import React, { useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { StatusBadge } from '../components/common/StatusBadge';
import { Button } from '../components/common/Button';
import { WorkerEditModal } from '../components/common/WorkerEditModal';
import { ApplyLeaveModal } from '../components/common/ApplyLeaveModal';
import { ConfirmationDialog } from '../components/common/ConfirmationDialog';
import { useNavigation } from '../context/NavigationContext';
import { useWorkers } from '../context/WorkerContext';
import { useAttendance, getTodayDateString } from '../context/AttendanceContext';
import { useProduction } from '../context/ProductionContext';
import { usePayroll } from '../context/PayrollContext';
import { useToast } from '../context/ToastContext';
import { getHourlyOvertimeRate } from '../utils/payroll';
import { Modal } from '../components/common/Modal';
import { FormField } from '../components/common/FormField';
import { SelectField } from '../components/common/SelectField';
import { LeaveRecord } from '../types';
import {
  ArrowLeft,
  User,
  IndianRupee,
  Layers,
  Edit3,
  UserCheck,
  UserX,
  CalendarCheck,
  CalendarDays,
  ArrowRight,
  Plus,
  Trash2,
  Receipt
} from 'lucide-react';

interface WorkerDetailPageProps {
  id?: string;
}

export const WorkerDetailPage: React.FC<WorkerDetailPageProps> = ({ id }) => {
  const { currentPath, navigate } = useNavigation();
  const { getWorker, workers } = useWorkers();
  const {
    getAttendanceForDate,
    markAttendance,
    getMonthSummary,
    getLeaveRecords,
    cancelLeave
  } = useAttendance();
  const { jobs } = useProduction();
  const { adjustments, addAdjustment, deleteAdjustment, shiftConfig } = usePayroll();
  const { showToast } = useToast();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddAdjModalOpen, setIsAddAdjModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [editingLeaveId, setEditingLeaveId] = useState<string | undefined>(undefined);
  const [cancellingLeave, setCancellingLeave] = useState<LeaveRecord | null>(null);

  // New adjustment form state
  const [adjType, setAdjType] = useState<'Uppad' | 'Jama'>('Uppad');
  const [adjAmount, setAdjAmount] = useState('');
  const [adjDate, setAdjDate] = useState(getTodayDateString());
  const [adjReason, setAdjReason] = useState('');

  // Extract ID from path if not passed as prop e.g. /workers/WRK-001
  const pathParts = currentPath.split('/');
  const workerId = id || pathParts[2] || 'WRK-001';

  const worker = getWorker(workerId) || workers[0];

  if (!worker) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <div>Worker not found.</div>
        <Button variant="secondary" onClick={() => navigate('/workers')} style={{ marginTop: '12px' }}>
          Back to Workers
        </Button>
      </div>
    );
  }

  const todayStr = getTodayDateString();
  const todayAtt = getAttendanceForDate(worker.workerId || worker.id, todayStr);
  const currentStatus = todayAtt?.status;
  const isPresent = currentStatus === 'Present' || currentStatus === 'Half Day';

  // Calculate current month's attendance
  const now = new Date();
  const monthSummary = getMonthSummary(worker.workerId || worker.id, now.getFullYear(), now.getMonth() + 1);

  const handleAttendanceToggle = () => {
    if (worker.status !== 'Active') {
      showToast({
        title: 'Status Not Active',
        message: `Worker is currently ${worker.status}. Daily attendance is only available for active operators.`,
        type: 'warning'
      });
      return;
    }
    const nextStatus = isPresent ? 'Absent' : 'Present';
    markAttendance(worker.workerId || worker.id, todayStr, nextStatus, {
      checkInTime: nextStatus === 'Present' ? '08:15 AM' : undefined
    });
    showToast({
      title: nextStatus === 'Present' ? 'Attendance Marked Present' : 'Attendance Marked Absent',
      message: `${worker.name} is now marked ${nextStatus} for today (${todayStr}).`,
      type: nextStatus === 'Present' ? 'success' : 'info'
    });
  };

  const assignedJobs = jobs.filter(
    j => j.assignedWorkerId === worker.workerId || j.assignedWorkerId === worker.id || (j.assignedWorker && j.assignedWorker.includes(worker.name.split(' ')[0]))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader
        title={`${worker.name}`}
        description={`Karigar Profile • Code: ${worker.workerId} • ${worker.department}`}
        breadcrumbs={[
          { label: 'Workers', path: '/workers' },
          { label: worker.workerId }
        ]}
        badge={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <StatusBadge status={worker.status} />
            {worker.status === 'Active' && currentStatus && (
              <StatusBadge
                status={currentStatus}
                customLabel={
                  currentStatus === 'Present'
                    ? `Present (${todayAtt?.checkInTime || '08:15 AM'})`
                    : currentStatus === 'Half Day'
                    ? `Half Day (${todayAtt?.checkInTime || '08:15 AM'})`
                    : currentStatus
                }
                icon={true}
              />
            )}
          </div>
        }
        actions={
          <>
            <Button
              variant="primary"
              icon={<Plus size={14} />}
              onClick={() => {
                setEditingLeaveId(undefined);
                setIsLeaveModalOpen(true);
              }}
            >
              Apply Leave
            </Button>
            <Button
              variant="secondary"
              icon={<ArrowLeft size={14} />}
              onClick={() => navigate('/workers')}
            >
              Back to Workers
            </Button>
            <Button
              variant="outline"
              icon={<CalendarDays size={14} />}
              onClick={() => navigate(`/attendance/${worker.workerId || worker.id}`)}
            >
              Attendance Calendar
            </Button>
            {worker.status === 'Active' && (
              <Button
                variant={isPresent ? 'outline' : 'secondary'}
                icon={isPresent ? <UserX size={14} /> : <UserCheck size={14} />}
                onClick={handleAttendanceToggle}
              >
                {isPresent ? 'Mark Absent Today' : 'Clock In / Mark Present'}
              </Button>
            )}
            <Button
              variant="secondary"
              icon={<Edit3 size={14} />}
              onClick={() => setIsEditModalOpen(true)}
            >
              Edit Details
            </Button>
          </>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
        {/* Left Column: Worker Master Card */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <User size={16} style={{ color: 'var(--color-brand-primary)' }} />
              <span>Personal & Skill Details</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              icon={<Edit3 size={13} />}
              onClick={() => setIsEditModalOpen(true)}
            >
              Edit
            </Button>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Worker ID</div>
              <div style={{ marginTop: '2px' }}><span className="mono-code">{worker.workerId}</span></div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Primary Skill</div>
              <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', marginTop: '2px' }}>{worker.skill}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Department</div>
              <div style={{ color: 'var(--color-text-primary)', marginTop: '2px' }}>{worker.department}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Contact Number</div>
              <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', marginTop: '2px' }}>{worker.mobile}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Shift Assignment</div>
              <div style={{ color: 'var(--color-text-primary)', marginTop: '2px' }}>{worker.shift || 'Shift A (8:00 AM - 8:00 PM)'}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Joining Date</div>
              <div style={{ color: 'var(--color-text-primary)', marginTop: '2px' }}>{worker.joiningDate}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Residential Address</div>
              <div style={{ color: 'var(--color-text-secondary)', marginTop: '2px' }}>{worker.address}</div>
            </div>
            {worker.emergencyContact && (
              <div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Emergency Contact</div>
                <div style={{ color: 'var(--color-text-secondary)', marginTop: '2px' }}>{worker.emergencyContact}</div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Attendance Widget, Salary & Assigned Production Jobs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* This Month's Attendance Summary Widget */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <CalendarCheck size={16} style={{ color: 'var(--color-brand-primary)' }} />
                <span>This Month's Attendance Summary ({now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                icon={<ArrowRight size={13} />}
                iconPosition="right"
                onClick={() => navigate(`/attendance/${worker.workerId || worker.id}`)}
              >
                View Full Calendar
              </Button>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                <div style={{ padding: '12px', backgroundColor: 'var(--color-status-success-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-status-success-border)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-status-success-text)', textTransform: 'uppercase', fontWeight: 600 }}>Attendance Rate</div>
                  <div className="tabular-nums" style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-status-success-solid)', marginTop: '2px' }}>
                    {monthSummary.attendancePercent}%
                  </div>
                </div>

                <div style={{ padding: '12px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Present Days</div>
                  <div className="tabular-nums" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '2px' }}>
                    {monthSummary.present} <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--color-text-muted)' }}>Days</span>
                  </div>
                </div>

                <div style={{ padding: '12px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Half Days</div>
                  <div className="tabular-nums" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-status-warning-solid)', marginTop: '2px' }}>
                    {monthSummary.halfDay} <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--color-text-muted)' }}>Days</span>
                  </div>
                </div>

                <div style={{ padding: '12px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Absent / Leave</div>
                  <div className="tabular-nums" style={{ fontSize: '16px', fontWeight: 700, color: monthSummary.absent > 0 ? 'var(--color-status-danger-solid)' : 'var(--color-text-primary)', marginTop: '2px' }}>
                    {monthSummary.absent} Abs <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--color-text-muted)' }}>/ {monthSummary.onLeave} Lve</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Wage & Remuneration Card */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <IndianRupee size={16} style={{ color: 'var(--color-status-success-solid)' }} />
                <span>Wage & Compensation Structure</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                icon={<Edit3 size={13} />}
                onClick={() => setIsEditModalOpen(true)}
              >
                Change Wage
              </Button>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                <div style={{ padding: '12px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Salary Structure</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '2px' }}>{worker.salaryType}</div>
                </div>
                <div style={{ padding: '12px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Agreed Rate / Base</div>
                  <div className="tabular-nums" style={{ fontSize: '17px', fontWeight: 700, color: 'var(--color-brand-primary)', marginTop: '2px' }}>
                    ₹{worker.salary.toLocaleString('en-IN')}
                  </div>
                </div>
                <div style={{ padding: '12px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>OT Hourly Rate</div>
                  <div className="tabular-nums" style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '2px' }}>
                    {worker.salaryType === 'Piece Rate (Karigar)' ? (
                      <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 400 }}>Piece-rate output</span>
                    ) : (
                      `₹${getHourlyOvertimeRate(worker, shiftConfig).toFixed(1)}/hr`
                    )}
                  </div>
                </div>
                <div style={{ padding: '12px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Payment Cycle</div>
                  <div style={{ fontSize: '13px', fontWeight: 500, marginTop: '2px' }}>Monthly 1st-7th</div>
                </div>
              </div>
            </div>
          </div>

          {/* Uppad / Jama Adjustments Ledger Card */}
          {(() => {
            const workerAdjustments = adjustments.filter(
              a => a.workerId === worker.workerId || a.workerId === worker.id
            );
            const totalUppad = workerAdjustments.filter(a => a.type === 'Uppad').reduce((s, a) => s + a.amount, 0);
            const totalJama = workerAdjustments.filter(a => a.type === 'Jama').reduce((s, a) => s + a.amount, 0);

            return (
              <div className="card">
                <div className="card-header">
                  <div className="card-title">
                    <Receipt size={16} style={{ color: 'var(--color-brand-primary)' }} />
                    <span>Salary Adjustments Ledger (Uppad / Jama)</span>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<Plus size={13} />}
                    onClick={() => {
                      setAdjType('Uppad');
                      setAdjAmount('');
                      setAdjDate(getTodayDateString());
                      setAdjReason('');
                      setIsAddAdjModalOpen(true);
                    }}
                  >
                    Add Adjustment
                  </Button>
                </div>

                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Totals Summary */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                    <div style={{ padding: '10px 12px', backgroundColor: 'var(--color-status-danger-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-status-danger-border)' }}>
                      <div style={{ fontSize: '10px', color: 'var(--color-status-danger-text)', fontWeight: 600, textTransform: 'uppercase' }}>Total Uppad (Deductions)</div>
                      <div className="tabular-nums" style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-status-danger-solid)', marginTop: '2px' }}>
                        -₹{totalUppad.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div style={{ padding: '10px 12px', backgroundColor: 'var(--color-status-success-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-status-success-border)' }}>
                      <div style={{ fontSize: '10px', color: 'var(--color-status-success-text)', fontWeight: 600, textTransform: 'uppercase' }}>Total Jama (Credits)</div>
                      <div className="tabular-nums" style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-status-success-solid)', marginTop: '2px' }}>
                        +₹{totalJama.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div style={{ padding: '10px 12px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)' }}>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Net Adjustment Impact</div>
                      <div className="tabular-nums" style={{ fontSize: '16px', fontWeight: 700, color: totalJama >= totalUppad ? 'var(--color-status-success-solid)' : 'var(--color-status-danger-solid)', marginTop: '2px' }}>
                        {totalJama >= totalUppad ? `+₹${(totalJama - totalUppad).toLocaleString('en-IN')}` : `-₹${(totalUppad - totalJama).toLocaleString('en-IN')}`}
                      </div>
                    </div>
                  </div>

                  {/* Adjustments Table */}
                  {workerAdjustments.length > 0 ? (
                    <div style={{ overflowX: 'auto', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-md)' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                        <thead>
                          <tr style={{ backgroundColor: 'var(--color-bg-subtle)', borderBottom: '1px solid var(--color-border-default)' }}>
                            <th style={{ padding: '6px 12px', textAlign: 'left', fontSize: '10px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Date</th>
                            <th style={{ padding: '6px 12px', textAlign: 'left', fontSize: '10px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Type</th>
                            <th style={{ padding: '6px 12px', textAlign: 'right', fontSize: '10px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Amount</th>
                            <th style={{ padding: '6px 12px', textAlign: 'left', fontSize: '10px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Reason / Description</th>
                            <th style={{ padding: '6px 12px', textAlign: 'center', fontSize: '10px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {workerAdjustments.map((adj) => (
                            <tr key={adj.id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                              <td style={{ padding: '6px 12px' }}><span className="mono-code" style={{ fontSize: '11px' }}>{adj.date}</span></td>
                              <td style={{ padding: '6px 12px' }}>
                                <span
                                  style={{
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    padding: '2px 6px',
                                    borderRadius: 'var(--radius-sm)',
                                    backgroundColor: adj.type === 'Uppad' ? 'var(--color-status-danger-bg)' : 'var(--color-status-success-bg)',
                                    color: adj.type === 'Uppad' ? 'var(--color-status-danger-text)' : 'var(--color-status-success-text)',
                                    border: `1px solid ${adj.type === 'Uppad' ? 'var(--color-status-danger-border)' : 'var(--color-status-success-border)'}`
                                  }}
                                >
                                  {adj.type}
                                </span>
                              </td>
                              <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 700, color: adj.type === 'Uppad' ? 'var(--color-status-danger-solid)' : 'var(--color-status-success-solid)' }} className="tabular-nums">
                                {adj.type === 'Uppad' ? '-' : '+'}₹{adj.amount.toLocaleString('en-IN')}
                              </td>
                              <td style={{ padding: '6px 12px', color: 'var(--color-text-secondary)' }}>
                                {adj.reason || '—'}
                              </td>
                              <td style={{ padding: '6px 12px', textAlign: 'center' }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    deleteAdjustment(adj.id);
                                    showToast({ title: 'Adjustment Deleted', message: `Removed ₹${adj.amount} ${adj.type} record.`, type: 'info' });
                                  }}
                                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-status-danger-solid)', padding: '2px' }}
                                  title="Delete Adjustment"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', textAlign: 'center', padding: '12px 0' }}>
                      No advances (Uppad) or bonus credits (Jama) recorded for this worker.
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Leave History Card */}
          {(() => {
            const workerLeaves = getLeaveRecords(worker.workerId || worker.id);
            return (
              <div className="card">
                <div className="card-header">
                  <div className="card-title">
                    <CalendarDays size={16} style={{ color: 'var(--color-brand-primary)' }} />
                    <span>Leave History & Multi-Day Requests ({workerLeaves.length})</span>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<Plus size={13} />}
                    onClick={() => {
                      setEditingLeaveId(undefined);
                      setIsLeaveModalOpen(true);
                    }}
                  >
                    Apply Leave
                  </Button>
                </div>
                <div className="card-body">
                  {workerLeaves.length > 0 ? (
                    <div style={{ overflowX: 'auto', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-md)' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                        <thead>
                          <tr style={{ backgroundColor: 'var(--color-bg-subtle)', borderBottom: '1px solid var(--color-border-default)' }}>
                            <th style={{ padding: '6px 12px', textAlign: 'left', fontSize: '10px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Leave ID</th>
                            <th style={{ padding: '6px 12px', textAlign: 'left', fontSize: '10px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Category</th>
                            <th style={{ padding: '6px 12px', textAlign: 'left', fontSize: '10px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Date Range</th>
                            <th style={{ padding: '6px 12px', textAlign: 'center', fontSize: '10px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Total Days</th>
                            <th style={{ padding: '6px 12px', textAlign: 'left', fontSize: '10px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Reason / Notes</th>
                            <th style={{ padding: '6px 12px', textAlign: 'center', fontSize: '10px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {workerLeaves.map(leave => (
                            <tr key={leave.id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                              <td style={{ padding: '6px 12px' }}><span className="mono-code" style={{ fontSize: '11px' }}>{leave.id}</span></td>
                              <td style={{ padding: '6px 12px' }}>
                                <span
                                  style={{
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    padding: '2px 6px',
                                    borderRadius: 'var(--radius-sm)',
                                    backgroundColor: leave.leaveType === 'Sick' ? 'var(--color-status-danger-bg)' : 'var(--color-status-info-bg)',
                                    color: leave.leaveType === 'Sick' ? 'var(--color-status-danger-text)' : 'var(--color-status-info-text)',
                                    border: `1px solid ${leave.leaveType === 'Sick' ? 'var(--color-status-danger-border)' : 'var(--color-status-info-border)'}`
                                  }}
                                >
                                  {leave.leaveType}
                                </span>
                              </td>
                              <td style={{ padding: '6px 12px' }}>
                                <span className="mono-code" style={{ fontSize: '11px' }}>{leave.startDate} {leave.startDate !== leave.endDate ? `→ ${leave.endDate}` : ''}</span>
                              </td>
                              <td style={{ padding: '6px 12px', textAlign: 'center', fontWeight: 700 }} className="tabular-nums">
                                {leave.totalDays}d
                              </td>
                              <td style={{ padding: '6px 12px', color: 'var(--color-text-secondary)' }}>
                                {leave.reason || '—'}
                              </td>
                              <td style={{ padding: '6px 12px', textAlign: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingLeaveId(leave.id);
                                      setIsLeaveModalOpen(true);
                                    }}
                                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-brand-primary)', padding: '2px' }}
                                    title="Edit Range"
                                  >
                                    <Edit3 size={13} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setCancellingLeave(leave)}
                                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-status-danger-solid)', padding: '2px' }}
                                    title="Cancel Leave"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', textAlign: 'center', padding: '12px 0' }}>
                      No active or past leave applications on record.
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Assigned Production Jobs */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <Layers size={16} style={{ color: 'var(--color-brand-accent)' }} />
                <span>Assigned Production Jobs ({assignedJobs.length})</span>
              </div>
            </div>
            <div style={{ padding: '16px' }}>
              {assignedJobs.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {assignedJobs.map(job => (
                    <div
                      key={job.id}
                      onClick={() => navigate(`/production/jobs/${job.id}`)}
                      style={{
                        padding: '12px 14px',
                        border: '1px solid var(--color-border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        backgroundColor: 'var(--color-bg-surface)'
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-bg-subtle)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--color-bg-surface)'}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="mono-code">{job.jobNumber}</span>
                          <span style={{ fontWeight: 600, fontSize: '13px' }}>{job.productName}</span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                          Machine: {job.machine} • Target: {job.requiredQuantity} pcs • Produced: {job.producedQuantity} pcs
                        </div>
                      </div>
                      <StatusBadge status={job.status} size="sm" />
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', textAlign: 'center', padding: '16px 0' }}>
                  No active jobs currently allocated to this worker.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Worker Modal */}
      <WorkerEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        worker={worker}
      />

      {/* Apply Leave Modal */}
      <ApplyLeaveModal
        isOpen={isLeaveModalOpen}
        onClose={() => {
          setIsLeaveModalOpen(false);
          setEditingLeaveId(undefined);
        }}
        workerId={worker.workerId || worker.id}
        existingLeaveId={editingLeaveId}
      />

      {/* Cancel Leave Confirmation */}
      <ConfirmationDialog
        isOpen={Boolean(cancellingLeave)}
        onClose={() => setCancellingLeave(null)}
        onConfirm={() => {
          if (cancellingLeave) {
            cancelLeave(cancellingLeave.id);
            showToast({
              title: 'Leave Cancelled',
              message: `Cancelled ${cancellingLeave.leaveType} leave for ${worker.name}.`,
              type: 'info'
            });
            setCancellingLeave(null);
          }
        }}
        title={`Cancel ${cancellingLeave?.leaveType} Leave (${cancellingLeave?.id})?`}
        message={`Are you sure you want to cancel the leave from ${cancellingLeave?.startDate} to ${cancellingLeave?.endDate} (${cancellingLeave?.totalDays} days)? Marked days will be reverted to unmarked.`}
        confirmLabel="Cancel Leave"
      />

      {/* Add Adjustment Modal */}
      <Modal
        isOpen={isAddAdjModalOpen}
        onClose={() => setIsAddAdjModalOpen(false)}
        title={`Add Salary Adjustment — ${worker.name}`}
        subtitle={`Record Uppad (advance deduction) or Jama (bonus / reimbursement credit)`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsAddAdjModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                const amt = parseFloat(adjAmount);
                if (!amt || amt <= 0) {
                  showToast({ title: 'Invalid Amount', message: 'Please enter a valid positive adjustment amount.', type: 'warning' });
                  return;
                }
                addAdjustment(worker.workerId || worker.id, adjDate, adjType, amt, adjReason || undefined);
                showToast({
                  title: `${adjType} Recorded`,
                  message: `Added ₹${amt.toLocaleString('en-IN')} ${adjType} entry for ${worker.name}.`,
                  type: 'success'
                });
                setIsAddAdjModalOpen(false);
              }}
            >
              Save Adjustment
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <SelectField
              label="Adjustment Type"
              required
              value={adjType}
              onChange={e => setAdjType(e.target.value as 'Uppad' | 'Jama')}
              options={[
                { value: 'Uppad', label: 'Uppad (Advance / Deduction -)' },
                { value: 'Jama', label: 'Jama (Bonus / Credit +)' },
              ]}
            />
            <FormField
              label="Adjustment Amount (₹)"
              type="number"
              prefix="₹"
              placeholder="1000"
              required
              value={adjAmount}
              onChange={e => setAdjAmount(e.target.value)}
            />
          </div>

          <FormField
            label="Adjustment Date"
            type="date"
            required
            value={adjDate}
            onChange={e => setAdjDate(e.target.value)}
          />

          <FormField
            label="Reason / Description"
            placeholder="e.g. Medical emergency advance, Diwali bonus, Fine deduction"
            value={adjReason}
            onChange={e => setAdjReason(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
};
