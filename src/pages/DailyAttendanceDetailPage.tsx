import React, { useState, useMemo } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { SummaryCard } from '../components/common/SummaryCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { Button } from '../components/common/Button';
import { ApplyLeaveModal } from '../components/common/ApplyLeaveModal';
import { useNavigation } from '../context/NavigationContext';
import { useWorkers } from '../context/WorkerContext';
import { useAttendance, getTodayDateString } from '../context/AttendanceContext';
import { useFactoryCalendar } from '../context/FactoryCalendarContext';
import { useToast } from '../context/ToastContext';
import { AttendanceStatus, Worker } from '../types';
import {
  Calendar,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  UserCheck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Sparkles,
  Search,
  CalendarDays,
  ArrowRight,
  Phone,
  Layers,
  IndianRupee,
  HardHat,
  Building2
} from 'lucide-react';

interface DailyAttendanceDetailPageProps {
  date?: string;
}

export const DailyAttendanceDetailPage: React.FC<DailyAttendanceDetailPageProps> = ({ date }) => {
  const { navigate } = useNavigation();
  const { workers } = useWorkers();
  const {
    records,
    markAttendance,
    bulkMarkAttendance,
    getAttendanceForDate,
    getDaySummary,
    getLeaveById
  } = useAttendance();
  const { getFactoryDay } = useFactoryCalendar();
  const { showToast } = useToast();

  const todayStr = getTodayDateString();
  const [selectedDate, setSelectedDate] = useState<string>(date || todayStr);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [includeAllWorkers, setIncludeAllWorkers] = useState<boolean>(false);

  // Leave modal state
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState<boolean>(false);
  const [leaveTargetWorkerId, setLeaveTargetWorkerId] = useState<string | undefined>(undefined);

  // Active or All workers based on toggle
  const baseWorkers = useMemo(() => {
    return includeAllWorkers ? workers : workers.filter(w => w.status === 'Active');
  }, [workers, includeAllWorkers]);

  // Unique departments for filter
  const departments = useMemo(() => {
    const deps = new Set(workers.map(w => w.department));
    return ['All', ...Array.from(deps)];
  }, [workers]);

  // Day summary counts
  const summary = useMemo(() => {
    return getDaySummary(selectedDate, baseWorkers);
  }, [getDaySummary, selectedDate, baseWorkers, records]);

  // Factory status for selected date
  const factoryDayInfo = useMemo(() => {
    return getFactoryDay(selectedDate);
  }, [selectedDate, getFactoryDay]);

  // Filter and sort workers
  const processedWorkers = useMemo(() => {
    return baseWorkers
      .filter(w => {
        const matchSearch =
          w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          w.workerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          w.skill.toLowerCase().includes(searchTerm.toLowerCase()) ||
          w.department.toLowerCase().includes(searchTerm.toLowerCase());

        const matchDep = departmentFilter === 'All' || w.department === departmentFilter;

        const record = getAttendanceForDate(w.workerId || w.id, selectedDate);
        const currentStatus = record?.status;

        let matchStatus = true;
        if (statusFilter === 'UNMARKED') {
          matchStatus = !currentStatus;
        } else if (statusFilter === 'PRESENT') {
          matchStatus = currentStatus === 'Present';
        } else if (statusFilter === 'HALFDAY') {
          matchStatus = currentStatus === 'Half Day';
        } else if (statusFilter === 'ABSENT') {
          matchStatus = currentStatus === 'Absent';
        } else if (statusFilter === 'ONLEAVE') {
          matchStatus = currentStatus === 'On Leave';
        } else if (statusFilter === 'HOLIDAY') {
          matchStatus = currentStatus === 'Holiday';
        }

        return matchSearch && matchDep && matchStatus;
      })
      .sort((a, b) => {
        // Prioritize Unmarked / Absent first so supervisors can immediately resolve floor gaps
        const recA = getAttendanceForDate(a.workerId || a.id, selectedDate);
        const recB = getAttendanceForDate(b.workerId || b.id, selectedDate);

        const scoreA = !recA ? 0 : recA.status === 'Absent' ? 1 : recA.status === 'Half Day' ? 2 : recA.status === 'On Leave' ? 3 : 4;
        const scoreB = !recB ? 0 : recB.status === 'Absent' ? 1 : recB.status === 'Half Day' ? 2 : recB.status === 'On Leave' ? 3 : 4;

        return scoreA - scoreB;
      });
  }, [baseWorkers, searchTerm, departmentFilter, statusFilter, selectedDate, getAttendanceForDate, records]);

  // Date shifting
  const changeDateByDays = (offset: number) => {
    const current = new Date(selectedDate + 'T00:00:00');
    current.setDate(current.getDate() + offset);
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');
    const d = String(current.getDate()).padStart(2, '0');
    const newDateStr = `${y}-${m}-${d}`;
    setSelectedDate(newDateStr);
    navigate(`/attendance/day/${newDateStr}`);
  };

  const handleDateInput = (newDate: string) => {
    if (newDate) {
      setSelectedDate(newDate);
      navigate(`/attendance/day/${newDate}`);
    }
  };

  const handleStatusChange = (worker: Worker, status: AttendanceStatus) => {
    const workerKey = worker.workerId || worker.id;

    // Intercept On Leave to open the Leave Range Modal
    if (status === 'On Leave') {
      setLeaveTargetWorkerId(workerKey);
      setIsLeaveModalOpen(true);
      return;
    }

    const currentRec = getAttendanceForDate(workerKey, selectedDate);

    markAttendance(workerKey, selectedDate, status, {
      checkInTime: currentRec?.checkInTime,
      checkOutTime: currentRec?.checkOutTime,
      notes: currentRec?.notes
    });

    showToast({
      title: 'Attendance Saved',
      message: `${worker.name} marked as ${status} on ${selectedDate}.`,
      type: status === 'Present' ? 'success' : status === 'Absent' ? 'danger' : 'info'
    });
  };

  const handleTimeChange = (
    worker: Worker,
    field: 'checkInTime' | 'checkOutTime',
    value: string
  ) => {
    const workerKey = worker.workerId || worker.id;
    const currentRec = getAttendanceForDate(workerKey, selectedDate);
    const status = currentRec?.status || 'Present';

    markAttendance(workerKey, selectedDate, status, {
      checkInTime: field === 'checkInTime' ? value : currentRec?.checkInTime,
      checkOutTime: field === 'checkOutTime' ? value : currentRec?.checkOutTime,
      notes: currentRec?.notes
    });
  };

  const handleNotesChange = (worker: Worker, notes: string) => {
    const workerKey = worker.workerId || worker.id;
    const currentRec = getAttendanceForDate(workerKey, selectedDate);
    const status = currentRec?.status || 'Present';

    markAttendance(workerKey, selectedDate, status, {
      checkInTime: currentRec?.checkInTime,
      checkOutTime: currentRec?.checkOutTime,
      notes
    });
  };

  const handleMarkAllUnmarkedPresent = () => {
    const unmarkedWorkerIds = baseWorkers
      .filter(w => !getAttendanceForDate(w.workerId || w.id, selectedDate))
      .map(w => w.workerId || w.id);

    if (unmarkedWorkerIds.length === 0) {
      showToast({
        title: 'All Logged',
        message: `All ${baseWorkers.length} operators already have attendance records for this date.`,
        type: 'info'
      });
      return;
    }

    bulkMarkAttendance(unmarkedWorkerIds, selectedDate, 'Present');
    showToast({
      title: 'Bulk Check-In Complete',
      message: `Marked ${unmarkedWorkerIds.length} unmarked operators as Present for ${selectedDate}.`,
      type: 'success'
    });
  };

  const handleMarkAllUnmarkedHoliday = () => {
    const unmarkedWorkerIds = baseWorkers
      .filter(w => !getAttendanceForDate(w.workerId || w.id, selectedDate))
      .map(w => w.workerId || w.id);

    if (unmarkedWorkerIds.length === 0) {
      showToast({
        title: 'All Logged',
        message: `All ${baseWorkers.length} operators already have attendance records for this date.`,
        type: 'info'
      });
      return;
    }

    bulkMarkAttendance(unmarkedWorkerIds, selectedDate, 'Holiday');
    showToast({
      title: 'Bulk Holiday Applied',
      message: `Marked ${unmarkedWorkerIds.length} unmarked operators as Holiday for ${selectedDate}.`,
      type: 'success'
    });
  };

  const isToday = selectedDate === todayStr;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Page Header */}
      <PageHeader
        title={`Daily Attendance Detail — ${new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        })}`}
        description="Comprehensive shift roster, timing records, compensation context, and inline attendance management for this date."
        breadcrumbs={[
          { label: 'Attendance', path: '/attendance' },
          { label: selectedDate }
        ]}
        badge={
          isToday ? (
            <span className="status-badge status-badge-active" style={{ fontSize: '11px', padding: '3px 8px' }}>
              Live Factory Shift
            </span>
          ) : (
            <span className="status-badge status-badge-neutral" style={{ fontSize: '11px', padding: '3px 8px' }}>
              Historical Record
            </span>
          )
        }
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Button
              variant="outline"
              icon={<Calendar size={14} />}
              onClick={() => navigate('/calendar')}
            >
              Factory Calendar
            </Button>
            <Button
              variant="outline"
              icon={<CalendarDays size={14} />}
              onClick={() => navigate('/attendance/leaves')}
            >
              Leave Directory
            </Button>
            <Button
              variant="secondary"
              icon={<ArrowLeft size={14} />}
              onClick={() => navigate('/attendance')}
            >
              Back to Overview
            </Button>
            {factoryDayInfo.status === 'Closed' ? (
              <Button
                variant="danger"
                icon={<Building2 size={14} />}
                onClick={handleMarkAllUnmarkedHoliday}
              >
                Mark Unmarked as Holiday
              </Button>
            ) : (
              <Button
                variant="primary"
                icon={<UserCheck size={14} />}
                onClick={handleMarkAllUnmarkedPresent}
              >
                Mark All Unmarked Present
              </Button>
            )}
          </div>
        }
      />

      {/* Factory Operating Status Banner (if Closed) */}
      {factoryDayInfo.status === 'Closed' && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px' }}>🔴</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-status-danger-solid)' }}>
                Plant Closed: {factoryDayInfo.title} ({factoryDayInfo.category})
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                {factoryDayInfo.notes || 'Plant operations and floor machining are suspended for this day.'}
              </div>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/calendar')}
          >
            Manage in Calendar
          </Button>
        </div>
      )}

      {/* Date Navigation & Jump Toolbar */}
      <div
        className="card"
        style={{
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          backgroundColor: 'var(--color-bg-surface)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Button
              variant="outline"
              size="sm"
              icon={<ChevronLeft size={14} />}
              onClick={() => changeDateByDays(-1)}
              title="Previous Day"
            />
            <Button
              variant="outline"
              size="sm"
              icon={<ChevronRight size={14} />}
              onClick={() => changeDateByDays(1)}
              title="Next Day"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} style={{ color: 'var(--color-brand-primary)' }} />
            <input
              type="date"
              className="input"
              value={selectedDate}
              onChange={e => handleDateInput(e.target.value)}
              style={{
                padding: '6px 10px',
                fontSize: '13px',
                fontWeight: 600,
                width: '160px'
              }}
            />
          </div>

          {!isToday && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSelectedDate(todayStr);
                navigate(`/attendance/day/${todayStr}`);
              }}
            >
              Jump to Today
            </Button>
          )}
        </div>

        <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
          {summary.present} Present • {summary.halfDay} Half Day • {summary.absent} Absent • {summary.notMarked} Unmarked
        </div>
      </div>

      {/* Day Summary KPI Cards Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '14px' }}>
        <SummaryCard
          title="Present on Floor"
          value={summary.present}
          subtitle="Full day attendance"
          icon={<CheckCircle2 size={18} />}
          statusTag={{ label: `${summary.present} Present`, variant: 'success' }}
        />
        <SummaryCard
          title="Half Day Shifts"
          value={summary.halfDay}
          subtitle="4-hour partial presence"
          icon={<Clock size={18} />}
          statusTag={{ label: `${summary.halfDay} Half Day`, variant: 'warning' }}
        />
        <SummaryCard
          title="Absent Operators"
          value={summary.absent}
          subtitle="Unplanned / sick absences"
          icon={<XCircle size={18} />}
          statusTag={{ label: `${summary.absent} Absent`, variant: summary.absent > 0 ? 'danger' : 'success' }}
        />
        <SummaryCard
          title="On Leave / Off"
          value={summary.onLeave + summary.holiday}
          subtitle={`${summary.onLeave} leave, ${summary.holiday} off`}
          icon={<AlertTriangle size={18} />}
          statusTag={{ label: `${summary.onLeave + summary.holiday} Leave/Off`, variant: 'info' }}
        />
        <SummaryCard
          title="Not Yet Marked"
          value={summary.notMarked}
          subtitle="Awaiting shift clock-in"
          icon={<CalendarCheck size={18} />}
          statusTag={{
            label: summary.notMarked === 0 ? 'All Marked' : `${summary.notMarked} Pending`,
            variant: summary.notMarked === 0 ? 'success' : 'neutral'
          }}
        />
        <SummaryCard
          title="Plant Workforce"
          value={summary.totalWorkers}
          subtitle="Tracked roster count"
          icon={<HardHat size={18} />}
        />
      </div>

      {/* Filter and Control Bar */}
      <div
        className="card"
        style={{
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '280px' }}>
          <div style={{ position: 'relative', width: '280px' }}>
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
              placeholder="Search operator, skill, code..."
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
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Status:</span>
            <select
              className="select"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{ padding: '6px 10px', fontSize: '12px' }}
            >
              <option value="ALL">All Statuses ({baseWorkers.length})</option>
              <option value="UNMARKED">Unmarked ({summary.notMarked})</option>
              <option value="PRESENT">Present ({summary.present})</option>
              <option value="HALFDAY">Half Day ({summary.halfDay})</option>
              <option value="ABSENT">Absent ({summary.absent})</option>
              <option value="ONLEAVE">On Leave ({summary.onLeave})</option>
              <option value="HOLIDAY">Holiday ({summary.holiday})</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
            <input
              type="checkbox"
              checked={includeAllWorkers}
              onChange={e => setIncludeAllWorkers(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            <span>Include Inactive / On Leave Roster</span>
          </label>

          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
            Showing <strong>{processedWorkers.length}</strong> operators
          </span>
        </div>
      </div>

      {/* Main Full Detail Worker Cards Grid */}
      {processedWorkers.length === 0 ? (
        <div className="card" style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          <UserCheck size={32} style={{ margin: '0 auto 12px auto', opacity: 0.4 }} />
          <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)' }}>No operators match your filter</div>
          <div style={{ fontSize: '13px', marginTop: '4px' }}>Try adjusting your search term, department, or status dropdown.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
          {processedWorkers.map(worker => {
            const workerKey = worker.workerId || worker.id;
            const record = getAttendanceForDate(workerKey, selectedDate);
            const currentStatus = record?.status;

            // Border color depending on status
            let cardAccentBorder = 'transparent';
            if (!currentStatus) cardAccentBorder = 'var(--color-status-warning-border)';
            else if (currentStatus === 'Absent') cardAccentBorder = 'var(--color-status-danger-solid)';
            else if (currentStatus === 'Present') cardAccentBorder = 'var(--color-status-success-solid)';
            else if (currentStatus === 'Half Day') cardAccentBorder = 'var(--color-status-warning-solid)';
            else if (currentStatus === 'On Leave') cardAccentBorder = 'var(--color-status-info-solid)';

            return (
              <div
                key={worker.id}
                className="card"
                style={{
                  padding: '16px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  borderLeft: `4px solid ${cardAccentBorder}`,
                  backgroundColor: 'var(--color-bg-surface)',
                  transition: 'box-shadow 0.15s ease'
                }}
              >
                {/* Card Top: Worker Identity & Quick Profile Links */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-brand-primary-light)',
                        color: 'var(--color-brand-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '15px',
                        flexShrink: 0
                      }}
                    >
                      {worker.name.charAt(0)}
                    </div>
                    <div>
                      <div
                        onClick={() => navigate(`/workers/${worker.workerId || worker.id}`)}
                        style={{
                          fontSize: '14px',
                          fontWeight: 700,
                          color: 'var(--color-brand-primary)',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                        onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                      >
                        {worker.name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                        <span className="mono-code" style={{ fontSize: '10px' }}>
                          {worker.workerId}
                        </span>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            padding: '1px 6px',
                            borderRadius: '3px',
                            backgroundColor: 'var(--color-bg-subtle)',
                            color: 'var(--color-text-secondary)',
                            border: '1px solid var(--color-border-subtle)'
                          }}
                        >
                          {worker.skill}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Current Status Badge */}
                  <div>
                    {currentStatus ? (
                      <div style={{ textAlign: 'right' }}>
                        <StatusBadge status={currentStatus} icon={true} />
                        {record?.leaveRecordId && (() => {
                          const leave = getLeaveById(record.leaveRecordId);
                          return (
                            <div
                              onClick={() => {
                                setLeaveTargetWorkerId(worker.workerId || worker.id);
                                setIsLeaveModalOpen(true);
                              }}
                              style={{
                                fontSize: '10px',
                                color: 'var(--color-status-info-text)',
                                fontWeight: 600,
                                marginTop: '3px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-end',
                                gap: '3px'
                              }}
                              title="Click to view/edit leave application"
                            >
                              <span>{leave ? `${leave.leaveType} Leave (${leave.totalDays}d)` : 'Multi-Day Leave'}</span>
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: 'var(--color-status-warning-bg)',
                          color: 'var(--color-status-warning-text)',
                          border: '1px solid var(--color-status-warning-border)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Clock size={11} />
                        <span>Not Marked</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Worker Context Strip: Department, Shift, Mobile, Compensation */}
                <div
                  style={{
                    padding: '8px 10px',
                    backgroundColor: 'var(--color-bg-subtle)',
                    borderRadius: 'var(--radius-md)',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '6px 12px',
                    fontSize: '11px',
                    color: 'var(--color-text-secondary)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Layers size={12} style={{ color: 'var(--color-text-muted)' }} />
                    <span>Dept: <strong>{worker.department}</strong></span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <HardHat size={12} style={{ color: 'var(--color-text-muted)' }} />
                    <span>Shift: <strong>{worker.shift || 'Shift A (8AM-8PM)'}</strong></span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Phone size={12} style={{ color: 'var(--color-text-muted)' }} />
                    <span>{worker.mobile}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <IndianRupee size={12} style={{ color: 'var(--color-status-success-solid)' }} />
                    <span>
                      ₹{worker.salary.toLocaleString('en-IN')}{worker.salaryType === 'Hourly Rate' ? '/hr' : worker.salaryType === 'Daily Wage' ? '/day' : worker.salaryType === 'Piece Rate (Karigar)' ? '/pc' : '/mo'}{' '}
                      <span style={{ opacity: 0.75 }}>({worker.salaryType === 'Hourly Rate' ? 'Hourly' : worker.salaryType.split(' ')[0]})</span>
                    </span>
                  </div>
                </div>

                {/* Timings and Remarks (When Present or Half Day) */}
                {(currentStatus === 'Present' || currentStatus === 'Half Day') && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '3px' }}>
                        Check-In Time
                      </label>
                      <input
                        type="text"
                        className="input"
                        placeholder="08:15 AM"
                        defaultValue={record?.checkInTime || '08:15 AM'}
                        onBlur={e => handleTimeChange(worker, 'checkInTime', e.target.value)}
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '3px' }}>
                        Check-Out Time
                      </label>
                      <input
                        type="text"
                        className="input"
                        placeholder={currentStatus === 'Half Day' ? '01:30 PM' : '05:30 PM'}
                        defaultValue={record?.checkOutTime || (currentStatus === 'Half Day' ? '01:30 PM' : '05:30 PM')}
                        onBlur={e => handleTimeChange(worker, 'checkOutTime', e.target.value)}
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                      />
                    </div>
                  </div>
                )}

                {/* Shift Notes Field */}
                <div>
                  <input
                    type="text"
                    className="input"
                    placeholder="Shift remarks / reason (e.g. casual leave, overtime, machine issue)..."
                    defaultValue={record?.notes || ''}
                    onBlur={e => handleNotesChange(worker, e.target.value)}
                    style={{ width: '100%', padding: '5px 8px', fontSize: '11px' }}
                  />
                </div>

                {/* 5-Way Segmented Quick Action Selector */}
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                    Set Status for {selectedDate}:
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(5, 1fr)',
                      gap: '4px',
                      backgroundColor: 'var(--color-bg-subtle)',
                      padding: '3px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border-subtle)'
                    }}
                  >
                    {/* Present */}
                    <button
                      type="button"
                      onClick={() => handleStatusChange(worker, 'Present')}
                      style={{
                        padding: '6px 2px',
                        fontSize: '11px',
                        fontWeight: 600,
                        borderRadius: 'var(--radius-sm)',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '3px',
                        backgroundColor: currentStatus === 'Present' ? 'var(--color-status-success-solid)' : 'transparent',
                        color: currentStatus === 'Present' ? '#ffffff' : 'var(--color-text-secondary)',
                        transition: 'all 0.15s'
                      }}
                    >
                      <CheckCircle2 size={11} />
                      <span>Present</span>
                    </button>

                    {/* Half Day */}
                    <button
                      type="button"
                      onClick={() => handleStatusChange(worker, 'Half Day')}
                      style={{
                        padding: '6px 2px',
                        fontSize: '11px',
                        fontWeight: 600,
                        borderRadius: 'var(--radius-sm)',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '3px',
                        backgroundColor: currentStatus === 'Half Day' ? 'var(--color-status-warning-solid)' : 'transparent',
                        color: currentStatus === 'Half Day' ? '#ffffff' : 'var(--color-text-secondary)',
                        transition: 'all 0.15s'
                      }}
                    >
                      <Clock size={11} />
                      <span>Half</span>
                    </button>

                    {/* Absent */}
                    <button
                      type="button"
                      onClick={() => handleStatusChange(worker, 'Absent')}
                      style={{
                        padding: '6px 2px',
                        fontSize: '11px',
                        fontWeight: 600,
                        borderRadius: 'var(--radius-sm)',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '3px',
                        backgroundColor: currentStatus === 'Absent' ? 'var(--color-status-danger-solid)' : 'transparent',
                        color: currentStatus === 'Absent' ? '#ffffff' : 'var(--color-text-secondary)',
                        transition: 'all 0.15s'
                      }}
                    >
                      <XCircle size={11} />
                      <span>Absent</span>
                    </button>

                    {/* On Leave */}
                    <button
                      type="button"
                      onClick={() => handleStatusChange(worker, 'On Leave')}
                      style={{
                        padding: '6px 2px',
                        fontSize: '11px',
                        fontWeight: 600,
                        borderRadius: 'var(--radius-sm)',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '3px',
                        backgroundColor: currentStatus === 'On Leave' ? 'var(--color-status-info-solid)' : 'transparent',
                        color: currentStatus === 'On Leave' ? '#ffffff' : 'var(--color-text-secondary)',
                        transition: 'all 0.15s'
                      }}
                    >
                      <AlertTriangle size={11} />
                      <span>Leave</span>
                    </button>

                    {/* Holiday */}
                    <button
                      type="button"
                      onClick={() => handleStatusChange(worker, 'Holiday')}
                      style={{
                        padding: '6px 2px',
                        fontSize: '11px',
                        fontWeight: 600,
                        borderRadius: 'var(--radius-sm)',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '3px',
                        backgroundColor: currentStatus === 'Holiday' ? 'var(--color-text-secondary)' : 'transparent',
                        color: currentStatus === 'Holiday' ? '#ffffff' : 'var(--color-text-secondary)',
                        transition: 'all 0.15s'
                      }}
                    >
                      <Sparkles size={11} />
                      <span>Off</span>
                    </button>
                  </div>
                </div>

                {/* Card Footer Action Links */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '8px',
                    borderTop: '1px solid var(--color-border-subtle)',
                    marginTop: 'auto'
                  }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<CalendarDays size={13} />}
                    onClick={() => navigate(`/attendance/${worker.workerId || worker.id}`)}
                  >
                    Monthly Calendar
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<ArrowRight size={13} />}
                    iconPosition="right"
                    onClick={() => navigate(`/workers/${worker.workerId || worker.id}`)}
                  >
                    Worker Profile
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Apply Multi-Day Leave Modal */}
      <ApplyLeaveModal
        isOpen={isLeaveModalOpen}
        onClose={() => {
          setIsLeaveModalOpen(false);
          setLeaveTargetWorkerId(undefined);
        }}
        workerId={leaveTargetWorkerId}
        initialStartDate={selectedDate}
        initialEndDate={selectedDate}
      />
    </div>
  );
};
