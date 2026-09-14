import React, { useState, useMemo } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { SummaryCard } from '../components/common/SummaryCard';
import { Button } from '../components/common/Button';
import { useNavigation } from '../context/NavigationContext';
import { useWorkers } from '../context/WorkerContext';
import { useAttendance, getTodayDateString } from '../context/AttendanceContext';
import { useToast } from '../context/ToastContext';
import { AttendanceStatus } from '../types';
import {
  CalendarCheck,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Search,
  UserCheck,
  CalendarDays
} from 'lucide-react';

export const AttendancePage: React.FC = () => {
  const { navigate } = useNavigation();
  const { workers } = useWorkers();
  const {
    records,
    markAttendance,
    bulkMarkAttendance,
    getAttendanceForDate,
    getStatusBreakdownForDate
  } = useAttendance();
  const { showToast } = useToast();

  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('All');

  // Filter only Active workers (attendance only applies to active employees)
  const activeWorkers = useMemo(() => {
    return workers.filter(w => w.status === 'Active');
  }, [workers]);

  // Unique departments
  const departments = useMemo(() => {
    const deps = new Set(activeWorkers.map(w => w.department));
    return ['All', ...Array.from(deps)];
  }, [activeWorkers]);

  // Filtered workers list
  const filteredWorkers = useMemo(() => {
    return activeWorkers.filter(w => {
      const matchSearch =
        w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.workerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.skill.toLowerCase().includes(searchTerm.toLowerCase());
      const matchDep = departmentFilter === 'All' || w.department === departmentFilter;
      return matchSearch && matchDep;
    });
  }, [activeWorkers, searchTerm, departmentFilter]);

  // Breakdown counts for the selected date
  const breakdown = useMemo(() => {
    return getStatusBreakdownForDate(selectedDate, activeWorkers);
  }, [getStatusBreakdownForDate, selectedDate, activeWorkers, records]);

  // Handle date shifting
  const changeDateByDays = (offset: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + offset);
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');
    const d = String(current.getDate()).padStart(2, '0');
    setSelectedDate(`${y}-${m}-${d}`);
  };

  const handleStatusChange = (
    workerId: string,
    status: AttendanceStatus,
    workerName: string
  ) => {
    const currentRec = getAttendanceForDate(workerId, selectedDate);
    markAttendance(workerId, selectedDate, status, {
      checkInTime: currentRec?.checkInTime,
      checkOutTime: currentRec?.checkOutTime,
      notes: currentRec?.notes
    });
    showToast({
      title: 'Attendance Updated',
      message: `${workerName} marked as ${status} for ${selectedDate}.`,
      type: status === 'Present' ? 'success' : status === 'Absent' ? 'danger' : 'info'
    });
  };

  const handleTimeChange = (
    workerId: string,
    field: 'checkInTime' | 'checkOutTime',
    value: string
  ) => {
    const currentRec = getAttendanceForDate(workerId, selectedDate);
    const status = currentRec?.status || 'Present';
    markAttendance(workerId, selectedDate, status, {
      checkInTime: field === 'checkInTime' ? value : currentRec?.checkInTime,
      checkOutTime: field === 'checkOutTime' ? value : currentRec?.checkOutTime,
      notes: currentRec?.notes
    });
  };

  const handleNotesChange = (workerId: string, notes: string) => {
    const currentRec = getAttendanceForDate(workerId, selectedDate);
    const status = currentRec?.status || 'Present';
    markAttendance(workerId, selectedDate, status, {
      checkInTime: currentRec?.checkInTime,
      checkOutTime: currentRec?.checkOutTime,
      notes
    });
  };

  const handleMarkAllPresent = () => {
    const unmarkedWorkerIds = activeWorkers
      .filter(w => !getAttendanceForDate(w.workerId || w.id, selectedDate))
      .map(w => w.workerId || w.id);

    if (unmarkedWorkerIds.length === 0) {
      showToast({
        title: 'Already Marked',
        message: 'All active workers already have attendance records for this date.',
        type: 'info'
      });
      return;
    }

    bulkMarkAttendance(unmarkedWorkerIds, selectedDate, 'Present');
    showToast({
      title: 'Bulk Attendance Logged',
      message: `Marked ${unmarkedWorkerIds.length} unmarked operators as Present for ${selectedDate}.`,
      type: 'success'
    });
  };

  const isToday = selectedDate === getTodayDateString();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Page Header */}
      <PageHeader
        title="Floor Attendance & Daily Roster"
        description="Daily operator check-in, real-time presence tracking, and single-click status updates."
        breadcrumbs={[{ label: 'Attendance' }]}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Button
              variant="secondary"
              icon={<UserCheck size={15} />}
              onClick={handleMarkAllPresent}
            >
              Mark All Unmarked Present
            </Button>
          </div>
        }
      />

      {/* Date Control Toolbar */}
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
              onChange={e => e.target.value && setSelectedDate(e.target.value)}
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
              onClick={() => setSelectedDate(getTodayDateString())}
            >
              Jump to Today
            </Button>
          )}

          {isToday && (
            <span className="status-badge status-badge-active" style={{ fontSize: '11px', padding: '2px 8px' }}>
              Today's Live Shift
            </span>
          )}
        </div>

        <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
          {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
        <SummaryCard
          title="Present On Floor"
          value={breakdown.present}
          subtitle={`Full day attendance`}
          icon={<CheckCircle2 size={18} />}
          statusTag={{ label: `${breakdown.present} Present`, variant: 'success' }}
        />
        <SummaryCard
          title="Half Day"
          value={breakdown.halfDay}
          subtitle={`4-hour floor shift`}
          icon={<Clock size={18} />}
          statusTag={{ label: `${breakdown.halfDay} Half`, variant: 'warning' }}
        />
        <SummaryCard
          title="Absent"
          value={breakdown.absent}
          subtitle={`Unexcused or sick`}
          icon={<XCircle size={18} />}
          statusTag={{ label: `${breakdown.absent} Absent`, variant: 'danger' }}
        />
        <SummaryCard
          title="On Leave / Off"
          value={breakdown.onLeave + breakdown.holiday}
          subtitle={`${breakdown.onLeave} leave, ${breakdown.holiday} holiday`}
          icon={<AlertTriangle size={18} />}
          statusTag={{ label: `${breakdown.onLeave + breakdown.holiday} Leave`, variant: 'info' }}
        />
        <SummaryCard
          title="Unmarked Today"
          value={breakdown.unmarked}
          subtitle={`Awaiting clock-in`}
          icon={<CalendarCheck size={18} />}
          statusTag={{
            label: breakdown.unmarked === 0 ? 'All Marked' : `${breakdown.unmarked} Pending`,
            variant: breakdown.unmarked === 0 ? 'success' : 'neutral'
          }}
        />
      </div>

      {/* Main Roster Card */}
      <div className="card">
        {/* Filter bar */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '240px' }}>
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
                placeholder="Search operator, code, skill..."
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
          </div>

          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
            Showing <strong>{filteredWorkers.length}</strong> active operators
          </div>
        </div>

        {/* Workers Roster Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-bg-subtle)', borderBottom: '1px solid var(--color-border-subtle)' }}>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Operator / Karigar
                </th>
                <th style={{ padding: '10px 16px', textAlign: 'center', fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Daily Status Selector
                </th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Timings
                </th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Remarks / Notes
                </th>
                <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Monthly Calendar
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredWorkers.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '36px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    No active operators match your search filter.
                  </td>
                </tr>
              ) : (
                filteredWorkers.map((w, idx) => {
                  const record = getAttendanceForDate(w.workerId || w.id, selectedDate);
                  const currentStatus = record?.status;

                  return (
                    <tr
                      key={w.id}
                      style={{
                        borderBottom: '1px solid var(--color-border-subtle)',
                        backgroundColor: idx % 2 === 0 ? 'var(--color-bg-surface)' : 'rgba(248, 250, 252, 0.4)',
                        transition: 'background-color 0.1s'
                      }}
                    >
                      {/* Worker info */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '34px',
                              height: '34px',
                              borderRadius: '50%',
                              backgroundColor: 'var(--color-brand-primary-light)',
                              color: 'var(--color-brand-primary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '12px'
                            }}
                          >
                            {w.name.charAt(0)}
                          </div>
                          <div>
                            <div
                              onClick={() => navigate(`/attendance/${w.workerId || w.id}`)}
                              style={{
                                fontWeight: 600,
                                color: 'var(--color-brand-primary)',
                                cursor: 'pointer',
                                textDecoration: 'none'
                              }}
                              onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                              onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                            >
                              {w.name}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                              <span className="mono-code" style={{ fontSize: '10px' }}>
                                {w.workerId}
                              </span>
                              <span
                                style={{
                                  fontSize: '11px',
                                  padding: '1px 6px',
                                  borderRadius: '3px',
                                  backgroundColor: 'var(--color-bg-subtle)',
                                  color: 'var(--color-text-secondary)',
                                  border: '1px solid var(--color-border-subtle)'
                                }}
                              >
                                {w.skill}
                              </span>
                              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                                • {w.department}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 5-way segmented status button group */}
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div
                          style={{
                            display: 'inline-flex',
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: 'var(--color-bg-subtle)',
                            padding: '3px',
                            gap: '2px',
                            border: '1px solid var(--color-border-subtle)'
                          }}
                        >
                          {/* Present */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(w.workerId || w.id, 'Present', w.name)}
                            style={{
                              padding: '5px 10px',
                              fontSize: '11px',
                              fontWeight: 600,
                              borderRadius: 'var(--radius-sm)',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              backgroundColor:
                                currentStatus === 'Present'
                                  ? 'var(--color-status-success-solid)'
                                  : 'transparent',
                              color: currentStatus === 'Present' ? '#ffffff' : 'var(--color-text-secondary)',
                              transition: 'all 0.15s'
                            }}
                          >
                            <CheckCircle2 size={12} />
                            <span>Present</span>
                          </button>

                          {/* Half Day */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(w.workerId || w.id, 'Half Day', w.name)}
                            style={{
                              padding: '5px 10px',
                              fontSize: '11px',
                              fontWeight: 600,
                              borderRadius: 'var(--radius-sm)',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              backgroundColor:
                                currentStatus === 'Half Day'
                                  ? 'var(--color-status-warning-solid)'
                                  : 'transparent',
                              color: currentStatus === 'Half Day' ? '#ffffff' : 'var(--color-text-secondary)',
                              transition: 'all 0.15s'
                            }}
                          >
                            <Clock size={12} />
                            <span>Half Day</span>
                          </button>

                          {/* Absent */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(w.workerId || w.id, 'Absent', w.name)}
                            style={{
                              padding: '5px 10px',
                              fontSize: '11px',
                              fontWeight: 600,
                              borderRadius: 'var(--radius-sm)',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              backgroundColor:
                                currentStatus === 'Absent'
                                  ? 'var(--color-status-danger-solid)'
                                  : 'transparent',
                              color: currentStatus === 'Absent' ? '#ffffff' : 'var(--color-text-secondary)',
                              transition: 'all 0.15s'
                            }}
                          >
                            <XCircle size={12} />
                            <span>Absent</span>
                          </button>

                          {/* On Leave */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(w.workerId || w.id, 'On Leave', w.name)}
                            style={{
                              padding: '5px 10px',
                              fontSize: '11px',
                              fontWeight: 600,
                              borderRadius: 'var(--radius-sm)',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              backgroundColor:
                                currentStatus === 'On Leave'
                                  ? 'var(--color-status-info-solid)'
                                  : 'transparent',
                              color: currentStatus === 'On Leave' ? '#ffffff' : 'var(--color-text-secondary)',
                              transition: 'all 0.15s'
                            }}
                          >
                            <AlertTriangle size={12} />
                            <span>Leave</span>
                          </button>

                          {/* Holiday */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(w.workerId || w.id, 'Holiday', w.name)}
                            style={{
                              padding: '5px 10px',
                              fontSize: '11px',
                              fontWeight: 600,
                              borderRadius: 'var(--radius-sm)',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              backgroundColor:
                                currentStatus === 'Holiday'
                                  ? 'var(--color-text-secondary)'
                                  : 'transparent',
                              color: currentStatus === 'Holiday' ? '#ffffff' : 'var(--color-text-secondary)',
                              transition: 'all 0.15s'
                            }}
                          >
                            <Sparkles size={12} />
                            <span>Off</span>
                          </button>
                        </div>
                      </td>

                      {/* Timings */}
                      <td style={{ padding: '12px 16px' }}>
                        {currentStatus === 'Present' || currentStatus === 'Half Day' ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <input
                              type="text"
                              className="input"
                              placeholder="08:15 AM"
                              defaultValue={record?.checkInTime || '08:15 AM'}
                              onBlur={e => handleTimeChange(w.workerId || w.id, 'checkInTime', e.target.value)}
                              style={{ width: '80px', padding: '4px 6px', fontSize: '11px', textAlign: 'center' }}
                            />
                            <span style={{ color: 'var(--color-text-muted)' }}>-</span>
                            <input
                              type="text"
                              className="input"
                              placeholder={currentStatus === 'Half Day' ? '01:30 PM' : '05:30 PM'}
                              defaultValue={record?.checkOutTime || (currentStatus === 'Half Day' ? '01:30 PM' : '05:30 PM')}
                              onBlur={e => handleTimeChange(w.workerId || w.id, 'checkOutTime', e.target.value)}
                              style={{ width: '80px', padding: '4px 6px', fontSize: '11px', textAlign: 'center' }}
                            />
                          </div>
                        ) : currentStatus ? (
                          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                            —
                          </span>
                        ) : (
                          <span style={{ fontSize: '11px', color: 'var(--color-status-warning-text)', fontStyle: 'italic' }}>
                            Not clocked in
                          </span>
                        )}
                      </td>

                      {/* Remarks */}
                      <td style={{ padding: '12px 16px' }}>
                        <input
                          type="text"
                          className="input"
                          placeholder="Optional notes / reason..."
                          defaultValue={record?.notes || ''}
                          onBlur={e => handleNotesChange(w.workerId || w.id, e.target.value)}
                          style={{ width: '100%', maxWidth: '200px', padding: '4px 8px', fontSize: '12px' }}
                        />
                      </td>

                      {/* View Monthly Calendar */}
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<CalendarDays size={13} />}
                          onClick={() => navigate(`/attendance/${w.workerId || w.id}`)}
                        >
                          Calendar
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
