import React from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { SummaryCard } from '../components/common/SummaryCard';
import { DataTable } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/StatusBadge';
import { Button } from '../components/common/Button';
import { useNavigation } from '../context/NavigationContext';
import { mockProductionJobs } from '../mock/productionData';
import { ProductionJob, TableColumn } from '../types';
import { Factory, PlusCircle, Eye, Layers, CheckCircle2 } from 'lucide-react';

export const ProductionPage: React.FC = () => {
  const { navigate, openQuickAdd } = useNavigation();

  const totalRequired = mockProductionJobs.reduce((sum, j) => sum + j.requiredQuantity, 0);
  const totalProduced = mockProductionJobs.reduce((sum, j) => sum + j.producedQuantity, 0);
  const totalRejected = mockProductionJobs.reduce((sum, j) => sum + j.rejectedQuantity, 0);
  const activeJobs = mockProductionJobs.filter(j => j.status === 'In Production');

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
        title="Production & Shop Floor Control"
        description="Real-time job card scheduling, machine station dispatch, shift output, and operator productivity."
        breadcrumbs={[
          { label: 'Production' }
        ]}
        actions={
          <>
            <Button
              variant="secondary"
              icon={<Layers size={14} />}
              onClick={() => navigate('/production/jobs')}
            >
              All Job Cards
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
          title="Active Jobs on Floor"
          value={activeJobs.length}
          subtitle="Running on CNC & VMCs"
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
          subtitle={`${Math.round((totalProduced / totalRequired) * 100)}% plant completion`}
          icon={<CheckCircle2 size={18} />}
          trend={{ value: `${Math.round((totalProduced / totalRequired) * 100)}%`, isPositive: true, label: 'completion' }}
        />
        <SummaryCard
          title="Scrap / Rejection"
          value={`${totalRejected} pcs`}
          subtitle={`${((totalRejected / Math.max(1, totalProduced)) * 100).toFixed(1)}% rejection rate`}
          statusTag={{ label: 'Within Tolerance', variant: 'success' }}
        />
      </div>

      {/* Main Jobs Table */}
      <DataTable
        data={mockProductionJobs}
        columns={columns}
        searchPlaceholder="Search job by #, customer, product, operator, machine..."
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
        onAddClick={() => openQuickAdd('job')}
        addLabel="Create Job"
      />
    </div>
  );
};
