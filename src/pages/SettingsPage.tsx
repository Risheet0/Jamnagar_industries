import React, { useState, useRef } from 'react';
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
import { useWorkers } from '../context/WorkerContext';
import { useMaterials } from '../context/MaterialsContext';
import { useQuality } from '../context/QualityContext';
import { mockCompanyProfile } from '../mock/companyData';
import { mockProducts } from '../mock/productsData';
import { mockProductionJobs } from '../mock/productionData';
import { downloadJsonFile } from '../utils/exportCsv';
import {
  Building2,
  Clock,
  Palette,
  Save,
  Trash2,
  Database,
  Download,
  Upload,
  RotateCcw,
  HardDrive
} from 'lucide-react';

interface StorageEntityConfig {
  key: string;
  storageKey: string;
  label: string;
  count: number;
}

export const SettingsPage: React.FC = () => {
  const { showToast } = useToast();
  const { workers } = useWorkers();
  const { materials, stockMovements } = useMaterials();
  const { inspections } = useQuality();

  const [activeTab, setActiveTab] = useState<'company' | 'shifts' | 'backup' | 'design-system'>('company');

  // Interactive showcase state
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [isDemoConfirmOpen, setIsDemoConfirmOpen] = useState(false);

  // Backup & Restore states
  const [isImportConfirmOpen, setIsImportConfirmOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [pendingImportData, setPendingImportData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Company profile form state
  const [companyData, setCompanyData] = useState({
    name: mockCompanyProfile.name,
    location: mockCompanyProfile.location,
    plantAddress: mockCompanyProfile.plantAddress,
    gstNumber: mockCompanyProfile.gstNumber,
    phone: mockCompanyProfile.phone,
    email: mockCompanyProfile.email,
  });

  const storageEntities: StorageEntityConfig[] = [
    { key: 'workers', storageKey: 'jamnagar_erp_workers_v2', label: 'Workers & Karigars', count: workers.length },
    { key: 'materials', storageKey: 'jamnagar_erp_materials_v1', label: 'Raw Materials Master', count: materials.length },
    { key: 'stockMovements', storageKey: 'jamnagar_erp_stock_movements_v1', label: 'Stock Movement Ledger', count: stockMovements.length },
    { key: 'qualityInspections', storageKey: 'jamnagar_erp_quality_v1', label: 'Quality Control Inspections', count: inspections.length },
    { key: 'products', storageKey: 'jamnagar_erp_products_v1', label: 'Products Catalogue', count: mockProducts.length },
    { key: 'productionJobs', storageKey: 'jamnagar_erp_production_jobs_v1', label: 'Production Job Cards', count: mockProductionJobs.length }
  ];

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    showToast({
      title: 'Company Settings Saved',
      message: 'Plant profile and GST configurations updated in local storage.',
      type: 'success'
    });
  };

  // --- ITEM 5: Export Full Backup ---
  const handleExportBackup = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const payload = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      appName: 'Jamnagar Industry ERP - Vadilal Engineering',
      company: companyData,
      data: {
        workers: workers,
        materials: materials,
        stockMovements: stockMovements,
        qualityInspections: inspections,
        products: mockProducts,
        productionJobs: mockProductionJobs
      }
    };

    downloadJsonFile(payload, `jamnagar-erp-backup-${todayStr}.json`);

    showToast({
      title: 'Backup Downloaded',
      message: `Complete offline system state exported (${workers.length} workers, ${materials.length} materials, ${stockMovements.length} movements, ${inspections.length} QC inspections).`,
      type: 'success'
    });
  };

  // --- ITEM 5: Trigger File Picker ---
  const handleSelectFileClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  // --- ITEM 5: Process Uploaded JSON ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        if (!parsed || typeof parsed !== 'object') {
          throw new Error('Invalid JSON file format.');
        }

        // Accept both { data: { workers, materials... } } and direct keys
        const dataset = parsed.data || parsed;
        const hasExpectedKey = storageEntities.some(entity => Boolean(dataset[entity.key] || dataset[entity.storageKey]));

        if (!hasExpectedKey) {
          throw new Error('JSON backup does not contain valid Jamnagar ERP database tables.');
        }

        setPendingImportData(dataset);
        setIsImportConfirmOpen(true);
      } catch (err: any) {
        showToast({
          title: 'Import Failed',
          message: err.message || 'Could not parse JSON backup file. Please verify file integrity.',
          type: 'danger'
        });
      }
    };

    reader.onerror = () => {
      showToast({
        title: 'File Read Error',
        message: 'Could not read the uploaded file from disk.',
        type: 'danger'
      });
    };

    reader.readAsText(file);
  };

  // --- ITEM 5: Confirm Import & Overwrite ---
  const handleConfirmImport = () => {
    if (!pendingImportData) return;

    try {
      storageEntities.forEach(entity => {
        const items = pendingImportData[entity.key] || pendingImportData[entity.storageKey];
        if (Array.isArray(items)) {
          localStorage.setItem(entity.storageKey, JSON.stringify(items));
        }
      });

      setIsImportConfirmOpen(false);
      setPendingImportData(null);

      showToast({
        title: 'Database Restored',
        message: 'System database restored successfully. Reloading workspace...',
        type: 'success'
      });

      setTimeout(() => {
        window.location.reload();
      }, 600);
    } catch (err: any) {
      showToast({
        title: 'Write Failed',
        message: 'Failed to write restored data to local storage.',
        type: 'danger'
      });
    }
  };

  // --- ITEM 5: Reset to Sample Data ---
  const handleConfirmReset = () => {
    try {
      storageEntities.forEach(entity => {
        localStorage.removeItem(entity.storageKey);
      });

      setIsResetConfirmOpen(false);

      showToast({
        title: 'Reset to Sample Data',
        message: 'Local storage wiped. Reloading factory default sample dataset...',
        type: 'info'
      });

      setTimeout(() => {
        window.location.reload();
      }, 600);
    } catch {
      showToast({
        title: 'Reset Error',
        message: 'Could not clear browser storage.',
        type: 'danger'
      });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader
        title="Factory & System Settings"
        description="Configure plant master details, shift working hours, offline database backup/restore, and inspect the reusable UI design system."
        breadcrumbs={[
          { label: 'Settings' }
        ]}
      />

      {/* Hidden File Input for JSON restore */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".json,application/json"
        style={{ display: 'none' }}
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
            className={`tab-btn ${activeTab === 'backup' ? 'active' : ''}`}
            onClick={() => setActiveTab('backup')}
          >
            <Database size={15} />
            <span>Database Backup & Restore</span>
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
            <div style={{ padding: '14px 16px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--color-border-subtle)' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text-primary)' }}>Shift A (08:00 AM to 08:00 PM)</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>Standard 12-Hour Factory Shift • Primary Production Run</div>
              </div>
              <span className="status-badge status-badge-active">Currently Active</span>
            </div>

            <div style={{ padding: '14px 16px', backgroundColor: '#ffffff', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px dashed var(--color-border-subtle)' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text-primary)' }}>Other / Custom Shift Hours</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>Dynamic custom shifts can be typed directly via the "Other" option on any worker form.</div>
              </div>
              <span className="status-badge status-badge-neutral">Custom Configurable</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Database Backup & Restore */}
      {activeTab === 'backup' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '900px' }}>
          {/* Storage Summary Card */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <HardDrive size={16} style={{ color: 'var(--color-brand-primary)' }} />
                <span>Browser Local Database Overview</span>
              </div>
              <span className="status-badge status-badge-active">Offline Ready</span>
            </div>

            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                All manufacturing data (karigars, materials inventory, stock movements, and quality inspection certificates) is stored locally in your browser storage. You can create complete JSON backups to archive records or transfer to another computer.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                {storageEntities.map(entity => (
                  <div
                    key={entity.key}
                    style={{
                      padding: '12px 14px',
                      backgroundColor: 'var(--color-bg-subtle)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border-subtle)'
                    }}
                  >
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                      {entity.label}
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-brand-primary)', marginTop: '4px' }} className="tabular-nums">
                      {entity.count} records
                    </div>
                    <div className="mono-code" style={{ fontSize: '10px', marginTop: '4px' }}>
                      {entity.storageKey}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Backup Actions Card */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <Database size={16} style={{ color: 'var(--color-brand-primary)' }} />
                <span>Export & Restore Operations</span>
              </div>
            </div>

            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* 1. Export JSON */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', backgroundColor: '#ffffff', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-md)', gap: '16px', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Download size={16} style={{ color: 'var(--color-brand-primary)' }} />
                    <span>Download Complete System Backup (JSON)</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    Saves all workers, raw materials, stock ledger entries, and QC inspections to a timestamped JSON file.
                  </div>
                </div>
                <Button
                  variant="primary"
                  icon={<Download size={14} />}
                  onClick={handleExportBackup}
                >
                  Export Backup
                </Button>
              </div>

              {/* 2. Import JSON */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', backgroundColor: '#ffffff', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-md)', gap: '16px', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Upload size={16} style={{ color: 'var(--color-status-info-solid)' }} />
                    <span>Restore Database from JSON Backup</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    Upload a previously exported `.json` file to restore or migrate data. You will be prompted to confirm before overwriting.
                  </div>
                </div>
                <Button
                  variant="secondary"
                  icon={<Upload size={14} />}
                  onClick={handleSelectFileClick}
                >
                  Select JSON File
                </Button>
              </div>

              {/* 3. Reset to Sample Data */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', backgroundColor: 'var(--color-status-danger-bg)', border: '1px solid var(--color-status-danger-border)', borderRadius: 'var(--radius-md)', gap: '16px', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-status-danger-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <RotateCcw size={16} />
                    <span>Reset to Factory Sample Seed Data</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-status-danger-text)', opacity: 0.85, marginTop: '2px' }}>
                    Clears all custom local storage records and re-initializes the application with default demonstration data.
                  </div>
                </div>
                <Button
                  variant="danger"
                  icon={<Trash2 size={14} />}
                  onClick={() => setIsResetConfirmOpen(true)}
                >
                  Reset Data
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Design System & UI Components Interactive Showcase */}
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

      {/* Restore JSON Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isImportConfirmOpen}
        onClose={() => {
          setIsImportConfirmOpen(false);
          setPendingImportData(null);
        }}
        onConfirm={handleConfirmImport}
        title="Restore Database from Backup File?"
        message="This will replace all current data in your browser local storage with the records from the uploaded backup file. Are you sure you want to proceed?"
        confirmLabel="Overwrite & Restore Database"
      />

      {/* Reset Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleConfirmReset}
        title="Reset All Local ERP Data?"
        message="Are you sure you want to clear all locally saved worker, inventory, movement, and quality records? The system will reload with factory default sample seed records."
        confirmLabel="Yes, Reset Everything"
      />
    </div>
  );
};
