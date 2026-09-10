import React from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { StatusBadge } from '../components/common/StatusBadge';
import { Button } from '../components/common/Button';
import { useNavigation } from '../context/NavigationContext';
import { mockProductionJobs } from '../mock/productionData';
import { ArrowLeft, Layers, User, Printer } from 'lucide-react';

interface ProductionJobDetailPageProps {
  id?: string;
}

export const ProductionJobDetailPage: React.FC<ProductionJobDetailPageProps> = ({ id }) => {
  const { currentPath, navigate } = useNavigation();

  const pathParts = currentPath.split('/');
  const jobId = id || pathParts[3] || 'JOB-2026-001';

  const job = mockProductionJobs.find(j => j.id === jobId || j.jobNumber === jobId) || mockProductionJobs[0];

  const percent = Math.round((job.producedQuantity / job.requiredQuantity) * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader
        title={`Job Card: ${job.jobNumber}`}
        description={`${job.productName} • Client: ${job.customer}`}
        breadcrumbs={[
          { label: 'Production', path: '/production' },
          { label: 'Job Cards', path: '/production/jobs' },
          { label: job.jobNumber }
        ]}
        badge={<StatusBadge status={job.status} />}
        actions={
          <>
            <Button
              variant="secondary"
              icon={<ArrowLeft size={14} />}
              onClick={() => navigate('/production/jobs')}
            >
              Back to Jobs
            </Button>
            <Button
              variant="outline"
              icon={<Printer size={14} />}
              onClick={() => window.print()}
            >
              Print Route Card
            </Button>
          </>
        }
      />

      {/* Progress Metric Bar */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
              Batch Production Completion
            </div>
            <div className="tabular-nums" style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '2px' }}>
              {job.producedQuantity.toLocaleString('en-IN')} <span style={{ fontSize: '14px', color: 'var(--color-text-muted)', fontWeight: 400 }}>/ {job.requiredQuantity.toLocaleString('en-IN')} pcs ({percent}%)</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '20px', textAlign: 'right' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Rejections</div>
              <div className="tabular-nums" style={{ fontSize: '18px', fontWeight: 700, color: job.rejectedQuantity > 0 ? 'var(--color-status-danger-solid)' : 'var(--color-text-primary)' }}>
                {job.rejectedQuantity} pcs
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Due Date</div>
              <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '2px' }}>
                {job.dueDate}
              </div>
            </div>
          </div>
        </div>

        <div style={{ height: '10px', backgroundColor: 'var(--color-bg-muted)', borderRadius: '5px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${Math.min(100, percent)}%`, backgroundColor: percent >= 100 ? 'var(--color-status-success-solid)' : 'var(--color-brand-primary)' }} />
        </div>
      </div>

      {/* Specifications Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Layers size={16} style={{ color: 'var(--color-brand-primary)' }} />
              <span>Job Order Parameters</span>
            </div>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Customer / Order Reference</div>
              <div style={{ fontWeight: 600, marginTop: '2px' }}>{job.customer}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Component Name & Code</div>
              <div style={{ marginTop: '2px' }}>{job.productName} (<span className="mono-code">{job.productCode}</span>)</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Issue Date</div>
              <div style={{ marginTop: '2px' }}>{job.date}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Priority Flag</div>
              <div style={{ marginTop: '2px' }}>
                <span className={`status-badge ${job.priority === 'Critical' ? 'status-badge-danger' : job.priority === 'High' ? 'status-badge-warning' : 'status-badge-neutral'}`}>
                  {job.priority} Priority
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <User size={16} style={{ color: 'var(--color-brand-accent)' }} />
              <span>Machine & Karigar Allocation</span>
            </div>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Assigned Karigar</div>
              <div style={{ fontWeight: 600, marginTop: '2px' }}>{job.assignedWorker}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Assigned Machine / Cell</div>
              <div style={{ marginTop: '2px' }}>{job.machine}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Production Notes / Tolerances</div>
              <div style={{ marginTop: '2px', color: 'var(--color-text-secondary)' }}>{job.notes || 'No special instructions recorded.'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
