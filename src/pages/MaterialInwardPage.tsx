import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/common/Button';
import { FormField } from '../components/common/FormField';
import { SelectField } from '../components/common/SelectField';
import { DatePicker } from '../components/common/DatePicker';
import { DataTable } from '../components/common/DataTable';
import { useMaterials } from '../context/MaterialsContext';
import { useNavigation } from '../context/NavigationContext';
import { useToast } from '../context/ToastContext';
import { StockMovement, TableColumn } from '../types';
import { ArrowLeft, ArrowDownLeft, Save } from 'lucide-react';

export const MaterialInwardPage: React.FC = () => {
  const { navigate } = useNavigation();
  const { materials, stockMovements, recordInward } = useMaterials();
  const { showToast } = useToast();

  const todayStr = new Date().toISOString().split('T')[0];

  const [selectedMaterialId, setSelectedMaterialId] = useState<string>(
    materials.length > 0 ? materials[0].id : ''
  );
  const [quantity, setQuantity] = useState<string>('');
  const [supplier, setSupplier] = useState<string>('');
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [heatNumber, setHeatNumber] = useState<string>('');
  const [unitPrice, setUnitPrice] = useState<string>('');
  const [inwardDate, setInwardDate] = useState<string>(todayStr);
  const [notes, setNotes] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-fill supplier and unit price when material changes
  useEffect(() => {
    if (selectedMaterialId) {
      const mat = materials.find(m => m.id === selectedMaterialId || m.materialCode === selectedMaterialId);
      if (mat) {
        setSupplier(mat.supplier || '');
        setUnitPrice(mat.unitPrice ? String(mat.unitPrice) : '');
      }
    }
  }, [selectedMaterialId, materials]);

  const selectedMaterial = materials.find(
    m => m.id === selectedMaterialId || m.materialCode === selectedMaterialId
  );

  const materialOptions = materials.map(m => ({
    value: m.id,
    label: `${m.materialCode} - ${m.materialName} (Stock: ${m.currentStock} ${m.unit})`
  }));

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!selectedMaterialId) errs.material = 'Please select a material';
    if (!quantity || Number(quantity) <= 0) errs.quantity = 'Enter a valid quantity greater than 0';
    if (!supplier.trim()) errs.supplier = 'Supplier name is required';
    if (!invoiceNumber.trim()) errs.invoiceNumber = 'Invoice / Challan number is required';
    if (!inwardDate) errs.date = 'Inward date is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const qty = Number(quantity);
    const price = unitPrice ? Number(unitPrice) : undefined;

    recordInward(selectedMaterialId, qty, {
      supplier: supplier.trim(),
      invoiceNumber: invoiceNumber.trim(),
      heatNumber: heatNumber.trim() || undefined,
      date: inwardDate,
      unitPrice: price,
      notes: notes.trim() || undefined
    });

    showToast({
      title: 'Material Inward Recorded',
      message: `Added ${qty} ${selectedMaterial?.unit || 'units'} of ${selectedMaterial?.materialCode} to stock.`,
      type: 'success'
    });

    navigate('/materials');
  };

  // Recent inward movements (newest first)
  const inwardMovements = stockMovements
    .filter(m => m.type === 'Inward')
    .sort((a, b) => (b.date > a.date ? 1 : -1));

  const columns: TableColumn<StockMovement>[] = [
    {
      header: 'Date',
      accessor: 'date',
      width: '110px',
      sortable: true,
      render: (m) => <span className="mono-code" style={{ fontSize: '12px' }}>{m.date}</span>
    },
    {
      header: 'Movement ID',
      accessor: 'id',
      width: '110px',
      render: (m) => <span className="mono-code">{m.id}</span>
    },
    {
      header: 'Material Code',
      accessor: 'materialCode',
      width: '150px',
      sortable: true,
      render: (m) => <span className="mono-code" style={{ fontWeight: 600 }}>{m.materialCode}</span>
    },
    {
      header: 'Inward Qty',
      accessor: 'quantity',
      align: 'right',
      sortable: true,
      render: (m) => {
        const mat = materials.find(matItem => matItem.id === m.materialId || matItem.materialCode === m.materialCode);
        return (
          <span className="tabular-nums" style={{ fontWeight: 700, color: 'var(--color-status-success-solid)' }}>
            +{m.quantity} {mat?.unit || 'units'}
          </span>
        );
      }
    },
    {
      header: 'Supplier / Source',
      accessor: 'supplier',
      render: (m) => <span>{m.supplier || '—'}</span>
    },
    {
      header: 'Invoice / Ref #',
      accessor: 'reference',
      width: '140px',
      render: (m) => <span className="mono-code" style={{ fontSize: '11px' }}>{m.reference || '—'}</span>
    },
    {
      header: 'Heat / Lot #',
      accessor: 'heatNumber',
      width: '140px',
      render: (m) => (
        m.heatNumber ? (
          <span className="mono-code mono-code-contrast" style={{ fontSize: '11px' }}>{m.heatNumber}</span>
        ) : (
          <span style={{ color: 'var(--color-text-muted)' }}>—</span>
        )
      )
    },
    {
      header: 'Notes',
      accessor: 'notes',
      render: (m) => <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{m.notes || '—'}</span>
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader
        title="Material Inward (GRN / Goods Receipt)"
        description="Record incoming brass rods, raw metal billets, mill test certificates, and update warehouse stock balances."
        breadcrumbs={[
          { label: 'Materials', path: '/materials' },
          { label: 'Inward GRN' }
        ]}
        actions={
          <Button
            variant="secondary"
            icon={<ArrowLeft size={14} />}
            onClick={() => navigate('/materials')}
          >
            Back to Materials
          </Button>
        }
      />

      {/* Form Card */}
      <div className="card" style={{ maxWidth: '900px' }}>
        <div className="card-header">
          <div className="card-title">
            <ArrowDownLeft size={16} style={{ color: 'var(--color-status-success-solid)' }} />
            <span>New Goods Receipt Note (GRN Entry)</span>
          </div>
          {selectedMaterial && (
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              Current Stock: <strong className="tabular-nums">{selectedMaterial.currentStock} {selectedMaterial.unit}</strong> • Rack: <strong>{selectedMaterial.locationRack}</strong>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
              <SelectField
                label="Raw Material Item"
                required
                options={materialOptions}
                value={selectedMaterialId}
                onChange={e => setSelectedMaterialId(e.target.value)}
                error={errors.material}
                allowOther={false}
              />
              <FormField
                label="Inward Quantity"
                required
                type="number"
                placeholder="e.g. 500"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                suffix={selectedMaterial?.unit || 'units'}
                error={errors.quantity}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '16px' }}>
              <FormField
                label="Supplier / Vendor Name"
                required
                placeholder="e.g. Jamnagar Brass Syndicate Ltd."
                value={supplier}
                onChange={e => setSupplier(e.target.value)}
                error={errors.supplier}
              />
              <FormField
                label="Supplier Invoice / DC #"
                required
                placeholder="e.g. INV-2026-8890"
                value={invoiceNumber}
                onChange={e => setInvoiceNumber(e.target.value)}
                error={errors.invoiceNumber}
              />
              <DatePicker
                label="Receipt Date"
                required
                value={inwardDate}
                onChange={e => setInwardDate(e.target.value)}
                error={errors.date}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormField
                label="Heat / Lot Number (Traceability)"
                placeholder="e.g. HEAT-BRS-9042 / MTC-088"
                value={heatNumber}
                onChange={e => setHeatNumber(e.target.value)}
                helpText="Optional mill test cert or ingot batch number"
              />
              <FormField
                label="Unit Purchase Rate (Optional)"
                type="number"
                prefix="₹"
                suffix={selectedMaterial?.unit ? `/${selectedMaterial.unit}` : undefined}
                placeholder="565"
                value={unitPrice}
                onChange={e => setUnitPrice(e.target.value)}
                helpText="Updates standard unit cost if provided"
              />
            </div>

            <FormField
              label="Inspection Remarks / Weighment Notes"
              placeholder="e.g. Weighbridge net weight matched delivery slip. Surface visually inspected."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <Button
              variant="secondary"
              type="button"
              onClick={() => navigate('/materials')}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              icon={<Save size={14} />}
            >
              Record Inward & Update Stock
            </Button>
          </div>
        </form>
      </div>

      {/* Inward History Table */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            Recent Inward Receipts ({inwardMovements.length})
          </h3>
        </div>

        <DataTable
          data={inwardMovements}
          columns={columns}
          searchPlaceholder="Search inward history by supplier, heat #, invoice..."
          emptyTitle="No inward entries recorded yet"
          emptySubtitle="Recorded goods receipt notes will appear here."
        />
      </div>
    </div>
  );
};
