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
  Layers
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
    const firstDayIndex = new Date(currentYear, currentMonth - 1, 1).getDay(); // 0 is Sunday
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

    const days: Array<{
      dayNumber: number | null;
      dateStr: string | null;
      isWeeklyOff: boolean;
      isToday: boolean;
      dayOfWeek: number;
      factoryInfo?: FactoryCalendarEntry;
    }> = [];

    // Leading empty cells
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({
        dayNumber: null,
        dateStr: null,
        isWeeklyOff: false,
        isToday: false,
        dayOfWeek: i
      });
    }

    // Month days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const d = new Date(currentYear, currentMonth - 1, day);
      const dayOfWeek = d.getDay();
      const isWeeklyOff = dayOfWeek === config.defaultWeeklyOffDay;
      const isToday = dateStr === todayStr;
      const factoryInfo = getFactoryDay(dateStr);

      days.push({
        dayNumber: day,
        dateStr,
        isWeeklyOff,
        isToday,
        dayOfWeek,
        factoryInfo
      });
    }

    return days;
  }, [currentYear, currentMonth, todayStr, config.defaultWeeklyOffDay, getFactoryDay]);

  const openScheduleForDate = (dateStr: string) => {
    setModalInitialDate(dateStr);
    setIsScheduleModalOpen(true);
  };

  const allHolidays2026 = useMemo(() => getAllHolidaysForYear(currentYear), [currentYear, getAllHolidaysForYear]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Page Header */}
      <PageHeader
        title="Universal Factory Operational Calendar"
        description="Plant-wide master operational schedule, Friday weekly factory off, custom holiday dates, shift timings & workforce presence."
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              variant="secondary"
              icon={<Settings size={15} />}
              onClick={() => {
                setModalInitialDate(todayStr);
                setIsScheduleModalOpen(true);
              }}
            >
              Weekly Off (Friday)
            </Button>
            <Button
              variant="primary"
              icon={<Plus size={15} />}
              onClick={() => {
                setModalInitialDate(selectedDate || todayStr);
                setIsScheduleModalOpen(true);
              }}
            >
              + Declare Holiday / Schedule
            </Button>
          </div>
        }
      />

      {/* Top Plant KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {/* Card 1: Today Plant Status */}
        <div
          className="card"
          style={{
            padding: '16px',
            borderLeft: `4px solid ${
              todayFactoryInfo.status === 'Open'
                ? 'var(--color-status-success-solid)'
                : 'var(--color-status-danger-solid)'
            }`
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
              Today's Plant Status
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor:
                  todayFactoryInfo.status === 'Open'
                    ? 'var(--color-status-success-subtle)'
                    : 'var(--color-status-danger-subtle)',
                color:
                  todayFactoryInfo.status === 'Open'
                    ? 'var(--color-status-success-text)'
                    : 'var(--color-status-danger-text)'
              }}
            >
              {todayFactoryInfo.status === 'Open' ? '🟢 FACTORY OPEN' : '🔴 FACTORY CLOSED'}
            </span>
          </div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '8px' }}>
            {todayFactoryInfo.title}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            {todayFactoryInfo.status === 'Open'
              ? `${todayDaySummary.present} of ${todayDaySummary.totalWorkers} Karigars Present`
              : 'Plant Operations & Machining Suspended'}
          </div>
        </div>

        {/* Card 2: Factory Open Operating Days */}
        <SummaryCard
          title="Operating Days in Month"
          value={`${monthSummary.openDays} Days`}
          subtitle={`${Math.round((monthSummary.openDays / monthSummary.totalDays) * 100)}% Monthly Plant Uptime`}
          icon={<Building2 size={20} />}
          statusTag={{ label: 'Active Floor', variant: 'success' }}
        />

        {/* Card 3: Factory Closed / Holidays */}
        <SummaryCard
          title="Factory Closed Days"
          value={`${monthSummary.closedDays} Days`}
          subtitle={`${monthSummary.weeklyOffs} Fridays (Weekly Off) + ${monthSummary.holidays} Holidays`}
          icon={<Calendar size={20} />}
          statusTag={{ label: 'Rest & Maintenance', variant: 'danger' }}
        />

        {/* Card 4: Standard Shift Timings */}
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
            Plant Shift & Weekly Rule
          </div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-brand-primary)', marginTop: '6px' }}>
            {config.weeklyOffTitle}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={13} /> {config.standardShiftTimings}
          </div>
        </div>
      </div>

      {/* Main Container: Calendar & Day Inspector */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>
        {/* Left Column: Calendar Card & Controls */}
        <div className="card" style={{ overflow: 'hidden' }}>
          {/* Header Bar: Month Switcher & View Tabs */}
          <div
            className="card-header"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              padding: '14px 18px'
            }}
          >
            {/* Month & Year Title with Navigation Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                <Button variant="secondary" size="sm" onClick={handlePrevMonth}>
                  <ChevronLeft size={16} />
                </Button>
                <Button variant="secondary" size="sm" onClick={handleNextMonth}>
                  <ChevronRight size={16} />
                </Button>
              </div>

              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
                {MONTH_NAMES[currentMonth - 1]} {currentYear}
              </h2>

              <Button
                variant="secondary"
                size="sm"
                onClick={handleJumpToCurrentMonth}
                style={{ fontSize: '12px', marginLeft: '6px' }}
              >
                Today
              </Button>
            </div>

            {/* View Mode Toggle */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <Button
                variant={viewMode === 'calendar' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setViewMode('calendar')}
                icon={<Calendar size={14} />}
              >
                Universal Calendar
              </Button>
              <Button
                variant={viewMode === 'matrix' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setViewMode('matrix')}
                icon={<Layers size={14} />}
              >
                Worker Matrix
              </Button>
              <Button
                variant={viewMode === 'holidayList' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setViewMode('holidayList')}
                icon={<Flame size={14} />}
              >
                Year Holidays ({allHolidays2026.length})
              </Button>
            </div>
          </div>

          {/* VIEW 1: Universal Factory Calendar Grid */}
          {viewMode === 'calendar' && (
            <div style={{ padding: '16px' }}>
              {/* Day of Week Headers */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: '8px',
                  marginBottom: '8px',
                  textAlign: 'center'
                }}
              >
                {DAY_NAMES.map((name, idx) => {
                  const isFridayWeeklyOff = idx === config.defaultWeeklyOffDay;
                  return (
                    <div
                      key={name}
                      style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        padding: '6px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: isFridayWeeklyOff
                          ? 'rgba(239, 68, 68, 0.12)'
                          : 'var(--color-bg-subtle)',
                        color: isFridayWeeklyOff
                          ? 'var(--color-status-danger-solid)'
                          : 'var(--color-text-secondary)',
                        textTransform: 'uppercase'
                      }}
                    >
                      {name} {isFridayWeeklyOff ? '• Plant Off' : ''}
                    </div>
                  );
                })}
              </div>

              {/* Day Cells Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: '8px'
                }}
              >
                {calendarDays.map((cell, index) => {
                  if (cell.dayNumber === null || !cell.dateStr) {
                    return (
                      <div
                        key={`empty-${index}`}
                        style={{
                          minHeight: '105px',
                          backgroundColor: 'var(--color-bg-subtle)',
                          opacity: 0.3,
                          borderRadius: 'var(--radius-md)'
                        }}
                      />
                    );
                  }

                  const info = cell.factoryInfo!;
                  const isOpen = info.status === 'Open';
                  const isSelected = selectedDate === cell.dateStr;
                  const daySummary = getDaySummary(cell.dateStr, activeWorkers);

                  return (
                    <div
                      key={cell.dateStr}
                      onClick={() => setSelectedDate(cell.dateStr!)}
                      style={{
                        minHeight: '105px',
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-md)',
                        border: isSelected
                          ? '2px solid var(--color-brand-primary)'
                          : cell.isToday
                          ? '1.5px solid var(--color-status-success-solid)'
                          : '1px solid var(--color-border-subtle)',
                        backgroundColor: isSelected
                          ? 'var(--color-brand-subtle)'
                          : isOpen
                          ? 'var(--color-bg-surface)'
                          : 'rgba(239, 68, 68, 0.04)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        transition: 'all 0.15s ease',
                        position: 'relative'
                      }}
                    >
                      {/* Top Row: Day number + Badges */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span
                          style={{
                            fontSize: '14px',
                            fontWeight: cell.isToday ? 800 : 600,
                            color: cell.isToday
                              ? 'var(--color-brand-primary)'
                              : isOpen
                              ? 'var(--color-text-primary)'
                              : 'var(--color-status-danger-solid)'
                          }}
                        >
                          {cell.dayNumber}
                        </span>

                        {/* Open vs Closed Badge */}
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 5px',
                            borderRadius: '4px',
                            backgroundColor: isOpen
                              ? 'rgba(16, 185, 129, 0.15)'
                              : 'rgba(239, 68, 68, 0.15)',
                            color: isOpen
                              ? 'var(--color-status-success-solid)'
                              : 'var(--color-status-danger-solid)'
                          }}
                        >
                          {isOpen ? '🟢 OPEN' : '🔴 CLOSED'}
                        </span>
                      </div>

                      {/* Middle: Title or Event */}
                      <div style={{ margin: '4px 0' }}>
                        <div
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            color: isOpen ? 'var(--color-text-secondary)' : 'var(--color-status-danger-solid)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                          title={info.title}
                        >
                          {info.title}
                        </div>
                      </div>

                      {/* Bottom: Worker Presence Stats (if Open) or Closed Notice */}
                      <div>
                        {isOpen ? (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '11px',
                              fontWeight: 600
                            }}
                          >
                            <span style={{ color: 'var(--color-status-success-solid)' }}>
                              {daySummary.present}P
                            </span>
                            <span style={{ color: 'var(--color-text-muted)' }}>/</span>
                            <span style={{ color: 'var(--color-status-warning-solid)' }}>
                              {daySummary.halfDay}H
                            </span>
                            <span style={{ color: 'var(--color-text-muted)' }}>/</span>
                            <span style={{ color: 'var(--color-status-danger-solid)' }}>
                              {daySummary.absent}A
                            </span>
                          </div>
                        ) : (
                          <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                            {info.category === 'Weekly Off' ? 'Weekly Off' : info.category}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW 2: Worker Presence & Shift Matrix */}
          {viewMode === 'matrix' && (
            <div style={{ overflowX: 'auto', padding: '16px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-bg-subtle)' }}>
                    <th style={{ padding: '8px 10px', textAlign: 'left', minWidth: '150px', position: 'sticky', left: 0, backgroundColor: 'var(--color-bg-subtle)', zIndex: 2 }}>
                      Worker / Karigar
                    </th>
                    {Array.from({ length: new Date(currentYear, currentMonth, 0).getDate() }, (_, i) => i + 1).map(day => {
                      const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                      const fInfo = getFactoryDay(dateStr);
                      const isFriday = new Date(currentYear, currentMonth - 1, day).getDay() === config.defaultWeeklyOffDay;

                      return (
                        <th
                          key={day}
                          style={{
                            padding: '6px 4px',
                            textAlign: 'center',
                            minWidth: '28px',
                            backgroundColor: !fInfo || fInfo.status === 'Closed' ? 'rgba(239, 68, 68, 0.08)' : 'inherit',
                            color: isFriday ? 'var(--color-status-danger-solid)' : 'inherit'
                          }}
                        >
                          <div>{day}</div>
                          <div style={{ fontSize: '9px', opacity: 0.7 }}>
                            {DAY_NAMES[new Date(currentYear, currentMonth - 1, day).getDay()][0]}
                          </div>
                        </th>
                      );
                    })}
                    <th style={{ padding: '8px 10px', textAlign: 'center', minWidth: '60px' }}>P</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center', minWidth: '60px' }}>A</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center', minWidth: '60px' }}>Leave</th>
                  </tr>
                </thead>
                <tbody>
                  {activeWorkers.map(w => {
                    let pCount = 0;
                    let aCount = 0;
                    let lCount = 0;

                    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

                    return (
                      <tr key={w.id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                        {/* Worker Identity Column */}
                        <td
                          style={{
                            padding: '8px 10px',
                            fontWeight: 600,
                            position: 'sticky',
                            left: 0,
                            backgroundColor: 'var(--color-bg-surface)',
                            zIndex: 1
                          }}
                        >
                          <div>{w.name}</div>
                          <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                            {w.workerId} • {w.skill}
                          </div>
                        </td>

                        {/* Days 1..DaysInMonth */}
                        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                          const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                          const fInfo = getFactoryDay(dateStr);
                          const attRecord = getAttendanceForDate(w.workerId || w.id, dateStr);

                          let pill = '—';
                          let bg = 'transparent';
                          let color = 'var(--color-text-muted)';

                          if (fInfo.status === 'Closed') {
                            pill = 'Off';
                            bg = 'rgba(239, 68, 68, 0.1)';
                            color = 'var(--color-status-danger-solid)';
                          } else if (attRecord) {
                            if (attRecord.status === 'Present') {
                              pill = 'P';
                              bg = 'var(--color-status-success-subtle)';
                              color = 'var(--color-status-success-text)';
                              pCount++;
                            } else if (attRecord.status === 'Half Day') {
                              pill = 'H';
                              bg = 'var(--color-status-warning-subtle)';
                              color = 'var(--color-status-warning-text)';
                              pCount += 0.5;
                            } else if (attRecord.status === 'Absent') {
                              pill = 'A';
                              bg = 'var(--color-status-danger-subtle)';
                              color = 'var(--color-status-danger-text)';
                              aCount++;
                            } else if (attRecord.status === 'On Leave') {
                              pill = 'L';
                              bg = 'rgba(59, 130, 246, 0.15)';
                              color = 'var(--color-brand-primary)';
                              lCount++;
                            } else if (attRecord.status === 'Holiday') {
                              pill = 'Hol';
                              bg = 'rgba(239, 68, 68, 0.1)';
                              color = 'var(--color-status-danger-solid)';
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
                                  width: '22px',
                                  height: '22px',
                                  lineHeight: '22px',
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  borderRadius: '4px',
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
          )}

          {/* VIEW 3: Annual Holidays Directory */}
          {viewMode === 'holidayList' && (
            <div style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>
                    Factory Holidays & Shutdown Directory ({currentYear})
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: '2px 0 0 0' }}>
                    Standard Gujarat state holidays, festival shutdowns, and maintenance days for Jamnagar unit.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setModalInitialDate(todayStr);
                    setIsScheduleModalOpen(true);
                  }}
                >
                  + Add Custom Holiday
                </Button>
              </div>

              <div style={{ border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--color-bg-subtle)', textAlign: 'left' }}>
                      <th style={{ padding: '10px 14px', fontWeight: 600 }}>Date</th>
                      <th style={{ padding: '10px 14px', fontWeight: 600 }}>Holiday Name</th>
                      <th style={{ padding: '10px 14px', fontWeight: 600 }}>Category</th>
                      <th style={{ padding: '10px 14px', fontWeight: 600 }}>Plant Operations State</th>
                      <th style={{ padding: '10px 14px', fontWeight: 600 }}>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allHolidays2026.map(h => (
                      <tr key={h.id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
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
                              padding: '2px 6px',
                              borderRadius: 'var(--radius-sm)',
                              backgroundColor: 'var(--color-bg-subtle)',
                              color: 'var(--color-text-secondary)'
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
                              padding: '3px 8px',
                              borderRadius: 'var(--radius-sm)',
                              backgroundColor: 'rgba(239, 68, 68, 0.12)',
                              color: 'var(--color-status-danger-solid)'
                            }}
                          >
                            🔴 PLANT CLOSED
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', color: 'var(--color-text-secondary)', fontSize: '12px' }}>
                          {h.notes || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Selected Day Operational Inspector Drawer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Day Inspector Card */}
          <div className="card" style={{ padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
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
                onClick={() => openScheduleForDate(selectedDate)}
              >
                Edit
              </Button>
            </div>

            {/* Status Highlight Banner */}
            <div
              style={{
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor:
                  selectedFactoryInfo.status === 'Open'
                    ? 'rgba(16, 185, 129, 0.1)'
                    : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${
                  selectedFactoryInfo.status === 'Open'
                    ? 'rgba(16, 185, 129, 0.3)'
                    : 'rgba(239, 68, 68, 0.3)'
                }`,
                marginBottom: '16px'
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
                        : 'var(--color-status-danger-solid)'
                  }}
                >
                  {selectedFactoryInfo.status === 'Open' ? '🟢 FACTORY OPEN' : '🔴 FACTORY CLOSED'}
                </span>
                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                  {selectedFactoryInfo.category}
                </span>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, marginTop: '4px', color: 'var(--color-text-primary)' }}>
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
                gap: '8px'
              }}
            >
              <Clock size={15} style={{ color: 'var(--color-brand-primary)' }} />
              <div>
                <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {selectedFactoryInfo.shiftTimings || config.standardShiftTimings}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                  {selectedFactoryInfo.status === 'Open' ? 'Machining & Assembly Operating' : 'Floor Power & Operations Off'}
                </div>
              </div>
            </div>

            {/* Workforce Attendance Breakdown on Selected Date */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
                  Workforce Attendance
                </span>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  {selectedDaySummary.totalWorkers} Active
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', textAlign: 'center' }}>
                <div style={{ padding: '8px 4px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-status-success-solid)' }}>
                    {selectedDaySummary.present}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Present</div>
                </div>
                <div style={{ padding: '8px 4px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-status-warning-solid)' }}>
                    {selectedDaySummary.halfDay}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Half Day</div>
                </div>
                <div style={{ padding: '8px 4px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-status-danger-solid)' }}>
                    {selectedDaySummary.absent}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Absent</div>
                </div>
                <div style={{ padding: '8px 4px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-brand-primary)' }}>
                    {selectedDaySummary.onLeave}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Leave</div>
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
              Open {selectedDate} Attendance Sheet
            </Button>
          </div>

          {/* Quick Legend Info Card */}
          <div className="card" style={{ padding: '14px', fontSize: '12px' }}>
            <div style={{ fontWeight: 700, marginBottom: '8px', color: 'var(--color-text-primary)' }}>
              Factory Calendar Rules
            </div>
            <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li><strong>Fridays:</strong> Standard Jamnagar Brass cluster weekly plant off.</li>
              <li><strong>Special Working Day:</strong> Can be declared to run production on Fridays or weekends.</li>
              <li><strong>Holidays:</strong> Auto-updates daily workforce sheets and payroll calculations.</li>
            </ul>
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
