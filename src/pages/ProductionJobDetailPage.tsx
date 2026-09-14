import React, { useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { StatusBadge } from '../components/common/StatusBadge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { FormField } from '../components/common/FormField';
import { SelectField } from '../components/common/SelectField';
import { useNavigation } from '../context/NavigationContext';
import { useProduction } from '../context/ProductionContext';
import { useQuality } from '../context/QualityContext';
import { useToast } from '../context/ToastContext';
import {
  ArrowLeft,
  Layers,
  User,
  Printer,
  Plus,
  ShieldCheck
} from 'lucide-react';

interface ProductionJobDetailPageProps {
  id?: string;
}

export const ProductionJobDetailPage: React.FC<ProductionJobDetailPageProps> = ({ id }) => {
  const { currentPath, navigate } = useNavigation();
  const { getJob, jobs, logProduction, updateJob } = useProduction();
  const { inspections } = useQuality();
  const { showToast } = useToast();

  const pathParts = currentPath.split('/');
  const jobId = id || pathParts[3] || (jobs[0]?.id ?? 'JOB-2026-001');

  const job = getJob(jobId) || jobs[0];

  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [producedInput, setProducedInput] = useState('100');
  const [rejectedInput, setRejectedInput] = useState('0');
  const [operatorNote, setOperatorNote] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(job?.status || 'In Production');

  if (!job) {
    return (
      <div style={{ padding: '20px' }}>
        <Button variant="secondary" icon={<ArrowLeft size={14} />} onClick={() => navigate('/production/jobs')}>
          Back to Jobs
        </Button>
        <p style={{ marginTop: '20px' }}>Job Card record not found.</p>
      </div>
    );
  }

  // Cross-Module 7c: Quality Inspections linked to this job
  const linkedInspections = inspections.filter(
    i => i.jobId === job.id || i.jobNumber === job.jobNumber
  );

  const percent = Math.round((job.producedQuantity / Math.max(1, job.requiredQuantity)) * 100);

  // Pace tracking calculation for detail page
  let paceBarColor = 'var(--color-brand-primary)';
  let paceStatusText = `${percent}% Produced`;
  if (job.status === 'Completed' || percent >= 100) {
    paceBarColor = 'var(--color-status-success-solid)';
    paceStatusText = 'Target Completed';
  } else if (job.status === 'Delayed') {
    paceBarColor = 'var(--color-status-danger-solid)';
    paceStatusText = 'Behind Schedule (Delayed)';
  } else {
    const start = new Date(job.date).getTime();
    const due = new Date(job.dueDate).getTime();
    const now = Date.now();
    const totalDuration = Math.max(86400000, due - start);
    const elapsed = Math.min(totalDuration, Math.max(0, now - start));
    const elapsedPct = Math.round((elapsed / totalDuration) * 100);

    if (elapsedPct > 50 && percent < elapsedPct * 0.6) {
      paceBarColor = 'var(--color-status-danger-solid)';
      paceStatusText = '⚠️ Behind Expected Pace';
    } else if (elapsedPct > 30 && percent < elapsedPct * 0.8) {
      paceBarColor = 'var(--color-status-warning-solid)';
      paceStatusText = '⚡ Caution: Behind Timeline';
    }
  }

  const borderAccentColor = (job.priority === 'Critical' || job.status === 'Delayed')
    ? 'var(--color-status-danger-solid)'
    : job.priority === 'High'
    ? 'var(--color-status-warning-solid)'
    : undefined;

  const handleLogProductionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const prodDelta = Number(producedInput) || 0;
    const rejDelta = Number(rejectedInput) || 0;

    if (prodDelta <= 0 && rejDelta <= 0) {
      showToast({
        title: 'Invalid Entry',
        message: 'Enter a valid produced or rejected quantity greater than 0.',
        type: 'warning'
      });
      return;
    }

    const { job: updatedJob, isNewlyCompleted } = logProduction(job.id, prodDelta, rejDelta);

    setIsLogModalOpen(false);
    setProducedInput('100');
    setRejectedInput('0');
    setOperatorNote('');

    if (isNewlyCompleted || updatedJob?.status === 'Completed') {
      showToast({
        title: '🎉 Batch Target Completed!',
        message: `Job ${job.jobNumber} produced ${updatedJob?.producedQuantity} pcs. Ready for final QC inspection.`,
        type: 'success'
      });
    } else {
      showToast({
        title: 'Shift Output Recorded',
        message: `Logged +${prodDelta} produced (${rejDelta} scrap) for ${job.jobNumber}.`,
        type: 'success'
      });
    }
  };

  const handleStatusChange = (newStatus: any) => {
    setSelectedStatus(newStatus);
    updateJob(job.id, { status: newStatus });
    showToast({
      title: 'Status Updated',
      message: `Job ${job.jobNumber} status changed to ${newStatus}.`,
      type: 'info'
    });
  };

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
        badge={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <StatusBadge status={job.status} icon={true} />
            <StatusBadge
              status={job.priority}
              customLabel={`${job.priority} Priority`}
              icon={true}
            />
          </div>
        }
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              variant="secondary"
              icon={<ArrowLeft size={14} />}
              onClick={() => navigate('/production/jobs')}
            >
              Back to Jobs
            </Button>
            <Button
              variant="secondary"
              icon={<Printer size={14} />}
              onClick={() => window.print()}
            >
              Print Route Card
            </Button>
            <Button
              variant="primary"
              icon={<Plus size={14} />}
              onClick={() => setIsLogModalOpen(true)}
            >
              Log Production
            </Button>
          </div>
        }
      />

      {/* Production Progress Hero Banner */}
      <div className="card" style={{
        padding: '20px',
        borderLeft: borderAccentColor ? `6px solid ${borderAccentColor}` : '1px solid var(--color-border-subtle)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Batch Target Progress</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '2px' }}>
              <span className="tabular-nums">{job.producedQuantity.toLocaleString('en-IN')}</span> / <span className="tabular-nums">{job.requiredQuantity.toLocaleString('en-IN')} pcs</span>
              <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-muted)', marginLeft: '10px' }}>({paceStatusText})</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '24px', textAlign: 'right' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Scrap / Rejected</div>
              <div className="tabular-nums" style={{ fontSize: '18px', fontWeight: 700, color: job.rejectedQuantity > 0 ? 'var(--color-status-danger-solid)' : 'var(--color-text-muted)', marginTop: '2px' }}>
                {job.rejectedQuantity} pcs
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Target Due Date</div>
              <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '2px' }}>
                {job.dueDate}
              </div>
            </div>
          </div>
        </div>

        <div style={{ height: '10px', backgroundColor: 'var(--color-bg-muted)', borderRadius: '5px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${Math.min(100, percent)}%`, backgroundColor: paceBarColor, transition: 'width 0.4s ease' }} />
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
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Priority Level</div>
              <div style={{ marginTop: '4px' }}>
                <StatusBadge status={job.priority} customLabel={`${job.priority} Priority`} icon={true} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Change Job Status</div>
              <div style={{ marginTop: '4px' }}>
                <SelectField
                  label=""
                  options={[
                    { value: 'In Production', label: 'In Production' },
                    { value: 'Quality Check', label: 'Quality Check' },
                    { value: 'Completed', label: 'Completed' },
                    { value: 'Delayed', label: 'Delayed' },
                    { value: 'Pending', label: 'Pending' },
                  ]}
                  value={selectedStatus}
                  onChange={e => handleStatusChange(e.target.value)}
                  allowOther={false}
                />
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

            {/* Cross-Module 7c Linked QC Inspections list */}
            <div style={{ marginTop: '8px', borderTop: '1px solid var(--color-border-subtle)', paddingTop: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Linked QC Inspections ({linkedInspections.length})
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<ShieldCheck size={13} />}
                  onClick={() => navigate('/quality')}
                >
                  QC Register
                </Button>
              </div>

              {linkedInspections.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {linkedInspections.map(qc => (
                    <div
                      key={qc.id}
                      style={{
                        padding: '6px 10px',
                        backgroundColor: 'var(--color-bg-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="mono-code" style={{ fontSize: '10px' }}>{qc.id}</span>
                        <span>{qc.inspectionType}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="tabular-nums" style={{ color: 'var(--color-status-success-solid)' }}>✓ {qc.passedQuantity}</span>
                        {qc.rejectedQuantity > 0 && (
                          <span className="tabular-nums" style={{ color: 'var(--color-status-danger-solid)' }}>✗ {qc.rejectedQuantity}</span>
                        )}
                        <span
                          className="status-badge"
                          style={{
                            fontSize: '10px',
                            padding: '1px 6px',
                            backgroundColor: qc.result === 'Pass' ? 'var(--color-status-success-bg)' : 'var(--color-status-danger-bg)',
                            color: qc.result === 'Pass' ? 'var(--color-status-success-text)' : 'var(--color-status-danger-text)'
                          }}
                        >
                          {qc.result}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                  No QC inspections recorded for this job yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Log Production Modal Form (Item 7b) */}
      <Modal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        title={`Log Production Shift Output: ${job.jobNumber}`}
        subtitle={`${job.productName} • Machine: ${job.machine}`}
        maxWidth="540px"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', width: '100%' }}>
            <Button variant="secondary" type="button" onClick={() => setIsLogModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" form="log-prod-form">
              Record Output & Update Progress
            </Button>
          </div>
        }
      >
        <form id="log-prod-form" onSubmit={handleLogProductionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ padding: '10px 14px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            Current Progress: <strong className="tabular-nums">{job.producedQuantity} / {job.requiredQuantity} pcs</strong> • Remaining: <strong className="tabular-nums">{Math.max(0, job.requiredQuantity - job.producedQuantity)} pcs</strong>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <FormField
              label="Completed Quantity (pcs)"
              required
              type="number"
              value={producedInput}
              onChange={e => setProducedInput(e.target.value)}
              suffix="pcs"
              helpText="Units passed first visual check"
            />
            <FormField
              label="Scrap / Rejection (pcs)"
              type="number"
              value={rejectedInput}
              onChange={e => setRejectedInput(e.target.value)}
              suffix="pcs"
              helpText="Defective or off-size pieces"
            />
          </div>

          <FormField
            label="Shift Notes / Operator Log"
            placeholder="e.g. Completed Shift A morning run. Replaced carbide insert on station."
            value={operatorNote}
            onChange={e => setOperatorNote(e.target.value)}
          />
        </form>
      </Modal>
    </div>
  );
};
