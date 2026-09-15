import React, { useState, useMemo } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { SummaryCard } from '../components/common/SummaryCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { Button } from '../components/common/Button';
import { ApplyLeaveModal } from '../components/common/ApplyLeaveModal';
import { useNavigation } from '../context/NavigationContext';
import { useWorkers } from '../context/WorkerContext';
import { useAttendance, getTodayDateString } from '../context/AttendanceContext';
import { AttendanceRecord } from '../types';
import {
  Calendar,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  User,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Sparkles,
  ExternalLink,
  Plus
} from 'lucide-react';

interface WorkerAttendanceCalendarPageProps {
  workerId?: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const WorkerAttendanceCalendarPage: React.FC<WorkerAttendanceCalendarPageProps> = ({ workerId }) => {
  const { currentPath, navigate } = useNavigation();
  const { getWorker, workers } = useWorkers();
  const {
    records,
    getAttendanceForDate,
    getMonthSummary
  } = useAttendance();

  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

  // Extract worker ID from route if not directly provided as prop e.g. /attendance/WRK-001
  const pathParts = currentPath.split('/');
  const resolvedWorkerId = workerId || pathParts[2] || 'WRK-001';

  const worker = getWorker(resolvedWorkerId) || workers[0];

  const todayStr = getTodayDateString();
  const todayDateObj = new Date();

  // Current calendar viewing month and year
  const [currentYear, setCurrentYear] = useState<number>(todayDateObj.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(todayDateObj.getMonth() + 1); // 1-indexed (1..12)

  // Previous Month
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  // Next Month
  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Jump to Current Month
  const handleJumpToCurrentMonth = () => {
    setCurrentYear(todayDateObj.getFullYear());
    setCurrentMonth(todayDateObj.getMonth() + 1);
  };

  // Calculate calendar month layout
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth - 1, 1).getDay(); // 0 is Sunday
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

    const days: Array<{
      dayNumber: number | null;
      dateStr: string | null;
      isWeekend: boolean;
      isToday: boolean;
      record?: AttendanceRecord;
    }> = [];

    // Leading empty cells
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({
        dayNumber: null,
        dateStr: null,
        isWeekend: i === 0,
        isToday: false
      });
    }

    // Month days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayOfWeek = new Date(currentYear, currentMonth - 1, day).getDay();
      const isWeekend = dayOfWeek === 0; // Sunday
      const isToday = dateStr === todayStr;
      const record = getAttendanceForDate(worker ? (worker.workerId || worker.id) : resolvedWorkerId, dateStr);

      days.push({
        dayNumber: day,
        dateStr,
        isWeekend,
        isToday,
        record
      });
    }

    return days;
  }, [currentYear, currentMonth, worker, resolvedWorkerId, getAttendanceForDate, todayStr, records]);

  // Month summary calculations
  const summary = useMemo(() => {
    if (!worker) {
      return {
        present: 0,
        absent: 0,
        halfDay: 0,
        onLeave: 0,
        holiday: 0,
        totalMarked: 0,
        attendancePercent: 0
      };
    }
    return getMonthSummary(worker.workerId || worker.id, currentYear, currentMonth);
  }, [worker, currentYear, currentMonth, getMonthSummary, records]);

  if (!worker) {
    return (
      <div style={{ padding: '36px', textAlign: 'center' }}>
        <div>Worker not found.</div>
        <Button variant="secondary" onClick={() => navigate('/attendance')} style={{ marginTop: '14px' }}>
          Back to Attendance
        </Button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Page Header */}
      <PageHeader
        title={`${worker.name} — Monthly Attendance`}
        description={`Operator Code: ${worker.workerId} • Skill: ${worker.skill} • ${worker.department} Department`}
        breadcrumbs={[
          { label: 'Attendance', path: '/attendance' },
          { label: `${worker.name} Calendar` }
        ]}
        badge={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <StatusBadge status={worker.status} />
            <span className="mono-code" style={{ fontSize: '11px' }}>
              ₹{worker.salary.toLocaleString('en-IN')} ({worker.salaryType})
            </span>
          </div>
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
              variant="primary"
              icon={<Plus size={14} />}
              onClick={() => setIsLeaveModalOpen(true)}
            >
              Apply Leave
            </Button>
            <Button
              variant="secondary"
              icon={<ArrowLeft size={14} />}
              onClick={() => navigate('/attendance')}
            >
              Daily Roster
            </Button>
            <Button
              variant="outline"
              icon={<User size={14} />}
              onClick={() => navigate(`/workers/${worker.workerId || worker.id}`)}
            >
              Worker Profile
            </Button>
          </div>
        }
      />

      {/* Month Selector Bar */}
      <div
        className="card"
        style={{
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          backgroundColor: 'var(--color-bg-surface)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Button
              variant="outline"
              size="sm"
              icon={<ChevronLeft size={14} />}
              onClick={handlePrevMonth}
              title="Previous Month"
            />
            <Button
              variant="outline"
              size="sm"
              icon={<ChevronRight size={14} />}
              onClick={handleNextMonth}
              title="Next Month"
            />
          </div>

          <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} style={{ color: 'var(--color-brand-primary)' }} />
            <span>
              {MONTH_NAMES[currentMonth - 1]} {currentYear}
            </span>
          </div>

          {(currentYear !== todayDateObj.getFullYear() || currentMonth !== todayDateObj.getMonth() + 1) && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleJumpToCurrentMonth}
            >
              Current Month
            </Button>
          )}
        </div>

        <div style={{ fontSize: '12px', color: 'var(--color-brand-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
          <ExternalLink size={13} />
          <span>Click any date to view the full plant daily attendance page</span>
        </div>
      </div>

      {/* Month Summary KPI Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px' }}>
        <SummaryCard
          title="Attendance Rate"
          value={`${summary.attendancePercent}%`}
          subtitle="Of marked working days"
          icon={<CalendarCheck size={18} />}
          statusTag={{
            label: summary.attendancePercent >= 90 ? 'Excellent' : summary.attendancePercent >= 75 ? 'Satisfactory' : 'Needs Review',
            variant: summary.attendancePercent >= 90 ? 'success' : summary.attendancePercent >= 75 ? 'warning' : 'danger'
          }}
        />
        <SummaryCard
          title="Present Days"
          value={`${summary.present} Days`}
          subtitle="Full working shifts"
          icon={<CheckCircle2 size={18} />}
          statusTag={{ label: `${summary.present} Present`, variant: 'success' }}
        />
        <SummaryCard
          title="Half Days"
          value={`${summary.halfDay} Days`}
          subtitle="4-hour partial shifts"
          icon={<Clock size={18} />}
          statusTag={{ label: `${summary.halfDay} Half`, variant: 'warning' }}
        />
        <SummaryCard
          title="Absent Days"
          value={`${summary.absent} Days`}
          subtitle="Unexcused / sick absences"
          icon={<XCircle size={18} />}
          statusTag={{ label: `${summary.absent} Absent`, variant: summary.absent > 0 ? 'danger' : 'success' }}
        />
        <SummaryCard
          title="On Leave"
          value={`${summary.onLeave} Days`}
          subtitle="Approved leave requests"
          icon={<AlertTriangle size={18} />}
          statusTag={{ label: `${summary.onLeave} Leave`, variant: 'info' }}
        />
        <SummaryCard
          title="Holidays / Off"
          value={`${summary.holiday} Days`}
          subtitle="Sunday / plant closure"
          icon={<Sparkles size={18} />}
          statusTag={{ label: `${summary.holiday} Off`, variant: 'neutral' }}
        />
      </div>

      {/* Main 7-Column Calendar Grid */}
      <div className="card" style={{ padding: '20px' }}>
        {/* Day Name Headers */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '10px',
            marginBottom: '10px',
            textAlign: 'center'
          }}
        >
          {DAY_NAMES.map((name, i) => (
            <div
              key={name}
              style={{
                padding: '8px 4px',
                fontSize: '12px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: i === 0 ? 'var(--color-status-danger-solid)' : 'var(--color-text-secondary)',
                backgroundColor: i === 0 ? 'rgba(239, 68, 68, 0.06)' : 'var(--color-bg-subtle)',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              {name}
            </div>
          ))}
        </div>

        {/* Calendar Days Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '10px'
          }}
        >
          {calendarDays.map((item, idx) => {
            if (item.dayNumber === null) {
              return (
                <div
                  key={`empty-${idx}`}
                  style={{
                    minHeight: '90px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'rgba(241, 245, 249, 0.3)',
                    border: '1px dashed var(--color-border-subtle)',
                    opacity: 0.4
                  }}
                />
              );
            }

            const rec = item.record;
            const status = rec?.status;

            // Define visual styling based on attendance status
            let bgColor = 'var(--color-bg-surface)';
            let borderColor = 'var(--color-border-subtle)';
            let statusTextColor = 'var(--color-text-primary)';
            let badgeIcon = null;

            if (status === 'Present') {
              bgColor = 'var(--color-status-success-bg)';
              borderColor = 'var(--color-status-success-border)';
              statusTextColor = 'var(--color-status-success-text)';
              badgeIcon = <CheckCircle2 size={13} style={{ color: 'var(--color-status-success-solid)' }} />;
            } else if (status === 'Absent') {
              bgColor = 'var(--color-status-danger-bg)';
              borderColor = 'var(--color-status-danger-border)';
              statusTextColor = 'var(--color-status-danger-text)';
              badgeIcon = <XCircle size={13} style={{ color: 'var(--color-status-danger-solid)' }} />;
            } else if (status === 'Half Day') {
              bgColor = 'var(--color-status-warning-bg)';
              borderColor = 'var(--color-status-warning-border)';
              statusTextColor = 'var(--color-status-warning-text)';
              badgeIcon = <Clock size={13} style={{ color: 'var(--color-status-warning-solid)' }} />;
            } else if (status === 'On Leave') {
              bgColor = 'var(--color-status-info-bg)';
              borderColor = 'var(--color-status-info-border)';
              statusTextColor = 'var(--color-status-info-text)';
              badgeIcon = <AlertTriangle size={13} style={{ color: 'var(--color-status-info-solid)' }} />;
            } else if (status === 'Holiday') {
              bgColor = 'rgba(241, 245, 249, 0.7)';
              borderColor = 'var(--color-border-subtle)';
              statusTextColor = 'var(--color-text-secondary)';
              badgeIcon = <Sparkles size={13} style={{ color: 'var(--color-text-muted)' }} />;
            } else if (item.isWeekend) {
              bgColor = 'rgba(248, 250, 252, 0.6)';
            }

            const cellTooltip = `${item.dateStr}: ${status || 'Not marked'}${rec?.checkInTime ? ` (${rec.checkInTime})` : ''} — Click to view full daily detail`;

            return (
              <div
                key={`day-${item.dayNumber}`}
                onClick={() => item.dateStr && navigate(`/attendance/day/${item.dateStr}`)}
                title={cellTooltip}
                style={{
                  minHeight: '92px',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: bgColor,
                  border: item.isToday ? '2px solid var(--color-brand-primary)' : `1px solid ${borderColor}`,
                  boxShadow: item.isToday ? '0 0 0 1px var(--color-brand-primary)' : 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.15s ease',
                  position: 'relative'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.08)';
                  e.currentTarget.style.borderColor = 'var(--color-brand-primary)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = item.isToday ? '0 0 0 1px var(--color-brand-primary)' : 'none';
                  e.currentTarget.style.borderColor = item.isToday ? 'var(--color-brand-primary)' : borderColor;
                }}
              >
                {/* Top: Day Number & Today Tag */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      color: item.isToday ? 'var(--color-brand-primary)' : item.isWeekend ? 'var(--color-status-danger-solid)' : 'var(--color-text-primary)'
                    }}
                  >
                    {item.dayNumber}
                  </span>

                  {item.isToday && (
                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: 700,
                        padding: '1px 5px',
                        borderRadius: '3px',
                        backgroundColor: 'var(--color-brand-primary)',
                        color: '#ffffff',
                        textTransform: 'uppercase'
                      }}
                    >
                      Today
                    </span>
                  )}
                </div>

                {/* Middle / Bottom: Status details */}
                <div style={{ marginTop: 'auto' }}>
                  {status ? (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, color: statusTextColor }}>
                        {badgeIcon}
                        <span>{status}</span>
                      </div>

                      {rec?.checkInTime && (
                        <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                          {rec.checkInTime}
                        </div>
                      )}

                      {rec?.notes && (
                        <div
                          style={{
                            fontSize: '9px',
                            color: status === 'On Leave' ? 'var(--color-status-info-text)' : 'var(--color-text-muted)',
                            fontWeight: status === 'On Leave' ? 600 : 400,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            marginTop: '2px'
                          }}
                        >
                          {rec.notes}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', opacity: 0.6 }}>
                      {item.isWeekend ? 'Sunday Off' : 'Not marked'}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend Bar */}
        <div
          style={{
            marginTop: '20px',
            paddingTop: '14px',
            borderTop: '1px solid var(--color-border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '18px',
            fontSize: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: 'var(--color-status-success-bg)', border: '1px solid var(--color-status-success-border)' }} />
            <span style={{ color: 'var(--color-text-secondary)' }}>Present (Full Day)</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: 'var(--color-status-warning-bg)', border: '1px solid var(--color-status-warning-border)' }} />
            <span style={{ color: 'var(--color-text-secondary)' }}>Half Day (0.5 Day)</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: 'var(--color-status-danger-bg)', border: '1px solid var(--color-status-danger-border)' }} />
            <span style={{ color: 'var(--color-text-secondary)' }}>Absent (Unexcused)</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: 'var(--color-status-info-bg)', border: '1px solid var(--color-status-info-border)' }} />
            <span style={{ color: 'var(--color-text-secondary)' }}>On Leave (Approved)</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: 'rgba(241, 245, 249, 0.8)', border: '1px solid var(--color-border-subtle)' }} />
            <span style={{ color: 'var(--color-text-secondary)' }}>Holiday / Plant Off</span>
          </div>
        </div>
      </div>

      {/* Apply Multi-Day Leave Modal */}
      <ApplyLeaveModal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        workerId={worker ? (worker.workerId || worker.id) : resolvedWorkerId}
      />
    </div>
  );
};
