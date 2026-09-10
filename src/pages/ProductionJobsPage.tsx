import React, { useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { DataTable } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/StatusBadge';
import { Button } from '../components/common/Button';
import { useNavigation } from '../context/NavigationContext';
import { mockProductionJobs } from '../mock/productionData';
import { ProductionJob, TableColumn } from '../types';
import { PlusCircle, ArrowLeft, Eye } from 'lucide-react';

export const ProductionJobsPage: React.FC = () => {
  const { navigate, openQuickAdd } = useNavigation();
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredJobs = statusFilter === 'ALL'
    ? mockProductionJobs
    : mockProductionJobs.filter(j => j.status === statusFilter);

  const columns: TableColumn<ProductionJob>[] = [
    {
      header: 'Job #',
      accessor: 'jobNumber',
      width: '130px',
      sortable: true,
      render: (j) => <span className="mono-code">{j.jobNumber}</span>
    },
    {
      header: 'Date',
      accessor: 'date',
      width: '100px',
      sortable: true
    },
    {
      header: 'Customer',
      accessor: 'customer',
      sortable: true,
      render: (j) => <span style={{ fontWeight: 600 }}>{j.customer}</span>
    },
    {
      header: 'Product',
      accessor: 'productName',
      sortable: true,
      render: (j) => (
        <div>
          <div>{j.productName}</div>
          <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{j.productCode}</div>
        </div>
      )
    },
    {
      header: 'Assigned Karigar',
      accessor: 'assignedWorker',
      sortable: true,
      render: (j) => (
        <div>
          <div style={{ fontWeight: 500 }}>{j.assignedWorker}</div>
          <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{j.machine}</div>
        </div>
      )
    },
    {
      header: 'Required',
      accessor: 'requiredQuantity',
      align: 'right',
      sortable: true,
      render: (j) => <span className="tabular-nums" style={{ fontWeight: 600 }}>{j.requiredQuantity} pcs</span>
    },
    {
      header: 'Produced',
      accessor: 'producedQuantity',
      align: 'right',
      sortable: true,
      render: (j) => <span className="tabular-nums" style={{ color: 'var(--color-status-success-solid)', fontWeight: 600 }}>{j.producedQuantity} pcs</span>
    },
    {
      header: 'Rejected',
      accessor: 'rejectedQuantity',
      align: 'right',
      sortable: true,
      render: (j) => <span className="tabular-nums" style={{ color: j.rejectedQuantity > 0 ? 'var(--color-status-danger-solid)' : 'var(--color-text-muted)' }}>{j.rejectedQuantity}</span>
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
        title="Production Job Cards Master"
        description="Complete register of factory work orders, machine allocations, batch targets, and due dates."
        breadcrumbs={[
          { label: 'Production', path: '/production' },
          { label: 'Job Cards' }
        ]}
        actions={
          <>
            <Button
              variant="secondary"
              icon={<ArrowLeft size={14} />}
              onClick={() => navigate('/production')}
            >
              Back to Overview
            </Button>
            <Button
              variant="primary"
              icon={<PlusCircle size={15} />}
              onClick={() => openQuickAdd('job')}
            >
              + Create Job
            </Button>
          </>
        }
      />

      <DataTable
        data={filteredJobs}
        columns={columns}
        searchPlaceholder="Search jobs by number, customer, product, machine..."
        onRowClick={(row) => navigate(`/production/jobs/${row.id}`)}
        toolbarExtra={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Status Filter:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="form-select"
              style={{ width: '160px', padding: '4px 8px', fontSize: '12px' }}
            >
              <option value="ALL">All Statuses ({mockProductionJobs.length})</option>
              <option value="In Production">In Production</option>
              <option value="Quality Check">Quality Check</option>
              <option value="Completed">Completed</option>
              <option value="Delayed">Delayed</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        }
        actions={(row) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/production/jobs/${row.id}`);
              }}
              className="btn btn-ghost btn-sm btn-icon-only"
              title="Open Job Card Details"
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
