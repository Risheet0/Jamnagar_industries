import React from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { StatusBadge } from '../components/common/StatusBadge';
import { Button } from '../components/common/Button';
import { useNavigation } from '../context/NavigationContext';
import { mockWorkers } from '../mock/workersData';
import { mockProductionJobs } from '../mock/productionData';
import { ArrowLeft, User, IndianRupee, Layers } from 'lucide-react';

interface WorkerDetailPageProps {
  id?: string;
}

export const WorkerDetailPage: React.FC<WorkerDetailPageProps> = ({ id }) => {
  const { currentPath, navigate } = useNavigation();

  // Extract ID from path if not passed as prop e.g. /workers/WRK-001
  const pathParts = currentPath.split('/');
  const workerId = id || pathParts[2] || 'WRK-001';

  const worker = mockWorkers.find(w => w.id === workerId || w.workerId === workerId) || mockWorkers[0];

  const assignedJobs = mockProductionJobs.filter(j => j.assignedWorkerId === worker.workerId || j.assignedWorker.includes(worker.name.split(' ')[0]));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader
        title={`${worker.name}`}
        description={`Karigar Profile • Code: ${worker.workerId} • ${worker.department}`}
        breadcrumbs={[
          { label: 'Workers', path: '/workers' },
          { label: worker.workerId }
        ]}
        badge={<StatusBadge status={worker.status} />}
        actions={
          <Button
            variant="secondary"
            icon={<ArrowLeft size={14} />}
            onClick={() => navigate('/workers')}
          >
            Back to Workers
          </Button>
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
              <div style={{ color: 'var(--color-text-primary)', marginTop: '2px' }}>{worker.shift || 'Shift A (Morning)'}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Joining Date</div>
              <div style={{ color: 'var(--color-text-primary)', marginTop: '2px' }}>{worker.joiningDate}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Residential Address</div>
              <div style={{ color: 'var(--color-text-secondary)', marginTop: '2px' }}>{worker.address}</div>
            </div>
          </div>
        </div>

        {/* Right Column: Salary & Assigned Production Jobs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Wage & Remuneration Card */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <IndianRupee size={16} style={{ color: 'var(--color-status-success-solid)' }} />
                <span>Wage & Compensation Structure</span>
              </div>
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
    </div>
  );
};
