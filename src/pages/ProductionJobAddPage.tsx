import React, { useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { FormField } from '../components/common/FormField';
import { SelectField } from '../components/common/SelectField';
import { DatePicker } from '../components/common/DatePicker';
import { Button } from '../components/common/Button';
import { useNavigation } from '../context/NavigationContext';
import { useToast } from '../context/ToastContext';
import { PlusCircle, ArrowLeft, Save } from 'lucide-react';

export const ProductionJobAddPage: React.FC = () => {
  const { navigate } = useNavigation();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    jobNumber: 'JOB-2026-006',
    date: new Date().toISOString().split('T')[0],
    customer: '',
    productCode: 'PRD-BRS-FIT-01',
    productName: '1/2" Male Hex Brass Flare Tube Fitting (BSPT)',
    requiredQuantity: '2000',
    assignedWorker: 'Rajeshbhai Panchal (WRK-001)',
    machine: 'CNC Lathe 01 (Doosan Lynx 220)',
    dueDate: '2026-09-22',
    priority: 'High',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showToast({
      title: 'Job Card Created (Mock)',
      message: `${formData.jobNumber} has been scheduled for manufacturing.`,
      type: 'success'
    });
    navigate('/production/jobs');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader
        title="Issue New Production Job Card"
        description="Schedule shop floor batch work order, allocate CNC / VMC stations, and assign operator."
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
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormField
                label="Client / Customer Reference"
                required
                placeholder="e.g. Larsen & Toubro Heavy Engineering"
                value={formData.customer}
                onChange={e => setFormData({ ...formData, customer: e.target.value })}
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
                onChange={e => setFormData({ ...formData, priority: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
              <SelectField
                label="Component / Product to Manufacture"
                required
                options={[
                  { value: 'PRD-BRS-FIT-01', label: 'PRD-001: 1/2" Male Hex Brass Flare Fitting' },
                  { value: 'PRD-BRS-VAL-04', label: 'PRD-002: 3/4" Full Bore Brass Valve Stem' },
                  { value: 'PRD-SS-SHF-12', label: 'PRD-003: Precision SS 304 Pump Shaft' },
                  { value: 'PRD-MS-BOLT-M24', label: 'PRD-004: M24 x 120mm High Tensile Bolt' },
                ]}
                value={formData.productCode}
                onChange={e => setFormData({ ...formData, productCode: e.target.value })}
              />

              <FormField
                label="Required Batch Quantity"
                suffix="pcs"
                required
                type="number"
                value={formData.requiredQuantity}
                onChange={e => setFormData({ ...formData, requiredQuantity: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <SelectField
                label="Assigned Karigar / Machinist"
                required
                options={[
                  { value: 'Rajeshbhai Panchal', label: 'Rajeshbhai Panchal (CNC Operator)' },
                  { value: 'Hitesh Prajapati', label: 'Hitesh Prajapati (Lathe Master)' },
                  { value: 'Dharmesh Vaghela', label: 'Dharmesh Vaghela (VMC Specialist)' },
                  { value: 'Manish Suthar', label: 'Manish Suthar (Tool & Die Maker)' },
                ]}
                value={formData.assignedWorker}
                onChange={e => setFormData({ ...formData, assignedWorker: e.target.value })}
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
              placeholder="e.g. Critical thread pitch gauge check every 50 pcs"
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="card-footer">
            <Button variant="secondary" onClick={() => navigate('/production/jobs')} type="button">
              Cancel
            </Button>
            <Button variant="primary" icon={<Save size={14} />} type="submit">
              Issue Job Card
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
