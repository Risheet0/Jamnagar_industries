import React from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { SummaryCard } from '../components/common/SummaryCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { Button } from '../components/common/Button';
import { useNavigation } from '../context/NavigationContext';
import { mockCompanyProfile } from '../mock/companyData';
import { mockWorkers } from '../mock/workersData';
import { mockMaterials } from '../mock/materialsData';
import { mockProducts } from '../mock/productsData';
import { mockProductionJobs } from '../mock/productionData';
import {
  Users,
  Boxes,
  Cpu,
  Factory,
  AlertTriangle,
  ArrowRight,
  HardHat,
  Plus,
  ArrowDownLeft
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { navigate, openQuickAdd } = useNavigation();

  const totalWorkers = mockWorkers.length;
  const activeWorkers = mockWorkers.filter(w => w.status === 'Active').length;
  const totalMaterials = mockMaterials.length;
  const lowStockMaterials = mockMaterials.filter(m => m.status === 'Low Stock' || m.status === 'Out of Stock');
  const activeJobs = mockProductionJobs.filter(j => j.status === 'In Production');
  const delayedJobs = mockProductionJobs.filter(j => j.status === 'Delayed');

  // Compute total monthly wage payout mock
  const totalMonthlyWage = mockWorkers.reduce((acc, w) => acc + (w.salaryType === 'Daily Wage' ? w.salary * 26 : w.salary), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Page Header */}
      <PageHeader
        title="Plant Operations Dashboard"
        description={`${mockCompanyProfile.name} • ${mockCompanyProfile.location} • Standalone Industrial Control`}
        actions={
          <>
            <Button
              variant="secondary"
              icon={<ArrowDownLeft size={14} />}
              onClick={() => openQuickAdd('inward')}
            >
              Material Inward
            </Button>
            <Button
              variant="primary"
              icon={<Plus size={14} />}
              onClick={() => openQuickAdd('job')}
            >
              Issue Job Card
            </Button>
          </>
        }
      />

      {/* Operational Shift Status Banner */}
      <div
        className="card"
        style={{
          padding: '14px 20px',
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          borderColor: '#334155'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '6px', backgroundColor: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
            <HardHat size={22} />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Current Shift: {mockCompanyProfile.shiftTiming.currentShift}</span>
              <span className="status-badge status-badge-active" style={{ fontSize: '10px' }}>Active</span>
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
              Plant Status: <strong>{mockCompanyProfile.shiftTiming.plantStatus}</strong> • Floor Operators Present: <strong>{activeWorkers} / {totalWorkers}</strong>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: '#cbd5e1' }}>
          <div>
            <span style={{ color: '#94a3b8' }}>GSTIN:</span> <span className="mono-code mono-code-contrast">{mockCompanyProfile.gstNumber}</span>
          </div>
          <div>
            <span style={{ color: '#94a3b8' }}>Est. Monthly Wages:</span> <strong className="tabular-nums" style={{ color: '#38bdf8' }}>₹{totalMonthlyWage.toLocaleString('en-IN')}</strong>
          </div>
        </div>
      </div>

      {/* KPI Summary Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        <SummaryCard
          title="Active Karigars / Workers"
          value={`${activeWorkers} / ${totalWorkers}`}
          subtitle={`${mockWorkers.filter(w => w.status === 'On Leave').length} On Leave, ${mockWorkers.filter(w => w.status === 'Inactive').length} Inactive`}
          icon={<Users size={18} />}
          trend={{ value: '100%', isPositive: true, label: 'turnout' }}
          onClick={() => navigate('/workers')}
        />

        <SummaryCard
          title="Active Production Jobs"
          value={activeJobs.length}
          subtitle={`${delayedJobs.length} delayed / attention needed`}
          icon={<Factory size={18} />}
          statusTag={delayedJobs.length > 0 ? { label: `${delayedJobs.length} Delayed`, variant: 'danger' } : { label: 'On Schedule', variant: 'success' }}
          onClick={() => navigate('/production/jobs')}
        />

        <SummaryCard
          title="Raw Material Items"
          value={totalMaterials}
          subtitle={`${lowStockMaterials.length} items below minimum`}
          icon={<Boxes size={18} />}
          statusTag={lowStockMaterials.length > 0 ? { label: `${lowStockMaterials.length} Low Stock`, variant: 'warning' } : { label: 'Sufficient', variant: 'success' }}
          onClick={() => navigate('/materials')}
        />

        <SummaryCard
          title="Manufactured Products"
          value={mockProducts.length}
          subtitle="Active precision component catalogue"
          icon={<Cpu size={18} />}
          onClick={() => navigate('/products')}
        />
      </div>

      {/* Two Columns: Active Production Floor & Low Stock / Urgent Alerts */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        {/* Left: Active Production Jobs Summary Table */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Factory size={16} style={{ color: 'var(--color-brand-primary)' }} />
              <span>Shop Floor Active Jobs</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={<ArrowRight size={13} />}
              iconPosition="right"
              onClick={() => navigate('/production/jobs')}
            >
              View All Jobs
            </Button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-bg-subtle)', borderBottom: '1px solid var(--color-border-subtle)' }}>
                  <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Job #</th>
                  <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Product</th>
                  <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Assigned Karigar</th>
                  <th style={{ padding: '8px 14px', textAlign: 'right', fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Progress</th>
                  <th style={{ padding: '8px 14px', textAlign: 'center', fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {mockProductionJobs.slice(0, 4).map((job, idx) => {
                  const percent = Math.round((job.producedQuantity / job.requiredQuantity) * 100);

                  return (
                    <tr
                      key={job.id}
                      onClick={() => navigate(`/production/jobs/${job.id}`)}
                      style={{
                        borderBottom: '1px solid var(--color-border-subtle)',
                        cursor: 'pointer',
                        backgroundColor: idx % 2 === 0 ? 'var(--color-bg-surface)' : 'rgba(248, 250, 252, 0.5)'
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? 'var(--color-bg-surface)' : 'rgba(248, 250, 252, 0.5)'}
                    >
                      <td style={{ padding: '10px 14px' }}>
                        <span className="mono-code">{job.jobNumber}</span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{job.productName}</div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{job.customer}</div>
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--color-text-secondary)' }}>
                        <div>{job.assignedWorker}</div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{job.machine}</div>
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                        <div className="tabular-nums" style={{ fontWeight: 600 }}>
                          {job.producedQuantity} / {job.requiredQuantity} pcs
                        </div>
                        <div style={{
                          height: '5px',
                          width: '100%',
                          backgroundColor: 'var(--color-bg-muted)',
                          borderRadius: '3px',
                          overflow: 'hidden',
                          marginTop: '4px'
                        }}>
                          <div style={{
                            height: '100%',
                            width: `${Math.min(100, percent)}%`,
                            backgroundColor: percent >= 100 ? 'var(--color-status-success-solid)' : 'var(--color-brand-primary)'
                          }} />
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <StatusBadge status={job.status} size="sm" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Low Stock & Reorder Alerts */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <div className="card-title">
              <AlertTriangle size={16} style={{ color: 'var(--color-status-warning-solid)' }} />
              <span>Stock Alerts ({lowStockMaterials.length})</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/materials')}
            >
              Stock Master
            </Button>
          </div>

          <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
            {lowStockMaterials.map(mat => (
              <div
                key={mat.id}
                onClick={() => navigate(`/materials/${mat.id}`)}
                style={{
                  padding: '10px 12px',
                  backgroundColor: 'var(--color-bg-subtle)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border-subtle)',
                  cursor: 'pointer',
                  transition: 'border-color 0.1s'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-brand-primary)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border-subtle)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span className="mono-code" style={{ fontSize: '10px' }}>{mat.materialCode}</span>
                  <StatusBadge status={mat.status} size="sm" />
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)', lineHeight: 1.3 }}>
                  {mat.materialName}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  <span>Current: <strong className="tabular-nums" style={{ color: 'var(--color-status-danger-solid)' }}>{mat.currentStock} {mat.unit}</strong></span>
                  <span>Min: <span className="tabular-nums">{mat.minimumStock} {mat.unit}</span></span>
                </div>
              </div>
            ))}

            <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
              <Button
                variant="primary"
                size="sm"
                icon={<ArrowDownLeft size={14} />}
                style={{ width: '100%' }}
                onClick={() => openQuickAdd('inward')}
              >
                + Record Material Inward GRN
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
