import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { FormField } from './FormField';
import { SelectField } from './SelectField';
import { DatePicker } from './DatePicker';
import { useNavigation } from '../../context/NavigationContext';
import { useToast } from '../../context/ToastContext';
import { UserPlus, PackagePlus, Box, PlusCircle, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

type QuickAddCategory = 'worker' | 'material' | 'product' | 'job' | 'inward' | 'outward';

export const QuickAddModal: React.FC = () => {
  const { isQuickAddOpen, closeQuickAdd, quickAddType, navigate } = useNavigation();
  const { showToast } = useToast();
  const [selectedTab, setSelectedTab] = useState<QuickAddCategory>('worker');

  useEffect(() => {
    if (quickAddType && ['worker', 'material', 'product', 'job', 'inward', 'outward'].includes(quickAddType)) {
      setSelectedTab(quickAddType as QuickAddCategory);
    } else {
      setSelectedTab('worker');
    }
  }, [quickAddType, isQuickAddOpen]);

  // Form submit handlers (mock local submission + toast + redirect)
  const handleWorkerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showToast({
      title: 'Worker Record Created (Mock)',
      message: 'New Karigar profile initialized successfully in local dataset.',
      type: 'success'
    });
    closeQuickAdd();
    navigate('/workers');
  };

  const handleMaterialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showToast({
      title: 'Material Registered (Mock)',
      message: 'Raw material stock item created in inventory master.',
      type: 'success'
    });
    closeQuickAdd();
    navigate('/materials');
  };

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showToast({
      title: 'Product Added (Mock)',
      message: 'New manufactured component registered in production catalogue.',
      type: 'success'
    });
    closeQuickAdd();
    navigate('/products');
  };

  const handleJobSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showToast({
      title: 'Production Job Card Issued (Mock)',
      message: 'Job scheduled on shop floor machine.',
      type: 'success'
    });
    closeQuickAdd();
    navigate('/production/jobs');
  };

  const handleInwardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showToast({
      title: 'Material Inward Recorded (Mock)',
      message: 'Stock balance updated with inward challan.',
      type: 'success'
    });
    closeQuickAdd();
    navigate('/materials/inward');
  };

  const handleOutwardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showToast({
      title: 'Material Outward Issued (Mock)',
      message: 'Raw material issued to machine operator.',
      type: 'info'
    });
    closeQuickAdd();
    navigate('/materials/outward');
  };

  const categories = [
    { id: 'worker', label: 'Add Worker', icon: <UserPlus size={15} /> },
    { id: 'material', label: 'Add Material', icon: <PackagePlus size={15} /> },
    { id: 'product', label: 'Add Product', icon: <Box size={15} /> },
    { id: 'job', label: 'Create Job', icon: <PlusCircle size={15} /> },
    { id: 'inward', label: 'Material Inward', icon: <ArrowDownLeft size={15} /> },
    { id: 'outward', label: 'Material Outward', icon: <ArrowUpRight size={15} /> },
  ];

  return (
    <Modal
      isOpen={isQuickAddOpen}
      onClose={closeQuickAdd}
      title="Quick Entry / Industrial Transaction"
      subtitle="Fast data capture dialog for manufacturing operations"
      maxWidth="680px"
    >
      <div>
        {/* Category Selector Tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '20px' }}>
          {categories.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedTab(cat.id as QuickAddCategory)}
              className={`btn btn-sm ${selectedTab === cat.id ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start', padding: '8px 12px', fontSize: '12px' }}
            >
              {cat.icon}
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Dynamic Category Forms */}
        {selectedTab === 'worker' && (
          <form onSubmit={handleWorkerSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <FormField label="Karigar / Worker Name" required placeholder="e.g. Bharatbhai Mistry" defaultValue="Jayesh Rathod" />
              <FormField label="Mobile Number" required placeholder="+91 98250 XXXXX" defaultValue="+91 98982 33441" />
              <SelectField
                label="Primary Skill"
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
                defaultValue="CNC Operator"
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
                defaultValue="Machining"
              />
              <SelectField
                label="Salary Type"
                required
                options={[
                  { value: 'Monthly Fixed', label: 'Monthly Fixed' },
                  { value: 'Daily Wage', label: 'Daily Wage' },
                  { value: 'Piece Rate (Karigar)', label: 'Piece Rate (Karigar)' },
                ]}
                defaultValue="Monthly Fixed"
              />
              <FormField label="Salary / Rate" prefix="₹" required placeholder="25000" defaultValue="28000" />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
              <Button variant="secondary" onClick={closeQuickAdd} type="button">Cancel</Button>
              <Button variant="primary" type="submit">+ Save Worker Record</Button>
            </div>
          </form>
        )}

        {selectedTab === 'material' && (
          <form onSubmit={handleMaterialSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <FormField label="Material Code" required placeholder="MAT-BRS-005" defaultValue="MAT-BRS-HEX-22" />
              <FormField label="Material Name" required placeholder="e.g. Brass Hex Rod 22mm" defaultValue="Brass Hex Rod CW614N 22mm" />
              <SelectField
                label="Material Type"
                required
                options={[
                  { value: 'Brass Bar / Rod', label: 'Brass Bar / Rod' },
                  { value: 'Stainless Steel', label: 'Stainless Steel' },
                  { value: 'Mild Steel', label: 'Mild Steel' },
                  { value: 'Aluminum Alloy', label: 'Aluminum Alloy' },
                  { value: 'Cutting Tool', label: 'Cutting Tool' },
                  { value: 'Consumable / Oil', label: 'Consumable / Oil' },
                ]}
                defaultValue="Brass Bar / Rod"
              />
              <FormField label="Grade / Spec" placeholder="e.g. IS 319 Gr I" defaultValue="IS 319 Gr 1" />
              <FormField label="Opening Stock" suffix="kg" required defaultValue="500" />
              <FormField label="Minimum Alert Stock" suffix="kg" required defaultValue="200" />
              <FormField label="Unit Price" prefix="₹" defaultValue="570" />
              <FormField label="Supplier Name" defaultValue="Jamnagar Brass Syndicate" />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
              <Button variant="secondary" onClick={closeQuickAdd} type="button">Cancel</Button>
              <Button variant="primary" type="submit">+ Save Material</Button>
            </div>
          </form>
        )}

        {selectedTab === 'product' && (
          <form onSubmit={handleProductSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <FormField label="Product Code" required defaultValue="PRD-BRS-ADPT-09" />
              <FormField label="Product Name" required defaultValue={'3/8" Brass Female Adapter'} />
              <FormField label="Drawing Number" defaultValue="DWG-2026-FA-09.pdf" />
              <FormField label="Drawing Revision" defaultValue="Rev 1.0" />
              <FormField label="Raw Material Used" defaultValue="Brass Hex Bar 19mm" />
              <FormField label="Unit Weight" suffix="g" defaultValue="94" />
              <FormField label="Target Cycle Time" suffix="sec" defaultValue="35" />
              <FormField label="Unit Price" prefix="₹" defaultValue="68" />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
              <Button variant="secondary" onClick={closeQuickAdd} type="button">Cancel</Button>
              <Button variant="primary" type="submit">+ Register Product</Button>
            </div>
          </form>
        )}

        {selectedTab === 'job' && (
          <form onSubmit={handleJobSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <FormField label="Job Card Number" required defaultValue="JOB-2026-006" />
              <FormField label="Customer / Order Ref" required defaultValue="Adani Gas Pipelines Unit" />
              <SelectField
                label="Product"
                required
                options={[
                  { value: 'PRD-001', label: 'PRD-001: 1/2" Male Hex Brass Flare Fitting' },
                  { value: 'PRD-002', label: 'PRD-002: 3/4" Full Bore Brass Valve Stem' },
                  { value: 'PRD-003', label: 'PRD-003: Precision SS 304 Pump Shaft' },
                ]}
                defaultValue="PRD-001"
              />
              <FormField label="Required Batch Quantity" suffix="pcs" required defaultValue="1500" />
              <SelectField
                label="Assigned Worker / Karigar"
                required
                options={[
                  { value: 'WRK-001', label: 'Rajeshbhai Panchal (CNC Operator)' },
                  { value: 'WRK-003', label: 'Hitesh Prajapati (Lathe Master)' },
                  { value: 'WRK-004', label: 'Dharmesh Vaghela (VMC Specialist)' },
                ]}
                defaultValue="WRK-001"
              />
              <FormField label="Target Machine / Station" defaultValue="CNC Lathe 01 (Doosan Lynx)" />
              <DatePicker label="Target Due Date" required defaultValue="2026-09-18" />
              <SelectField
                label="Job Priority"
                options={[
                  { value: 'Normal', label: 'Normal' },
                  { value: 'High', label: 'High' },
                  { value: 'Critical', label: 'Critical' },
                ]}
                defaultValue="High"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
              <Button variant="secondary" onClick={closeQuickAdd} type="button">Cancel</Button>
              <Button variant="primary" type="submit">Issue Job Card</Button>
            </div>
          </form>
        )}

        {selectedTab === 'inward' && (
          <form onSubmit={handleInwardSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <FormField label="Inward Challan / GRN No." required defaultValue="GRN-2026-09-44" />
              <DatePicker label="Receipt Date" required defaultValue="2026-09-10" />
              <SelectField
                label="Material"
                required
                options={[
                  { value: 'MAT-001', label: 'MAT-001: Brass Round Rod CW614N 25mm' },
                  { value: 'MAT-002', label: 'MAT-002: Brass Hex Bar 19mm' },
                  { value: 'MAT-003', label: 'MAT-003: SS Round Bar 304 32mm' },
                ]}
                defaultValue="MAT-001"
              />
              <FormField label="Received Weight / Quantity" suffix="kg" required defaultValue="850" />
              <FormField label="Supplier Invoice No." defaultValue="INV-JB-9921" />
              <FormField label="Purity / Heat No." defaultValue="HEAT-CW614-2026-90" />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
              <Button variant="secondary" onClick={closeQuickAdd} type="button">Cancel</Button>
              <Button variant="primary" type="submit">Save Inward Entry</Button>
            </div>
          </form>
        )}

        {selectedTab === 'outward' && (
          <form onSubmit={handleOutwardSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <FormField label="Issue Slip No." required defaultValue="ISS-2026-118" />
              <DatePicker label="Issue Date" required defaultValue="2026-09-10" />
              <SelectField
                label="Material to Issue"
                required
                options={[
                  { value: 'MAT-001', label: 'MAT-001: Brass Round Rod CW614N 25mm' },
                  { value: 'MAT-002', label: 'MAT-002: Brass Hex Bar 19mm' },
                ]}
                defaultValue="MAT-001"
              />
              <FormField label="Issued Quantity" suffix="kg" required defaultValue="150" />
              <FormField label="For Production Job #" defaultValue="JOB-2026-001" />
              <FormField label="Operator / Machine" defaultValue="Rajeshbhai - CNC Lathe 01" />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
              <Button variant="secondary" onClick={closeQuickAdd} type="button">Cancel</Button>
              <Button variant="primary" type="submit">Issue Material</Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
