import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { FormField } from './FormField';
import { SelectField } from './SelectField';
import { DatePicker } from './DatePicker';
import { useNavigation } from '../../context/NavigationContext';
import { useToast } from '../../context/ToastContext';
import { useWorkers } from '../../context/WorkerContext';
import { useMaterials } from '../../context/MaterialsContext';
import { UserPlus, PackagePlus, Box, PlusCircle, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

type QuickAddCategory = 'worker' | 'material' | 'product' | 'job' | 'inward' | 'outward';

export const QuickAddModal: React.FC = () => {
  const { isQuickAddOpen, closeQuickAdd, quickAddType, navigate } = useNavigation();
  const { addWorker } = useWorkers();
  const { showToast } = useToast();
  const { materials, recordInward, recordOutward } = useMaterials();
  const [selectedTab, setSelectedTab] = useState<QuickAddCategory>('worker');

  // Inward & Outward form states
  const [inwardMatId, setInwardMatId] = useState('MAT-001');
  const [inwardQty, setInwardQty] = useState('850');
  const [inwardSupplier, setInwardSupplier] = useState('Jamnagar Brass Syndicate');
  const [inwardInvoice, setInwardInvoice] = useState('INV-JB-9921');
  const [inwardHeat, setInwardHeat] = useState('HEAT-CW614-2026-90');

  const [outwardMatId, setOutwardMatId] = useState('MAT-001');
  const [outwardQty, setOutwardQty] = useState('150');
  const [outwardIssuedTo, setOutwardIssuedTo] = useState('Rajeshbhai - CNC Lathe 01');

  // Worker form state
  const [workerName, setWorkerName] = useState('Jayesh Rathod');
  const [workerMobile, setWorkerMobile] = useState('+91 98982 33441');
  const [workerSkill, setWorkerSkill] = useState('CNC Operator');
  const [workerDept, setWorkerDept] = useState('Machining');
  const [workerSalaryType, setWorkerSalaryType] = useState('Monthly Fixed');
  const [workerSalary, setWorkerSalary] = useState('28000');

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
    addWorker({
      workerId: `WRK-${String(Date.now()).slice(-3)}`,
      name: workerName,
      mobile: workerMobile,
      address: 'GIDC Industrial Area, Vatva',
      joiningDate: new Date().toISOString().split('T')[0],
      skill: workerSkill as any,
      department: workerDept as any,
      salaryType: workerSalaryType as any,
      salary: Number(workerSalary) || 0,
      status: 'Active',
      shift: 'Shift A (8:00 AM - 8:00 PM)'
    });
    showToast({
      title: 'Worker Record Created',
      message: `${workerName} successfully added to factory database.`,
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
    const qty = Number(inwardQty) || 100;
    recordInward(inwardMatId, qty, {
      supplier: inwardSupplier,
      invoiceNumber: inwardInvoice,
      heatNumber: inwardHeat,
      date: new Date().toISOString().split('T')[0]
    });
    showToast({
      title: 'Material Inward Recorded',
      message: `Stock balance updated with ${qty} units.`,
      type: 'success'
    });
    closeQuickAdd();
    navigate('/materials');
  };

  const handleOutwardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(outwardQty) || 50;
    const success = recordOutward(outwardMatId, qty, {
      issuedTo: outwardIssuedTo,
      reason: 'Production Use',
      date: new Date().toISOString().split('T')[0]
    });
    if (!success) {
      showToast({
        title: 'Issue Failed',
        message: 'Insufficient stock available to issue requested quantity.',
        type: 'danger'
      });
      return;
    }
    showToast({
      title: 'Material Outward Issued',
      message: `Issued ${qty} units to ${outwardIssuedTo}.`,
      type: 'info'
    });
    closeQuickAdd();
    navigate('/materials');
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
              <FormField
                label="Karigar / Worker Name"
                required
                placeholder="e.g. Bharatbhai Mistry"
                value={workerName}
                onChange={e => setWorkerName(e.target.value)}
              />
              <FormField
                label="Mobile Number"
                required
                placeholder="+91 98250 XXXXX"
                value={workerMobile}
                onChange={e => setWorkerMobile(e.target.value)}
              />
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
                otherPlaceholder="Type custom skill, e.g. Surface Grinder..."
                value={workerSkill}
                onChange={e => setWorkerSkill(e.target.value)}
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
                otherPlaceholder="Type custom department, e.g. Anodizing..."
                value={workerDept}
                onChange={e => setWorkerDept(e.target.value)}
              />
              <SelectField
                label="Salary Type"
                required
                options={[
                  { value: 'Monthly Fixed', label: 'Monthly Fixed' },
                  { value: 'Daily Wage', label: 'Daily Wage (Per Day)' },
                  { value: 'Piece Rate (Karigar)', label: 'Piece Rate (Per Unit)' },
                ]}
                value={workerSalaryType}
                onChange={e => setWorkerSalaryType(e.target.value)}
              />
              <FormField
                label="Manual Salary / Wage Rate"
                prefix="₹"
                suffix={workerSalaryType === 'Daily Wage' ? '/ day' : workerSalaryType === 'Piece Rate (Karigar)' ? '/ piece' : '/ month'}
                required
                type="text"
                inputMode="decimal"
                placeholder="Type amount, e.g. 28000"
                value={workerSalary}
                onChange={e => {
                  const val = e.target.value;
                  if (/^[0-9.,]*$/.test(val)) {
                    setWorkerSalary(val);
                  }
                }}
              />
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
              <SelectField
                label="Material"
                required
                options={materials.map(m => ({
                  value: m.id,
                  label: `${m.materialCode}: ${m.materialName.slice(0, 24)}... (Stock: ${m.currentStock} ${m.unit})`
                }))}
                value={inwardMatId}
                onChange={e => setInwardMatId(e.target.value)}
                allowOther={false}
              />
              <DatePicker label="Receipt Date" required defaultValue={new Date().toISOString().split('T')[0]} />
              <FormField
                label="Received Weight / Quantity"
                suffix="kg"
                required
                value={inwardQty}
                onChange={e => setInwardQty(e.target.value)}
              />
              <FormField
                label="Supplier / Vendor"
                value={inwardSupplier}
                onChange={e => setInwardSupplier(e.target.value)}
              />
              <FormField
                label="Supplier Invoice / Challan #"
                value={inwardInvoice}
                onChange={e => setInwardInvoice(e.target.value)}
              />
              <FormField
                label="Heat / MTC #"
                value={inwardHeat}
                onChange={e => setInwardHeat(e.target.value)}
              />
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
              <SelectField
                label="Material to Issue"
                required
                options={materials.map(m => ({
                  value: m.id,
                  label: `${m.materialCode}: ${m.materialName.slice(0, 24)}... (Available: ${m.currentStock} ${m.unit})`
                }))}
                value={outwardMatId}
                onChange={e => setOutwardMatId(e.target.value)}
                allowOther={false}
              />
              <DatePicker label="Issue Date" required defaultValue={new Date().toISOString().split('T')[0]} />
              <FormField
                label="Issued Quantity"
                suffix="kg"
                required
                value={outwardQty}
                onChange={e => setOutwardQty(e.target.value)}
              />
              <FormField
                label="Issued To (Worker / Machine)"
                value={outwardIssuedTo}
                onChange={e => setOutwardIssuedTo(e.target.value)}
              />
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
