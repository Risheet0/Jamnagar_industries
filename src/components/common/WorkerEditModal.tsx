import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { FormField } from './FormField';
import { SelectField } from './SelectField';
import { Worker, WorkerSkill, WorkerDepartment, SalaryType, WorkerStatus } from '../../types';
import { useWorkers } from '../../context/WorkerContext';
import { useToast } from '../../context/ToastContext';
import { UserCheck, Save, Calculator, Keyboard } from 'lucide-react';

interface WorkerEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  worker: Worker | null;
  onSaved?: (updatedWorker: Worker) => void;
}

export const WorkerEditModal: React.FC<WorkerEditModalProps> = ({
  isOpen,
  onClose,
  worker,
  onSaved
}) => {
  const { updateWorker } = useWorkers();
  const { showToast } = useToast();

  const [formData, setFormData] = useState<Partial<Worker>>({});
  // String state for effortless keyboard typing of numerical amount & decimals
  const [salaryInput, setSalaryInput] = useState<string>('');
  const [overtimeInput, setOvertimeInput] = useState<string>('');

  useEffect(() => {
    if (worker) {
      setFormData({
        name: worker.name,
        mobile: worker.mobile,
        skill: worker.skill,
        department: worker.department,
        salaryType: worker.salaryType,
        salary: worker.salary,
        salaryNotes: worker.salaryNotes || '',
        overtimeRate: worker.overtimeRate || 0,
        status: worker.status,
        shift: worker.shift || 'Shift A (8:00 AM - 8:00 PM)',
        joiningDate: worker.joiningDate,
        address: worker.address,
        emergencyContact: worker.emergencyContact || '',
        aadharNumber: worker.aadharNumber || ''
      });
      setSalaryInput(worker.salary !== undefined ? String(worker.salary) : '');
      setOvertimeInput(worker.overtimeRate !== undefined && worker.overtimeRate > 0 ? String(worker.overtimeRate) : '');
    }
  }, [worker, isOpen]);

  if (!worker) return null;

  const currentSalaryNum = parseFloat(salaryInput.replace(/,/g, '')) || 0;
  const salaryType = formData.salaryType || 'Monthly Fixed';

  const getSalarySuffix = () => {
    switch (salaryType) {
      case 'Daily Wage':
        return '/ day';
      case 'Hourly Rate':
        return '/ hr';
      case 'Piece Rate (Karigar)':
        return '/ piece';
      default:
        return '/ month';
    }
  };

  const getSalaryHelperText = () => {
    if (salaryType === 'Monthly Fixed') {
      const perDay = Math.round(currentSalaryNum / 26);
      return `Monthly rate: ₹${currentSalaryNum.toLocaleString('en-IN')} (~₹${perDay.toLocaleString('en-IN')} / working day based on 26 days)`;
    }
    if (salaryType === 'Daily Wage') {
      const estMonthly = currentSalaryNum * 26;
      return `Daily rate: ₹${currentSalaryNum.toLocaleString('en-IN')} (~₹${estMonthly.toLocaleString('en-IN')} estimated for 26 days)`;
    }
    if (salaryType === 'Hourly Rate') {
      const estDaily = currentSalaryNum * 8;
      const estMonthly = estDaily * 26;
      return `Hourly rate: ₹${currentSalaryNum.toLocaleString('en-IN')}/hr (~₹${estDaily.toLocaleString('en-IN')}/day for 8h shift, ~₹${estMonthly.toLocaleString('en-IN')}/month)`;
    }
    if (salaryType === 'Piece Rate (Karigar)') {
      return `Piece-work rate: ₹${currentSalaryNum.toLocaleString('en-IN')} per unit passed in QC inspection.`;
    }
    return '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parsedSalary = parseFloat(salaryInput.replace(/,/g, '')) || 0;
    const parsedOT = parseFloat(overtimeInput.replace(/,/g, '')) || 0;

    const updatedData: Partial<Worker> = {
      ...formData,
      salary: parsedSalary,
      overtimeRate: parsedOT
    };

    updateWorker(worker.id, updatedData);

    const fullUpdated: Worker = {
      ...worker,
      ...updatedData
    } as Worker;

    showToast({
      title: 'Worker Wage Saved',
      message: `Updated rate: ₹${parsedSalary.toLocaleString('en-IN')} ${getSalarySuffix()} for ${formData.name}.`,
      type: 'success'
    });

    if (onSaved) {
      onSaved(fullUpdated);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Karigar: ${worker.name}`}
      subtitle={`Worker ID: ${worker.workerId} • Type custom amount via keyboard`}
      maxWidth="750px"
    >
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Top Info Banner */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            backgroundColor: 'var(--color-bg-subtle)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border-subtle)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserCheck size={18} style={{ color: 'var(--color-brand-primary)' }} />
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                Factory Record Code:
              </span>
              <span className="mono-code">{worker.workerId}</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
              Joined: {worker.joiningDate}
            </div>
          </div>

          {/* Row 1: Name & Mobile */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <FormField
              label="Full Name of Karigar"
              required
              placeholder="e.g. Rajeshbhai Panchal"
              value={formData.name || ''}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
            <FormField
              label="Mobile Number"
              required
              placeholder="+91 98250 XXXXX"
              value={formData.mobile || ''}
              onChange={e => setFormData({ ...formData, mobile: e.target.value })}
            />
          </div>

          {/* Row 2: Skill & Department */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <SelectField
              label="Primary Trade / Skill"
              required
              options={[
                { value: 'CNC Operator', label: 'CNC Operator' },
                { value: 'VMC Specialist', label: 'VMC Specialist' },
                { value: 'Lathe Master', label: 'Lathe Master' },
                { value: 'Tool & Die Maker', label: 'Tool & Die Maker' },
                { value: 'Welder / Fabricator', label: 'Welder / Fabricator' },
                { value: 'Assembly Specialist', label: 'Assembly Specialist' },
                { value: 'Helper / Trainee', label: 'Helper / Trainee' },
              ]}
              otherPlaceholder="Type custom skill / trade, e.g. Surface Grinder..."
              value={formData.skill ?? ''}
              onChange={e => setFormData({ ...formData, skill: e.target.value as WorkerSkill })}
            />

            <SelectField
              label="Department"
              required
              options={[
                { value: 'Machining', label: 'Machining' },
                { value: 'Fabrication', label: 'Fabrication' },
                { value: 'Quality & Inspection', label: 'Quality & Inspection' },
                { value: 'Tool Room', label: 'Tool Room' },
                { value: 'Assembly & Packing', label: 'Assembly & Packing' },
                { value: 'Store', label: 'Store' },
                { value: 'Maintenance', label: 'Maintenance' },
              ]}
              otherPlaceholder="Type custom department, e.g. Anodizing Plant..."
              value={formData.department ?? ''}
              onChange={e => setFormData({ ...formData, department: e.target.value as WorkerDepartment })}
            />
          </div>

          {/* SECTION: WAGE & SALARY RATE MANUAL KEYBOARD ENTRY */}
          <div style={{
            padding: '16px',
            backgroundColor: 'var(--color-bg-subtle)',
            border: '2px solid var(--color-brand-primary-border)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-brand-primary)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Keyboard size={16} />
                <span>Salary / Wage Amount (Type with Keyboard)</span>
              </div>
              <span className="status-badge status-badge-active" style={{ fontSize: '11px' }}>
                Keyboard Input Ready
              </span>
            </div>

            {/* Row: Salary Type & Direct Keyboard Typing Input */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '14px' }}>
              <SelectField
                label="Salary Structure Type"
                required
                options={[
                  { value: 'Monthly Fixed', label: 'Monthly Fixed Wage' },
                  { value: 'Daily Wage', label: 'Daily Wage (Per Day)' },
                  { value: 'Hourly Rate', label: 'Hourly Rate (Per Hour)' },
                  { value: 'Piece Rate (Karigar)', label: 'Piece Rate (Per Unit)' },
                ]}
                value={formData.salaryType || 'Monthly Fixed'}
                onChange={e => setFormData({ ...formData, salaryType: e.target.value as SalaryType })}
              />

              <div>
                <FormField
                  label="Type Salary / Rate (₹)"
                  prefix={<span style={{ fontWeight: 700, color: 'var(--color-brand-primary)' }}>₹</span>}
                  suffix={<span style={{ fontWeight: 600 }}>{getSalarySuffix()}</span>}
                  required
                  type="text"
                  inputMode="decimal"
                  placeholder="Type any amount, e.g. 28500 or 850"
                  value={salaryInput}
                  onChange={e => {
                    // Accept digits, decimals, and commas directly from keyboard
                    const val = e.target.value;
                    if (/^[0-9.,]*$/.test(val)) {
                      setSalaryInput(val);
                    }
                  }}
                  style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: 'var(--color-text-primary)'
                  }}
                />
              </div>
            </div>

            {/* Calculation Preview Banner */}
            <div style={{
              fontSize: '12px',
              color: 'var(--color-text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#ffffff',
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border-subtle)'
            }}>
              <Calculator size={14} style={{ color: 'var(--color-brand-primary)', flexShrink: 0 }} />
              <span>{getSalaryHelperText()}</span>
            </div>

            {/* Optional Overtime & Custom Wage Formula Note */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px', marginTop: '2px' }}>
              <FormField
                label="Overtime Rate (Optional)"
                prefix="₹"
                suffix="/ hr"
                type="text"
                inputMode="decimal"
                placeholder="0"
                value={overtimeInput}
                onChange={e => {
                  const val = e.target.value;
                  if (/^[0-9.,]*$/.test(val)) {
                    setOvertimeInput(val);
                  }
                }}
              />
              <FormField
                label="Custom Wage Notes (Optional)"
                placeholder="e.g. ₹15/pc with ₹2 bonus for >150 pcs/day"
                value={formData.salaryNotes || ''}
                onChange={e => setFormData({ ...formData, salaryNotes: e.target.value })}
              />
            </div>
          </div>

          {/* Row: Status & Shift */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <SelectField
              label="Employment Status"
              required
              options={[
                { value: 'Active', label: 'Active (On Duty)' },
                { value: 'On Leave', label: 'On Leave' },
                { value: 'Inactive', label: 'Inactive' },
                { value: 'Terminated', label: 'Terminated' },
              ]}
              value={formData.status ?? 'Active'}
              onChange={e => setFormData({ ...formData, status: e.target.value as WorkerStatus })}
            />

            <SelectField
              label="Shift Allocation"
              options={[
                { value: 'Shift A (8:00 AM - 8:00 PM)', label: 'Shift A (8:00 AM - 8:00 PM)' },
              ]}
              allowOther={true}
              otherPlaceholder="Specify custom shift, e.g. Night Shift (8:00 PM - 8:00 AM)"
              value={formData.shift ?? 'Shift A (8:00 AM - 8:00 PM)'}
              onChange={e => setFormData({ ...formData, shift: e.target.value })}
            />
          </div>

          {/* Row: Address & Emergency Contact */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '14px' }}>
            <FormField
              label="Residential Address"
              placeholder="House/Society, Area, GIDC, City"
              value={formData.address || ''}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
            />

            <FormField
              label="Emergency Contact"
              placeholder="+91 98250 XXXXX"
              value={formData.emergencyContact || ''}
              onChange={e => setFormData({ ...formData, emergencyContact: e.target.value })}
            />
          </div>
        </div>

        {/* Modal Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px', paddingTop: '14px', borderTop: '1px solid var(--color-border-subtle)' }}>
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" icon={<Save size={14} />} type="submit">
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};
