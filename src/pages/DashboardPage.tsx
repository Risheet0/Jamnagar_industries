import React from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { SummaryCard } from '../components/common/SummaryCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { Button } from '../components/common/Button';
import { useNavigation } from '../context/NavigationContext';
import { useWorkers } from '../context/WorkerContext';
import { useAttendance, getTodayDateString } from '../context/AttendanceContext';
import { useMaterials } from '../context/MaterialsContext';
import { useProducts } from '../context/ProductsContext';
import { useProduction } from '../context/ProductionContext';
import { useQuality } from '../context/QualityContext';
import { useCompany } from '../context/CompanyContext';
import {
  Users,
  Boxes,
  Cpu,
  Factory,
  AlertTriangle,
  ArrowRight,
  HardHat,
  Plus,
  ArrowDownLeft,
  ShieldAlert,
  Clock,
  CheckCircle2
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { navigate, openQuickAdd } = useNavigation();
  const { workers } = useWorkers();
  const { getPresentCountForDate, getAbsentCountForDate, getDaySummary } = useAttendance();
  const { materials } = useMaterials();
  const { products } = useProducts();
  const { jobs } = useProduction();
  const { inspections } = useQuality();
  const { companyProfile } = useCompany();

  const todayStr = getTodayDateString();
  const totalWorkers = workers.length;
  const activeWorkers = workers.filter(w => w.status === 'Active').length;
  const onLeaveWorkers = workers.filter(w => w.status === 'On Leave').length;
  const inactiveWorkers = workers.filter(w => w.status === 'Inactive').length;
  const presentWorkers = getPresentCountForDate(todayStr);
  const absentWorkers = getAbsentCountForDate(todayStr, workers);
  const daySummary = getDaySummary(todayStr, workers.filter(w => w.status === 'Active'));

  const totalMaterials = materials.length;
  const lowStockMaterials = materials.filter(m => m.status === 'Low Stock' || m.status === 'Out of Stock');

  const activeJobs = jobs.filter(j => j.status === 'In Production');
  const delayedJobs = jobs.filter(j => j.status === 'Delayed');
  const completedJobs = jobs.filter(j => j.status === 'Completed');

  // Compute On-time rate
  const finishedOrDelayed = completedJobs.length + delayedJobs.length;
  const otdPercent = finishedOrDelayed > 0 ? Math.round((completedJobs.length / finishedOrDelayed) * 100) : 100;

  // Recent Quality issues count
  const failInspections = inspections.filter(i => i.result === 'Fail');

  // Total issues needing immediate management attention
  const attentionItemsCount =
    lowStockMaterials.length +
    delayedJobs.length +
    absentWorkers +
    failInspections.length;

  // Compute total monthly wage payout
  const totalMonthlyWage = workers.reduce(
    (acc, w) =>
      acc +
      (w.salaryType === 'Daily Wage'
        ? w.salary * 26
        : w.salaryType === 'Hourly Rate'
        ? w.salary * 8 * 26
        : w.salary),
    0
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Page Header */}
      <PageHeader
        title="Plant Operations Dashboard"
        description={`${companyProfile.name} • ${companyProfile.location} • Standalone Industrial Control`}
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
              <span>Current Shift: {companyProfile.shiftTiming.currentShift}</span>
              <StatusBadge status="Active" size="sm" icon={true} />
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
              Plant Status: <strong>{companyProfile.shiftTiming.plantStatus}</strong> • Floor Operators Present Today: <strong className="tabular-nums" style={{ color: '#38bdf8' }}>{presentWorkers} / {activeWorkers} Active</strong> ({totalWorkers} on roster)
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: '#cbd5e1', flexWrap: 'wrap' }}>
          <div>
            <span style={{ color: '#94a3b8' }}>GSTIN:</span> <span className="mono-code mono-code-contrast">{companyProfile.gstNumber}</span>
          </div>
          <div>
            <span style={{ color: '#94a3b8' }}>Est. Monthly Wages:</span> <strong className="tabular-nums" style={{ color: '#38bdf8' }}>₹{totalMonthlyWage.toLocaleString('en-IN')}</strong>
          </div>
          {failInspections.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-status-danger-solid)' }}>
              <ShieldAlert size={14} />
              <span><strong>{failInspections.length}</strong> Open QC NCRs</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Today's Attendance Summary Widget ── */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={16} style={{ color: 'var(--color-brand-primary)' }} />
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)' }}>Today's Attendance</span>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>{todayStr}</span>
          </div>
          <button
            onClick={() => navigate(`/attendance/day/${todayStr}`)}
            style={{ background: 'none', border: 'none', fontSize: '11px', color: 'var(--color-brand-primary)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            Mark Attendance <ArrowRight size={11} />
          </button>
        </div>

        {/* Attendance stat pills */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginBottom: '12px' }}>
          {[
            { label: 'Present', value: daySummary.present, color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
            { label: 'Half Day', value: daySummary.halfDay, color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
            { label: 'Absent', value: daySummary.absent, color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
            { label: 'On Leave', value: daySummary.onLeave, color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd' },
            { label: 'Not Marked', value: daySummary.notMarked, color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
          ].map(({ label, value, color, bg, border }) => (
            <div key={label} style={{ padding: '10px 8px', background: bg, border: `1px solid ${border}`, borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 700, color, lineHeight: 1, fontFamily: 'monospace' }}>{value}</div>
              <div style={{ fontSize: '10px', fontWeight: 600, color: color + 'bb', marginTop: '3px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Attendance progress bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
            <span>Attendance Rate</span>
            <span style={{ fontWeight: 600, color: daySummary.totalWorkers > 0 && (daySummary.present / daySummary.totalWorkers) >= 0.8 ? '#059669' : '#d97706' }}>
              {daySummary.totalWorkers > 0 ? Math.round((daySummary.present / daySummary.totalWorkers) * 100) : 0}% present
            </span>
          </div>
          <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '9px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${daySummary.totalWorkers > 0 ? (daySummary.present / daySummary.totalWorkers) * 100 : 0}%`,
              background: 'linear-gradient(90deg, #059669, #34d399)',
              borderRadius: '9px',
              transition: 'width 600ms ease'
            }} />
          </div>
        </div>
      </div>

      {/* ZONE 1: NEEDS ATTENTION (Health-First) */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: attentionItemsCount > 0 ? 'var(--color-status-danger-solid)' : 'var(--color-status-success-solid)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {attentionItemsCount > 0 ? (
              <>
                <AlertTriangle size={16} />
                <span>Needs Immediate Attention ({attentionItemsCount})</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />
                <span>Plant Health: All Systems Normal</span>
              </>
            )}
          </div>
          {attentionItemsCount > 0 && (
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
              Prioritized operational alerts requiring supervisor action
            </span>
          )}
        </div>

        {attentionItemsCount === 0 ? (
          <div
            className="card"
            style={{
              padding: '16px 20px',
              borderLeft: '4px solid var(--color-status-success-solid)',
              backgroundColor: 'var(--color-status-success-bg)',
              display: 'flex',
              alignItems: 'center',
              gap: '14px'
            }}
          >
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(22, 163, 74, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-status-success-solid)', flexShrink: 0 }}>
              <CheckCircle2 size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--color-status-success-text)', fontSize: '14px' }}>
                All Plant Operations Healthy & On Track
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                Raw materials are above safety thresholds, 100% active karigars clocked in today, all production jobs on schedule, and zero active quality rejections.
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            {lowStockMaterials.length > 0 && (
              <SummaryCard
                title="Low Stock Materials"
                value={`${lowStockMaterials.length} Items`}
                subtitle="Below minimum safety buffer"
                icon={<Boxes size={18} />}
                statusTag={{ label: 'Restock Required', variant: 'warning' }}
                onClick={() => navigate('/materials/stock')}
              />
            )}

            {delayedJobs.length > 0 && (
              <SummaryCard
                title="Delayed Production Jobs"
                value={`${delayedJobs.length} Jobs`}
                subtitle="Behind committed deadline"
                icon={<Factory size={18} />}
                statusTag={{ label: 'Critical Delay', variant: 'danger' }}
                onClick={() => navigate('/production/jobs')}
              />
            )}

            {absentWorkers > 0 && (
              <SummaryCard
                title="Absent Floor Karigars"
                value={`${absentWorkers} Absent`}
                subtitle={`${presentWorkers} of ${activeWorkers} active present`}
                icon={<Users size={18} />}
                statusTag={{ label: 'Shift Gap', variant: 'danger' }}
                onClick={() => navigate(`/attendance/day/${todayStr}`)}
              />
            )}

            {failInspections.length > 0 && (
              <SummaryCard
                title="Quality Non-Conformances"
                value={`${failInspections.length} Batches`}
                subtitle="Failed QC stage inspection"
                icon={<ShieldAlert size={18} />}
                statusTag={{ label: 'Action Required', variant: 'danger' }}
                onClick={() => navigate('/quality')}
              />
            )}
          </div>
        )}
      </section>

      {/* ZONE 2: OPERATIONS OVERVIEW (Neutral Totals) */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Operations Overview & Capacity
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px' }}>
          <SummaryCard
            title="Total Active Workforce"
            value={`${activeWorkers}`}
            subtitle={`${totalWorkers} total roster (${onLeaveWorkers} leave, ${inactiveWorkers} inactive)`}
            icon={<Users size={18} />}
            trend={{ value: `${totalWorkers > 0 ? Math.round((activeWorkers / totalWorkers) * 100) : 100}%`, isPositive: true, label: 'employed' }}
            onClick={() => navigate('/workers')}
          />

          <SummaryCard
            title="Active Production Jobs"
            value={activeJobs.length}
            subtitle={`${completedJobs.length} batches completed`}
            icon={<Factory size={18} />}
            onClick={() => navigate('/production/jobs')}
          />

          <SummaryCard
            title="Raw Material Items"
            value={totalMaterials}
            subtitle="Brass, Copper, SS & MS master stock"
            icon={<Boxes size={18} />}
            onClick={() => navigate('/materials')}
          />

          <SummaryCard
            title="Manufactured Catalogue"
            value={products.length}
            subtitle="Precision turned brass parts"
            icon={<Cpu size={18} />}
            onClick={() => navigate('/products')}
          />

          <SummaryCard
            title="On-Time Delivery (OTD)"
            value={`${otdPercent}%`}
            subtitle="Batch dispatch reliability rate"
            icon={<Clock size={18} />}
            statusTag={otdPercent >= 90 ? { label: 'Optimal', variant: 'success' } : { label: 'Attention', variant: 'warning' }}
            onClick={() => navigate('/reports')}
          />
        </div>
      </section>

      {/* ── ZONE 2.5: INTERACTIVE VISUAL ANALYTICS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {/* 1. Production Target vs Output Visualizer */}
        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Factory size={16} style={{ color: 'var(--color-brand-primary)' }} />
              <span style={{ fontSize: '13px', fontWeight: 700 }}>Production Floor Target vs. Output</span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>Active Batches</span>
          </div>

          {jobs.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {jobs.slice(0, 4).map(j => {
                const pct = Math.min(100, Math.round((j.producedQuantity / Math.max(1, j.requiredQuantity)) * 100));
                const isDelayed = j.status === 'Delayed';
                const isCompleted = j.status === 'Completed' || pct >= 100;
                const barColor = isCompleted ? '#059669' : isDelayed ? '#dc2626' : '#1e3a8a';

                return (
                  <div key={j.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{j.productName} (<span className="mono-code" style={{ fontSize: '10px' }}>{j.jobNumber}</span>)</span>
                      <span className="tabular-nums" style={{ color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                        {j.producedQuantity} / {j.requiredQuantity} pcs ({pct}%)
                      </span>
                    </div>
                    <div style={{ height: '8px', width: '100%', backgroundColor: 'var(--color-bg-muted)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, backgroundColor: barColor, borderRadius: '4px', transition: 'width 0.4s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', textAlign: 'center', padding: '16px' }}>
              No production jobs currently active.
            </div>
          )}
        </div>

        {/* 2. Quality Defect Root-Cause Breakdown */}
        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={16} style={{ color: '#dc2626' }} />
              <span style={{ fontSize: '13px', fontWeight: 700 }}>Quality & Scrap Root Cause Distribution</span>
            </div>
            <button
              onClick={() => navigate('/quality')}
              style={{ background: 'none', border: 'none', fontSize: '11px', color: 'var(--color-brand-primary)', fontWeight: 600, cursor: 'pointer' }}
            >
              QC Audit →
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { cause: 'Burr / Flash Edge', count: 4, share: 40, color: '#ef4444' },
              { cause: 'Thread Pitch Damage', count: 3, share: 30, color: '#f59e0b' },
              { cause: 'OD/ID Dimension Variance', count: 2, share: 20, color: '#3b82f6' },
              { cause: 'Tool Chatter Marks', count: 1, share: 10, color: '#8b5cf6' }
            ].map(item => (
              <div key={item.cause} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px' }}>
                <span style={{ width: '150px', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.cause}
                </span>
                <div style={{ flex: 1, height: '7px', backgroundColor: 'var(--color-bg-muted)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${item.share}%`, backgroundColor: item.color, borderRadius: '4px' }} />
                </div>
                <span className="tabular-nums" style={{ width: '50px', textAlign: 'right', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {item.share}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Raw Material Stock Health Distribution */}
        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Boxes size={16} style={{ color: '#0284c7' }} />
              <span style={{ fontSize: '13px', fontWeight: 700 }}>Inventory Health Distribution</span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{totalMaterials} Items</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', textAlign: 'center', marginBottom: '14px' }}>
            <div style={{ padding: '8px', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '6px' }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#059669', fontFamily: 'monospace' }}>
                {materials.filter(m => m.status === 'In Stock').length}
              </div>
              <div style={{ fontSize: '10px', fontWeight: 600, color: '#065f46', textTransform: 'uppercase' }}>In Stock</div>
            </div>
            <div style={{ padding: '8px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px' }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#d97706', fontFamily: 'monospace' }}>
                {materials.filter(m => m.status === 'Low Stock').length}
              </div>
              <div style={{ fontSize: '10px', fontWeight: 600, color: '#92400e', textTransform: 'uppercase' }}>Low Stock</div>
            </div>
            <div style={{ padding: '8px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px' }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#dc2626', fontFamily: 'monospace' }}>
                {materials.filter(m => m.status === 'Out of Stock').length}
              </div>
              <div style={{ fontSize: '10px', fontWeight: 600, color: '#991b1b', textTransform: 'uppercase' }}>Critical Out</div>
            </div>
          </div>

          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Buffer Safety Level</span>
            <span style={{ fontWeight: 600, color: lowStockMaterials.length === 0 ? '#059669' : '#d97706' }}>
              {lowStockMaterials.length === 0 ? '100% Protected' : `${lowStockMaterials.length} Items Need Purchase GRN`}
            </span>
          </div>
        </div>
      </div>


      {/* Two Columns: Active Production Floor & Low Stock / Urgent Alerts */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        {/* Left: Active Production Jobs Summary Table */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Factory size={16} style={{ color: 'var(--color-brand-primary)' }} />
              <span>Shop Floor Active Jobs ({jobs.length})</span>
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
                {jobs.slice(0, 5).map((job, idx) => {
                  const percent = Math.round((job.producedQuantity / Math.max(1, job.requiredQuantity)) * 100);

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
                            backgroundColor: percent >= 100 ? 'var(--color-status-success-solid)' : job.status === 'Delayed' ? 'var(--color-status-danger-solid)' : 'var(--color-brand-primary)'
                          }} />
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <StatusBadge status={job.status} size="sm" icon={true} />
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
              onClick={() => navigate('/materials/stock')}
            >
              Stock Master
            </Button>
          </div>

          <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
            {lowStockMaterials.length > 0 ? (
              lowStockMaterials.slice(0, 4).map(mat => (
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
                    <StatusBadge status={mat.status} size="sm" icon={true} />
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)', lineHeight: 1.3 }}>
                    {mat.materialName}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                    <span>Current: <strong className="tabular-nums" style={{ color: 'var(--color-status-danger-solid)' }}>{mat.currentStock} {mat.unit}</strong></span>
                    <span>Min: <span className="tabular-nums">{mat.minimumStock} {mat.unit}</span></span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                All inventory items are within healthy safety stock levels.
              </div>
            )}

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
