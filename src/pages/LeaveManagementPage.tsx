import React, { useState, useMemo } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { SummaryCard } from '../components/common/SummaryCard';
import { Button } from '../components/common/Button';
import { ConfirmationDialog } from '../components/common/ConfirmationDialog';
import { ApplyLeaveModal } from '../components/common/ApplyLeaveModal';
import { useWorkers } from '../context/WorkerContext';
import { useAttendance, getTodayDateString } from '../context/AttendanceContext';
import { useToast } from '../context/ToastContext';
import { LeaveRecord } from '../types';
import {
  CalendarDays,
  Plus,
  Search,
  Calendar,
  Trash2,
  Edit3,
  Clock,
  Users
} from 'lucide-react';

export const LeaveManagementPage: React.FC = () => {
  const { workers } = useWorkers();
  const { leaveRecords, cancelLeave } = useAttendance();
  const { showToast } = useToast();

  const todayStr = getTodayDateString();

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [workerFilter, setWorkerFilter] = useState<string>('ALL');

  // Modal states
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [editingLeaveId, setEditingLeaveId] = useState<string | undefined>(undefined);
  const [targetWorkerId, setTargetWorkerId] = useState<string | undefined>(undefined);

  // Cancellation dialog state
  const [cancellingLeave, setCancellingLeave] = useState<LeaveRecord | null>(null);

  // Worker lookup helper
  const getWorkerInfo = (wId: string) => {
    return workers.find(w => w.workerId === wId || w.id === wId);
  };

  // KPI Calculations
  const stats = useMemo(() => {
    let activeToday = 0;
    let upcoming = 0;
    let totalDays = 0;

    leaveRecords.forEach(l => {
      totalDays += l.totalDays;
      if (l.startDate <= todayStr && l.endDate >= todayStr) {
        activeToday++;
      } else if (l.startDate > todayStr) {
        upcoming++;
      }
    });

    return {
      activeToday,
      upcoming,
      totalApplications: leaveRecords.length,
      totalDays
    };
  }, [leaveRecords, todayStr]);

  // Filtered leaves
  const filteredLeaves = useMemo(() => {
    return leaveRecords.filter(l => {
      const worker = getWorkerInfo(l.workerId);
      const workerName = worker?.name || '';
      const workerCode = worker?.workerId || l.workerId;
      const dept = worker?.department || '';

      const matchSearch =
        workerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        workerCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dept.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (l.reason && l.reason.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchType = typeFilter === 'ALL' || l.leaveType === typeFilter;
      const matchWorker = workerFilter === 'ALL' || l.workerId === workerFilter;

      return matchSearch && matchType && matchWorker;
    });
  }, [leaveRecords, searchTerm, typeFilter, workerFilter, workers]);

  const handleConfirmCancel = () => {
    if (!cancellingLeave) return;
    const worker = getWorkerInfo(cancellingLeave.workerId);
    cancelLeave(cancellingLeave.id);
    showToast({
      title: 'Leave Cancelled',
      message: `Cancelled ${cancellingLeave.leaveType} leave for ${worker?.name || cancellingLeave.workerId}. Associated dates reverted to unmarked.`,
      type: 'info'
    });
    setCancellingLeave(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader
        title="Leave & Time-Off Management"
        description="Company-wide directory of multi-day leave applications, upcoming scheduled time-off, and automated attendance adjustments."
        breadcrumbs={[
          { label: 'Attendance', path: '/attendance' },
          { label: 'Leaves' }
        ]}
        actions={
          <Button
            variant="primary"
            icon={<Plus size={14} />}
            onClick={() => {
              setEditingLeaveId(undefined);
              setTargetWorkerId(undefined);
              setIsApplyModalOpen(true);
            }}
          >
            Apply Multi-Day Leave
          </Button>
        }
      />

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        <SummaryCard
          title="On Leave Today"
          value={stats.activeToday}
          subtitle={`Active out-of-office operators on ${todayStr}`}
          icon={<Clock size={18} />}
          statusTag={{ label: `${stats.activeToday} Active Today`, variant: stats.activeToday > 0 ? 'warning' : 'neutral' }}
        />
        <SummaryCard
          title="Upcoming Planned Leaves"
          value={stats.upcoming}
          subtitle="Scheduled future time-off"
          icon={<Calendar size={18} />}
        />
        <SummaryCard
          title="Total Leave Days"
          value={`${stats.totalDays} Days`}
          subtitle={`Across ${stats.totalApplications} logged leave applications`}
          icon={<CalendarDays size={18} />}
        />
        <SummaryCard
          title="Tracked Plant Workforce"
          value={workers.length}
          subtitle="Active registered operators"
          icon={<Users size={18} />}
        />
      </div>

      {/* Filter and Search Bar */}
      <div
        className="card"
        style={{
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          backgroundColor: 'var(--color-bg-subtle)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '260px' }}>
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
              className="form-input"
              placeholder="Search operator, code, reason..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '32px', fontSize: '13px' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Type:</span>
            <select
              className="form-input"
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              style={{ padding: '6px 10px', fontSize: '12px' }}
            >
              <option value="ALL">All Categories</option>
              <option value="Sick">Sick / Medical</option>
              <option value="Casual">Casual</option>
              <option value="Personal">Personal</option>
              <option value="Emergency">Emergency</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Worker:</span>
            <select
              className="form-input"
              value={workerFilter}
              onChange={e => setWorkerFilter(e.target.value)}
              style={{ padding: '6px 10px', fontSize: '12px', maxWidth: '200px' }}
            >
              <option value="ALL">All Workers</option>
              {workers.map(w => (
                <option key={w.workerId} value={w.workerId}>
                  {w.name} ({w.workerId})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
          Showing <strong>{filteredLeaves.length}</strong> of {leaveRecords.length} leave records
        </div>
      </div>

      {/* Main Leave Records Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <CalendarDays size={16} style={{ color: 'var(--color-brand-primary)' }} />
            <span>Worker Leave Applications Ledger</span>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-bg-subtle)', borderBottom: '1px solid var(--color-border-default)' }}>
                <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Leave ID</th>
                <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Worker Details</th>
                <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Leave Category</th>
                <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Leave Date Range</th>
                <th style={{ padding: '8px 14px', textAlign: 'center', fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Total Days</th>
                <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Reason / Remarks</th>
                <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Applied On</th>
                <th style={{ padding: '8px 14px', textAlign: 'center', fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeaves.length > 0 ? (
                filteredLeaves.map((leave, idx) => {
                  const worker = getWorkerInfo(leave.workerId);
                  const isCurrent = leave.startDate <= todayStr && leave.endDate >= todayStr;
                  const isFuture = leave.startDate > todayStr;

                  return (
                    <tr
                      key={leave.id}
                      style={{
                        borderBottom: '1px solid var(--color-border-subtle)',
                        backgroundColor: idx % 2 === 0 ? '#fff' : 'rgba(248, 250, 252, 0.5)'
                      }}
                    >
                      <td style={{ padding: '10px 14px' }}>
                        <span className="mono-code">{leave.id}</span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                          {worker?.name || leave.workerId}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                          <span className="mono-code" style={{ fontSize: '10px' }}>{worker?.workerId || leave.workerId}</span> • {worker?.department || 'Plant'}
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor:
                              leave.leaveType === 'Sick'
                                ? 'var(--color-status-danger-bg)'
                                : leave.leaveType === 'Casual'
                                ? 'var(--color-status-info-bg)'
                                : leave.leaveType === 'Emergency'
                                ? 'var(--color-status-warning-bg)'
                                : 'var(--color-bg-subtle)',
                            color:
                              leave.leaveType === 'Sick'
                                ? 'var(--color-status-danger-text)'
                                : leave.leaveType === 'Casual'
                                ? 'var(--color-status-info-text)'
                                : leave.leaveType === 'Emergency'
                                ? 'var(--color-status-warning-text)'
                                : 'var(--color-text-secondary)',
                            border: `1px solid ${
                              leave.leaveType === 'Sick'
                                ? 'var(--color-status-danger-border)'
                                : leave.leaveType === 'Casual'
                                ? 'var(--color-status-info-border)'
                                : 'var(--color-border-subtle)'
                            }`
                          }}
                        >
                          {leave.leaveType} Leave
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="mono-code" style={{ fontSize: '12px' }}>{leave.startDate}</span>
                          {leave.startDate !== leave.endDate && (
                            <>
                              <span style={{ color: 'var(--color-text-muted)' }}>→</span>
                              <span className="mono-code" style={{ fontSize: '12px' }}>{leave.endDate}</span>
                            </>
                          )}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                          {isCurrent ? (
                            <span style={{ color: 'var(--color-status-warning-solid)', fontWeight: 600 }}>Active Today</span>
                          ) : isFuture ? (
                            <span style={{ color: 'var(--color-status-info-solid)' }}>Upcoming</span>
                          ) : (
                            <span>Past Leave</span>
                          )}
                          {leave.includeWeekends && ' • Includes weekends'}
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <span className="tabular-nums" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-brand-primary)' }}>
                          {leave.totalDays} Day{leave.totalDays > 1 ? 's' : ''}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--color-text-secondary)', maxWidth: '240px' }}>
                        {leave.reason || <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No reason recorded</span>}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span className="mono-code" style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                          {leave.appliedDate || '—'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingLeaveId(leave.id);
                              setTargetWorkerId(leave.workerId);
                              setIsApplyModalOpen(true);
                            }}
                            className="btn btn-outline btn-sm"
                            style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            title="Edit Leave Date Range"
                          >
                            <Edit3 size={12} />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setCancellingLeave(leave)}
                            className="btn btn-danger-outline btn-sm"
                            style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            title="Cancel Leave"
                          >
                            <Trash2 size={12} />
                            <span>Cancel</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} style={{ padding: '28px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    No leave applications found matching the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply / Edit Leave Modal */}
      <ApplyLeaveModal
        isOpen={isApplyModalOpen}
        onClose={() => {
          setIsApplyModalOpen(false);
          setEditingLeaveId(undefined);
          setTargetWorkerId(undefined);
        }}
        workerId={targetWorkerId}
        existingLeaveId={editingLeaveId}
      />

      {/* Cancellation Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={Boolean(cancellingLeave)}
        onClose={() => setCancellingLeave(null)}
        onConfirm={handleConfirmCancel}
        title={`Cancel Leave Application (${cancellingLeave?.id})?`}
        message={`Are you sure you want to cancel ${getWorkerInfo(cancellingLeave?.workerId || '')?.name || cancellingLeave?.workerId}'s ${cancellingLeave?.leaveType} leave (${cancellingLeave?.startDate} to ${cancellingLeave?.endDate})? All ${cancellingLeave?.totalDays} auto-marked attendance days will be reverted to unmarked.`}
        confirmLabel="Confirm Cancel Leave"
      />
    </div>
  );
};
