import React, { useState, useMemo } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { SummaryCard } from '../components/common/SummaryCard';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { FormField } from '../components/common/FormField';
import { useWorkers } from '../context/WorkerContext';
import { useAttendance, getTodayDateString } from '../context/AttendanceContext';
import { usePayroll } from '../context/PayrollContext';
import { useToast } from '../context/ToastContext';
import {
  calculatePayrollForAllWorkers,
  WorkerPayrollSummary,
  formatTime12h
} from '../utils/payroll';
import { exportPayrollToExcel } from '../utils/exportPayrollExcel';
import { AdjustmentType } from '../types';
import {
  IndianRupee,
  Calendar,
  Search,
  Plus,
  HardHat,
  TrendingUp,
  Clock,
  Trash2,
  FileSpreadsheet,
  CheckCircle2
} from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

type PeriodMode = 'monthly' | 'weekly' | 'custom';

export const PayrollReportPage: React.FC = () => {
  const { workers } = useWorkers();
  const { records: attendanceRecords } = useAttendance();
  const { adjustments, shiftConfig, addAdjustment, deleteAdjustment } = usePayroll();
  const { showToast } = useToast();

  const today = new Date();
  const todayStr = getTodayDateString();

  // Period state
  const [periodMode, setPeriodMode] = useState<PeriodMode>('monthly');
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth() + 1); // 1-indexed

  // Weekly state (Monday to Sunday)
  const [weeklyReferenceDate, setWeeklyReferenceDate] = useState<string>(todayStr);

  // Custom range state
  const [customStart, setCustomStart] = useState<string>(`${todayStr.slice(0, 7)}-01`);
  const [customEnd, setCustomEnd] = useState<string>(todayStr);

  // Filters & Sorting
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'netPayable' | 'overtimePay' | 'baseSalary' | 'name'>('netPayable');

  // Modals state
  const [selectedWorkerAudit, setSelectedWorkerAudit] = useState<WorkerPayrollSummary | null>(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);

  const [isAddAdjModalOpen, setIsAddAdjModalOpen] = useState<boolean>(false);
  const [targetWorkerId, setTargetWorkerId] = useState<string>('');
  const [adjDate, setAdjDate] = useState<string>(todayStr);
  const [adjType, setAdjType] = useState<AdjustmentType>('Uppad');
  const [adjAmount, setAdjAmount] = useState<string>('');
  const [adjReason, setAdjReason] = useState<string>('');

  // 1. Resolve Period Start and End Dates
  const { periodStart, periodEnd, periodLabel } = useMemo(() => {
    if (periodMode === 'monthly') {
      const start = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
      const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
      const end = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
      const label = `${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`;
      return { periodStart: start, periodEnd: end, periodLabel: label };
    }

    if (periodMode === 'weekly') {
      const d = new Date(weeklyReferenceDate + 'T00:00:00');
      const day = d.getDay(); // 0 is Sunday, 1 is Monday
      const diffToMon = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
      const mon = new Date(d.setDate(diffToMon));
      const sun = new Date(d.setDate(mon.getDate() + 6));

      const start = mon.toISOString().split('T')[0];
      const end = sun.toISOString().split('T')[0];
      const label = `Week of ${mon.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} – ${sun.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`;
      return { periodStart: start, periodEnd: end, periodLabel: label };
    }

    // Custom
    const label = `${customStart} to ${customEnd}`;
    return { periodStart: customStart, periodEnd: customEnd, periodLabel: label };
  }, [periodMode, selectedYear, selectedMonth, weeklyReferenceDate, customStart, customEnd]);

  // 2. Compute Payroll Summaries
  const allSummaries = useMemo(() => {
    return calculatePayrollForAllWorkers(
      workers,
      periodStart,
      periodEnd,
      attendanceRecords,
      adjustments,
      shiftConfig,
      periodLabel
    );
  }, [workers, periodStart, periodEnd, attendanceRecords, adjustments, shiftConfig, periodLabel]);

  // 3. Departments
  const departments = useMemo(() => {
    const deps = new Set(workers.map(w => w.department));
    return ['All', ...Array.from(deps)];
  }, [workers]);

  // 4. Filtered and Sorted Summaries
  const displayedSummaries = useMemo(() => {
    return allSummaries
      .filter(s => {
        const matchSearch =
          s.workerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.workerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.skill.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.department.toLowerCase().includes(searchTerm.toLowerCase());
        const matchDep = departmentFilter === 'All' || s.department === departmentFilter;
        return matchSearch && matchDep;
      })
      .sort((a, b) => {
        if (sortBy === 'netPayable') return b.netPayable - a.netPayable;
        if (sortBy === 'overtimePay') return b.overtimePay - a.overtimePay;
        if (sortBy === 'baseSalary') return b.baseSalary - a.baseSalary;
        return a.workerName.localeCompare(b.workerName);
      });
  }, [allSummaries, searchTerm, departmentFilter, sortBy]);

  // 5. Aggregate Totals
  const totals = useMemo(() => {
    const totalBase = allSummaries.reduce((acc, s) => acc + s.baseSalary, 0);
    const totalOTPay = allSummaries.reduce((acc, s) => acc + s.overtimePay, 0);
    const totalOTHours = allSummaries.reduce((acc, s) => acc + s.totalOvertimeHours, 0);
    const totalUppad = allSummaries.reduce((acc, s) => acc + s.totalUppad, 0);
    const totalJama = allSummaries.reduce((acc, s) => acc + s.totalJama, 0);
    const totalGross = allSummaries.reduce((acc, s) => acc + s.grossPay, 0);
    const totalNet = allSummaries.reduce((acc, s) => acc + s.netPayable, 0);

    return {
      totalBase,
      totalOTPay,
      totalOTHours: Math.round(totalOTHours * 10) / 10,
      totalUppad,
      totalJama,
      totalGross,
      totalNet
    };
  }, [allSummaries]);

  // Export to Excel
  const handleExportExcel = () => {
    exportPayrollToExcel(displayedSummaries, periodLabel);
    showToast({
      title: 'Excel Report Generated',
      message: `Downloaded payroll workbook for ${periodLabel}.`,
      type: 'success'
    });
  };

  // Open Add Adjustment Modal
  const handleOpenAddAdjustment = (workerId?: string) => {
    setTargetWorkerId(workerId || (workers[0] ? workers[0].workerId : ''));
    setAdjDate(todayStr);
    setAdjType('Uppad');
    setAdjAmount('');
    setAdjReason('');
    setIsAddAdjModalOpen(true);
  };

  // Save Adjustment
  const handleSaveAdjustment = () => {
    const parsedAmount = parseFloat(adjAmount);
    if (!targetWorkerId || isNaN(parsedAmount) || parsedAmount <= 0) {
      showToast({
        title: 'Invalid Input',
        message: 'Please enter a valid positive adjustment amount.',
        type: 'warning'
      });
      return;
    }

    const created = addAdjustment(targetWorkerId, adjDate, adjType, parsedAmount, adjReason.trim() || undefined);
    setIsAddAdjModalOpen(false);

    const workerObj = workers.find(w => w.workerId === targetWorkerId || w.id === targetWorkerId);
    showToast({
      title: `${adjType} Recorded (₹${parsedAmount.toLocaleString('en-IN')})`,
      message: `${adjType} adjustment added for ${workerObj?.name || targetWorkerId}.`,
      type: adjType === 'Jama' ? 'success' : 'info'
    });

    // Refresh modal if open
    if (selectedWorkerAudit && (selectedWorkerAudit.workerId === targetWorkerId || selectedWorkerAudit.workerId === targetWorkerId.replace(/^WRK-/, ''))) {
      const refreshed = calculatePayrollForAllWorkers(
        workers,
        periodStart,
        periodEnd,
        attendanceRecords,
        [created, ...adjustments],
        shiftConfig,
        periodLabel
      ).find(s => s.workerId === selectedWorkerAudit.workerId);
      if (refreshed) setSelectedWorkerAudit(refreshed);
    }
  };

  // Delete Adjustment
  const handleDeleteAdjustment = (id: string) => {
    deleteAdjustment(id);
    showToast({
      title: 'Adjustment Removed',
      message: 'The adjustment has been deleted from payroll calculation.',
      type: 'info'
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Page Header */}
      <PageHeader
        title="Payroll & Wage Ledger (Uppad / Jama)"
        description="Comprehensive factory payroll calculation engine with overtime hours computation, advance deductions (Uppad), bonuses (Jama), and exportable wage sheets."
        breadcrumbs={[
          { label: 'Reports', path: '/reports' },
          { label: 'Payroll Engine' }
        ]}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Button
              variant="secondary"
              icon={<Plus size={14} />}
              onClick={() => handleOpenAddAdjustment()}
            >
              + Record Uppad / Jama
            </Button>
            <Button
              variant="primary"
              icon={<FileSpreadsheet size={14} />}
              onClick={handleExportExcel}
            >
              Export Excel (.xlsx)
            </Button>
          </div>
        }
      />

      {/* Period Selector Toolbar */}
      <div
        className="card"
        style={{
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          backgroundColor: 'var(--color-bg-surface)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          {/* Mode Switcher */}
          <div
            style={{
              display: 'inline-flex',
              backgroundColor: 'var(--color-bg-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '3px',
              border: '1px solid var(--color-border-subtle)'
            }}
          >
            <button
              type="button"
              onClick={() => setPeriodMode('monthly')}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: periodMode === 'monthly' ? 'var(--color-brand-primary)' : 'transparent',
                color: periodMode === 'monthly' ? '#ffffff' : 'var(--color-text-secondary)',
                transition: 'all 0.15s'
              }}
            >
              Monthly Cycle
            </button>
            <button
              type="button"
              onClick={() => setPeriodMode('weekly')}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: periodMode === 'weekly' ? 'var(--color-brand-primary)' : 'transparent',
                color: periodMode === 'weekly' ? '#ffffff' : 'var(--color-text-secondary)',
                transition: 'all 0.15s'
              }}
            >
              Weekly Shift
            </button>
            <button
              type="button"
              onClick={() => setPeriodMode('custom')}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: periodMode === 'custom' ? 'var(--color-brand-primary)' : 'transparent',
                color: periodMode === 'custom' ? '#ffffff' : 'var(--color-text-secondary)',
                transition: 'all 0.15s'
              }}
            >
              Custom Date Range
            </button>
          </div>

          {/* Controls for Monthly */}
          {periodMode === 'monthly' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <select
                className="select"
                value={selectedMonth}
                onChange={e => setSelectedMonth(parseInt(e.target.value, 10))}
                style={{ padding: '6px 10px', fontSize: '13px', fontWeight: 600 }}
              >
                {MONTH_NAMES.map((name, idx) => (
                  <option key={name} value={idx + 1}>
                    {name}
                  </option>
                ))}
              </select>

              <select
                className="select"
                value={selectedYear}
                onChange={e => setSelectedYear(parseInt(e.target.value, 10))}
                style={{ padding: '6px 10px', fontSize: '13px', fontWeight: 600 }}
              >
                {[2024, 2025, 2026, 2027].map(yr => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedMonth(today.getMonth() + 1);
                  setSelectedYear(today.getFullYear());
                }}
              >
                This Month
              </Button>
            </div>
          )}

          {/* Controls for Weekly */}
          {periodMode === 'weekly' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Week containing:</span>
              <input
                type="date"
                className="input"
                value={weeklyReferenceDate}
                onChange={e => e.target.value && setWeeklyReferenceDate(e.target.value)}
                style={{ padding: '5px 8px', fontSize: '12px', width: '140px' }}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setWeeklyReferenceDate(todayStr)}
              >
                This Week
              </Button>
            </div>
          )}

          {/* Controls for Custom */}
          {periodMode === 'custom' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>From:</span>
              <input
                type="date"
                className="input"
                value={customStart}
                onChange={e => e.target.value && setCustomStart(e.target.value)}
                style={{ padding: '5px 8px', fontSize: '12px', width: '140px' }}
              />
              <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>To:</span>
              <input
                type="date"
                className="input"
                value={customEnd}
                onChange={e => e.target.value && setCustomEnd(e.target.value)}
                style={{ padding: '5px 8px', fontSize: '12px', width: '140px' }}
              />
            </div>
          )}
        </div>

        {/* Period badge label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
          <Calendar size={14} style={{ color: 'var(--color-brand-primary)' }} />
          <span>Pay Period: <strong style={{ color: 'var(--color-text-primary)' }}>{periodLabel}</strong></span>
        </div>
      </div>

      {/* Aggregate Financial Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        <SummaryCard
          title="Total Gross Wages"
          value={`₹${totals.totalGross.toLocaleString('en-IN')}`}
          subtitle={`Base ₹${totals.totalBase.toLocaleString('en-IN')} + OT ₹${totals.totalOTPay.toLocaleString('en-IN')}`}
          icon={<HardHat size={18} />}
        />
        <SummaryCard
          title="Overtime Payout"
          value={`₹${totals.totalOTPay.toLocaleString('en-IN')}`}
          subtitle={`${totals.totalOTHours} hrs @ ${shiftConfig.overtimeMultiplier}x rate`}
          icon={<Clock size={18} />}
          statusTag={totals.totalOTHours > 0 ? { label: `${totals.totalOTHours}h OT Logged`, variant: 'info' } : undefined}
        />
        <SummaryCard
          title="Total Uppad (Deductions)"
          value={`- ₹${totals.totalUppad.toLocaleString('en-IN')}`}
          subtitle="Advances & mid-month withdrawals"
          icon={<TrendingUp size={18} />}
          statusTag={{ label: `${totals.totalUppad > 0 ? `₹${totals.totalUppad} Deducted` : 'No Uppad'}`, variant: totals.totalUppad > 0 ? 'danger' : 'neutral' }}
        />
        <SummaryCard
          title="Total Jama (Bonuses)"
          value={`+ ₹${totals.totalJama.toLocaleString('en-IN')}`}
          subtitle="Incentives & tool maintenance allowances"
          icon={<TrendingUp size={18} />}
          statusTag={{ label: `${totals.totalJama > 0 ? `₹${totals.totalJama} Credited` : 'No Jama'}`, variant: totals.totalJama > 0 ? 'success' : 'neutral' }}
        />
        <SummaryCard
          title="Net Payable Wage Bill"
          value={`₹${totals.totalNet.toLocaleString('en-IN')}`}
          subtitle={`Final net disbursement for ${allSummaries.length} workers`}
          icon={<IndianRupee size={18} />}
          statusTag={{ label: 'Payable Amount', variant: 'success' }}
        />
      </div>

      {/* Main Payroll Table Card */}
      <div className="card">
        {/* Table Filters & Search */}
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid var(--color-border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '260px' }}>
            <div style={{ position: 'relative', width: '260px' }}>
              <Search
                size={15}
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--color-text-muted)'
                }}
              />
              <input
                type="text"
                className="input"
                placeholder="Search worker, code, skill..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '32px', fontSize: '13px' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Dept:</span>
              <select
                className="select"
                value={departmentFilter}
                onChange={e => setDepartmentFilter(e.target.value)}
                style={{ padding: '6px 10px', fontSize: '12px' }}
              >
                {departments.map(d => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Sort:</span>
              <select
                className="select"
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                style={{ padding: '6px 10px', fontSize: '12px' }}
              >
                <option value="netPayable">Net Payable (High → Low)</option>
                <option value="overtimePay">Overtime Pay (High → Low)</option>
                <option value="baseSalary">Base Salary</option>
                <option value="name">Worker Name</option>
              </select>
            </div>
          </div>

          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
            Showing <strong>{displayedSummaries.length}</strong> active operators
          </div>
        </div>

        {/* Table Content */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-bg-subtle)', borderBottom: '1px solid var(--color-border-subtle)' }}>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Worker / Karigar
                </th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Wage Structure
                </th>
                <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Days (P / H / A)
                </th>
                <th style={{ padding: '10px 14px', textAlign: 'right', fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
                  OT Hours & Pay
                </th>
                <th style={{ padding: '10px 14px', textAlign: 'right', fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Base Salary
                </th>
                <th style={{ padding: '10px 14px', textAlign: 'right', fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Uppad (Adv.)
                </th>
                <th style={{ padding: '10px 14px', textAlign: 'right', fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Jama (Bonus)
                </th>
                <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: '11px', color: 'var(--color-text-primary)', fontWeight: 700, textTransform: 'uppercase' }}>
                  Net Payable
                </th>
                <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {displayedSummaries.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '36px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    No payroll records match the filter criteria.
                  </td>
                </tr>
              ) : (
                displayedSummaries.map((s, idx) => (
                  <tr
                    key={s.workerId}
                    style={{
                      borderBottom: '1px solid var(--color-border-subtle)',
                      backgroundColor: idx % 2 === 0 ? 'var(--color-bg-surface)' : 'rgba(248, 250, 252, 0.4)'
                    }}
                  >
                    {/* Worker */}
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{s.workerName}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                        <span className="mono-code" style={{ fontSize: '10px' }}>{s.workerId}</span>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>• {s.department}</span>
                      </div>
                    </td>

                    {/* Salary Structure */}
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{s.salaryType}</div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                        Base: ₹{s.baseRate.toLocaleString('en-IN')}{s.salaryType === 'Hourly Rate' ? '/hr' : s.salaryType === 'Daily Wage' ? '/day' : s.salaryType === 'Piece Rate (Karigar)' ? '/pc' : '/mo'}
                      </div>
                    </td>

                    {/* Days */}
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600 }}>
                        <span style={{ color: 'var(--color-status-success-solid)' }}>{s.presentDays}P</span>
                        <span style={{ color: 'var(--color-text-muted)' }}>/</span>
                        <span style={{ color: 'var(--color-status-warning-solid)' }}>{s.halfDays}H</span>
                        <span style={{ color: 'var(--color-text-muted)' }}>/</span>
                        <span style={{ color: 'var(--color-status-danger-solid)' }}>{s.absentDays}A</span>
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                        {s.onLeaveDays > 0 ? `${s.onLeaveDays} Leave` : `${s.presentDays + s.halfDays * 0.5} Days Worked`}
                      </div>
                    </td>

                    {/* OT Hours & Pay */}
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <div className="tabular-nums" style={{ fontWeight: 600, color: s.overtimePay > 0 ? 'var(--color-brand-primary)' : 'var(--color-text-secondary)' }}>
                        ₹{s.overtimePay.toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                        {s.totalOvertimeHours} hrs OT
                      </div>
                    </td>

                    {/* Base Salary */}
                    <td style={{ padding: '12px 14px', textAlign: 'right' }} className="tabular-nums">
                      <div style={{ fontWeight: 600 }}>₹{s.baseSalary.toLocaleString('en-IN')}</div>
                    </td>

                    {/* Uppad */}
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      {s.totalUppad > 0 ? (
                        <span className="tabular-nums" style={{ fontWeight: 600, color: 'var(--color-status-danger-solid)' }}>
                          - ₹{s.totalUppad.toLocaleString('en-IN')}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)' }}>—</span>
                      )}
                    </td>

                    {/* Jama */}
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      {s.totalJama > 0 ? (
                        <span className="tabular-nums" style={{ fontWeight: 600, color: 'var(--color-status-success-solid)' }}>
                          + ₹{s.totalJama.toLocaleString('en-IN')}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)' }}>—</span>
                      )}
                    </td>

                    {/* Net Payable */}
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div
                        style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: 'var(--color-status-success-bg)',
                          border: '1px solid var(--color-status-success-border)'
                        }}
                      >
                        <span
                          className="tabular-nums"
                          style={{
                            fontSize: '15px',
                            fontWeight: 700,
                            color: 'var(--color-status-success-text)'
                          }}
                        >
                          ₹{s.netPayable.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<Clock size={12} />}
                          onClick={() => {
                            setSelectedWorkerAudit(s);
                            setIsAuditModalOpen(true);
                          }}
                          title="View Day-by-Day Hours & Adjustments Audit"
                        >
                          Audit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Plus size={12} />}
                          onClick={() => handleOpenAddAdjustment(s.workerId)}
                          title="Add Uppad / Jama for this worker"
                        >
                          Adjust
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Day-by-Day Payroll & Overtime Audit Modal */}
      {selectedWorkerAudit && (
        <Modal
          isOpen={isAuditModalOpen}
          onClose={() => setIsAuditModalOpen(false)}
          title={`Payroll Audit Trail — ${selectedWorkerAudit.workerName} (${selectedWorkerAudit.workerId})`}
          maxWidth="760px"
          footer={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-status-success-text)' }}>
                Net Payable: ₹{selectedWorkerAudit.netPayable.toLocaleString('en-IN')}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Button variant="secondary" onClick={() => setIsAuditModalOpen(false)}>
                  Close
                </Button>
                <Button
                  variant="primary"
                  icon={<Plus size={13} />}
                  onClick={() => handleOpenAddAdjustment(selectedWorkerAudit.workerId)}
                >
                  + Add Uppad / Jama
                </Button>
              </div>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Worker Summary Banner */}
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: 'var(--color-bg-subtle)',
                borderRadius: 'var(--radius-md)',
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '12px',
                fontSize: '12px'
              }}
            >
              <div>
                <span style={{ color: 'var(--color-text-muted)' }}>Base Salary:</span>
                <div style={{ fontWeight: 700, fontSize: '14px', marginTop: '2px' }}>₹{selectedWorkerAudit.baseSalary.toLocaleString('en-IN')}</div>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)' }}>Overtime Pay:</span>
                <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-brand-primary)', marginTop: '2px' }}>
                  ₹{selectedWorkerAudit.overtimePay.toLocaleString('en-IN')} ({selectedWorkerAudit.totalOvertimeHours}h)
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)' }}>Uppad Deductions:</span>
                <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-status-danger-solid)', marginTop: '2px' }}>
                  - ₹{selectedWorkerAudit.totalUppad.toLocaleString('en-IN')}
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)' }}>Jama Credits:</span>
                <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-status-success-solid)', marginTop: '2px' }}>
                  + ₹{selectedWorkerAudit.totalJama.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Daily Hours & Overtime Breakdown Table */}
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                Daily Shift Hours & Overtime Breakdown ({selectedWorkerAudit.periodLabel})
              </div>
              <div style={{ maxHeight: '240px', overflowY: 'auto', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-md)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--color-bg-subtle)', borderBottom: '1px solid var(--color-border-subtle)' }}>
                      <th style={{ padding: '6px 10px', textAlign: 'left' }}>Date</th>
                      <th style={{ padding: '6px 10px', textAlign: 'center' }}>Check-In</th>
                      <th style={{ padding: '6px 10px', textAlign: 'center' }}>Check-Out</th>
                      <th style={{ padding: '6px 10px', textAlign: 'right' }}>Worked Hrs</th>
                      <th style={{ padding: '6px 10px', textAlign: 'right' }}>OT Hours</th>
                      <th style={{ padding: '6px 10px', textAlign: 'right' }}>OT Rate</th>
                      <th style={{ padding: '6px 10px', textAlign: 'right' }}>OT Pay</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedWorkerAudit.dailyBreakdowns.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: '16px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                          No attendance records found for this period.
                        </td>
                      </tr>
                    ) : (
                      selectedWorkerAudit.dailyBreakdowns.map((d, i) => {
                        const rec = attendanceRecords.find(
                          r =>
                            (r.workerId === selectedWorkerAudit.workerId || r.workerId === selectedWorkerAudit.workerId.replace(/^WRK-/, '')) &&
                            r.date === d.date
                        );

                        return (
                          <tr key={d.date} style={{ borderBottom: '1px solid var(--color-border-subtle)', backgroundColor: i % 2 === 0 ? '#fff' : 'rgba(248, 250, 252, 0.5)' }}>
                            <td style={{ padding: '6px 10px' }}>
                              <span style={{ fontWeight: 600 }}>{d.date}</span>
                              {rec && <span style={{ marginLeft: '6px', fontSize: '10px', color: 'var(--color-text-muted)' }}>({rec.status})</span>}
                            </td>
                            <td style={{ padding: '6px 10px', textAlign: 'center' }}>{formatTime12h(rec?.checkInTime)}</td>
                            <td style={{ padding: '6px 10px', textAlign: 'center' }}>{formatTime12h(rec?.checkOutTime)}</td>
                            <td style={{ padding: '6px 10px', textAlign: 'right' }} className="tabular-nums">{d.actualHours}h</td>
                            <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: d.overtimeHours > 0 ? 600 : 400, color: d.overtimeHours > 0 ? 'var(--color-brand-primary)' : 'inherit' }} className="tabular-nums">
                              {d.overtimeHours > 0 ? `${d.overtimeHours}h` : '—'}
                            </td>
                            <td style={{ padding: '6px 10px', textAlign: 'right', color: 'var(--color-text-muted)' }} className="tabular-nums">
                              {d.hourlyRate > 0 ? `₹${d.hourlyRate}/h` : '—'}
                            </td>
                            <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 600, color: d.overtimePay > 0 ? 'var(--color-status-success-solid)' : 'inherit' }} className="tabular-nums">
                              {d.overtimePay > 0 ? `₹${d.overtimePay.toLocaleString('en-IN')}` : '—'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Adjustments (Uppad / Jama) in Period */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  Uppad / Jama Adjustments Ledger ({selectedWorkerAudit.adjustments.length})
                </span>
              </div>

              {selectedWorkerAudit.adjustments.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--color-text-muted)', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)', fontSize: '12px' }}>
                  No salary deductions or credits recorded in this period.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto' }}>
                  {selectedWorkerAudit.adjustments.map(adj => (
                    <div
                      key={adj.id}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: adj.type === 'Jama' ? 'var(--color-status-success-bg)' : 'var(--color-status-danger-bg)',
                        border: `1px solid ${adj.type === 'Jama' ? 'var(--color-status-success-border)' : 'var(--color-status-danger-border)'}`,
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span
                          style={{
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '3px',
                            backgroundColor: adj.type === 'Jama' ? 'var(--color-status-success-solid)' : 'var(--color-status-danger-solid)',
                            color: '#fff',
                            fontSize: '10px',
                            textTransform: 'uppercase'
                          }}
                        >
                          {adj.type}
                        </span>
                        <div>
                          <span style={{ fontWeight: 600 }}>₹{adj.amount.toLocaleString('en-IN')}</span>
                          {adj.reason && <span style={{ color: 'var(--color-text-secondary)', marginLeft: '8px' }}>— {adj.reason}</span>}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ color: 'var(--color-text-muted)', fontSize: '11px' }}>{adj.date}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteAdjustment(adj.id)}
                          className="btn btn-ghost btn-icon-only btn-sm"
                          style={{ color: 'var(--color-status-danger-solid)', padding: '2px' }}
                          title="Delete adjustment"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Add Uppad / Jama Modal */}
      <Modal
        isOpen={isAddAdjModalOpen}
        onClose={() => setIsAddAdjModalOpen(false)}
        title="Record Salary Adjustment (Uppad / Jama)"
        maxWidth="480px"
        footer={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', width: '100%' }}>
            <Button variant="secondary" onClick={() => setIsAddAdjModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" icon={<CheckCircle2 size={14} />} onClick={handleSaveAdjustment}>
              Save Adjustment
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Worker Select */}
          <FormField label="Karigar / Worker" required>
            <select
              className="select"
              value={targetWorkerId}
              onChange={e => setTargetWorkerId(e.target.value)}
              style={{ width: '100%' }}
            >
              {workers.map(w => (
                <option key={w.workerId || w.id} value={w.workerId || w.id}>
                  {w.name} ({w.workerId}) — {w.department}
                </option>
              ))}
            </select>
          </FormField>

          {/* Adjustment Type Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
              Adjustment Category *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setAdjType('Uppad')}
                style={{
                  padding: '10px',
                  borderRadius: 'var(--radius-md)',
                  border: adjType === 'Uppad' ? '2px solid var(--color-status-danger-solid)' : '1px solid var(--color-border-subtle)',
                  backgroundColor: adjType === 'Uppad' ? 'var(--color-status-danger-bg)' : 'var(--color-bg-subtle)',
                  color: adjType === 'Uppad' ? 'var(--color-status-danger-text)' : 'var(--color-text-primary)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '13px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>Uppad (Deduction)</span>
                <span style={{ fontSize: '10px', fontWeight: 400, opacity: 0.85 }}>Advance / Fine / Loan repayment</span>
              </button>

              <button
                type="button"
                onClick={() => setAdjType('Jama')}
                style={{
                  padding: '10px',
                  borderRadius: 'var(--radius-md)',
                  border: adjType === 'Jama' ? '2px solid var(--color-status-success-solid)' : '1px solid var(--color-border-subtle)',
                  backgroundColor: adjType === 'Jama' ? 'var(--color-status-success-bg)' : 'var(--color-bg-subtle)',
                  color: adjType === 'Jama' ? 'var(--color-status-success-text)' : 'var(--color-text-primary)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '13px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>Jama (Credit / Bonus)</span>
                <span style={{ fontSize: '10px', fontWeight: 400, opacity: 0.85 }}>Performance / Incentive / Allowance</span>
              </button>
            </div>
          </div>

          {/* Amount and Date */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <FormField label="Amount (INR ₹)" required>
              <input
                type="number"
                className="input"
                placeholder="e.g. 1500"
                value={adjAmount}
                onChange={e => setAdjAmount(e.target.value)}
                autoFocus
              />
            </FormField>

            <FormField label="Effective Date" required>
              <input
                type="date"
                className="input"
                value={adjDate}
                onChange={e => setAdjDate(e.target.value)}
              />
            </FormField>
          </div>

          {/* Reason */}
          <FormField label="Reason / Remarks">
            <textarea
              className="textarea"
              rows={2}
              placeholder="e.g. Mid-month cash advance, tool setup bonus..."
              value={adjReason}
              onChange={e => setAdjReason(e.target.value)}
            />
          </FormField>
        </div>
      </Modal>
    </div>
  );
};
