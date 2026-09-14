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
import { useProducts } from '../../context/ProductsContext';
import { useProduction } from '../../context/ProductionContext';
import { UserPlus, PackagePlus, Box, PlusCircle, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

type QuickAddCategory = 'worker' | 'material' | 'product' | 'job' | 'inward' | 'outward';

export const QuickAddModal: React.FC = () => {
  const { isQuickAddOpen, closeQuickAdd, quickAddType, navigate } = useNavigation();
  const { workers, addWorker } = useWorkers();
  const { showToast } = useToast();
  const { materials, addMaterial, recordInward, recordOutward } = useMaterials();
  const { products, addProduct } = useProducts();
  const { addJob } = useProduction();
  const [selectedTab, setSelectedTab] = useState<QuickAddCategory>('worker');

  // Material form state
  const [matCode, setMatCode] = useState('MAT-BRS-HEX-22');
  const [matName, setMatName] = useState('Brass Hex Rod CW614N 22mm');
  const [matType, setMatType] = useState('Brass Bar / Rod');
  const [matGrade, setMatGrade] = useState('IS 319 Gr 1');
  const [matOpeningStock, setMatOpeningStock] = useState('500');
  const [matMinStock, setMatMinStock] = useState('200');
  const [matUnitPrice, setMatUnitPrice] = useState('570');
  const [matSupplier, setMatSupplier] = useState('Jamnagar Brass Syndicate');

  // Product form state
  const [prodCode, setProdCode] = useState('PRD-BRS-ADPT-09');
  const [prodName, setProdName] = useState('3/8" Brass Female Adapter');
  const [prodDwgNo, setProdDwgNo] = useState('DWG-2026-FA-09.pdf');
  const [prodDwgRev, setProdDwgRev] = useState('Rev 1.0');
  const [prodMatCode, setProdMatCode] = useState('MAT-001');
  const [prodWeight, setProdWeight] = useState('94');
  const [prodCycleTime, setProdCycleTime] = useState('35');
  const [prodUnitPrice, setProdUnitPrice] = useState('68');

  // Job form state
  const [jobNum, setJobNum] = useState(`JOB-2026-${String(Date.now()).slice(-3)}`);
  const [jobCustomer, setJobCustomer] = useState('Adani Gas Pipelines Unit');
  const [jobProdCode, setJobProdCode] = useState(products[0]?.productCode || 'PRD-BRS-FIT-01');
  const [jobQty, setJobQty] = useState('1500');
  const [jobWorkerId, setJobWorkerId] = useState(workers[0]?.id || 'WRK-001');
  const [jobMachine, setJobMachine] = useState('CNC Lathe 01 (Doosan Lynx)');
  const [jobDueDate, setJobDueDate] = useState(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
  const [jobPriority, setJobPriority] = useState<'Normal' | 'High' | 'Critical'>('High');

  // Inward & Outward form states
  const [inwardMatId, setInwardMatId] = useState(materials[0]?.id || 'MAT-001');
  const [inwardQty, setInwardQty] = useState('850');
  const [inwardSupplier, setInwardSupplier] = useState('Jamnagar Brass Syndicate');
  const [inwardInvoice, setInwardInvoice] = useState('INV-JB-9921');
  const [inwardHeat, setInwardHeat] = useState('HEAT-CW614-2026-90');

  const [outwardMatId, setOutwardMatId] = useState(materials[0]?.id || 'MAT-001');
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

  // Form submit handlers
  const handleWorkerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addWorker({
      workerId: `WRK-${String(Date.now()).slice(-3)}`,
      name: workerName,
      mobile: workerMobile,
      address: 'GIDC Industrial Area, Jamnagar',
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
    const created = addMaterial({
      materialCode: matCode.trim() || `MAT-${String(Date.now()).slice(-3)}`,
      materialName: matName,
      type: matType as any,
      grade: matGrade,
      size: 'Dia 22mm x 3000mm',
      unit: 'kg',
      openingStock: Number(matOpeningStock) || 0,
      currentStock: Number(matOpeningStock) || 0,
      minimumStock: Number(matMinStock) || 0,
      reorderQuantity: 300,
      unitPrice: Number(matUnitPrice) || 0,
      supplier: matSupplier,
      locationRack: 'Rack A-01, Raw Store',
      status: 'In Stock'
    });

    showToast({
      title: 'Material Registered',
      message: `${created.materialCode} added to inventory master.`,
      type: 'success'
    });
    closeQuickAdd();
    navigate('/materials');
  };

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedMat = materials.find(m => m.materialCode === prodMatCode || m.id === prodMatCode);
    const created = addProduct({
      productCode: prodCode.trim() || `PRD-${String(Date.now()).slice(-3)}`,
      productName: prodName,
      drawing: prodDwgNo,
      drawingRevision: prodDwgRev,
      materialCode: selectedMat?.materialCode || prodMatCode || 'MAT-001',
      material: selectedMat?.materialName || 'Brass Hex Bar CW614N 19mm',
      weight: Number(prodWeight) || 94,
      weightUnit: 'g',
      unit: 'pieces',
      targetCycleTimeSec: Number(prodCycleTime) || 35,
      unitPrice: Number(prodUnitPrice) || 68,
      status: 'Active Production',
      category: 'Fittings'
    });

    showToast({
      title: 'Product Added',
      message: `${created.productCode} registered in production catalogue.`,
      type: 'success'
    });
    closeQuickAdd();
    navigate('/products');
  };

  const handleJobSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedProd = products.find(p => p.productCode === jobProdCode || p.id === jobProdCode);
    const selectedWorker = workers.find(w => w.id === jobWorkerId || w.workerId === jobWorkerId);
    const qty = Number(jobQty) || 1000;

    // Cross-module BOM deduction
    let stockAlert = false;
    if (selectedProd) {
      const mat = materials.find(m => m.materialCode === selectedProd.materialCode || m.id === selectedProd.materialCode);
      if (mat) {
        const estimatedKg = Math.round(((qty * (selectedProd.weight || 100)) / 1000) * 100) / 100;
        if (mat.currentStock < estimatedKg) {
          stockAlert = true;
        }
        recordOutward(mat.id, estimatedKg, {
          jobId: jobNum,
          reason: 'Production Use',
          issuedTo: selectedWorker ? selectedWorker.name : 'Shop Floor',
          date: new Date().toISOString().split('T')[0],
          allowDeficit: true
        });
      }
    }

    const created = addJob({
      jobNumber: jobNum.trim() || `JOB-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
      customer: jobCustomer,
      productCode: selectedProd ? selectedProd.productCode : jobProdCode,
      productName: selectedProd ? selectedProd.productName : 'Standard Brass Component',
      requiredQuantity: qty,
      producedQuantity: 0,
      rejectedQuantity: 0,
      assignedWorkerId: selectedWorker ? selectedWorker.id : (workers[0]?.id || 'WRK-001'),
      assignedWorker: selectedWorker ? selectedWorker.name : 'Assigned Karigar',
      machine: jobMachine,
      date: new Date().toISOString().split('T')[0],
      dueDate: jobDueDate,
      status: 'Pending',
      priority: jobPriority,
      notes: 'Issued via Quick Add drawer'
    });

    if (stockAlert) {
      showToast({
        title: 'Job Issued (Stock Insufficient)',
        message: `Job ${created.jobNumber} created. Raw material stock went negative — Reorder required!`,
        type: 'warning'
      });
    } else {
      showToast({
        title: 'Production Job Card Issued',
        message: `Job ${created.jobNumber} scheduled and raw material BOM reserved.`,
        type: 'success'
      });
    }

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
              <FormField
                label="Material Code"
                required
                placeholder="MAT-BRS-005"
                value={matCode}
                onChange={e => setMatCode(e.target.value)}
              />
              <FormField
                label="Material Name"
                required
                placeholder="e.g. Brass Hex Rod 22mm"
                value={matName}
                onChange={e => setMatName(e.target.value)}
              />
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
                value={matType}
                onChange={e => setMatType(e.target.value)}
              />
              <FormField
                label="Grade / Spec"
                placeholder="e.g. IS 319 Gr I"
                value={matGrade}
                onChange={e => setMatGrade(e.target.value)}
              />
              <FormField
                label="Opening Stock"
                suffix="kg"
                required
                value={matOpeningStock}
                onChange={e => setMatOpeningStock(e.target.value)}
              />
              <FormField
                label="Minimum Alert Stock"
                suffix="kg"
                required
                value={matMinStock}
                onChange={e => setMatMinStock(e.target.value)}
              />
              <FormField
                label="Unit Price"
                prefix="₹"
                value={matUnitPrice}
                onChange={e => setMatUnitPrice(e.target.value)}
              />
              <FormField
                label="Supplier Name"
                value={matSupplier}
                onChange={e => setMatSupplier(e.target.value)}
              />
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
              <FormField
                label="Product Code"
                required
                value={prodCode}
                onChange={e => setProdCode(e.target.value)}
              />
              <FormField
                label="Product Name"
                required
                value={prodName}
                onChange={e => setProdName(e.target.value)}
              />
              <FormField
                label="Drawing Number"
                value={prodDwgNo}
                onChange={e => setProdDwgNo(e.target.value)}
              />
              <FormField
                label="Drawing Revision"
                value={prodDwgRev}
                onChange={e => setProdDwgRev(e.target.value)}
              />
              <SelectField
                label="Raw Material"
                options={materials.map(m => ({
                  value: m.materialCode,
                  label: `${m.materialCode} (${m.materialName.slice(0, 20)}...)`
                }))}
                value={prodMatCode}
                onChange={e => setProdMatCode(e.target.value)}
              />
              <FormField
                label="Unit Weight"
                suffix="g"
                value={prodWeight}
                onChange={e => setProdWeight(e.target.value)}
              />
              <FormField
                label="Target Cycle Time"
                suffix="sec"
                value={prodCycleTime}
                onChange={e => setProdCycleTime(e.target.value)}
              />
              <FormField
                label="Unit Price"
                prefix="₹"
                value={prodUnitPrice}
                onChange={e => setProdUnitPrice(e.target.value)}
              />
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
              <FormField
                label="Job Card Number"
                required
                value={jobNum}
                onChange={e => setJobNum(e.target.value)}
              />
              <FormField
                label="Customer / Order Ref"
                required
                value={jobCustomer}
                onChange={e => setJobCustomer(e.target.value)}
              />
              <SelectField
                label="Product"
                required
                options={products.map(p => ({
                  value: p.productCode,
                  label: `${p.productCode}: ${p.productName.slice(0, 24)}...`
                }))}
                value={jobProdCode}
                onChange={e => setJobProdCode(e.target.value)}
              />
              <FormField
                label="Required Batch Quantity"
                suffix="pcs"
                required
                value={jobQty}
                onChange={e => setJobQty(e.target.value)}
              />
              <SelectField
                label="Assigned Worker / Karigar"
                required
                options={workers.map(w => ({
                  value: w.id,
                  label: `${w.name} (${w.skill})`
                }))}
                value={jobWorkerId}
                onChange={e => setJobWorkerId(e.target.value)}
              />
              <FormField
                label="Target Machine / Station"
                value={jobMachine}
                onChange={e => setJobMachine(e.target.value)}
              />
              <DatePicker
                label="Target Due Date"
                required
                value={jobDueDate}
                onChange={e => setJobDueDate(e.target.value)}
              />
              <SelectField
                label="Job Priority"
                options={[
                  { value: 'Normal', label: 'Normal' },
                  { value: 'High', label: 'High' },
                  { value: 'Critical', label: 'Critical' },
                ]}
                value={jobPriority}
                onChange={e => setJobPriority(e.target.value as any)}
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
