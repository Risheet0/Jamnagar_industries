import * as XLSX from 'xlsx';

export const WORKING_DAYS_PER_MONTH = 26;

export interface DailyHoursBreakdown {
  date: string;
  scheduledHours: number;
  actualHours: number;
  overtimeHours: number;
  overtimePay: number;
  earlyMinutes: number;
  lateMinutes: number;
  hourlyRate: number;
}

export interface WorkerPayrollSummary {
  workerId: string;
  workerName: string;
  department: string;
  skill: string;
  salaryType: string;
  baseRate: number;
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  presentDays: number;
  halfDays: number;
  absentDays: number;
  onLeaveDays: number;
  holidayDays: number;
  totalWorkedHours: number;
  totalOvertimeHours: number;
  baseSalary: number;
  overtimePay: number;
  totalUppad: number;
  totalJama: number;
  grossPay: number;
  netPayable: number;
  dailyBreakdowns: DailyHoursBreakdown[];
  adjustments: any[];
}

export function parseTo24h(timeStr?: string | null): string {
  if (!timeStr) return '08:00';
  const clean = timeStr.trim().toUpperCase();

  if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(clean)) {
    const [h, m] = clean.split(':');
    return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
  }

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

export function formatTime12h(timeStr?: string | null): string {
  if (!timeStr) return '—';
  const clean = parseTo24h(timeStr);
  const [hStr, mStr] = clean.split(':');
  let hour = parseInt(hStr, 10);
  const minute = mStr;
  const ampm = hour >= 12 ? 'PM' : 'AM';

  hour = hour % 12;
  hour = hour ? hour : 12;

  return `${String(hour).padStart(2, '0')}:${minute} ${ampm}`;
}

export function timeToDecimalHours(hhMm: string): number {
  const norm = parseTo24h(hhMm);
  const [h, m] = norm.split(':').map(Number);
  return h + (m || 0) / 60;
}

export function timeToMinutes(hhMm: string): number {
  const norm = parseTo24h(hhMm);
  const [h, m] = norm.split(':').map(Number);
  return h * 60 + (m || 0);
}

export function getHourlyOvertimeRate(worker: any, shiftConfig: any): number {
  if (worker.overtimeRate && worker.overtimeRate > 0) {
    return worker.overtimeRate;
  }

  const startHours = timeToDecimalHours(shiftConfig.standardStartTime);
  const endHours = timeToDecimalHours(shiftConfig.standardEndTime);
  const scheduledHours = Math.max(1, endHours - startHours);
  const multiplier = shiftConfig.overtimeMultiplier || 1.5;

  if (worker.salaryType === 'Monthly Fixed') {
    const dailyRate = worker.salary / WORKING_DAYS_PER_MONTH;
    const standardHourlyRate = dailyRate / scheduledHours;
    return Math.round(standardHourlyRate * multiplier * 100) / 100;
  }

  if (worker.salaryType === 'Daily Wage') {
    const standardHourlyRate = worker.salary / scheduledHours;
    return Math.round(standardHourlyRate * multiplier * 100) / 100;
  }

  if (worker.salaryType === 'Hourly Rate') {
    return Math.round(worker.salary * multiplier * 100) / 100;
  }

  const dailyEquivalent = 800;
  return Math.round((dailyEquivalent / scheduledHours) * multiplier * 100) / 100;
}

export function calculateDailyHours(record: any, worker: any, shiftConfig: any): DailyHoursBreakdown {
  const scheduledStartHours = timeToDecimalHours(shiftConfig.standardStartTime);
  const scheduledEndHours = timeToDecimalHours(shiftConfig.standardEndTime);
  const scheduledHours = Math.max(1, scheduledEndHours - scheduledStartHours);

  const hourlyOvertimeRate = getHourlyOvertimeRate(worker, shiftConfig);

  if (record.status !== 'Present' && record.status !== 'Half Day') {
    return {
      date: record.date,
      scheduledHours,
      actualHours: 0,
      overtimeHours: 0,
      overtimePay: 0,
      earlyMinutes: 0,
      lateMinutes: 0,
      hourlyRate: hourlyOvertimeRate
    };
  }

  const checkIn = parseTo24h(record.checkInTime || shiftConfig.standardStartTime);
  const checkOut = parseTo24h(record.checkOutTime || shiftConfig.standardEndTime);

  const checkInMin = timeToMinutes(checkIn);
  const checkOutMin = timeToMinutes(checkOut);
  const shiftStartMin = timeToMinutes(shiftConfig.standardStartTime);
  const shiftEndMin = timeToMinutes(shiftConfig.standardEndTime);

  const earlyMinutes = Math.max(0, shiftStartMin - checkInMin);
  const lateMinutes = Math.max(0, checkOutMin - shiftEndMin);

  let rawMinutes = Math.max(0, checkOutMin - checkInMin);
  if (record.status === 'Half Day' && rawMinutes === 0) {
    rawMinutes = (scheduledHours * 60) / 2;
  }

  const actualHours = Math.round((rawMinutes / 60) * 100) / 100;
  const effectiveScheduled = record.status === 'Half Day' ? scheduledHours / 2 : scheduledHours;
  const overtimeHours = Math.max(0, Math.round((actualHours - effectiveScheduled) * 100) / 100);
  const overtimePay = Math.round(overtimeHours * hourlyOvertimeRate);

  return {
    date: record.date,
    scheduledHours: effectiveScheduled,
    actualHours,
    overtimeHours,
    overtimePay,
    earlyMinutes,
    lateMinutes,
    hourlyRate: hourlyOvertimeRate
  };
}

export function calculateWorkerPayroll(
  worker: any,
  attendanceRecords: any[],
  shiftConfig: any,
  adjustments: any[],
  periodLabel: string,
  periodStart: string,
  periodEnd: string
): WorkerPayrollSummary {
  let presentDays = 0;
  let halfDays = 0;
  let absentDays = 0;
  let onLeaveDays = 0;
  let holidayDays = 0;
  let totalWorkedHours = 0;
  let totalOvertimeHours = 0;
  let overtimePay = 0;

  const dailyBreakdowns: DailyHoursBreakdown[] = [];

  attendanceRecords.forEach(r => {
    if (r.status === 'Present') presentDays++;
    else if (r.status === 'Half Day') halfDays++;
    else if (r.status === 'Absent') absentDays++;
    else if (r.status === 'On Leave') onLeaveDays++;
    else if (r.status === 'Holiday') holidayDays++;

    const breakdown = calculateDailyHours(r, worker, shiftConfig);
    dailyBreakdowns.push(breakdown);

    totalWorkedHours += breakdown.actualHours;
    totalOvertimeHours += breakdown.overtimeHours;
    overtimePay += breakdown.overtimePay;
  });

  totalWorkedHours = Math.round(totalWorkedHours * 100) / 100;
  totalOvertimeHours = Math.round(totalOvertimeHours * 100) / 100;

  let baseSalary = 0;
  const effectivePresentDays = presentDays + halfDays * 0.5;

  if (worker.salaryType === 'Monthly Fixed') {
    const dailyRate = worker.salary / WORKING_DAYS_PER_MONTH;
    baseSalary = Math.round(dailyRate * effectivePresentDays);
  } else if (worker.salaryType === 'Daily Wage') {
    baseSalary = Math.round(worker.salary * effectivePresentDays);
  } else if (worker.salaryType === 'Hourly Rate') {
    baseSalary = Math.round(worker.salary * totalWorkedHours);
  } else {
    const defaultDaily = 800;
    baseSalary = Math.round(defaultDaily * effectivePresentDays);
  }

  let totalUppad = 0;
  let totalJama = 0;

  adjustments.forEach(adj => {
    if (adj.type === 'Uppad') {
      totalUppad += adj.amount;
    } else if (adj.type === 'Jama') {
      totalJama += adj.amount;
    }
  });

  const grossPay = baseSalary + overtimePay + totalJama;
  const netPayable = Math.max(0, grossPay - totalUppad);

  return {
    workerId: worker.workerId || worker.id,
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
    totalWorkedHours,
    totalOvertimeHours,
    baseSalary,
    overtimePay,
    totalUppad,
    totalJama,
    grossPay,
    netPayable,
    dailyBreakdowns,
    adjustments
  };
}

export function generatePayrollExcelBuffer(
  summaries: WorkerPayrollSummary[],
  periodLabel: string,
  companyName: string = 'Vadilal Engineering Industries'
): Buffer {
  const wb = XLSX.utils.book_new();

  const headers = [
    'Worker ID',
    'Worker Name',
    'Department',
    'Skill',
    'Salary Type',
    'Base Rate (₹)',
    'Present (Days)',
    'Half Day',
    'Absent',
    'On Leave',
    'Holiday',
    'Worked Hours',
    'OT Hours',
    'Base Salary (₹)',
    'OT Pay (₹)',
    'Jama Bonus (+) (₹)',
    'Gross Pay (₹)',
    'Uppad / Advance (-) (₹)',
    'Net Payable (₹)'
  ];

  const rows = summaries.map(s => [
    s.workerId,
    s.workerName,
    s.department,
    s.skill,
    s.salaryType,
    s.baseRate,
    s.presentDays,
    s.halfDays,
    s.absentDays,
    s.onLeaveDays,
    s.holidayDays,
    s.totalWorkedHours,
    s.totalOvertimeHours,
    s.baseSalary,
    s.overtimePay,
    s.totalJama,
    s.grossPay,
    s.totalUppad,
    s.netPayable
  ]);

  const totalGross = summaries.reduce((acc, s) => acc + s.grossPay, 0);
  const totalUppad = summaries.reduce((acc, s) => acc + s.totalUppad, 0);
  const totalNet = summaries.reduce((acc, s) => acc + s.netPayable, 0);

  const summaryRow = [
    'TOTAL',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    totalGross,
    totalUppad,
    totalNet
  ];

  const wsData = [
    [companyName],
    [`Payroll Statement — ${periodLabel}`],
    [`Generated: ${new Date().toLocaleString('en-IN')}`],
    [],
    headers,
    ...rows,
    [],
    summaryRow
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, 'Payroll Summary');

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}
