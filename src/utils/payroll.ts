import { Worker, AttendanceRecord, ShiftConfig, SalaryAdjustment, SalaryType } from '../types';

export const WORKING_DAYS_PER_MONTH = 26;

export interface DailyHoursBreakdown {
  date: string;
  scheduledHours: number;      // e.g. 12 (08:00 - 20:00)
  actualHours: number;         // checkOut - checkIn in decimal hours
  overtimeHours: number;       // max(0, actualHours - scheduledHours)
  overtimePay: number;         // overtimeHours * hourlyOvertimeRate
  earlyMinutes: number;        // arrived before shift start
  lateMinutes: number;         // worked past shift end
  hourlyRate: number;          // derived or configured hourly rate
}

export interface WorkerPayrollSummary {
  workerId: string;
  workerName: string;
  department: string;
  skill: string;
  salaryType: SalaryType;
  baseRate: number;               // original salary parameter
  periodLabel: string;            // e.g. "Week of 8-14 Sep 2026", "Sep 2026"
  periodStart: string;            // YYYY-MM-DD
  periodEnd: string;              // YYYY-MM-DD
  presentDays: number;
  halfDays: number;
  absentDays: number;
  onLeaveDays: number;
  holidayDays: number;
  totalWorkedHours: number;
  totalOvertimeHours: number;
  baseSalary: number;             // prorated for the period
  overtimePay: number;
  totalUppad: number;             // deductions (-)
  totalJama: number;              // bonuses / credits (+)
  grossPay: number;               // baseSalary + overtimePay + totalJama
  netPayable: number;             // grossPay - totalUppad
  dailyBreakdowns: DailyHoursBreakdown[];
  adjustments: SalaryAdjustment[];
}

/**
 * Normalizes any time string (e.g. "08:15 AM", "8:15", "20:30") into standard 24-hr "HH:mm".
 */
export function parseTo24h(timeStr?: string): string {
  if (!timeStr) return '08:00';
  const clean = timeStr.trim().toUpperCase();

  // If already 24-hr "HH:mm"
  if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(clean)) {
    const [h, m] = clean.split(':');
    return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
  }

  // If 12-hr with AM/PM
  const match = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (match) {
    let hour = parseInt(match[1], 10);
    const min = match[2];
    const modifier = match[3];

    if (modifier === 'PM' && hour < 12) hour += 12;
    if (modifier === 'AM' && hour === 12) hour = 0;

    return `${String(hour).padStart(2, '0')}:${min}`;
  }

  return '08:00';
}

/**
 * Formats a 24-hr "HH:mm" time string into standard 12-hour "hh:mm AM/PM" for display.
 */
export function formatTime12h(timeStr?: string): string {
  if (!timeStr) return '—';
  const clean = parseTo24h(timeStr);
  const [hStr, mStr] = clean.split(':');
  let hour = parseInt(hStr, 10);
  const minute = mStr;
  const ampm = hour >= 12 ? 'PM' : 'AM';

  hour = hour % 12;
  hour = hour ? hour : 12; // 0 becomes 12

  return `${String(hour).padStart(2, '0')}:${minute} ${ampm}`;
}

/**
 * Converts "HH:mm" into decimal hours from midnight (e.g. "08:30" -> 8.5)
 */
export function timeToDecimalHours(hhMm: string): number {
  const norm = parseTo24h(hhMm);
  const [h, m] = norm.split(':').map(Number);
  return h + (m || 0) / 60;
}

/**
 * Converts "HH:mm" into total minutes from midnight (e.g. "08:30" -> 510)
 */
export function timeToMinutes(hhMm: string): number {
  const norm = parseTo24h(hhMm);
  const [h, m] = norm.split(':').map(Number);
  return h * 60 + (m || 0);
}

/**
 * Calculates hourly overtime rate for a worker based on employment type and shift config.
 */
export function getHourlyOvertimeRate(worker: Worker, shiftConfig: ShiftConfig): number {
  if (worker.overtimeRate && worker.overtimeRate > 0) {
    return worker.overtimeRate;
  }

  const startHours = timeToDecimalHours(shiftConfig.standardStartTime);
  const endHours = timeToDecimalHours(shiftConfig.standardEndTime);
  const scheduledHours = Math.max(1, endHours - startHours);
  const multiplier = shiftConfig.overtimeMultiplier || 1.5;

  if (worker.salaryType === 'Monthly Fixed') {
    const dailyBase = worker.salary / WORKING_DAYS_PER_MONTH;
    const hourlyBase = dailyBase / scheduledHours;
    return Math.round(hourlyBase * multiplier);
  }

  if (worker.salaryType === 'Daily Wage') {
    const hourlyBase = worker.salary / scheduledHours;
    return Math.round(hourlyBase * multiplier);
  }

  if (worker.salaryType === 'Hourly Rate') {
    return Math.round(worker.salary * multiplier);
  }

  // Piece Rate workers are paid per piece, OT is informational by default
  return 0;
}

/**
 * Calculates the hours and overtime for a single daily attendance record.
 */
export function calculateDailyHours(
  record: AttendanceRecord,
  shiftConfig: ShiftConfig,
  worker: Worker
): DailyHoursBreakdown {
  const isEligible = record.status === 'Present' || record.status === 'Half Day';

  if (!isEligible || !record.checkInTime || !record.checkOutTime) {
    return {
      date: record.date,
      scheduledHours: 0,
      actualHours: 0,
      overtimeHours: 0,
      overtimePay: 0,
      earlyMinutes: 0,
      lateMinutes: 0,
      hourlyRate: 0
    };
  }

  const shiftStartMin = timeToMinutes(shiftConfig.standardStartTime);
  const shiftEndMin = timeToMinutes(shiftConfig.standardEndTime);
  const checkInMin = timeToMinutes(record.checkInTime);
  const checkOutMin = timeToMinutes(record.checkOutTime);

  const fullScheduledHours = Math.max(0, (shiftEndMin - shiftStartMin) / 60);
  const scheduledHours = record.status === 'Half Day' ? fullScheduledHours / 2 : fullScheduledHours;

  const actualMinutes = Math.max(0, checkOutMin - checkInMin);
  const actualHours = Math.round((actualMinutes / 60) * 100) / 100;

  // Overtime occurs when total duration exceeds scheduled shift duration
  const overtimeHours = Math.max(0, Math.round((actualHours - scheduledHours) * 100) / 100);

  const earlyMinutes = Math.max(0, shiftStartMin - checkInMin);
  const lateMinutes = Math.max(0, checkOutMin - shiftEndMin);

  const hourlyRate = getHourlyOvertimeRate(worker, shiftConfig);
  const overtimePay = Math.round(overtimeHours * hourlyRate);

  return {
    date: record.date,
    scheduledHours,
    actualHours,
    overtimeHours,
    overtimePay,
    earlyMinutes,
    lateMinutes,
    hourlyRate
  };
}

/**
 * Calculates comprehensive payroll for a single worker over a defined date range.
 */
export function calculateWorkerPayroll(
  worker: Worker,
  periodStart: string,
  periodEnd: string,
  attendanceRecords: AttendanceRecord[],
  adjustments: SalaryAdjustment[],
  shiftConfig: ShiftConfig,
  customPeriodLabel?: string
): WorkerPayrollSummary {
  // Filter attendance to this worker & period
  const workerKey = worker.workerId || worker.id;
  const filteredAtt = attendanceRecords.filter(
    r =>
      (r.workerId === workerKey || r.workerId === workerKey.replace(/^WRK-/, '')) &&
      r.date >= periodStart &&
      r.date <= periodEnd
  );

  // Filter adjustments to this worker & period
  const filteredAdj = adjustments.filter(
    a =>
      (a.workerId === workerKey || a.workerId === workerKey.replace(/^WRK-/, '')) &&
      a.date >= periodStart &&
      a.date <= periodEnd
  );

  let presentDays = 0;
  let halfDays = 0;
  let absentDays = 0;
  let onLeaveDays = 0;
  let holidayDays = 0;
  let totalWorkedHours = 0;
  let totalOvertimeHours = 0;
  let overtimePay = 0;

  const dailyBreakdowns: DailyHoursBreakdown[] = [];

  filteredAtt.forEach(r => {
    if (r.status === 'Present') presentDays++;
    else if (r.status === 'Half Day') halfDays++;
    else if (r.status === 'Absent') absentDays++;
    else if (r.status === 'On Leave') onLeaveDays++;
    else if (r.status === 'Holiday') holidayDays++;

    const breakdown = calculateDailyHours(r, shiftConfig, worker);
    dailyBreakdowns.push(breakdown);

    totalWorkedHours += breakdown.actualHours;
    totalOvertimeHours += breakdown.overtimeHours;
    overtimePay += breakdown.overtimePay;
  });

  // Calculate Base Salary proration
  const effectiveWorkingDays = presentDays + halfDays * 0.5;
  let baseSalary = 0;

  if (worker.salaryType === 'Monthly Fixed') {
    // Days in period
    const startD = new Date(periodStart);
    const endD = new Date(periodEnd);
    const diffDays = Math.max(1, Math.round((endD.getTime() - startD.getTime()) / (1000 * 3600 * 24)) + 1);

    if (diffDays >= 28) {
      // Full month view: prorate based on 26 working days (unpaid leave policy)
      baseSalary = Math.round((worker.salary / WORKING_DAYS_PER_MONTH) * effectiveWorkingDays);
    } else {
      // Weekly or custom short period: prorate daily rate
      const dailyRate = worker.salary / WORKING_DAYS_PER_MONTH;
      baseSalary = Math.round(dailyRate * effectiveWorkingDays);
    }
  } else if (worker.salaryType === 'Daily Wage') {
    baseSalary = Math.round(worker.salary * effectiveWorkingDays);
  } else if (worker.salaryType === 'Hourly Rate') {
    let regularHours = 0;
    const startHours = timeToDecimalHours(shiftConfig.standardStartTime);
    const endHours = timeToDecimalHours(shiftConfig.standardEndTime);
    const standardDailyHours = Math.max(1, endHours - startHours);

    dailyBreakdowns.forEach((breakdown, idx) => {
      const rec = filteredAtt[idx];
      if (rec && (rec.status === 'Present' || rec.status === 'Half Day')) {
        if (breakdown.actualHours > 0) {
          regularHours += Math.max(0, breakdown.actualHours - breakdown.overtimeHours);
        } else {
          regularHours += rec.status === 'Half Day' ? standardDailyHours / 2 : standardDailyHours;
        }
      }
    });

    baseSalary = Math.round(worker.salary * regularHours);
  } else {
    // Piece Rate approximation if explicit production jobs not parsed
    baseSalary = Math.round(worker.salary * effectiveWorkingDays);
  }

  // Sum Uppad and Jama
  let totalUppad = 0;
  let totalJama = 0;

  filteredAdj.forEach(adj => {
    if (adj.type === 'Uppad') {
      totalUppad += adj.amount;
    } else if (adj.type === 'Jama') {
      totalJama += adj.amount;
    }
  });

  const grossPay = baseSalary + overtimePay + totalJama;
  const netPayable = Math.max(0, grossPay - totalUppad);

  const periodLabel = customPeriodLabel || `${periodStart} to ${periodEnd}`;

  return {
    workerId: worker.workerId,
    workerName: worker.name,
    department: worker.department,
    skill: worker.skill,
    salaryType: worker.salaryType,
    baseRate: worker.salary,
    periodLabel,
    periodStart,
    periodEnd,
    presentDays,
    halfDays,
    absentDays,
    onLeaveDays,
    holidayDays,
    totalWorkedHours: Math.round(totalWorkedHours * 10) / 10,
    totalOvertimeHours: Math.round(totalOvertimeHours * 10) / 10,
    baseSalary,
    overtimePay,
    totalUppad,
    totalJama,
    grossPay,
    netPayable,
    dailyBreakdowns,
    adjustments: filteredAdj
  };
}

/**
 * Calculates payroll for all active workers for the given period.
 */
export function calculatePayrollForAllWorkers(
  workers: Worker[],
  periodStart: string,
  periodEnd: string,
  allAttendance: AttendanceRecord[],
  allAdjustments: SalaryAdjustment[],
  shiftConfig: ShiftConfig,
  customPeriodLabel?: string
): WorkerPayrollSummary[] {
  const activeWorkers = workers.filter(w => w.status === 'Active');
  return activeWorkers.map(w =>
    calculateWorkerPayroll(
      w,
      periodStart,
      periodEnd,
      allAttendance,
      allAdjustments,
      shiftConfig,
      customPeriodLabel
    )
  );
}
