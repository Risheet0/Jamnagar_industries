import React, { useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/common/Button';
import { StatusBadge } from '../components/common/StatusBadge';
import { FormField } from '../components/common/FormField';
import { SelectField } from '../components/common/SelectField';
import { DatePicker } from '../components/common/DatePicker';
import { Modal } from '../components/common/Modal';
import { ConfirmationDialog } from '../components/common/ConfirmationDialog';
import { EmptyState, ErrorState } from '../components/common/EmptyState';
import { useToast } from '../context/ToastContext';
import { mockCompanyProfile } from '../mock/companyData';
import {
  Building2,
  Clock,
  Palette,
  Save,
  Trash2
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'company' | 'shifts' | 'design-system'>('company');

  // Interactive showcase state
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [isDemoConfirmOpen, setIsDemoConfirmOpen] = useState(false);

  // Company profile form state
  const [companyData, setCompanyData] = useState({
    name: mockCompanyProfile.name,
    location: mockCompanyProfile.location,
    plantAddress: mockCompanyProfile.plantAddress,
    gstNumber: mockCompanyProfile.gstNumber,
    phone: mockCompanyProfile.phone,
    email: mockCompanyProfile.email,
  });

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    showToast({
      title: 'Company Settings Saved',
      message: 'Plant profile and GST configurations updated in local storage.',
      type: 'success'
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader
        title="Factory & System Settings"
        description="Configure plant master details, shift working hours, backup storage, and inspect the reusable UI design system."
        breadcrumbs={[
          { label: 'Settings' }
        ]}
      />

      {/* Tabs Header */}
      <div className="card" style={{ padding: 0 }}>
        <div className="tabs-header">
          <button
            type="button"
            className={`tab-btn ${activeTab === 'company' ? 'active' : ''}`}
            onClick={() => setActiveTab('company')}
          >
            <Building2 size={15} />
            <span>Company Profile</span>
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'shifts' ? 'active' : ''}`}
            onClick={() => setActiveTab('shifts')}
          >
            <Clock size={15} />
            <span>Shift Timings</span>
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'design-system' ? 'active' : ''}`}
            onClick={() => setActiveTab('design-system')}
          >
            <Palette size={15} />
            <span>Design System & UI Components</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Company Profile */}
      {activeTab === 'company' && (
        <div className="card" style={{ maxWidth: '850px' }}>
          <div className="card-header">
            <div className="card-title">
              <Building2 size={16} style={{ color: 'var(--color-brand-primary)' }} />
              <span>Plant & Company Master</span>
            </div>
            <span className="mono-code">Offline Mode</span>
          </div>

          <form onSubmit={handleSaveCompany}>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <FormField
                  label="Company / Enterprise Name"
                  required
                  value={companyData.name}
                  onChange={e => setCompanyData({ ...companyData, name: e.target.value })}
                />
                <FormField
                  label="Location / City"
                  required
                  value={companyData.location}
                  onChange={e => setCompanyData({ ...companyData, location: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <FormField
                  label="GSTIN Identification Number"
                  required
                  value={companyData.gstNumber}
                  onChange={e => setCompanyData({ ...companyData, gstNumber: e.target.value })}
                />
                <FormField
                  label="Factory Landline / Phone"
                  value={companyData.phone}
                  onChange={e => setCompanyData({ ...companyData, phone: e.target.value })}
                />
              </div>

              <FormField
                label="Full Plant / Works Address"
                value={companyData.plantAddress}
                onChange={e => setCompanyData({ ...companyData, plantAddress: e.target.value })}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <FormField
                  label="Official Email Contact"
                  value={companyData.email}
                  onChange={e => setCompanyData({ ...companyData, email: e.target.value })}
                />
                <FormField
                  label="Current Logged In Role"
                  disabled
                  value={`${mockCompanyProfile.currentUser.role} (${mockCompanyProfile.currentUser.username})`}
                />
              </div>
            </div>

            <div className="card-footer">
              <Button variant="primary" icon={<Save size={14} />} type="submit">
                Save Company Profile
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Shifts */}
      {activeTab === 'shifts' && (
        <div className="card" style={{ maxWidth: '850px' }}>
          <div className="card-header">
            <div className="card-title">
              <Clock size={16} style={{ color: 'var(--color-brand-primary)' }} />
              <span>Plant Shift Schedule</span>
            </div>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ padding: '12px 16px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 600 }}>Shift A (Morning Shift)</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>08:00 AM to 04:30 PM (Lunch 01:00 PM - 01:30 PM)</div>
              </div>
              <span className="status-badge status-badge-active">Currently Active</span>
            </div>

            <div style={{ padding: '12px 16px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 600 }}>Shift B (Evening Shift)</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>04:30 PM to 01:00 AM (Dinner 08:30 PM - 09:00 PM)</div>
              </div>
              <span className="status-badge status-badge-neutral">Scheduled</span>
            </div>

            <div style={{ padding: '12px 16px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 600 }}>Shift C (Night Shift)</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>01:00 AM to 08:00 AM (Continuous Machining)</div>
              </div>
              <span className="status-badge status-badge-neutral">Scheduled</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Design System & UI Components Interactive Showcase */}
      {activeTab === 'design-system' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* 1. Buttons Showcase */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">1. Button Variants & Sizes</div>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                <Button variant="primary">Primary Action</Button>
                <Button variant="secondary">Secondary Action</Button>
                <Button variant="outline">Outline Action</Button>
                <Button variant="success">Success Action</Button>
                <Button variant="danger">Danger Action</Button>
                <Button variant="danger-outline">Danger Outline</Button>
                <Button variant="ghost">Ghost Button</Button>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                <Button variant="primary" size="sm">Small Primary</Button>
                <Button variant="secondary" size="sm">Small Secondary</Button>
                <Button variant="primary" size="md">Medium Primary</Button>
                <Button variant="primary" size="lg">Large Primary</Button>
                <Button variant="primary" isLoading>Loading State</Button>
              </div>
            </div>
          </div>

          {/* 2. Status Badges Showcase */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">2. Industrial Status Badges</div>
            </div>
            <div className="card-body" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
              <StatusBadge status="Active" />
              <StatusBadge status="Completed" />
              <StatusBadge status="Passed" />
              <StatusBadge status="In Stock" />
              <StatusBadge status="In Production" />
              <StatusBadge status="Pending" />
              <StatusBadge status="Low Stock" />
              <StatusBadge status="Delayed" />
              <StatusBadge status="Quality Check" />
              <StatusBadge status="Rejected" />
              <StatusBadge status="Out of Stock" />
              <StatusBadge status="Inactive" />
              <StatusBadge status="Terminated" />
              <StatusBadge status="Sample / Prototype" />
            </div>
          </div>

          {/* 3. Typography & Code Tags */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">3. Industrial Typography & Monospace Codes</div>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <span className="mono-code">WRK-001</span>
                <span className="mono-code">MAT-BRS-ROD-25</span>
                <span className="mono-code">PRD-BRS-FIT-01</span>
                <span className="mono-code">JOB-2026-001</span>
                <span className="mono-code mono-code-contrast">DWG-2026-REV3</span>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                Indian Rupee Currency Formatting: <strong className="tabular-nums" style={{ color: 'var(--color-text-primary)' }}>₹1,45,280.00</strong>
              </div>
            </div>
          </div>

          {/* 4. Form Inputs */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">4. Form Controls & Validation UI</div>
            </div>
            <div className="card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <FormField label="Standard Input" placeholder="Enter text..." />
              <FormField label="Price Input with Prefix" prefix="₹" placeholder="5000" />
              <FormField label="Weight with Suffix" suffix="kg" placeholder="250" />
              <FormField label="Input with Error" required error="This field is mandatory" defaultValue="" />
              <SelectField
                label="Select Dropdown"
                options={[
                  { value: '1', label: 'Option Alpha' },
                  { value: '2', label: 'Option Beta' },
                ]}
              />
              <DatePicker label="Industrial Date Picker" defaultValue="2026-09-10" />
            </div>
          </div>

          {/* 5. Modals, Toasts & Dialogs */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">5. Interactive Modals & Toast Triggers</div>
            </div>
            <div className="card-body" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              <Button
                variant="primary"
                onClick={() => setIsDemoModalOpen(true)}
              >
                Open Demo Modal
              </Button>
              <Button
                variant="danger"
                icon={<Trash2 size={14} />}
                onClick={() => setIsDemoConfirmOpen(true)}
              >
                Open Delete Confirmation
              </Button>
              <Button
                variant="success"
                onClick={() => showToast({ title: 'Production Started', message: 'Batch run scheduled on CNC Lathe 01.', type: 'success' })}
              >
                Trigger Success Toast
              </Button>
              <Button
                variant="outline"
                onClick={() => showToast({ title: 'Low Coolant Warning', message: 'Check coolant tank level on VMC 02.', type: 'warning' })}
              >
                Trigger Warning Toast
              </Button>
            </div>
          </div>

          {/* 6. Empty & Error States */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <EmptyState
              title="No inspection records found"
              description="No quality inspection batches have been logged for this shift yet."
              actionLabel="Add First Inspection"
              onAction={() => showToast({ title: 'Add Inspection Clicked', type: 'info' })}
            />
            <ErrorState
              title="Failed to load spindle telemetry"
              message="CNC machine sensor communication timeout."
              onRetry={() => showToast({ title: 'Retrying connection...', type: 'info' })}
            />
          </div>
        </div>
      )}

      {/* Demo Modal */}
      <Modal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        title="Sample Reusable Industrial Modal"
        subtitle="Standardized header, body, and action footer"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsDemoModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => { setIsDemoModalOpen(false); showToast({ title: 'Modal Action Confirmed', type: 'success' }); }}>
              Confirm Action
            </Button>
          </>
        }
      >
        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
          This modal demonstrates the standard dialog component designed for adding, editing, and inspecting manufacturing data.
        </p>
      </Modal>

      {/* Demo Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDemoConfirmOpen}
        onClose={() => setIsDemoConfirmOpen(false)}
        onConfirm={() => {
          setIsDemoConfirmOpen(false);
          showToast({ title: 'Record Deleted', message: 'Item permanently removed from local database.', type: 'danger' });
        }}
        title="Delete Production Job JOB-2026-999?"
        message="Are you sure you want to delete this job card and all linked time logs?"
        confirmLabel="Confirm Delete"
      />
    </div>
  );
};
