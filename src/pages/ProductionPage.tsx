import React from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { SummaryCard } from '../components/common/SummaryCard';
import { DataTable } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/StatusBadge';
import { Button } from '../components/common/Button';
import { useNavigation } from '../context/NavigationContext';
import { useProduction } from '../context/ProductionContext';
import { ProductionJob, TableColumn } from '../types';
import { Factory, PlusCircle, Eye, Layers, CheckCircle2, ArrowRight } from 'lucide-react';

export const ProductionPage: React.FC = () => {
  const { navigate, openQuickAdd } = useNavigation();
  const { jobs } = useProduction();

  const totalRequired = jobs.reduce((sum, j) => sum + j.requiredQuantity, 0);
  const totalProduced = jobs.reduce((sum, j) => sum + j.producedQuantity, 0);
  const totalRejected = jobs.reduce((sum, j) => sum + j.rejectedQuantity, 0);
  const activeJobs = jobs.filter(j => j.status === 'In Production');
  const delayedJobs = jobs.filter(j => j.status === 'Delayed');

  // Active Floor Jobs snapshot: In Production, Delayed, Pending (max 10 rows)
  const floorJobsSnapshot = jobs
    .filter(j => j.status === 'In Production' || j.status === 'Delayed' || j.status === 'Pending')
    .slice(0, 10);

  const displayJobs = floorJobsSnapshot.length > 0 ? floorJobsSnapshot : jobs.slice(0, 10);

  const columns: TableColumn<ProductionJob>[] = [
    {
      header: 'Job Card #',
      accessor: 'jobNumber',
      width: '130px',
      sortable: true,
      render: (j) => <span className="mono-code">{j.jobNumber}</span>
    },
    {
      header: 'Product & Customer',
      accessor: 'productName',
      sortable: true,
      render: (j) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{j.productName}</div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Customer: {j.customer}</div>
        </div>
      )
    },
    {
      header: 'Machine / Station',
      accessor: 'machine',
      sortable: true,
      render: (j) => (
        <div>
          <div style={{ fontWeight: 500 }}>{j.machine}</div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Operator: {j.assignedWorker}</div>
        </div>
      )
    },
    {
      header: 'Batch Progress',
      accessor: 'producedQuantity',
      align: 'right',
      sortable: true,
      render: (j) => {
        const percent = Math.round((j.producedQuantity / j.requiredQuantity) * 100);
        return (
          <div style={{ textAlign: 'right', minWidth: '120px' }}>
            <div className="tabular-nums" style={{ fontWeight: 700 }}>
              {j.producedQuantity} / {j.requiredQuantity} pcs
            </div>
            <div style={{
              height: '4px',
              backgroundColor: 'var(--color-bg-muted)',
              borderRadius: '2px',
              overflow: 'hidden',
              marginTop: '4px'
            }}>
              <div style={{
                height: '100%',
                width: `${Math.min(100, percent)}%`,
                backgroundColor: percent >= 100 ? 'var(--color-status-success-solid)' : 'var(--color-brand-primary)'
              }} />
            </div>
          </div>
        );
      }
    },
    {
      header: 'Due Date',
      accessor: 'dueDate',
      width: '110px',
      sortable: true,
      render: (j) => <span style={{ fontSize: '12px' }}>{j.dueDate}</span>
    },
    {
      header: 'Status',
      accessor: 'status',
      width: '130px',
      align: 'center',
      sortable: true,
      render: (j) => <StatusBadge status={j.status} size="sm" />
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader
        title="Shop Floor Overview"
        description="Real-time active machine station dispatch, batch progress, operator productivity, and floor throughput."
        breadcrumbs={[
          { label: 'Production', path: '/production' },
          { label: 'Shop Floor Overview' }
        ]}
        actions={
          <>
            <Button
              variant="secondary"
              icon={<Layers size={14} />}
              onClick={() => navigate('/production/jobs')}
            >
              All Job Cards ({jobs.length})
            </Button>
            <Button
              variant="primary"
              icon={<PlusCircle size={15} />}
              onClick={() => openQuickAdd('job')}
            >
              + Create Job Card
            </Button>
          </>
        }
      />

      {/* KPI Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
        <SummaryCard
          title="Active Floor Jobs"
          value={activeJobs.length}
          subtitle={`${delayedJobs.length > 0 ? `${delayedJobs.length} delayed` : 'All stations on schedule'}`}
          icon={<Factory size={18} />}
        />
        <SummaryCard
          title="Total Target Output"
          value={`${totalRequired.toLocaleString('en-IN')} pcs`}
          subtitle="Scheduled batch quantity"
          icon={<Layers size={18} />}
        />
        <SummaryCard
          title="Completed Output"
          value={`${totalProduced.toLocaleString('en-IN')} pcs`}
          subtitle={`${Math.round((totalProduced / Math.max(1, totalRequired)) * 100)}% plant completion`}
          icon={<CheckCircle2 size={18} />}
          trend={{ value: `${Math.round((totalProduced / Math.max(1, totalRequired)) * 100)}%`, isPositive: true, label: 'completion' }}
        />
        <SummaryCard
          title="Scrap / Rejection"
          value={`${totalRejected} pcs`}
          subtitle={`${((totalRejected / Math.max(1, totalProduced)) * 100).toFixed(1)}% rejection rate`}
          statusTag={{ label: 'Within Tolerance', variant: 'success' }}
        />
      </div>

      {/* Active Floor Snapshot Table */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              Active Floor Execution ({displayJobs.length} active jobs)
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
              Live progress for jobs currently on CNC Lathes and VMCs
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            icon={<ArrowRight size={14} />}
            onClick={() => navigate('/production/jobs')}
          >
            View Full Job Ledger ({jobs.length})
          </Button>
        </div>

        <DataTable
          data={displayJobs}
          columns={columns}
          searchPlaceholder="Search active floor jobs..."
          onRowClick={(row) => navigate(`/production/jobs/${row.id}`)}
          actions={(row) => (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/production/jobs/${row.id}`);
                }}
                className="btn btn-ghost btn-sm btn-icon-only"
                title="Open Job Card"
              >
                <Eye size={14} style={{ color: 'var(--color-brand-primary)' }} />
              </button>
            </div>
          )}
        />
      </div>
    </div>
  );
};
