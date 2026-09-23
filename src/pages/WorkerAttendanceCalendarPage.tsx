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
import { AttendanceRecord, FactoryCalendarEntry } from '../types';
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
  const { config, getFactoryDay } = useFactoryCalendar();

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
      type: 'empty-lead' | 'day' | 'empty-trail';
      key: string;
      dayNumber: number | null;
      dateStr: string | null;
      isWeeklyOff: boolean;
      isToday: boolean;
      factoryInfo?: FactoryCalendarEntry;
      record?: AttendanceRecord;
    }> = [];

    // Leading empty cells
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({
        type: 'empty-lead',
        key: `lead-${i}`,
        dayNumber: null,
        dateStr: null,
        isWeeklyOff: i === config.defaultWeeklyOffDay,
        isToday: false
      });
    }

    // Month days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayOfWeek = new Date(currentYear, currentMonth - 1, day).getDay();
      const isWeeklyOff = dayOfWeek === config.defaultWeeklyOffDay;
      const isToday = dateStr === todayStr;
      const factoryInfo = getFactoryDay(dateStr);
      const record = getAttendanceForDate(worker ? (worker.workerId || worker.id) : resolvedWorkerId, dateStr);

      days.push({
        type: 'day',
        key: `day-${dateStr}`,
        dayNumber: day,
        dateStr,
        isWeeklyOff,
        isToday,
        factoryInfo,
        record
      });
    }

    // Trailing empty cells
    const remainder = days.length % 7;
    if (remainder !== 0) {
      const trailingCount = 7 - remainder;
      for (let t = 0; t < trailingCount; t++) {
        const trailingDayOfWeek = (firstDayIndex + daysInMonth + t) % 7;
        days.push({
          type: 'empty-trail',
          key: `trail-${t}`,
          dayNumber: null,
          dateStr: null,
          isWeeklyOff: trailingDayOfWeek === config.defaultWeeklyOffDay,
          isToday: false
        });
      }
    }

    return days;
  }, [currentYear, currentMonth, worker, resolvedWorkerId, getAttendanceForDate, todayStr, records, config.defaultWeeklyOffDay, getFactoryDay]);

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
        description={`Operator Code: ${worker.workerId || worker.id} • ${worker.skill} • ${worker.department} Department`}
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
              Profile
            </Button>
          </div>
        }
      />

      {/* Month Selector Bar */}
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
          <div style={{ display: 'inline-flex', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)', overflow: 'hidden' }}>
            <button
              onClick={handlePrevMonth}
              style={{
                padding: '6px 10px',
                background: 'transparent',
                border: 'none',
                borderRight: '1px solid var(--color-border-subtle)',
                cursor: 'pointer',
                color: 'var(--color-text-secondary)',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Previous Month"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={handleNextMonth}
              style={{
                padding: '6px 10px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-secondary)',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Next Month"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} style={{ color: 'var(--color-brand-primary)' }} />
            <span>
              {MONTH_NAMES[currentMonth - 1]} {currentYear}
            </span>
          </div>

          {(currentYear !== todayDateObj.getFullYear() || currentMonth !== todayDateObj.getMonth() + 1) && (
            <button
              onClick={handleJumpToCurrentMonth}
              style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--color-bg-subtle)',
                border: '1px solid var(--color-border-subtle)',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer'
              }}
            >
              Current Month
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '12px', fontSize: '11.5px', color: 'var(--color-text-secondary)' }}>
          <span>Rate: <strong style={{ color: 'var(--color-brand-primary)' }}>{summary.attendancePercent}%</strong></span>
          <span>•</span>
          <span>Present: <strong style={{ color: 'var(--color-status-success-solid)' }}>{summary.present}</strong></span>
          <span>•</span>
          <span>Absent: <strong style={{ color: 'var(--color-status-danger-solid)' }}>{summary.absent}</strong></span>
          <span>•</span>
          <span>Leave: <strong style={{ color: 'var(--color-brand-primary)' }}>{summary.onLeave}</strong></span>
        </div>
      </div>

      {/* Month Summary KPI Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px' }}>
        <SummaryCard
          title="Attendance Rate"
          value={`${summary.attendancePercent}%`}
          subtitle="Monthly compliance"
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
          statusTag={{ label: `${summary.present} Days`, variant: 'success' }}
        />
        <SummaryCard
          title="Half Days"
          value={`${summary.halfDay} Days`}
          subtitle="Partial shifts"
          icon={<Clock size={18} />}
          statusTag={{ label: `${summary.halfDay} Days`, variant: 'warning' }}
        />
        <SummaryCard
          title="Absent Days"
          value={`${summary.absent} Days`}
          subtitle="Unexcused absences"
          icon={<XCircle size={18} />}
          statusTag={{ label: `${summary.absent} Days`, variant: summary.absent > 0 ? 'danger' : 'success' }}
        />
        <SummaryCard
          title="On Leave"
          value={`${summary.onLeave} Days`}
          subtitle="Approved leaves"
          icon={<AlertTriangle size={18} />}
          statusTag={{ label: `${summary.onLeave} Days`, variant: 'info' }}
        />
        <SummaryCard
          title="Holidays / Off"
          value={`${summary.holiday} Days`}
          subtitle="Plant offs"
          icon={<Sparkles size={18} />}
          statusTag={{ label: `${summary.holiday} Off`, variant: 'neutral' }}
        />
      </div>

      {/* Main 7-Column Calendar Grid */}
      <div className="card" style={{ padding: '16px' }}>
        {/* Day Name Headers */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
            gap: '8px',
            marginBottom: '10px',
            textAlign: 'center'
          }}
        >
          {DAY_NAMES.map((name, i) => {
            const isWeeklyOff = i === config.defaultWeeklyOffDay;
            return (
              <div
                key={name}
                style={{
                  padding: '6px 4px',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: isWeeklyOff ? 'var(--color-status-danger-solid)' : 'var(--color-text-muted)',
                  backgroundColor: isWeeklyOff ? 'rgba(239, 68, 68, 0.08)' : 'var(--color-bg-subtle)',
                  borderRadius: 'var(--radius-sm)'
                }}
              >
                {name} {isWeeklyOff ? '(OFF)' : ''}
              </div>
            );
          })}
        </div>

        {/* Calendar Days Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
            gap: '8px'
          }}
        >
          {calendarDays.map((item) => {
            if (item.type !== 'day' || item.dayNumber === null) {
              return (
                <div
                  key={item.key}
                  style={{
                    minHeight: '92px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-bg-subtle)',
                    border: '1px solid var(--color-border-subtle)',
                    opacity: 0.3
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
            } else if (item.isWeeklyOff) {
              bgColor = 'rgba(239, 68, 68, 0.04)';
              borderColor = 'rgba(239, 68, 68, 0.2)';
            }

            return (
              <div
                key={`day-${item.dayNumber}`}
                onClick={() => item.dateStr && navigate(`/attendance/day/${item.dateStr}`)}
                style={{
                  minHeight: '92px',
                  padding: '8px 9px',
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
              >
                {/* Top: Day Number & Today Tag */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      width: '22px',
                      height: '22px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      backgroundColor: item.isToday ? 'var(--color-brand-primary)' : 'transparent',
                      color: item.isToday ? '#ffffff' : item.isWeeklyOff ? 'var(--color-status-danger-solid)' : 'var(--color-text-primary)'
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
                    <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                      {item.isWeeklyOff ? 'Plant Off' : 'Not marked'}
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
            marginTop: '16px',
            paddingTop: '12px',
            borderTop: '1px solid var(--color-border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            fontSize: '11.5px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: 'var(--color-status-success-bg)', border: '1px solid var(--color-status-success-border)' }} />
            <span style={{ color: 'var(--color-text-secondary)' }}>Present</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: 'var(--color-status-warning-bg)', border: '1px solid var(--color-status-warning-border)' }} />
            <span style={{ color: 'var(--color-text-secondary)' }}>Half Day</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: 'var(--color-status-danger-bg)', border: '1px solid var(--color-status-danger-border)' }} />
            <span style={{ color: 'var(--color-text-secondary)' }}>Absent</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: 'var(--color-status-info-bg)', border: '1px solid var(--color-status-info-border)' }} />
            <span style={{ color: 'var(--color-text-secondary)' }}>On Leave</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: 'rgba(241, 245, 249, 0.8)', border: '1px solid var(--color-border-subtle)' }} />
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
