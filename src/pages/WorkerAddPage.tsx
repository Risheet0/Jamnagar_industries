import React, { useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { FormField } from '../components/common/FormField';
import { SelectField } from '../components/common/SelectField';
import { DatePicker } from '../components/common/DatePicker';
import { Button } from '../components/common/Button';
import { useNavigation } from '../context/NavigationContext';
import { useToast } from '../context/ToastContext';
import { UserPlus, ArrowLeft, Save } from 'lucide-react';

export const WorkerAddPage: React.FC = () => {
  const { navigate } = useNavigation();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    address: '',
    joiningDate: new Date().toISOString().split('T')[0],
    skill: 'CNC Operator',
    department: 'Machining',
    salaryType: 'Monthly Fixed',
    salary: '28000',
    shift: 'Shift A (Morning)',
    emergencyContact: '',
    aadharNumber: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showToast({
      title: 'Worker Record Created (Mock)',
      message: `${formData.name} successfully added to factory database.`,
      type: 'success'
    });
    navigate('/workers');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader
        title="Add New Karigar / Worker"
        description="Register a new factory technician, set trade skills, salary type, and assigned production department."
        breadcrumbs={[
          { label: 'Workers', path: '/workers' },
          { label: 'Add New' }
        ]}
        actions={
          <Button
            variant="secondary"
            icon={<ArrowLeft size={14} />}
            onClick={() => navigate('/workers')}
          >
            Back to Workers
          </Button>
        }
      />

      <div className="card" style={{ maxWidth: '850px' }}>
        <div className="card-header">
          <div className="card-title">
            <UserPlus size={16} style={{ color: 'var(--color-brand-primary)' }} />
            <span>Worker Information Form</span>
          </div>
          <span className="mono-code">Auto ID: WRK-009</span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormField
                label="Full Name of Karigar"
                required
                placeholder="e.g. Mukeshbhai Panchal"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
              <FormField
                label="Mobile Contact Number"
                required
                placeholder="+91 98250 XXXXX"
                value={formData.mobile}
                onChange={e => setFormData({ ...formData, mobile: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <SelectField
                label="Primary Skill / Trade"
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
                value={formData.skill}
                onChange={e => setFormData({ ...formData, skill: e.target.value })}
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
                ]}
                value={formData.department}
                onChange={e => setFormData({ ...formData, department: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <SelectField
                label="Salary Type"
                required
                options={[
                  { value: 'Monthly Fixed', label: 'Monthly Fixed' },
                  { value: 'Daily Wage', label: 'Daily Wage' },
                  { value: 'Piece Rate (Karigar)', label: 'Piece Rate (Karigar)' },
                ]}
                value={formData.salaryType}
                onChange={e => setFormData({ ...formData, salaryType: e.target.value })}
              />

              <FormField
                label="Salary / Rate (₹)"
                prefix="₹"
                required
                type="number"
                value={formData.salary}
                onChange={e => setFormData({ ...formData, salary: e.target.value })}
              />

              <DatePicker
                label="Joining Date"
                required
                value={formData.joiningDate}
                onChange={e => setFormData({ ...formData, joiningDate: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <SelectField
                label="Assigned Plant Shift"
                options={[
                  { value: 'General', label: 'General (09:00 - 17:30)' },
                  { value: 'Shift A (Morning)', label: 'Shift A (Morning 08:00 - 16:30)' },
                  { value: 'Shift B (Evening)', label: 'Shift B (Evening 16:30 - 01:00)' },
                  { value: 'Shift C (Night)', label: 'Shift C (Night 01:00 - 08:00)' },
                ]}
                value={formData.shift}
                onChange={e => setFormData({ ...formData, shift: e.target.value })}
              />

              <FormField
                label="Emergency Contact Number"
                placeholder="+91 98250 XXXXX"
                value={formData.emergencyContact}
                onChange={e => setFormData({ ...formData, emergencyContact: e.target.value })}
              />
            </div>

            <FormField
              label="Residential Address"
              placeholder="House/Society, Area, GIDC, City"
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="card-footer">
            <Button variant="secondary" onClick={() => navigate('/workers')} type="button">
              Cancel
            </Button>
            <Button variant="primary" icon={<Save size={14} />} type="submit">
              Save Worker
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
