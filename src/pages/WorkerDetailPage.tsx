import React, { useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { StatusBadge } from '../components/common/StatusBadge';
import { Button } from '../components/common/Button';
import { WorkerEditModal } from '../components/common/WorkerEditModal';
import { useNavigation } from '../context/NavigationContext';
import { useWorkers } from '../context/WorkerContext';
import { useAttendance, getTodayDateString } from '../context/AttendanceContext';
import { useProduction } from '../context/ProductionContext';
import { useToast } from '../context/ToastContext';
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
  ArrowRight
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
    getMonthSummary
  } = useAttendance();
  const { jobs } = useProduction();
  const { showToast } = useToast();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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
                variant={isPresent ? 'outline' : 'primary'}
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                <div style={{ padding: '12px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Salary Structure</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '2px' }}>{worker.salaryType}</div>
                </div>
                <div style={{ padding: '12px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Agreed Rate / Base</div>
                  <div className="tabular-nums" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-brand-primary)', marginTop: '2px' }}>
                    ₹{worker.salary.toLocaleString('en-IN')}
                  </div>
                </div>
                <div style={{ padding: '12px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Payment Cycle</div>
                  <div style={{ fontSize: '14px', fontWeight: 500, marginTop: '2px' }}>Monthly 1st-7th</div>
                </div>
              </div>
            </div>
          </div>

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
    </div>
  );
};
