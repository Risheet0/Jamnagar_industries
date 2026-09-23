import React, { useState, useMemo } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { SummaryCard } from '../components/common/SummaryCard';
import { Button } from '../components/common/Button';
import { FactoryScheduleModal } from '../components/common/FactoryScheduleModal';
import { useFactoryCalendar } from '../context/FactoryCalendarContext';
import { useAttendance, getTodayDateString } from '../context/AttendanceContext';
import { useWorkers } from '../context/WorkerContext';
import { useNavigation } from '../context/NavigationContext';
import { FactoryCalendarEntry } from '../types';
import {
  Calendar,
  Clock,
  Building2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Settings,
  Flame,
  ExternalLink,
  Layers,
  Search,
  Edit3,
  CalendarDays
} from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const FactoryCalendarPage: React.FC = () => {
  const {
    config,
    getFactoryDay,
    getMonthSummary,
    getAllHolidaysForYear
  } = useFactoryCalendar();
  const { workers } = useWorkers();
  const { getDaySummary, getAttendanceForDate } = useAttendance();
  const { navigate } = useNavigation();

  const todayStr = getTodayDateString();
  const todayDateObj = new Date();

  const [currentYear, setCurrentYear] = useState<number>(todayDateObj.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(todayDateObj.getMonth() + 1); // 1-indexed

  const [viewMode, setViewMode] = useState<'calendar' | 'matrix' | 'holidayList'>('calendar');
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState<boolean>(false);
  const [modalInitialDate, setModalInitialDate] = useState<string>(todayStr);
  const [matrixSearch, setMatrixSearch] = useState<string>('');
  const [holidaySearch, setHolidaySearch] = useState<string>('');

  const activeWorkers = useMemo(() => workers.filter(w => w.status === 'Active'), [workers]);

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

  const handleJumpToCurrentMonth = () => {
    setCurrentYear(todayDateObj.getFullYear());
    setCurrentMonth(todayDateObj.getMonth() + 1);
    setSelectedDate(todayStr);
  };

  // Month Operational Summary
  const monthSummary = useMemo(
    () => getMonthSummary(currentYear, currentMonth),
    [currentYear, currentMonth, getMonthSummary]
  );

  // Today's Factory Info
  const todayFactoryInfo = useMemo(() => getFactoryDay(todayStr), [todayStr, getFactoryDay]);
  const todayDaySummary = useMemo(() => getDaySummary(todayStr, activeWorkers), [todayStr, getDaySummary, activeWorkers]);

  // Selected Day Factory Info & Attendance
  const selectedFactoryInfo = useMemo(() => getFactoryDay(selectedDate), [selectedDate, getFactoryDay]);
  const selectedDaySummary = useMemo(() => getDaySummary(selectedDate, activeWorkers), [selectedDate, getDaySummary, activeWorkers]);

  // Calendar Days Calculation
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth - 1, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

    const days: Array<{
      type: 'empty-lead' | 'day' | 'empty-trail';
      key: string;
      dayNumber: number | null;
      dateStr: string | null;
      isWeeklyOff: boolean;
      isToday: boolean;
      dayOfWeek: number;
      factoryInfo?: FactoryCalendarEntry;
    }> = [];

    // Leading empty cells before Day 1
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({
        type: 'empty-lead',
        key: `lead-${i}`,
        dayNumber: null,
        dateStr: null,
        isWeeklyOff: i === config.defaultWeeklyOffDay,
        isToday: false,
        dayOfWeek: i
      });
    }

    // Days 1 through daysInMonth
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const d = new Date(currentYear, currentMonth - 1, day);
      const dayOfWeek = d.getDay();
      const isWeeklyOff = dayOfWeek === config.defaultWeeklyOffDay;
      const isToday = dateStr === todayStr;
      const factoryInfo = getFactoryDay(dateStr);

      days.push({
        type: 'day',
        key: `day-${dateStr}`,
        dayNumber: day,
        dateStr,
        isWeeklyOff,
        isToday,
        dayOfWeek,
        factoryInfo
      });
    }

    // Trailing empty cells to complete the last 7-day row
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
          isToday: false,
          dayOfWeek: trailingDayOfWeek
        });
      }
    }

    return days;
  }, [currentYear, currentMonth, todayStr, config.defaultWeeklyOffDay, getFactoryDay]);

  const openScheduleForDate = (dateStr: string) => {
    setModalInitialDate(dateStr);
    setIsScheduleModalOpen(true);
  };

  const holidaysForCurrentYear = useMemo(
    () => getAllHolidaysForYear(currentYear),
    [currentYear, getAllHolidaysForYear]
  );

  const filteredHolidays = useMemo(() => {
    if (!holidaySearch.trim()) return holidaysForCurrentYear;
    const q = holidaySearch.toLowerCase();
    return holidaysForCurrentYear.filter(h =>
      h.title.toLowerCase().includes(q) ||
      h.date.includes(q) ||
      h.category.toLowerCase().includes(q) ||
      (h.notes && h.notes.toLowerCase().includes(q))
    );
  }, [holidaysForCurrentYear, holidaySearch]);

  const filteredWorkersForMatrix = useMemo(() => {
    if (!matrixSearch.trim()) return activeWorkers;
    const q = matrixSearch.toLowerCase();
    return activeWorkers.filter(w =>
      w.name.toLowerCase().includes(q) ||
      (w.workerId && w.workerId.toLowerCase().includes(q)) ||
      (w.skill && w.skill.toLowerCase().includes(q))
    );
  }, [activeWorkers, matrixSearch]);

  const uptimePercent = monthSummary.totalDays > 0
    ? Math.round((monthSummary.openDays / monthSummary.totalDays) * 100)
    : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Page Header */}
      <PageHeader
        title="Factory Calendar"
        description="Plant operational schedules, weekly offs, declared holidays, and shift oversight."
        actions={
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button
              variant="secondary"
              icon={<Settings size={15} />}
              onClick={() => {
                setModalInitialDate(todayStr);
                setIsScheduleModalOpen(true);
              }}
            >
              Weekly Off Config
            </Button>
            <Button
              variant="primary"
              icon={<Plus size={15} />}
              onClick={() => {
                setModalInitialDate(selectedDate || todayStr);
                setIsScheduleModalOpen(true);
              }}
            >
              Declare Holiday / Override
            </Button>
          </div>
        }
      />

      {/* Top Plant KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        {/* Card 1: Today Plant Status */}
        <div
          className="card"
          style={{
            padding: '16px 18px',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            borderLeft: `4px solid ${
              todayFactoryInfo.status === 'Open'
                ? 'var(--color-status-success-solid)'
                : 'var(--color-status-danger-solid)'
            }`
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Today's Status
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor:
                  todayFactoryInfo.status === 'Open'
                    ? 'rgba(16, 185, 129, 0.12)'
                    : 'rgba(239, 68, 68, 0.12)',
                color:
                  todayFactoryInfo.status === 'Open'
                    ? 'var(--color-status-success-solid)'
                    : 'var(--color-status-danger-solid)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: todayFactoryInfo.status === 'Open' ? '#10b981' : '#ef4444' }} />
              {todayFactoryInfo.status === 'Open' ? 'Factory Open' : 'Factory Closed'}
            </span>
          </div>
          <div style={{ marginTop: '10px' }}>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              {todayFactoryInfo.title}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '3px' }}>
              {todayFactoryInfo.status === 'Open'
                ? `${todayDaySummary.present} of ${todayDaySummary.totalWorkers} workers present`
                : 'Floor operations suspended'}
            </div>
          </div>
        </div>

        {/* Card 2: Operating Days */}
        <SummaryCard
          title="Operating Days"
          value={`${monthSummary.openDays} / ${monthSummary.totalDays} Days`}
          subtitle={`${uptimePercent}% Monthly Plant Uptime`}
          icon={<Building2 size={20} />}
          statusTag={{ label: 'Active Floor', variant: 'success' }}
        />

        {/* Card 3: Non-Working Days */}
        <SummaryCard
          title="Non-Working Days"
          value={`${monthSummary.closedDays} Days`}
          subtitle={`${monthSummary.weeklyOffs} Weekly Offs • ${monthSummary.holidays} Holidays`}
          icon={<Calendar size={20} />}
          statusTag={{ label: 'Scheduled Offs', variant: 'danger' }}
        />

        {/* Card 4: Operating Shift & Weekly Off */}
        <div
          className="card"
          style={{
            padding: '16px 18px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Shift & Schedule
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                color: 'var(--color-brand-primary)'
              }}
            >
              Standard Rule
            </span>
          </div>
          <div style={{ marginTop: '10px' }}>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              {config.weeklyOffTitle || 'Friday Weekly Off'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Clock size={13} style={{ color: 'var(--color-brand-primary)' }} />
              {config.standardShiftTimings || 'Day Shift: 8:00 AM – 8:00 PM'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: '18px', alignItems: 'start' }}>
        {/* Left Column: Calendar / Matrix / Holidays */}
        <div className="card" style={{ overflow: 'hidden', minWidth: 0 }}>
          {/* Header Bar: Month Navigation & View Segmented Tabs */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              padding: '14px 18px',
              borderBottom: '1px solid var(--color-border-subtle)',
              backgroundColor: 'var(--color-bg-surface)'
            }}
          >
            {/* Month & Year Navigation */}
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

              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--color-text-primary)', minWidth: '160px' }}>
                {MONTH_NAMES[currentMonth - 1]} {currentYear}
              </h2>

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
                Today
              </button>
            </div>

            {/* View Mode Segmented Controls */}
            <div
              style={{
                display: 'inline-flex',
                padding: '3px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-bg-subtle)',
                border: '1px solid var(--color-border-subtle)',
                gap: '2px'
              }}
            >
              <button
                onClick={() => setViewMode('calendar')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  backgroundColor: viewMode === 'calendar' ? 'var(--color-brand-primary)' : 'transparent',
                  color: viewMode === 'calendar' ? '#ffffff' : 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <Calendar size={14} />
                Month View
              </button>
              <button
                onClick={() => setViewMode('matrix')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  backgroundColor: viewMode === 'matrix' ? 'var(--color-brand-primary)' : 'transparent',
                  color: viewMode === 'matrix' ? '#ffffff' : 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <Layers size={14} />
                Workforce Matrix
              </button>
              <button
                onClick={() => setViewMode('holidayList')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  backgroundColor: viewMode === 'holidayList' ? 'var(--color-brand-primary)' : 'transparent',
                  color: viewMode === 'holidayList' ? '#ffffff' : 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <Flame size={14} />
                Holidays ({holidaysForCurrentYear.length})
              </button>
            </div>
          </div>

          {/* VIEW 1: Clean Industrial Calendar Grid */}
          {viewMode === 'calendar' && (
            <div style={{ padding: '16px', minWidth: 0, overflowX: 'auto' }}>
              {/* Day of Week Headers */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                  gap: '8px',
                  marginBottom: '10px',
                  textAlign: 'center'
                }}
              >
                {DAY_NAMES.map((name, idx) => {
                  const isWeeklyOff = idx === config.defaultWeeklyOffDay;
                  return (
                    <div
                      key={name}
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '6px 4px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: isWeeklyOff
                          ? 'rgba(239, 68, 68, 0.08)'
                          : 'var(--color-bg-subtle)',
                        color: isWeeklyOff
                          ? 'var(--color-status-danger-solid)'
                          : 'var(--color-text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}
                    >
                      {name} {isWeeklyOff ? '(OFF)' : ''}
                    </div>
                  );
                })}
              </div>

              {/* Day Cells Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                  gap: '8px'
                }}
              >
                {calendarDays.map((cell) => {
                  if (cell.type !== 'day' || cell.dayNumber === null || !cell.dateStr) {
                    return (
                      <div
                        key={cell.key}
                        style={{
                          minHeight: '100px',
                          backgroundColor: 'var(--color-bg-subtle)',
                          opacity: 0.3,
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--color-border-subtle)'
                        }}
                      />
                    );
                  }

                  const info = cell.factoryInfo!;
                  const isOpen = info.status === 'Open';
                  const isSelected = selectedDate === cell.dateStr;
                  const daySummary = getDaySummary(cell.dateStr, activeWorkers);
                  const isHoliday = !isOpen && info.category !== 'Weekly Off';
                  const isWeeklyOff = !isOpen && info.category === 'Weekly Off';
                  const isSpecialWorkDay = isOpen && info.isCustomOverride;
                  const hasAttendanceLogged = daySummary.present > 0 || daySummary.absent > 0 || daySummary.halfDay > 0;

                  return (
                    <div
                      key={cell.key}
                      onClick={() => setSelectedDate(cell.dateStr!)}
                      onDoubleClick={() => openScheduleForDate(cell.dateStr!)}
                      style={{
                        minHeight: '100px',
                        padding: '8px 9px',
                        borderRadius: 'var(--radius-md)',
                        border: isSelected
                          ? '2px solid var(--color-brand-primary)'
                          : cell.isToday
                          ? '1.5px solid var(--color-brand-accent)'
                          : isHoliday
                          ? '1px solid rgba(239, 68, 68, 0.3)'
                          : isWeeklyOff
                          ? '1px solid rgba(245, 158, 11, 0.25)'
                          : '1px solid var(--color-border-subtle)',
                        backgroundColor: isSelected
                          ? 'rgba(30, 58, 138, 0.06)'
                          : cell.isToday
                          ? 'rgba(2, 132, 199, 0.04)'
                          : isHoliday
                          ? 'rgba(239, 68, 68, 0.04)'
                          : isWeeklyOff
                          ? 'rgba(245, 158, 11, 0.03)'
                          : 'var(--color-bg-surface-solid)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        transition: 'all 0.15s ease',
                        position: 'relative',
                        boxShadow: isSelected ? '0 0 0 1px var(--color-brand-primary)' : 'none'
                      }}
                    >
                      {/* Top Row: Date Number & Badges */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span
                          style={{
                            fontSize: '13px',
                            fontWeight: cell.isToday || isSelected ? 800 : 600,
                            width: '24px',
                            height: '24px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '50%',
                            backgroundColor: cell.isToday
                              ? 'var(--color-brand-primary)'
                              : 'transparent',
                            color: cell.isToday
                              ? '#ffffff'
                              : isHoliday
                              ? 'var(--color-status-danger-solid)'
                              : isWeeklyOff
                              ? 'var(--color-status-warning-solid)'
                              : 'var(--color-text-primary)'
                          }}
                        >
                          {cell.dayNumber}
                        </span>

                        {/* Top-right subtle badge */}
                        {isHoliday && (
                          <span
                            style={{
                              fontSize: '9.5px',
                              fontWeight: 700,
                              padding: '1px 5px',
                              borderRadius: '3px',
                              backgroundColor: 'rgba(239, 68, 68, 0.12)',
                              color: 'var(--color-status-danger-solid)',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            Holiday
                          </span>
                        )}

                        {isWeeklyOff && (
                          <span
                            style={{
                              fontSize: '9.5px',
                              fontWeight: 600,
                              padding: '1px 5px',
                              borderRadius: '3px',
                              backgroundColor: 'rgba(245, 158, 11, 0.12)',
                              color: 'var(--color-status-warning-solid)',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            Off
                          </span>
                        )}

                        {isSpecialWorkDay && (
                          <span
                            style={{
                              fontSize: '9.5px',
                              fontWeight: 700,
                              padding: '1px 5px',
                              borderRadius: '3px',
                              backgroundColor: 'rgba(16, 185, 129, 0.15)',
                              color: 'var(--color-status-success-solid)',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            Special
                          </span>
                        )}
                      </div>

                      {/* Middle: Event Title (Only shown for holidays / special events to avoid clutter) */}
                      <div style={{ margin: '4px 0', minHeight: '22px' }}>
                        {isHoliday ? (
                          <div
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: 'var(--color-status-danger-solid)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                            title={info.title}
                          >
                            {info.title}
                          </div>
                        ) : isSpecialWorkDay ? (
                          <div
                            style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              color: 'var(--color-status-success-solid)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                            title={info.title}
                          >
                            {info.title}
                          </div>
                        ) : isWeeklyOff ? (
                          <div style={{ fontSize: '10.5px', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                            Weekly Off
                          </div>
                        ) : null}
                      </div>

                      {/* Bottom Row: Attendance Presence Pill */}
                      <div>
                        {isOpen ? (
                          hasAttendanceLogged ? (
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '10px',
                                fontWeight: 700,
                                padding: '2px 6px',
                                borderRadius: '4px',
                                backgroundColor: 'rgba(16, 185, 129, 0.08)',
                                color: 'var(--color-status-success-solid)'
                              }}
                            >
                              <span>● {daySummary.present} Present</span>
                              {daySummary.absent > 0 && (
                                <span style={{ color: 'var(--color-status-danger-solid)' }}>
                                  ({daySummary.absent}A)
                                </span>
                              )}
                            </div>
                          ) : (
                            <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                              Open Shift
                            </div>
                          )
                        ) : (
                          <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                            {info.category === 'Weekly Off' ? 'Plant Closed' : info.category}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW 2: Clean Worker Presence Matrix */}
          {viewMode === 'matrix' && (
            <div style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', gap: '10px' }}>
                <div style={{ position: 'relative', width: '260px' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Search worker by name or ID..."
                    value={matrixSearch}
                    onChange={e => setMatrixSearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 10px 6px 32px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-border-subtle)',
                      backgroundColor: 'var(--color-bg-subtle)',
                      color: 'var(--color-text-primary)',
                      fontSize: '12px'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'var(--color-text-secondary)', alignItems: 'center' }}>
                  <span><strong style={{ color: 'var(--color-status-success-solid)' }}>P</strong> Present</span>
                  <span><strong style={{ color: 'var(--color-status-warning-solid)' }}>H</strong> Half Day</span>
                  <span><strong style={{ color: 'var(--color-status-danger-solid)' }}>A</strong> Absent</span>
                  <span><strong style={{ color: 'var(--color-brand-primary)' }}>L</strong> Leave</span>
                  <span><strong style={{ color: 'var(--color-text-muted)' }}>Off</strong> Closed</span>
                </div>
              </div>

              <div style={{ overflowX: 'auto', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-md)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--color-bg-subtle)', borderBottom: '1px solid var(--color-border-subtle)' }}>
                      <th style={{ padding: '10px 12px', textAlign: 'left', minWidth: '160px', position: 'sticky', left: 0, backgroundColor: 'var(--color-bg-subtle)', zIndex: 2 }}>
                        Worker Name
                      </th>
                      {Array.from({ length: new Date(currentYear, currentMonth, 0).getDate() }, (_, i) => i + 1).map(day => {
                        const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const fInfo = getFactoryDay(dateStr);
                        const isWeeklyOff = new Date(currentYear, currentMonth - 1, day).getDay() === config.defaultWeeklyOffDay;

                        return (
                          <th
                            key={day}
                            style={{
                              padding: '6px 3px',
                              textAlign: 'center',
                              minWidth: '26px',
                              backgroundColor: !fInfo || fInfo.status === 'Closed' ? 'rgba(239, 68, 68, 0.05)' : 'inherit',
                              color: isWeeklyOff ? 'var(--color-status-danger-solid)' : 'inherit'
                            }}
                          >
                            <div style={{ fontWeight: 700 }}>{day}</div>
                            <div style={{ fontSize: '9px', opacity: 0.6 }}>
                              {DAY_NAMES[new Date(currentYear, currentMonth - 1, day).getDay()][0]}
                            </div>
                          </th>
                        );
                      })}
                      <th style={{ padding: '10px 8px', textAlign: 'center', minWidth: '36px', color: 'var(--color-status-success-solid)' }}>P</th>
                      <th style={{ padding: '10px 8px', textAlign: 'center', minWidth: '36px', color: 'var(--color-status-danger-solid)' }}>A</th>
                      <th style={{ padding: '10px 8px', textAlign: 'center', minWidth: '36px', color: 'var(--color-brand-primary)' }}>L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWorkersForMatrix.map(w => {
                      let pCount = 0;
                      let aCount = 0;
                      let lCount = 0;

                      const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

                      return (
                        <tr key={w.id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                          <td
                            style={{
                              padding: '8px 12px',
                              fontWeight: 600,
                              position: 'sticky',
                              left: 0,
                              backgroundColor: 'var(--color-bg-surface)',
                              zIndex: 1
                            }}
                          >
                            <div style={{ color: 'var(--color-text-primary)' }}>{w.name}</div>
                            <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                              {w.workerId || w.id} • {w.skill}
                            </div>
                          </td>

                          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                            const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            const fInfo = getFactoryDay(dateStr);
                            const attRecord = getAttendanceForDate(w.workerId || w.id, dateStr);

                            let pill = '—';
                            let bg = 'transparent';
                            let color = 'var(--color-text-muted)';

                            if (fInfo.status === 'Closed') {
                              pill = 'Off';
                              bg = 'rgba(239, 68, 68, 0.08)';
                              color = 'var(--color-status-danger-solid)';
                            } else if (attRecord) {
                              if (attRecord.status === 'Present') {
                                pill = 'P';
                                bg = 'rgba(16, 185, 129, 0.15)';
                                color = 'var(--color-status-success-solid)';
                                pCount++;
                              } else if (attRecord.status === 'Half Day') {
                                pill = 'H';
                                bg = 'rgba(245, 158, 11, 0.15)';
                                color = 'var(--color-status-warning-solid)';
                                pCount += 0.5;
                              } else if (attRecord.status === 'Absent') {
                                pill = 'A';
                                bg = 'rgba(239, 68, 68, 0.15)';
                                color = 'var(--color-status-danger-solid)';
                                aCount++;
                              } else if (attRecord.status === 'On Leave') {
                                pill = 'L';
                                bg = 'rgba(59, 130, 246, 0.15)';
                                color = 'var(--color-brand-primary)';
                                lCount++;
                              }
                            }

                            return (
                              <td
                                key={day}
                                style={{
                                  padding: '4px 2px',
                                  textAlign: 'center',
                                  borderRight: '1px solid var(--color-border-subtle)'
                                }}
                              >
                                <span
                                  style={{
                                    display: 'inline-block',
                                    width: '20px',
                                    height: '20px',
                                    lineHeight: '20px',
                                    fontSize: '9.5px',
                                    fontWeight: 700,
                                    borderRadius: '3px',
                                    backgroundColor: bg,
                                    color: color
                                  }}
                                >
                                  {pill}
                                </span>
                              </td>
                            );
                          })}

                          <td style={{ padding: '6px', textAlign: 'center', fontWeight: 700, color: 'var(--color-status-success-solid)' }}>
                            {pCount}
                          </td>
                          <td style={{ padding: '6px', textAlign: 'center', fontWeight: 700, color: 'var(--color-status-danger-solid)' }}>
                            {aCount}
                          </td>
                          <td style={{ padding: '6px', textAlign: 'center', fontWeight: 700, color: 'var(--color-brand-primary)' }}>
                            {lCount}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW 3: Annual Holidays Directory */}
          {viewMode === 'holidayList' && (
            <div style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', gap: '10px' }}>
                <div style={{ position: 'relative', width: '280px' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Search declared holidays..."
                    value={holidaySearch}
                    onChange={e => setHolidaySearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 10px 6px 32px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-border-subtle)',
                      backgroundColor: 'var(--color-bg-subtle)',
                      color: 'var(--color-text-primary)',
                      fontSize: '12px'
                    }}
                  />
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setModalInitialDate(todayStr);
                    setIsScheduleModalOpen(true);
                  }}
                  icon={<Plus size={14} />}
                >
                  Declare Holiday
                </Button>
              </div>

              {filteredHolidays.length === 0 ? (
                <div style={{ padding: '36px', textAlign: 'center', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                  <CalendarDays size={28} style={{ color: 'var(--color-text-muted)', marginBottom: '8px' }} />
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    No declared holidays found
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setModalInitialDate(`${currentYear}-01-01`);
                      setIsScheduleModalOpen(true);
                    }}
                    style={{ marginTop: '12px' }}
                  >
                    + Add Holiday
                  </Button>
                </div>
              ) : (
                <div style={{ border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--color-bg-subtle)', textAlign: 'left', borderBottom: '1px solid var(--color-border-subtle)' }}>
                        <th style={{ padding: '10px 14px', fontWeight: 600 }}>Date</th>
                        <th style={{ padding: '10px 14px', fontWeight: 600 }}>Holiday / Event</th>
                        <th style={{ padding: '10px 14px', fontWeight: 600 }}>Category</th>
                        <th style={{ padding: '10px 14px', fontWeight: 600 }}>Plant Status</th>
                        <th style={{ padding: '10px 14px', fontWeight: 600 }}>Remarks</th>
                        <th style={{ padding: '10px 14px', fontWeight: 600, textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHolidays.map(h => (
                        <tr key={h.id || h.date} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                          <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                            {h.date}
                          </td>
                          <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                            {h.title}
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                padding: '2px 8px',
                                borderRadius: 'var(--radius-sm)',
                                backgroundColor: 'var(--color-bg-subtle)',
                                color: 'var(--color-text-secondary)',
                                border: '1px solid var(--color-border-subtle)'
                              }}
                            >
                              {h.category}
                            </span>
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: 'var(--radius-sm)',
                                backgroundColor:
                                  h.status === 'Open'
                                    ? 'rgba(16, 185, 129, 0.12)'
                                    : 'rgba(239, 68, 68, 0.12)',
                                color:
                                  h.status === 'Open'
                                    ? 'var(--color-status-success-solid)'
                                    : 'var(--color-status-danger-solid)'
                              }}
                            >
                              {h.status === 'Open' ? 'OPEN' : 'CLOSED'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 14px', color: 'var(--color-text-secondary)', fontSize: '12px' }}>
                            {h.notes || '—'}
                          </td>
                          <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                            <button
                              type="button"
                              onClick={() => openScheduleForDate(h.date)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--color-brand-primary)',
                                cursor: 'pointer',
                                padding: '4px 6px',
                                fontSize: '12px',
                                fontWeight: 600
                              }}
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Day Inspector & Control Drawer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Day Inspector Card */}
          <div className="card" style={{ padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Day Inspector
                </span>
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '2px 0 0 0', color: 'var(--color-text-primary)' }}>
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </h3>
              </div>
              <Button
                variant="secondary"
                size="sm"
                icon={<Edit3 size={13} />}
                onClick={() => openScheduleForDate(selectedDate)}
              >
                Edit
              </Button>
            </div>

            {/* Operating Status Box */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor:
                  selectedFactoryInfo.status === 'Open'
                    ? 'rgba(16, 185, 129, 0.08)'
                    : 'rgba(239, 68, 68, 0.08)',
                border: `1px solid ${
                  selectedFactoryInfo.status === 'Open'
                    ? 'rgba(16, 185, 129, 0.25)'
                    : 'rgba(239, 68, 68, 0.25)'
                }`,
                marginBottom: '14px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 800,
                    color:
                      selectedFactoryInfo.status === 'Open'
                        ? 'var(--color-status-success-solid)'
                        : 'var(--color-status-danger-solid)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: selectedFactoryInfo.status === 'Open' ? '#10b981' : '#ef4444' }} />
                  {selectedFactoryInfo.status === 'Open' ? 'Factory Open' : 'Factory Closed'}
                </span>
                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                  {selectedFactoryInfo.category}
                </span>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, marginTop: '5px', color: 'var(--color-text-primary)' }}>
                {selectedFactoryInfo.title}
              </div>
              {selectedFactoryInfo.notes && (
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                  {selectedFactoryInfo.notes}
                </div>
              )}
            </div>

            {/* Shift Timings */}
            <div
              style={{
                padding: '10px 12px',
                backgroundColor: 'var(--color-bg-subtle)',
                borderRadius: 'var(--radius-md)',
                fontSize: '12px',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: '1px solid var(--color-border-subtle)'
              }}
            >
              <Clock size={15} style={{ color: 'var(--color-brand-primary)' }} />
              <div>
                <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {selectedFactoryInfo.shiftTimings || config.standardShiftTimings}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                  {selectedFactoryInfo.status === 'Open' ? 'Machining & Assembly Active' : 'Plant Suspended'}
                </div>
              </div>
            </div>

            {/* Workforce Attendance Breakdown */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
                  Attendance Summary
                </span>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  {selectedDaySummary.totalWorkers} Active
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', textAlign: 'center' }}>
                <div style={{ padding: '8px 2px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-subtle)' }}>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-status-success-solid)' }}>
                    {selectedDaySummary.present}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 500 }}>Present</div>
                </div>
                <div style={{ padding: '8px 2px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-subtle)' }}>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-status-warning-solid)' }}>
                    {selectedDaySummary.halfDay}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 500 }}>Half Day</div>
                </div>
                <div style={{ padding: '8px 2px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-subtle)' }}>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-status-danger-solid)' }}>
                    {selectedDaySummary.absent}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 500 }}>Absent</div>
                </div>
                <div style={{ padding: '8px 2px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-subtle)' }}>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-brand-primary)' }}>
                    {selectedDaySummary.onLeave}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 500 }}>Leave</div>
                </div>
              </div>
            </div>

            {/* Quick Button to Open Daily Punch Sheet */}
            <Button
              variant="secondary"
              style={{ width: '100%' }}
              icon={<ExternalLink size={14} />}
              onClick={() => navigate(`/attendance/day/${selectedDate}`)}
            >
              Open Daily Attendance Sheet
            </Button>
          </div>

          {/* Quick Legend Card */}
          <div className="card" style={{ padding: '14px 16px', fontSize: '12px' }}>
            <div style={{ fontWeight: 700, marginBottom: '8px', color: 'var(--color-text-primary)' }}>
              Calendar Legend
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', color: 'var(--color-text-secondary)', fontSize: '11.5px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                <span><strong>Factory Open:</strong> Standard shift active</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                <span><strong>Holiday:</strong> Declared festival / public holiday</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                <span><strong>Weekly Off:</strong> Standard plant rest day ({config.weeklyOffTitle || 'Friday'})</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3b82f6' }} />
                <span><strong>Special Shift:</strong> Manual production override</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Factory Schedule / Holiday Modal */}
      <FactoryScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        initialDate={modalInitialDate}
      />
    </div>
  );
};
