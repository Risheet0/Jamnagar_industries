import React, { useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { SummaryCard } from '../components/common/SummaryCard';
import { DataTable } from '../components/common/DataTable';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { FormField } from '../components/common/FormField';
import { SelectField } from '../components/common/SelectField';
import { DatePicker } from '../components/common/DatePicker';
import { ConfirmationDialog } from '../components/common/ConfirmationDialog';
import { useQuality } from '../context/QualityContext';
import { useProduction } from '../context/ProductionContext';
import { useToast } from '../context/ToastContext';
import {
  QualityInspection,
  InspectionResult,
  DefectType,
  TableColumn
} from '../types';
import {
  CheckSquare,
  Plus,
  ShieldCheck,
  AlertOctagon,
  Percent,
  Layers,
  Trash2,
  FileCheck2,
  Eye
} from 'lucide-react';

const DEFECT_OPTIONS: DefectType[] = [
  'Burr',
  'Thread Damage',
  'Undersize',
  'Oversize',
  'Surface Finish',
  'Other'
];

export const QualityPage: React.FC = () => {
  const { inspections, addInspection, deleteInspection } = useQuality();
  const { jobs, updateJob } = useProduction();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'all' | 'pass' | 'fail' | 'first-piece'>('all');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedInspectionForView, setSelectedInspectionForView] = useState<QualityInspection | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  // New Inspection Form State
  const defaultJob = jobs[0];
  const [jobId, setJobId] = useState<string>(defaultJob?.jobNumber || 'JOB-2026-001');
  const [productCode, setProductCode] = useState<string>(defaultJob?.productCode || 'PRD-BRS-FIT-01');
  const [productName, setProductName] = useState<string>(defaultJob?.productName || '1/2" Male Hex Brass Flare Tube Fitting (BSPT)');
  const [inspectionType, setInspectionType] = useState<'First-Piece' | 'In-Process Sample' | 'Final'>('In-Process Sample');
  const [sampleSize, setSampleSize] = useState<string>('50');
  const [inspectedQty, setInspectedQty] = useState<string>('50');
  const [passedQty, setPassedQty] = useState<string>('50');
  const [rejectedQty, setRejectedQty] = useState<string>('0');
  const [selectedDefects, setSelectedDefects] = useState<DefectType[]>([]);
  const [dimensionalNotes, setDimensionalNotes] = useState<string>('');
  const [result, setResult] = useState<InspectionResult>('Pass');
  const [isResultOverridden, setIsResultOverridden] = useState<boolean>(false);
  const [inspectedBy, setInspectedBy] = useState<string>('Ramesh Patel (QC Master)');
  const [inspectionDate, setInspectionDate] = useState<string>(todayStr);
  const [remarks, setRemarks] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Summary Metrics calculations
  const totalInspections = inspections.length;
  const passedInspections = inspections.filter(i => i.result === 'Pass').length;
  const failedInspections = inspections.filter(i => i.result === 'Fail').length;
  const passRate = totalInspections > 0 ? Math.round((passedInspections / totalInspections) * 100) : 100;
  const totalRejectedParts = inspections.reduce((acc, i) => acc + (i.rejectedQuantity || 0), 0);

  // Filtered Inspections for Tabs
  const filteredInspections = inspections.filter(i => {
    if (activeTab === 'pass') return i.result === 'Pass';
    if (activeTab === 'fail') return i.result === 'Fail';
    if (activeTab === 'first-piece') return i.inspectionType === 'First-Piece';
    return true;
  });

  // Auto-calculate passed/rejected quantities and auto-suggest result
  const handleInspectedQtyChange = (val: string) => {
    setInspectedQty(val);
    const total = Number(val) || 0;
    const rej = Number(rejectedQty) || 0;
    const pass = Math.max(0, total - rej);
    setPassedQty(String(pass));
    if (!isResultOverridden) {
      setResult(rej > 0 ? 'Fail' : 'Pass');
    }
  };

  const handleRejectedQtyChange = (val: string) => {
    setRejectedQty(val);
    const rej = Number(val) || 0;
    const total = Number(inspectedQty) || 0;
    const pass = Math.max(0, total - rej);
    setPassedQty(String(pass));
    if (!isResultOverridden) {
      setResult(rej > 0 ? 'Fail' : 'Pass');
    }
  };

  const handleJobSelect = (selectedJobNum: string) => {
    setJobId(selectedJobNum);
    const matchedJob = jobs.find(j => j.jobNumber === selectedJobNum || j.id === selectedJobNum);
    if (matchedJob) {
      setProductCode(matchedJob.productCode);
      setProductName(matchedJob.productName);
    }
  };

  const toggleDefect = (defect: DefectType) => {
    if (selectedDefects.includes(defect)) {
      setSelectedDefects(selectedDefects.filter(d => d !== defect));
    } else {
      setSelectedDefects([...selectedDefects, defect]);
    }
  };

  const resetForm = () => {
    const currentDefaultJob = jobs[0];
    setJobId(currentDefaultJob?.jobNumber || 'JOB-2026-001');
    setProductCode(currentDefaultJob?.productCode || 'PRD-BRS-FIT-01');
    setProductName(currentDefaultJob?.productName || '1/2" Male Hex Brass Flare Tube Fitting (BSPT)');
    setInspectionType('In-Process Sample');
    setSampleSize('50');
    setInspectedQty('50');
    setPassedQty('50');
    setRejectedQty('0');
    setSelectedDefects([]);
    setDimensionalNotes('');
    setResult('Pass');
    setIsResultOverridden(false);
    setInspectedBy('Ramesh Patel (QC Master)');
    setInspectionDate(todayStr);
    setRemarks('');
    setErrors({});
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!jobId.trim()) errs.jobId = 'Job card number is required';
    if (!productName.trim()) errs.productName = 'Product name is required';
    if (!inspectedQty || Number(inspectedQty) <= 0) errs.inspectedQty = 'Inspected quantity must be > 0';
    if (!inspectedBy.trim()) errs.inspectedBy = 'Inspector name is required';
    if (!inspectionDate) errs.date = 'Inspection date is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreateInspection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const rejQtyNum = Number(rejectedQty) || 0;

    addInspection({
      jobId: jobId.trim(),
      jobNumber: jobId.trim(),
      productCode: productCode.trim() || 'PRD-CUSTOM',
      productName: productName.trim(),
      inspectionType,
      sampleSize: Number(sampleSize) || Number(inspectedQty) || 1,
      inspectedQuantity: Number(inspectedQty),
      passedQuantity: Number(passedQty),
      rejectedQuantity: rejQtyNum,
      defectTypes: selectedDefects,
      dimensionalNotes: dimensionalNotes.trim() || undefined,
      result,
      inspectedBy: inspectedBy.trim(),
      date: inspectionDate,
      remarks: remarks.trim() || undefined
    });

    // Cross-module reconciliation (Item 7c): QC is the source of truth for rejection counts
    const matchedJob = jobs.find(j => j.jobNumber === jobId.trim() || j.id === jobId.trim());
    if (matchedJob && rejQtyNum > 0 && matchedJob.rejectedQuantity !== rejQtyNum) {
      updateJob(matchedJob.id, {
        rejectedQuantity: rejQtyNum
      });
    }

    showToast({
      title: 'QC Inspection Logged',
      message: `${inspectionType} inspection for ${jobId} recorded with result: ${result}.`,
      type: result === 'Pass' ? 'success' : 'warning'
    });

    setIsNewModalOpen(false);
    resetForm();
  };

  const handleDeleteConfirm = () => {
    if (deleteId) {
      deleteInspection(deleteId);
      showToast({
        title: 'Inspection Deleted',
        message: `QC record ${deleteId} removed from log.`,
        type: 'info'
      });
      setDeleteId(null);
    }
  };

  const columns: TableColumn<QualityInspection>[] = [
    {
      header: 'QC ID',
      accessor: 'id',
      width: '100px',
      sortable: true,
      render: (i) => <span className="mono-code">{i.id}</span>
    },
    {
      header: 'Job Card #',
      accessor: 'jobNumber',
      width: '130px',
      sortable: true,
      render: (i) => <span className="mono-code" style={{ fontWeight: 600 }}>{i.jobNumber}</span>
    },
    {
      header: 'Product / Component',
      accessor: 'productName',
      sortable: true,
      render: (i) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{i.productName}</div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{i.productCode}</div>
        </div>
      )
    },
    {
      header: 'Stage',
      accessor: 'inspectionType',
      width: '140px',
      sortable: true,
      render: (i) => (
        <span
          style={{
            fontSize: '12px',
            fontWeight: 500,
            padding: '2px 8px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--color-bg-subtle)',
            border: '1px solid var(--color-border-subtle)',
            color: 'var(--color-text-secondary)'
          }}
        >
          {i.inspectionType}
        </span>
      )
    },
    {
      header: 'Result',
      accessor: 'result',
      width: '110px',
      align: 'center',
      sortable: true,
      render: (i) => {
        const isPass = i.result === 'Pass';
        const isFail = i.result === 'Fail';
        return (
          <span
            className="status-badge"
            style={{
              backgroundColor: isPass ? 'var(--color-status-success-bg)' : isFail ? 'var(--color-status-danger-bg)' : 'var(--color-status-warning-bg)',
              color: isPass ? 'var(--color-status-success-text)' : isFail ? 'var(--color-status-danger-text)' : 'var(--color-status-warning-text)',
              borderColor: isPass ? 'var(--color-status-success-border)' : isFail ? 'var(--color-status-danger-border)' : 'var(--color-status-warning-border)'
            }}
          >
            {i.result}
          </span>
        );
      }
    },
    {
      header: 'Inspected / Pass / Rej',
      align: 'right',
      width: '160px',
      render: (i) => (
        <div style={{ textAlign: 'right', fontSize: '12px' }}>
          <span className="tabular-nums" style={{ fontWeight: 600 }}>{i.inspectedQuantity} pcs</span>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
            <span style={{ color: 'var(--color-status-success-solid)' }}>✓ {i.passedQuantity}</span>
            {i.rejectedQuantity > 0 && (
              <span style={{ color: 'var(--color-status-danger-solid)', marginLeft: '6px' }}>✗ {i.rejectedQuantity}</span>
            )}
          </div>
        </div>
      )
    },
    {
      header: 'Inspector',
      accessor: 'inspectedBy',
      render: (i) => <span style={{ fontSize: '12px' }}>{i.inspectedBy}</span>
    },
    {
      header: 'Date',
      accessor: 'date',
      width: '110px',
      sortable: true,
      render: (i) => <span className="mono-code" style={{ fontSize: '11px' }}>{i.date}</span>
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader
        title="Quality Control & Inspection (QC)"
        description="First-piece dimensional verification, in-process sampling, thread pitch gauge clearance, and batch rejection logs."
        breadcrumbs={[
          { label: 'Quality Control' }
        ]}
        actions={
          <Button
            variant="primary"
            icon={<Plus size={14} />}
            onClick={() => {
              resetForm();
              setIsNewModalOpen(true);
            }}
          >
            + New QC Inspection
          </Button>
        }
      />

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <SummaryCard
          title="Total QC Inspections"
          value={totalInspections}
          subtitle="Total batches verified"
          icon={<ShieldCheck size={18} />}
        />
        <SummaryCard
          title="First-Pass Rate"
          value={`${passRate}%`}
          subtitle={`${passedInspections} passed out of ${totalInspections}`}
          icon={<Percent size={18} />}
          statusTag={passRate >= 95 ? { label: 'High Yield', variant: 'success' } : { label: 'Attention', variant: 'warning' }}
        />
        <SummaryCard
          title="Rejected Parts Qty"
          value={`${totalRejectedParts} pcs`}
          subtitle="Non-conforming units logged"
          icon={<AlertOctagon size={18} />}
          statusTag={totalRejectedParts === 0 ? { label: 'Zero Defect', variant: 'success' } : { label: `${totalRejectedParts} Scrap`, variant: 'danger' }}
        />
        <SummaryCard
          title="Open NCRs / Failed"
          value={failedInspections}
          subtitle="Requires corrective tool offset"
          icon={<CheckSquare size={18} />}
          statusTag={failedInspections === 0 ? { label: 'Clean', variant: 'success' } : { label: `${failedInspections} Action Needed`, variant: 'warning' }}
        />
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="card" style={{ padding: 0 }}>
        <div className="tabs-header">
          <button
            type="button"
            className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <Layers size={14} />
            <span>All Inspections</span>
            <span className="tab-badge">{inspections.length}</span>
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'pass' ? 'active' : ''}`}
            onClick={() => setActiveTab('pass')}
          >
            <span>Passed Batches</span>
            <span
              className="tab-badge"
              style={{ backgroundColor: 'var(--color-status-success-bg)', color: 'var(--color-status-success-text)' }}
            >
              {passedInspections}
            </span>
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'fail' ? 'active' : ''}`}
            onClick={() => setActiveTab('fail')}
          >
            <span>Failed / NCR</span>
            <span
              className="tab-badge"
              style={{ backgroundColor: 'var(--color-status-danger-bg)', color: 'var(--color-status-danger-text)' }}
            >
              {failedInspections}
            </span>
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'first-piece' ? 'active' : ''}`}
            onClick={() => setActiveTab('first-piece')}
          >
            <span>First-Piece Sign-offs</span>
            <span className="tab-badge">
              {inspections.filter(i => i.inspectionType === 'First-Piece').length}
            </span>
          </button>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={filteredInspections}
        columns={columns}
        searchPlaceholder="Search QC log by job #, product, inspector, defects..."
        onRowClick={(row) => setSelectedInspectionForView(row)}
        actions={(row) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setSelectedInspectionForView(row)}
              className="btn btn-ghost btn-sm btn-icon-only"
              title="View QC Details"
            >
              <Eye size={14} style={{ color: 'var(--color-brand-primary)' }} />
            </button>
            <button
              onClick={() => setDeleteId(row.id)}
              className="btn btn-ghost btn-sm btn-icon-only"
              title="Delete Inspection"
            >
              <Trash2 size={14} style={{ color: 'var(--color-status-danger-solid)' }} />
            </button>
          </div>
        )}
        onAddClick={() => {
          resetForm();
          setIsNewModalOpen(true);
        }}
        addLabel="Record Inspection"
        emptyTitle="No quality inspections match this filter"
        emptySubtitle="Record a first-piece clearance or in-process sampling inspection."
      />

      {/* New QC Inspection Modal Form */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Record Quality Inspection Entry"
        subtitle="Dimensional verification, Go/No-Go thread gauging, and defect logging"
        maxWidth="800px"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', width: '100%' }}>
            <Button
              variant="secondary"
              type="button"
              onClick={() => setIsNewModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              form="new-qc-form"
              icon={<FileCheck2 size={14} />}
            >
              Save QC Inspection
            </Button>
          </div>
        }
      >
        <form id="new-qc-form" onSubmit={handleCreateInspection} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '14px' }}>
            <SelectField
              label="Job Card #"
              required
              options={jobs.map(j => ({
                value: j.jobNumber,
                label: `${j.jobNumber} (${j.productName.slice(0, 24)}...)`
              }))}
              value={jobId}
              onChange={e => handleJobSelect(e.target.value)}
              error={errors.jobId}
              allowOther
              otherPlaceholder="e.g. JOB-2026-CUSTOM"
            />
            <FormField
              label="Product / Manufactured Component"
              required
              value={productName}
              onChange={e => setProductName(e.target.value)}
              error={errors.productName}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
            <SelectField
              label="Inspection Type"
              required
              options={[
                { value: 'First-Piece', label: 'First-Piece Setup Clearance' },
                { value: 'In-Process Sample', label: 'In-Process Sample (50 pcs)' },
                { value: 'Final', label: 'Final Pre-Dispatch Inspection' }
              ]}
              value={inspectionType}
              onChange={e => setInspectionType(e.target.value as any)}
              allowOther={false}
            />
            <DatePicker
              label="Inspection Date"
              required
              value={inspectionDate}
              onChange={e => setInspectionDate(e.target.value)}
              error={errors.date}
            />
            <FormField
              label="QC Inspector Name"
              required
              value={inspectedBy}
              onChange={e => setInspectedBy(e.target.value)}
              error={errors.inspectedBy}
            />
          </div>

          {/* Quantities */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', padding: '12px 14px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)' }}>
            <FormField
              label="Inspected Qty (pcs)"
              required
              type="number"
              value={inspectedQty}
              onChange={e => handleInspectedQtyChange(e.target.value)}
              error={errors.inspectedQty}
            />
            <FormField
              label="Passed Qty (pcs)"
              type="number"
              value={passedQty}
              onChange={e => setPassedQty(e.target.value)}
            />
            <FormField
              label="Rejected Qty (pcs)"
              type="number"
              value={rejectedQty}
              onChange={e => handleRejectedQtyChange(e.target.value)}
            />
          </div>

          {/* Defect Checkboxes */}
          <div>
            <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>
              Identified Defect Types (if any):
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {DEFECT_OPTIONS.map(defect => {
                const isSelected = selectedDefects.includes(defect);
                return (
                  <button
                    key={defect}
                    type="button"
                    onClick={() => toggleDefect(defect)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      border: isSelected ? '1px solid var(--color-status-danger-solid)' : '1px solid var(--color-border-default)',
                      backgroundColor: isSelected ? 'var(--color-status-danger-bg)' : '#ffffff',
                      color: isSelected ? 'var(--color-status-danger-text)' : 'var(--color-text-secondary)',
                      transition: 'all 0.1s'
                    }}
                  >
                    {isSelected ? '✓ ' : '+ '}{defect}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dimensional Notes & Result Override */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
            <FormField
              label="Vernier / Micrometer Dimensional Notes"
              placeholder="e.g. OD 24.98mm vs 25.00 ±0.02mm. Thread pitch gauge tight on crest."
              value={dimensionalNotes}
              onChange={e => setDimensionalNotes(e.target.value)}
              helpText="Key tolerance readings from inspection table"
            />
            <SelectField
              label="Inspection Verdict"
              required
              options={[
                { value: 'Pass', label: 'Pass (Clearance Granted)' },
                { value: 'Fail', label: 'Fail (Rejection / Hold)' },
                { value: 'Pending', label: 'Pending / Re-test' }
              ]}
              value={result}
              onChange={e => {
                setResult(e.target.value as InspectionResult);
                setIsResultOverridden(true);
              }}
              allowOther={false}
            />
          </div>

          <FormField
            label="Inspector Remarks & Corrective Action"
            placeholder="e.g. Tool insert offset adjusted +0.02mm on X-axis. Next batch sampled clean."
            value={remarks}
            onChange={e => setRemarks(e.target.value)}
          />
        </form>
      </Modal>

      {/* View Details Modal */}
      {selectedInspectionForView && (
        <Modal
          isOpen={Boolean(selectedInspectionForView)}
          onClose={() => setSelectedInspectionForView(null)}
          title={`Inspection Certificate: ${selectedInspectionForView.id}`}
          subtitle={`${selectedInspectionForView.jobNumber} • ${selectedInspectionForView.productName}`}
          maxWidth="640px"
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <Button
                variant="danger-outline"
                size="sm"
                icon={<Trash2 size={13} />}
                onClick={() => {
                  const id = selectedInspectionForView.id;
                  setSelectedInspectionForView(null);
                  setDeleteId(id);
                }}
              >
                Delete Entry
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedInspectionForView(null)}
              >
                Close
              </Button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>VERDICT</span>
                <div style={{ fontWeight: 700, fontSize: '15px', color: selectedInspectionForView.result === 'Pass' ? 'var(--color-status-success-solid)' : 'var(--color-status-danger-solid)' }}>
                  {selectedInspectionForView.result === 'Pass' ? '✓ APPROVED / PASS' : '✗ REJECTED / HOLD'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>INSPECTION STAGE</span>
                <div style={{ fontWeight: 600 }}>{selectedInspectionForView.inspectionType}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <div style={{ padding: '10px', backgroundColor: '#ffffff', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Sample Size</div>
                <div style={{ fontWeight: 700, fontSize: '14px' }}>{selectedInspectionForView.inspectedQuantity} pcs</div>
              </div>
              <div style={{ padding: '10px', backgroundColor: 'var(--color-status-success-bg)', border: '1px solid var(--color-status-success-border)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '11px', color: 'var(--color-status-success-text)' }}>Passed Qty</div>
                <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-status-success-text)' }}>{selectedInspectionForView.passedQuantity} pcs</div>
              </div>
              <div style={{ padding: '10px', backgroundColor: selectedInspectionForView.rejectedQuantity > 0 ? 'var(--color-status-danger-bg)' : '#ffffff', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '11px', color: selectedInspectionForView.rejectedQuantity > 0 ? 'var(--color-status-danger-text)' : 'var(--color-text-muted)' }}>Rejected Qty</div>
                <div style={{ fontWeight: 700, fontSize: '14px', color: selectedInspectionForView.rejectedQuantity > 0 ? 'var(--color-status-danger-text)' : 'inherit' }}>{selectedInspectionForView.rejectedQuantity} pcs</div>
              </div>
            </div>

            {selectedInspectionForView.defectTypes && selectedInspectionForView.defectTypes.length > 0 && (
              <div>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Defects Identified:</span>
                <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                  {selectedInspectionForView.defectTypes.map(d => (
                    <span key={d} className="status-badge status-badge-inactive" style={{ color: 'var(--color-status-danger-solid)' }}>
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedInspectionForView.dimensionalNotes && (
              <div style={{ padding: '10px 12px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Dimensional Tolerance Readings</div>
                <div style={{ marginTop: '3px', color: 'var(--color-text-primary)' }}>{selectedInspectionForView.dimensionalNotes}</div>
              </div>
            )}

            {selectedInspectionForView.remarks && (
              <div style={{ padding: '10px 12px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Inspector Remarks</div>
                <div style={{ marginTop: '3px', color: 'var(--color-text-secondary)' }}>{selectedInspectionForView.remarks}</div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border-subtle)', paddingTop: '10px' }}>
              <span>Inspector: <strong>{selectedInspectionForView.inspectedBy}</strong></span>
              <span>Date: <strong>{selectedInspectionForView.date}</strong></span>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Quality Inspection Log?"
        message={`Are you sure you want to delete inspection record ${deleteId}? This will remove it from the historical QC log.`}
        confirmLabel="Confirm Delete"
      />
    </div>
  );
};
