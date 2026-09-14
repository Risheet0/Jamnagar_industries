import * as XLSX from 'xlsx';
import { WorkerPayrollSummary } from './payroll';

export function exportPayrollToExcel(
  summaries: WorkerPayrollSummary[],
  periodLabel: string
) {
  // 1. Prepare Main Summary Sheet Data
  const rows = summaries.map(s => ({
    'Worker ID': s.workerId,
    'Worker Name': s.workerName,
    'Department': s.department,
    'Skill Profile': s.skill,
    'Salary Structure': s.salaryType,
    'Present (Days)': s.presentDays,
    'Half Day (Days)': s.halfDays,
    'Absent (Days)': s.absentDays,
    'On Leave (Days)': s.onLeaveDays,
    'Holiday (Days)': s.holidayDays,
    'OT Hours': s.totalOvertimeHours,
    'Base Salary (₹)': s.baseSalary,
    'Overtime Pay (₹)': s.overtimePay,
    'Uppad / Deductions (₹)': s.totalUppad,
    'Jama / Credits (₹)': s.totalJama,
    'Gross Pay (₹)': s.grossPay,
    'Net Payable (₹)': s.netPayable
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set explicit column widths for readability
  worksheet['!cols'] = [
    { wch: 12 }, // Worker ID
    { wch: 24 }, // Worker Name
    { wch: 18 }, // Department
    { wch: 20 }, // Skill
    { wch: 16 }, // Salary Type
    { wch: 14 }, // Present Days
    { wch: 14 }, // Half Day Days
    { wch: 14 }, // Absent Days
    { wch: 14 }, // Leave Days
    { wch: 14 }, // Holiday Days
    { wch: 12 }, // OT Hours
    { wch: 16 }, // Base Salary
    { wch: 16 }, // Overtime Pay
    { wch: 22 }, // Uppad
    { wch: 20 }, // Jama
    { wch: 16 }, // Gross Pay
    { wch: 18 }  // Net Payable
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Payroll Summary');

  // 2. Prepare Period Totals Sheet
  const totalGross = summaries.reduce((acc, s) => acc + s.grossPay, 0);
  const totalBase = summaries.reduce((acc, s) => acc + s.baseSalary, 0);
  const totalOTPay = summaries.reduce((acc, s) => acc + s.overtimePay, 0);
  const totalOTHours = summaries.reduce((acc, s) => acc + s.totalOvertimeHours, 0);
  const totalUppad = summaries.reduce((acc, s) => acc + s.totalUppad, 0);
  const totalJama = summaries.reduce((acc, s) => acc + s.totalJama, 0);
  const totalNet = summaries.reduce((acc, s) => acc + s.netPayable, 0);

  const totalsData = [
    { 'Period Summary Metric': 'Pay Period', 'Value': periodLabel },
    { 'Period Summary Metric': 'Total Active Karigars', 'Value': summaries.length },
    { 'Period Summary Metric': 'Total Overtime Hours', 'Value': Math.round(totalOTHours * 10) / 10 },
    { 'Period Summary Metric': 'Total Base Wages (₹)', 'Value': totalBase },
    { 'Period Summary Metric': 'Total Overtime Payout (₹)', 'Value': totalOTPay },
    { 'Period Summary Metric': 'Total Gross Wages (₹)', 'Value': totalGross },
    { 'Period Summary Metric': 'Total Uppad / Advance Deductions (₹)', 'Value': totalUppad },
    { 'Period Summary Metric': 'Total Jama / Bonus Credits (₹)', 'Value': totalJama },
    { 'Period Summary Metric': 'Total Net Payable Payout (₹)', 'Value': totalNet }
  ];

  const totalsSheet = XLSX.utils.json_to_sheet(totalsData);
  totalsSheet['!cols'] = [{ wch: 38 }, { wch: 26 }];
  XLSX.utils.book_append_sheet(workbook, totalsSheet, 'Period Financial Totals');

  // 3. Trigger File Download
  const filenameSafePeriod = periodLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  XLSX.writeFile(workbook, `vadilal-payroll-${filenameSafePeriod}.xlsx`);
}
