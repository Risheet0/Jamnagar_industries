import React, { useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { DataTable } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/StatusBadge';
import { Button } from '../components/common/Button';
import { useNavigation } from '../context/NavigationContext';
import { useProduction } from '../context/ProductionContext';
import { ProductionJob, TableColumn } from '../types';
import { PlusCircle, ArrowLeft, Eye, Factory } from 'lucide-react';

export const ProductionJobsPage: React.FC = () => {
  const { navigate, openQuickAdd } = useNavigation();
  const { jobs } = useProduction();
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredJobs = statusFilter === 'ALL'
    ? jobs
    : jobs.filter(j => j.status === statusFilter);

  // Summary counts — click any card to filter
  const counts = {
    total: jobs.length,
    inProduction: jobs.filter(j => j.status === 'In Production').length,
    qualityCheck: jobs.filter(j => j.status === 'Quality Check').length,
    completed: jobs.filter(j => j.status === 'Completed').length,
    delayed: jobs.filter(j => j.status === 'Delayed').length,
    pending: jobs.filter(j => j.status === 'Pending').length,
  };

  const summaryStats = [
    { label: 'Total Jobs', filterVal: 'ALL',           value: counts.total,        color: '#1e3a8a', bg: '#eff6ff', border: '#bfdbfe' },
    { label: 'In Production', filterVal: 'In Production', value: counts.inProduction, color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd' },
    { label: 'Quality Check', filterVal: 'Quality Check', value: counts.qualityCheck, color: '#7c3aed', bg: '#faf5ff', border: '#e9d5ff' },
    { label: 'Completed',     filterVal: 'Completed',     value: counts.completed,    color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
    { label: 'Delayed',       filterVal: 'Delayed',       value: counts.delayed,      color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
    { label: 'Pending',       filterVal: 'Pending',       value: counts.pending,      color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  ];

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
      header: 'Status & Priority',
      accessor: 'status',
      width: '180px',
      sortable: true,
      render: (j) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'nowrap' }}>
          <StatusBadge status={j.status} size="sm" />
          <StatusBadge
            status={j.priority}
            size="sm"
            showDot={false}
            style={{ fontSize: '10px', padding: '1px 5px', fontWeight: 600 }}
          />
        </div>
      )
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

      {/* Status Summary Bar */}
      <div style={{
        background: 'var(--color-bg-surface-solid)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '8px',
            backgroundColor: 'var(--color-bg-subtle)',
            color: 'var(--color-brand-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--color-border-subtle)',
            flexShrink: 0
          }}>
            <Factory size={22} />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Real-time Production Job Schedule
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
              Tracking {jobs.length} active factory orders, machine routing, and operator assignments.
            </div>
          </div>
        </div>

        <div className="glass-pill-nav" style={{ padding: '4px' }}>
          {summaryStats.map(({ label, filterVal, value, color }) => {
            const isActive = statusFilter === filterVal;
            return (
              <button
                key={filterVal}
                id={`job-filter-${filterVal.replace(/\s+/g, '-').toLowerCase()}`}
                onClick={() => setStatusFilter(filterVal)}
                className={`glass-pill-tab ${isActive ? 'active' : ''}`}
                style={{
                  padding: '6px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                <span>{label}</span>
                <span
                  style={{
                    padding: '2px 6px',
                    borderRadius: '999px',
                    fontSize: '10px',
                    fontWeight: 700,
                    background: isActive ? color : 'rgba(0,0,0,0.06)',
                    color: isActive ? '#ffffff' : 'var(--color-text-secondary)',
                  }}
                >
                  {value}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <DataTable
        data={filteredJobs}
        columns={columns}
        searchPlaceholder="Search jobs by number, customer, product, machine..."
        onRowClick={(row) => navigate(`/production/jobs/${row.id}`)}
        rowBorderAccent={(j) => {
          if (j.priority === 'Critical' || j.status === 'Delayed') return 'var(--color-status-danger-solid)';
          if (j.priority === 'High') return 'var(--color-status-warning-solid)';
          return undefined;
        }}
        toolbarExtra={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Status Filter:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="form-select"
              style={{ width: '160px', padding: '4px 8px', fontSize: '12px' }}
            >
              <option value="ALL">All Statuses ({jobs.length})</option>
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
