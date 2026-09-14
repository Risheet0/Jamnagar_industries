import React, { useState, useMemo } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { SummaryCard } from '../components/common/SummaryCard';
import { Button } from '../components/common/Button';
import { StatusBadge } from '../components/common/StatusBadge';
import { useWorkers } from '../context/WorkerContext';
import { useMaterials } from '../context/MaterialsContext';
import { useQuality } from '../context/QualityContext';
import { useProduction } from '../context/ProductionContext';
import { exportToCsv } from '../utils/exportCsv';
import {
  BarChart3,
  Download,
  Calendar,
  HardHat,
  Boxes,
  Clock,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { workers } = useWorkers();
  const { materials, stockMovements } = useMaterials();
  const { inspections } = useQuality();
  const { jobs } = useProduction();

  const todayStr = new Date().toISOString().split('T')[0];
  const firstDayOfMonthStr = `${todayStr.slice(0, 7)}-01`;

  const [startDate, setStartDate] = useState<string>(firstDayOfMonthStr);
  const [endDate, setEndDate] = useState<string>(todayStr);

  const isDateInRange = (dateStr?: string): boolean => {
    if (!dateStr) return true;
    if (startDate && dateStr < startDate) return false;
    if (endDate && dateStr > endDate) return false;
    return true;
  };

  // 1. Production Jobs in range
  const filteredJobs = useMemo(() => {
    return jobs.filter(j => isDateInRange(j.date) || isDateInRange(j.dueDate));
  }, [jobs, startDate, endDate]);

  const totalRequiredPieces = filteredJobs.reduce((acc, j) => acc + (j.requiredQuantity || 0), 0);
  const totalProducedPieces = filteredJobs.reduce((acc, j) => acc + (j.producedQuantity || 0), 0);
  const productionCompletionPct = totalRequiredPieces > 0 ? Math.round((totalProducedPieces / totalRequiredPieces) * 100) : 0;

  // 2. Karigar Wage Sheet Data
  const workerPayoutData = useMemo(() => {
    return workers.map(w => {
      // Find jobs assigned to this worker
      const assignedJobs = jobs.filter(
        j => j.assignedWorkerId === w.id || j.assignedWorkerId === w.workerId || (j.assignedWorker && j.assignedWorker.includes(w.name))
      );
      const totalPiecesProduced = assignedJobs.reduce((acc, j) => acc + j.producedQuantity, 0);

      let estimatedMonthlyPay = w.salary;
      let payFormula = `${w.salaryType}: ₹${w.salary.toLocaleString('en-IN')}`;

      if (w.salaryType === 'Daily Wage') {
        estimatedMonthlyPay = w.salary * 26; // 26 working days
        payFormula = `₹${w.salary}/day × 26 days`;
      } else if (w.salaryType === 'Piece Rate (Karigar)') {
        // If worker has custom notes with rate or use base salary
        estimatedMonthlyPay = w.salary > 0 ? w.salary : totalPiecesProduced * 1.5;
        payFormula = `Base / ₹${w.salary.toLocaleString('en-IN')} + piece output (${totalPiecesProduced} pcs)`;
      }

      return {
        id: w.id,
        workerId: w.workerId,
        name: w.name,
        department: w.department,
        skill: w.skill,
        salaryType: w.salaryType,
        baseRate: w.salary,
        overtimeRate: w.overtimeRate || Math.round(w.salary / (26 * 8) * 1.5),
        piecesMade: totalPiecesProduced,
        estimatedPay: estimatedMonthlyPay,
        payFormula,
        status: w.status
      };
    });
  }, [workers]);

  const totalEstimatedWagePayout = workerPayoutData.reduce((acc, w) => acc + w.estimatedPay, 0);

  // 3. Material Consumption Ratio Data
  const materialConsumptionData = useMemo(() => {
    const movementsInRange = stockMovements.filter(m => isDateInRange(m.date));

    return materials.map(mat => {
      const inwardSum = movementsInRange
        .filter(m => (m.materialId === mat.id || m.materialCode === mat.materialCode) && m.type === 'Inward')
        .reduce((acc, m) => acc + m.quantity, 0);

      const outwardSum = movementsInRange
        .filter(m => (m.materialId === mat.id || m.materialCode === mat.materialCode) && m.type === 'Outward')
        .reduce((acc, m) => acc + m.quantity, 0);

      const netDelta = inwardSum - outwardSum;
      const consumptionRatioPct = inwardSum > 0 ? Math.round((outwardSum / inwardSum) * 100) : (outwardSum > 0 ? 100 : 0);

      return {
        id: mat.id,
        materialCode: mat.materialCode,
        materialName: mat.materialName,
        unit: mat.unit,
        currentStock: mat.currentStock,
        minimumStock: mat.minimumStock,
        unitPrice: mat.unitPrice,
        inwardQty: inwardSum,
        outwardQty: outwardSum,
        netDelta,
        consumptionRatioPct,
        stockValue: mat.currentStock * mat.unitPrice
      };
    });
  }, [materials, stockMovements, startDate, endDate]);

  // 4. On-Time Delivery (OTD) Tracking
  const otdData = useMemo(() => {
    const completed = filteredJobs.filter(j => j.status === 'Completed');
    const delayed = filteredJobs.filter(j => j.status === 'Delayed');
    const inProduction = filteredJobs.filter(j => j.status === 'In Production');

    const onTimeCount = completed.length;
    const delayedCount = delayed.length;
    const totalFinishedOrDue = onTimeCount + delayedCount;
    const otdRate = totalFinishedOrDue > 0 ? Math.round((onTimeCount / totalFinishedOrDue) * 100) : 100;

    return {
      completed,
      delayed,
      inProduction,
      onTimeCount,
      delayedCount,
      otdRate
    };
  }, [filteredJobs]);

  // Export handlers
  const handleExportProductionCsv = () => {
    exportToCsv(
      filteredJobs.map(j => ({
        'Job Number': j.jobNumber,
        'Date': j.date,
        'Customer': j.customer,
        'Product Code': j.productCode,
        'Product Name': j.productName,
        'Required Qty': j.requiredQuantity,
        'Produced Qty': j.producedQuantity,
        'Rejected Qty': j.rejectedQuantity,
        'Assigned Worker': j.assignedWorker,
        'Machine': j.machine,
        'Due Date': j.dueDate,
        'Status': j.status,
        'Priority': j.priority
      })),
      [
        { header: 'Job Number', accessor: 'Job Number' },
        { header: 'Date', accessor: 'Date' },
        { header: 'Customer', accessor: 'Customer' },
        { header: 'Product Code', accessor: 'Product Code' },
        { header: 'Product Name', accessor: 'Product Name' },
        { header: 'Required Qty', accessor: 'Required Qty' },
        { header: 'Produced Qty', accessor: 'Produced Qty' },
        { header: 'Rejected Qty', accessor: 'Rejected Qty' },
        { header: 'Assigned Worker', accessor: 'Assigned Worker' },
        { header: 'Machine', accessor: 'Machine' },
        { header: 'Due Date', accessor: 'Due Date' },
        { header: 'Status', accessor: 'Status' }
      ],
      `production-summary-report-${todayStr}.csv`
    );
  };

  const handleExportWageCsv = () => {
    exportToCsv(
      workerPayoutData.map(w => ({
        'Worker ID': w.workerId,
        'Name': w.name,
        'Department': w.department,
        'Skill': w.skill,
        'Salary Type': w.salaryType,
        'Base Rate (INR)': w.baseRate,
        'Estimated Overtime Rate/hr': w.overtimeRate,
        'Pieces Made': w.piecesMade,
        'Estimated Monthly Pay (INR)': w.estimatedPay,
        'Status': w.status
      })),
      [
        { header: 'Worker ID', accessor: 'Worker ID' },
        { header: 'Name', accessor: 'Name' },
        { header: 'Department', accessor: 'Department' },
        { header: 'Skill', accessor: 'Skill' },
        { header: 'Salary Type', accessor: 'Salary Type' },
        { header: 'Base Rate (INR)', accessor: 'Base Rate (INR)' },
        { header: 'Estimated Overtime Rate/hr', accessor: 'Estimated Overtime Rate/hr' },
        { header: 'Pieces Made', accessor: 'Pieces Made' },
        { header: 'Estimated Monthly Pay (INR)', accessor: 'Estimated Monthly Pay (INR)' },
        { header: 'Status', accessor: 'Status' }
      ],
      `karigar-wage-sheet-${todayStr}.csv`
    );
  };

  const handleExportMaterialCsv = () => {
    exportToCsv(
      materialConsumptionData.map(m => ({
        'Material Code': m.materialCode,
        'Material Name': m.materialName,
        'Unit': m.unit,
        'Current Stock': m.currentStock,
        'Min Stock': m.minimumStock,
        'Unit Rate (INR)': m.unitPrice,
        'Inward Qty (Period)': m.inwardQty,
        'Outward Issued (Period)': m.outwardQty,
        'Net Stock Delta': m.netDelta,
        'Consumption Rate %': `${m.consumptionRatioPct}%`,
        'Total Valuation (INR)': m.stockValue
      })),
      [
        { header: 'Material Code', accessor: 'Material Code' },
        { header: 'Material Name', accessor: 'Material Name' },
        { header: 'Unit', accessor: 'Unit' },
        { header: 'Current Stock', accessor: 'Current Stock' },
        { header: 'Min Stock', accessor: 'Min Stock' },
        { header: 'Unit Rate (INR)', accessor: 'Unit Rate (INR)' },
        { header: 'Inward Qty (Period)', accessor: 'Inward Qty (Period)' },
        { header: 'Outward Issued (Period)', accessor: 'Outward Issued (Period)' },
        { header: 'Net Stock Delta', accessor: 'Net Stock Delta' },
        { header: 'Consumption Rate %', accessor: 'Consumption Rate %' },
        { header: 'Total Valuation (INR)', accessor: 'Total Valuation (INR)' }
      ],
      `material-consumption-report-${todayStr}.csv`
    );
  };

  const handleExportOtdCsv = () => {
    exportToCsv(
      filteredJobs.map(j => ({
        'Job #': j.jobNumber,
        'Customer': j.customer,
        'Product': j.productName,
        'Due Date': j.dueDate,
        'Produced / Required': `${j.producedQuantity} / ${j.requiredQuantity}`,
        'Status': j.status,
        'Delivery Status': j.status === 'Completed' ? 'Delivered On-Time' : j.status === 'Delayed' ? 'Delayed' : 'In Progress'
      })),
      [
        { header: 'Job #', accessor: 'Job #' },
        { header: 'Customer', accessor: 'Customer' },
        { header: 'Product', accessor: 'Product' },
        { header: 'Due Date', accessor: 'Due Date' },
        { header: 'Produced / Required', accessor: 'Produced / Required' },
        { header: 'Status', accessor: 'Status' },
        { header: 'Delivery Status', accessor: 'Delivery Status' }
      ],
      `otd-delivery-tracking-${todayStr}.csv`
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader
        title="Industrial Reports & Production Analytics"
        description="Offline analytics engine for shop floor output, Karigar wage payout ledgers, raw material consumption, and on-time delivery metrics."
        breadcrumbs={[
          { label: 'Reports' }
        ]}
      />

      {/* Date Range Filter Bar */}
      <div
        className="card"
        style={{
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          backgroundColor: 'var(--color-bg-subtle)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Calendar size={16} style={{ color: 'var(--color-brand-primary)' }} />
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            Report Period Filter:
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>From:</span>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="form-input"
              style={{ padding: '4px 8px', fontSize: '12px', width: '135px' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>To:</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="form-input"
              style={{ padding: '4px 8px', fontSize: '12px', width: '135px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setStartDate(firstDayOfMonthStr);
                setEndDate(todayStr);
              }}
            >
              This Month
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
            >
              All Time
            </Button>
          </div>
        </div>
      </div>

      {/* Top Level Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <SummaryCard
          title="Total Component Output"
          value={`${totalProducedPieces.toLocaleString('en-IN')} pcs`}
          subtitle={`${productionCompletionPct}% of required ${totalRequiredPieces.toLocaleString('en-IN')} pcs`}
          icon={<TrendingUp size={18} />}
          trend={{ value: `${productionCompletionPct}%`, isPositive: true, label: 'target' }}
        />
        <SummaryCard
          title="Estimated Monthly Wages"
          value={`₹${totalEstimatedWagePayout.toLocaleString('en-IN')}`}
          subtitle={`${workers.length} active operators & karigars`}
          icon={<HardHat size={18} />}
        />
        <SummaryCard
          title="On-Time Delivery (OTD)"
          value={`${otdData.otdRate}%`}
          subtitle={`${otdData.onTimeCount} on-time, ${otdData.delayedCount} delayed`}
          icon={<Clock size={18} />}
          statusTag={otdData.otdRate >= 90 ? { label: 'Optimal', variant: 'success' } : { label: 'Needs Followup', variant: 'warning' }}
        />
        <SummaryCard
          title="QC Inspection Pass Rate"
          value={`${inspections.length > 0 ? Math.round((inspections.filter(i => i.result === 'Pass').length / inspections.length) * 100) : 100}%`}
          subtitle={`${inspections.length} total quality audits logged`}
          icon={<ShieldCheck size={18} />}
        />
      </div>

      {/* SECTION 1: Production Summary Report */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <BarChart3 size={16} style={{ color: 'var(--color-brand-primary)' }} />
            <span>1. Shop Floor Production Yield Summary</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            icon={<Download size={13} />}
            onClick={handleExportProductionCsv}
          >
            Export CSV
          </Button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-bg-subtle)', borderBottom: '1px solid var(--color-border-default)' }}>
                <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Job #</th>
                <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Product</th>
                <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Customer</th>
                <th style={{ padding: '8px 14px', textAlign: 'right', fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Required</th>
                <th style={{ padding: '8px 14px', textAlign: 'right', fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Produced</th>
                <th style={{ padding: '8px 14px', textAlign: 'right', fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Rejected</th>
                <th style={{ padding: '8px 14px', textAlign: 'center', fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Progress</th>
                <th style={{ padding: '8px 14px', textAlign: 'center', fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.map((job, idx) => {
                const pct = Math.round((job.producedQuantity / job.requiredQuantity) * 100);
                return (
                  <tr key={job.id} style={{ borderBottom: '1px solid var(--color-border-subtle)', backgroundColor: idx % 2 === 0 ? '#fff' : 'rgba(248, 250, 252, 0.5)' }}>
                    <td style={{ padding: '8px 14px' }}><span className="mono-code">{job.jobNumber}</span></td>
                    <td style={{ padding: '8px 14px', fontWeight: 600 }}>{job.productName}</td>
                    <td style={{ padding: '8px 14px', color: 'var(--color-text-secondary)' }}>{job.customer}</td>
                    <td style={{ padding: '8px 14px', textAlign: 'right' }} className="tabular-nums">{job.requiredQuantity}</td>
                    <td style={{ padding: '8px 14px', textAlign: 'right', fontWeight: 600, color: 'var(--color-status-success-solid)' }} className="tabular-nums">{job.producedQuantity}</td>
                    <td style={{ padding: '8px 14px', textAlign: 'right', color: job.rejectedQuantity > 0 ? 'var(--color-status-danger-solid)' : 'var(--color-text-muted)' }} className="tabular-nums">{job.rejectedQuantity}</td>
                    <td style={{ padding: '8px 14px', textAlign: 'center' }}>
                      <span className="tabular-nums" style={{ fontSize: '12px', fontWeight: 600 }}>{pct}%</span>
                    </td>
                    <td style={{ padding: '8px 14px', textAlign: 'center' }}>
                      <StatusBadge status={job.status} size="sm" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: Karigar Wage Payout Sheet */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <HardHat size={16} style={{ color: 'var(--color-brand-primary)' }} />
            <span>2. Karigar & Worker Wage Payout Sheet</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            icon={<Download size={13} />}
            onClick={handleExportWageCsv}
          >
            Export CSV
          </Button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-bg-subtle)', borderBottom: '1px solid var(--color-border-default)' }}>
                <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Worker ID</th>
                <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Karigar Name</th>
                <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Skill / Dept</th>
                <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Salary Structure</th>
                <th style={{ padding: '8px 14px', textAlign: 'right', fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Base Rate</th>
                <th style={{ padding: '8px 14px', textAlign: 'right', fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>OT Rate/hr</th>
                <th style={{ padding: '8px 14px', textAlign: 'right', fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Est. Monthly Pay</th>
                <th style={{ padding: '8px 14px', textAlign: 'center', fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {workerPayoutData.map((w, idx) => (
                <tr key={w.id} style={{ borderBottom: '1px solid var(--color-border-subtle)', backgroundColor: idx % 2 === 0 ? '#fff' : 'rgba(248, 250, 252, 0.5)' }}>
                  <td style={{ padding: '8px 14px' }}><span className="mono-code">{w.workerId}</span></td>
                  <td style={{ padding: '8px 14px', fontWeight: 600 }}>{w.name}</td>
                  <td style={{ padding: '8px 14px', color: 'var(--color-text-secondary)' }}>{w.skill} • {w.department}</td>
                  <td style={{ padding: '8px 14px' }}>
                    <span style={{ fontSize: '12px' }}>{w.salaryType}</span>
                  </td>
                  <td style={{ padding: '8px 14px', textAlign: 'right' }} className="tabular-nums">₹{w.baseRate.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '8px 14px', textAlign: 'right', color: 'var(--color-text-secondary)' }} className="tabular-nums">₹{w.overtimeRate}/hr</td>
                  <td style={{ padding: '8px 14px', textAlign: 'right', fontWeight: 700, color: 'var(--color-brand-primary)' }} className="tabular-nums">
                    ₹{w.estimatedPay.toLocaleString('en-IN')}
                  </td>
                  <td style={{ padding: '8px 14px', textAlign: 'center' }}>
                    <StatusBadge status={w.status} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ backgroundColor: 'var(--color-bg-subtle)', fontWeight: 700, borderTop: '2px solid var(--color-border-default)' }}>
                <td colSpan={6} style={{ padding: '10px 14px', textAlign: 'right' }}>Total Factory Monthly Wage Liability:</td>
                <td style={{ padding: '10px 14px', textAlign: 'right', color: 'var(--color-brand-primary)', fontSize: '14px' }} className="tabular-nums">
                  ₹{totalEstimatedWagePayout.toLocaleString('en-IN')}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* SECTION 3: Material Consumption Ratio */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Boxes size={16} style={{ color: 'var(--color-brand-primary)' }} />
            <span>3. Raw Material Inward vs Consumption Ratio</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            icon={<Download size={13} />}
            onClick={handleExportMaterialCsv}
          >
            Export CSV
          </Button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-bg-subtle)', borderBottom: '1px solid var(--color-border-default)' }}>
                <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Code</th>
                <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Material</th>
                <th style={{ padding: '8px 14px', textAlign: 'right', fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>In-Stock</th>
                <th style={{ padding: '8px 14px', textAlign: 'right', fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Inward (GRN)</th>
                <th style={{ padding: '8px 14px', textAlign: 'right', fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Outward Issued</th>
                <th style={{ padding: '8px 14px', textAlign: 'right', fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Net Delta</th>
                <th style={{ padding: '8px 14px', textAlign: 'right', fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Inventory Valuation</th>
              </tr>
            </thead>
            <tbody>
              {materialConsumptionData.map((m, idx) => (
                <tr key={m.id} style={{ borderBottom: '1px solid var(--color-border-subtle)', backgroundColor: idx % 2 === 0 ? '#fff' : 'rgba(248, 250, 252, 0.5)' }}>
                  <td style={{ padding: '8px 14px' }}><span className="mono-code">{m.materialCode}</span></td>
                  <td style={{ padding: '8px 14px', fontWeight: 600 }}>{m.materialName}</td>
                  <td style={{ padding: '8px 14px', textAlign: 'right' }} className="tabular-nums">{m.currentStock} {m.unit}</td>
                  <td style={{ padding: '8px 14px', textAlign: 'right', color: 'var(--color-status-success-solid)' }} className="tabular-nums">+{m.inwardQty} {m.unit}</td>
                  <td style={{ padding: '8px 14px', textAlign: 'right', color: 'var(--color-status-danger-solid)' }} className="tabular-nums">-{m.outwardQty} {m.unit}</td>
                  <td style={{ padding: '8px 14px', textAlign: 'right', fontWeight: 600 }} className="tabular-nums">
                    <span style={{ color: m.netDelta >= 0 ? 'var(--color-status-success-solid)' : 'var(--color-status-danger-solid)' }}>
                      {m.netDelta >= 0 ? `+${m.netDelta}` : m.netDelta} {m.unit}
                    </span>
                  </td>
                  <td style={{ padding: '8px 14px', textAlign: 'right', fontWeight: 600 }} className="tabular-nums">
                    ₹{m.stockValue.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 4: On-Time Delivery (OTD) Tracking */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Clock size={16} style={{ color: 'var(--color-brand-primary)' }} />
            <span>4. Customer Order On-Time Delivery (OTD) Performance</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            icon={<Download size={13} />}
            onClick={handleExportOtdCsv}
          >
            Export CSV
          </Button>
        </div>

        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
            <div style={{ padding: '12px 14px', backgroundColor: 'var(--color-status-success-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-status-success-border)' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-status-success-text)', fontWeight: 600 }}>COMPLETED ON-TIME</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-status-success-text)', marginTop: '4px' }} className="tabular-nums">
                {otdData.onTimeCount} Jobs
              </div>
            </div>

            <div style={{ padding: '12px 14px', backgroundColor: otdData.delayedCount > 0 ? 'var(--color-status-danger-bg)' : 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)' }}>
              <div style={{ fontSize: '11px', color: otdData.delayedCount > 0 ? 'var(--color-status-danger-text)' : 'var(--color-text-muted)', fontWeight: 600 }}>DELAYED ORDERS</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: otdData.delayedCount > 0 ? 'var(--color-status-danger-text)' : 'var(--color-text-primary)', marginTop: '4px' }} className="tabular-nums">
                {otdData.delayedCount} Jobs
              </div>
            </div>

            <div style={{ padding: '12px 14px', backgroundColor: 'var(--color-status-info-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-status-info-border)' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-status-info-text)', fontWeight: 600 }}>RUNNING IN PRODUCTION</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-status-info-text)', marginTop: '4px' }} className="tabular-nums">
                {otdData.inProduction.length} Jobs
              </div>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-bg-subtle)', borderBottom: '1px solid var(--color-border-default)' }}>
                  <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Job Card #</th>
                  <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Customer</th>
                  <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Target Product</th>
                  <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Due Date</th>
                  <th style={{ padding: '8px 14px', textAlign: 'center', fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map((job, idx) => (
                  <tr key={job.id} style={{ borderBottom: '1px solid var(--color-border-subtle)', backgroundColor: idx % 2 === 0 ? '#fff' : 'rgba(248, 250, 252, 0.5)' }}>
                    <td style={{ padding: '8px 14px' }}><span className="mono-code">{job.jobNumber}</span></td>
                    <td style={{ padding: '8px 14px', fontWeight: 500 }}>{job.customer}</td>
                    <td style={{ padding: '8px 14px' }}>{job.productName}</td>
                    <td style={{ padding: '8px 14px' }}><span className="mono-code" style={{ fontSize: '11px' }}>{job.dueDate}</span></td>
                    <td style={{ padding: '8px 14px', textAlign: 'center' }}>
                      <StatusBadge status={job.status} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
