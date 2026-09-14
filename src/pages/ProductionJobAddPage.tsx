import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { FormField } from '../components/common/FormField';
import { SelectField } from '../components/common/SelectField';
import { DatePicker } from '../components/common/DatePicker';
import { Button } from '../components/common/Button';
import { useNavigation } from '../context/NavigationContext';
import { useToast } from '../context/ToastContext';
import { useProducts } from '../context/ProductsContext';
import { useWorkers } from '../context/WorkerContext';
import { useMaterials } from '../context/MaterialsContext';
import { useProduction } from '../context/ProductionContext';
import { PlusCircle, ArrowLeft, Save, AlertTriangle, Layers } from 'lucide-react';

export const ProductionJobAddPage: React.FC = () => {
  const { navigate } = useNavigation();
  const { showToast } = useToast();
  const { products } = useProducts();
  const { workers } = useWorkers();
  const { materials, recordOutward } = useMaterials();
  const { addJob } = useProduction();

  const todayStr = new Date().toISOString().split('T')[0];
  const nextWeekStr = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const generatedJobNum = `JOB-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`;

  const [formData, setFormData] = useState({
    jobNumber: generatedJobNum,
    date: todayStr,
    customer: '',
    productCode: products[0]?.productCode || 'PRD-BRS-FIT-01',
    productName: products[0]?.productName || '1/2" Male Hex Brass Flare Tube Fitting (BSPT)',
    requiredQuantity: '1000',
    assignedWorker: workers[0]?.name || 'Rajeshbhai Panchal',
    assignedWorkerId: workers[0]?.id || 'WRK-001',
    machine: 'CNC Lathe 01 (Doosan Lynx 220)',
    dueDate: nextWeekStr,
    priority: 'High' as 'High' | 'Medium' | 'Critical' | 'Normal',
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-update productName when productCode changes
  const selectedProduct = products.find(p => p.productCode === formData.productCode || p.id === formData.productCode);
  const selectedMaterial = materials.find(m => m.materialCode === selectedProduct?.materialCode || m.id === selectedProduct?.materialCode || m.type.includes('Brass'));

  useEffect(() => {
    if (selectedProduct) {
      setFormData(prev => ({
        ...prev,
        productName: selectedProduct.productName
      }));
    }
  }, [selectedProduct]);

  // Estimate material needed
  const reqQtyNum = Number(formData.requiredQuantity) || 0;
  const unitWeightGrams = selectedProduct?.weight || 100;
  const estimatedKgNeeded = selectedProduct?.weightUnit === 'kg'
    ? reqQtyNum * unitWeightGrams
    : (reqQtyNum * unitWeightGrams) / 1000;

  const isStockInsufficient = selectedMaterial && selectedMaterial.currentStock < estimatedKgNeeded;

  const handleProductChange = (code: string) => {
    const prd = products.find(p => p.productCode === code || p.id === code);
    setFormData(prev => ({
      ...prev,
      productCode: code,
      productName: prd ? prd.productName : code
    }));
  };

  const handleWorkerChange = (workerNameOrId: string) => {
    const wrk = workers.find(w => w.name === workerNameOrId || w.id === workerNameOrId || w.workerId === workerNameOrId);
    setFormData(prev => ({
      ...prev,
      assignedWorker: wrk ? wrk.name : workerNameOrId,
      assignedWorkerId: wrk ? wrk.id : 'WRK-001'
    }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.jobNumber.trim()) errs.jobNumber = 'Job card number is required';
    if (!formData.customer.trim()) errs.customer = 'Client name is required';
    if (!formData.requiredQuantity || Number(formData.requiredQuantity) <= 0) errs.requiredQuantity = 'Quantity must be > 0';
    if (!formData.assignedWorker.trim()) errs.assignedWorker = 'Please assign a karigar';
    if (!formData.dueDate) errs.dueDate = 'Due date is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const qty = Number(formData.requiredQuantity);

    const newJob = addJob({
      jobNumber: formData.jobNumber.trim(),
      date: formData.date,
      customer: formData.customer.trim(),
      productCode: formData.productCode,
      productName: formData.productName,
      requiredQuantity: qty,
      producedQuantity: 0,
      rejectedQuantity: 0,
      assignedWorker: formData.assignedWorker,
      assignedWorkerId: formData.assignedWorkerId,
      machine: formData.machine.trim(),
      dueDate: formData.dueDate,
      status: 'In Production',
      priority: formData.priority,
      notes: formData.notes.trim() || undefined
    });

    // Cross-Module 7a: Deduct raw material consumption
    if (selectedMaterial && estimatedKgNeeded > 0) {
      const deductionQty = Math.round(estimatedKgNeeded);
      recordOutward(selectedMaterial.id, deductionQty, {
        jobId: newJob.jobNumber,
        issuedTo: `${formData.assignedWorker} (${newJob.jobNumber})`,
        reason: `Production Requisition for ${newJob.jobNumber}`,
        date: formData.date,
        allowDeficit: true
      });

      if (isStockInsufficient) {
        showToast({
          title: 'Job Issued (Stock Alert)',
          message: `Job ${newJob.jobNumber} created. Required ${deductionQty} ${selectedMaterial.unit} exceeds on-hand stock (${selectedMaterial.currentStock} ${selectedMaterial.unit}). Reorder required.`,
          type: 'warning'
        });
      } else {
        showToast({
          title: 'Job Card Issued & Material Allocated',
          message: `Job ${newJob.jobNumber} scheduled. Allocated ~${deductionQty} ${selectedMaterial.unit} of ${selectedMaterial.materialCode}.`,
          type: 'success'
        });
      }
    } else {
      showToast({
        title: 'Job Card Scheduled',
        message: `${newJob.jobNumber} created and assigned to ${formData.assignedWorker}.`,
        type: 'success'
      });
    }

    navigate('/production/jobs');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader
        title="Issue New Production Job Card"
        description="Schedule shop floor batch work order, allocate CNC / VMC stations, and auto-allocate raw material bill-of-materials."
        breadcrumbs={[
          { label: 'Production', path: '/production' },
          { label: 'Job Cards', path: '/production/jobs' },
          { label: 'Issue Job' }
        ]}
        actions={
          <Button
            variant="secondary"
            icon={<ArrowLeft size={14} />}
            onClick={() => navigate('/production/jobs')}
          >
            Back to Job Cards
          </Button>
        }
      />

      <div className="card" style={{ maxWidth: '850px' }}>
        <div className="card-header">
          <div className="card-title">
            <PlusCircle size={16} style={{ color: 'var(--color-brand-primary)' }} />
            <span>Job Card Scheduling Form</span>
          </div>
          <span className="mono-code">{formData.jobNumber}</span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <FormField
                label="Job Card #"
                required
                value={formData.jobNumber}
                onChange={e => setFormData({ ...formData, jobNumber: e.target.value })}
                error={errors.jobNumber}
              />
              <DatePicker
                label="Issue Date"
                required
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
              />
              <DatePicker
                label="Target Due Date"
                required
                value={formData.dueDate}
                onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                error={errors.dueDate}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '16px' }}>
              <FormField
                label="Client / Customer Reference"
                required
                placeholder="e.g. Larsen & Toubro Heavy Engineering"
                value={formData.customer}
                onChange={e => setFormData({ ...formData, customer: e.target.value })}
                error={errors.customer}
              />
              <SelectField
                label="Priority Level"
                options={[
                  { value: 'Normal', label: 'Normal' },
                  { value: 'Medium', label: 'Medium' },
                  { value: 'High', label: 'High' },
                  { value: 'Critical', label: 'Critical' },
                ]}
                value={formData.priority}
                onChange={e => setFormData({ ...formData, priority: e.target.value as any })}
                allowOther={false}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
              <SelectField
                label="Component / Product to Manufacture"
                required
                options={products.map(p => ({
                  value: p.productCode,
                  label: `${p.productCode}: ${p.productName} (${p.category})`
                }))}
                value={formData.productCode}
                onChange={e => handleProductChange(e.target.value)}
                allowOther
                otherPlaceholder="e.g. PRD-CUSTOM-001"
              />

              <FormField
                label="Required Batch Quantity"
                suffix="pcs"
                required
                type="number"
                value={formData.requiredQuantity}
                onChange={e => setFormData({ ...formData, requiredQuantity: e.target.value })}
                error={errors.requiredQuantity}
              />
            </div>

            {/* Cross-Module 7a Raw Material BOM Consumption Banner */}
            {selectedMaterial && (
              <div
                style={{
                  padding: '12px 14px',
                  backgroundColor: isStockInsufficient ? 'var(--color-status-warning-bg)' : 'var(--color-bg-subtle)',
                  borderRadius: 'var(--radius-md)',
                  border: isStockInsufficient ? '1px solid var(--color-status-warning-border)' : '1px solid var(--color-border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  fontSize: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isStockInsufficient ? (
                    <AlertTriangle size={16} style={{ color: 'var(--color-status-warning-solid)', flexShrink: 0 }} />
                  ) : (
                    <Layers size={16} style={{ color: 'var(--color-brand-primary)', flexShrink: 0 }} />
                  )}
                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      Raw Material Allocation (BOM):
                    </span>{' '}
                    <span>{selectedMaterial.materialCode} ({selectedMaterial.materialName})</span>
                    <div style={{ color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                      Estimated consumption: <strong className="tabular-nums">~{estimatedKgNeeded.toFixed(1)} {selectedMaterial.unit}</strong> • On-hand warehouse stock: <strong className="tabular-nums">{selectedMaterial.currentStock} {selectedMaterial.unit}</strong>
                    </div>
                  </div>
                </div>

                {isStockInsufficient && (
                  <span className="status-badge status-badge-inactive" style={{ color: 'var(--color-status-warning-solid)', flexShrink: 0 }}>
                    Insufficient Stock
                  </span>
                )}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <SelectField
                label="Assigned Karigar / Machinist"
                required
                options={workers.map(w => ({
                  value: w.name,
                  label: `${w.name} (${w.skill} • ${w.department})`
                }))}
                value={formData.assignedWorker}
                onChange={e => handleWorkerChange(e.target.value)}
                allowOther
                otherPlaceholder="e.g. Contract Machinist"
                error={errors.assignedWorker}
              />

              <FormField
                label="Allocated Machine / Station"
                required
                placeholder="e.g. CNC Turning Station 01"
                value={formData.machine}
                onChange={e => setFormData({ ...formData, machine: e.target.value })}
              />
            </div>

            <FormField
              label="Engineering & Quality Tolerances Note"
              placeholder="e.g. Critical thread pitch gauge check every 50 pcs. Tolerance ±0.02mm."
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <Button variant="secondary" onClick={() => navigate('/production/jobs')} type="button">
              Cancel
            </Button>
            <Button variant="primary" icon={<Save size={14} />} type="submit">
              Issue Job Card & Allocate Stock
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
