import React, { useState } from 'react';
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
import { ArrowLeft, ArrowUpRight, Save, AlertTriangle } from 'lucide-react';

export const MaterialOutwardPage: React.FC = () => {
  const { navigate } = useNavigation();
  const { materials, stockMovements, recordOutward } = useMaterials();
  const { showToast } = useToast();

  const todayStr = new Date().toISOString().split('T')[0];

  const [selectedMaterialId, setSelectedMaterialId] = useState<string>(
    materials.length > 0 ? materials[0].id : ''
  );
  const [quantity, setQuantity] = useState<string>('');
  const [issuedTo, setIssuedTo] = useState<string>('');
  const [reason, setReason] = useState<string>('Production Use');
  const [outwardDate, setOutwardDate] = useState<string>(todayStr);
  const [notes, setNotes] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedMaterial = materials.find(
    m => m.id === selectedMaterialId || m.materialCode === selectedMaterialId
  );

  const materialOptions = materials.map(m => ({
    value: m.id,
    label: `${m.materialCode} - ${m.materialName} (Available: ${m.currentStock} ${m.unit})`
  }));

  const reasonOptions = [
    { value: 'Production Use', label: 'Production Use (Job Card Requisition)' },
    { value: 'Rework', label: 'Rework / Modification' },
    { value: 'Scrap/Wastage', label: 'Scrap / Off-cut / Wastage' },
    { value: 'Tool Room Sample', label: 'Tool Room Sample / Prototype Trial' },
    { value: 'Transfer to Subcontractor', label: 'Transfer to Subcontractor' }
  ];

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!selectedMaterialId) errs.material = 'Please select a material';

    const numQty = Number(quantity);
    if (!quantity || isNaN(numQty) || numQty <= 0) {
      errs.quantity = 'Enter a valid quantity greater than 0';
    } else if (selectedMaterial && numQty > selectedMaterial.currentStock) {
      errs.quantity = `Quantity (${numQty} ${selectedMaterial.unit}) exceeds available stock (${selectedMaterial.currentStock} ${selectedMaterial.unit})`;
    }

    if (!issuedTo.trim()) errs.issuedTo = 'Specify the recipient (Worker name or Job Card #)';
    if (!reason.trim()) errs.reason = 'Issue reason is required';
    if (!outwardDate) errs.date = 'Date is required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const qty = Number(quantity);
    const success = recordOutward(selectedMaterialId, qty, {
      issuedTo: issuedTo.trim(),
      reason: reason.trim(),
      date: outwardDate,
      notes: notes.trim() || undefined
    });

    if (!success) {
      setErrors({
        quantity: `Cannot deduct ${qty} units. Insufficient stock remaining.`
      });
      showToast({
        title: 'Issue Blocked',
        message: 'Insufficient warehouse stock to fulfill this request.',
        type: 'danger'
      });
      return;
    }

    showToast({
      title: 'Material Issue Recorded',
      message: `Issued ${qty} ${selectedMaterial?.unit || 'units'} of ${selectedMaterial?.materialCode} to ${issuedTo}.`,
      type: 'success'
    });

    navigate('/materials');
  };

  // Recent outward movements (newest first)
  const outwardMovements = stockMovements
    .filter(m => m.type === 'Outward')
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
      header: 'Issue Slip #',
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
      header: 'Issued Qty',
      accessor: 'quantity',
      align: 'right',
      sortable: true,
      render: (m) => {
        const mat = materials.find(matItem => matItem.id === m.materialId || matItem.materialCode === m.materialCode);
        return (
          <span className="tabular-nums" style={{ fontWeight: 700, color: 'var(--color-status-danger-solid)' }}>
            -{m.quantity} {mat?.unit || 'units'}
          </span>
        );
      }
    },
    {
      header: 'Issued To / Job Card',
      accessor: 'issuedTo',
      render: (m) => <span style={{ fontWeight: 500 }}>{m.issuedTo || '—'}</span>
    },
    {
      header: 'Purpose / Notes',
      accessor: 'notes',
      render: (m) => <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{m.notes || '—'}</span>
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader
        title="Material Outward (Floor Issue Slips)"
        description="Issue raw material rods and tooling inserts to CNC operators, lathe machines, and active job batches."
        breadcrumbs={[
          { label: 'Materials', path: '/materials' },
          { label: 'Outward Issue' }
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
            <ArrowUpRight size={16} style={{ color: 'var(--color-brand-primary)' }} />
            <span>New Shop Floor Material Issue Slip</span>
          </div>
          {selectedMaterial && (
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              Current Available: <strong className="tabular-nums" style={{ color: selectedMaterial.currentStock <= selectedMaterial.minimumStock ? 'var(--color-status-warning-solid)' : 'var(--color-status-success-solid)' }}>{selectedMaterial.currentStock} {selectedMaterial.unit}</strong>
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
                onChange={e => {
                  setSelectedMaterialId(e.target.value);
                  setErrors(prev => ({ ...prev, quantity: '' }));
                }}
                error={errors.material}
                allowOther={false}
              />
              <FormField
                label="Issue Quantity"
                required
                type="number"
                placeholder="e.g. 100"
                value={quantity}
                onChange={e => {
                  setQuantity(e.target.value);
                  setErrors(prev => ({ ...prev, quantity: '' }));
                }}
                suffix={selectedMaterial?.unit || 'units'}
                error={errors.quantity}
              />
            </div>

            {selectedMaterial && Number(quantity) > selectedMaterial.currentStock && (
              <div
                style={{
                  padding: '10px 14px',
                  backgroundColor: 'var(--color-status-danger-bg)',
                  border: '1px solid var(--color-status-danger-border)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: 'var(--color-status-danger-text)',
                  fontSize: '13px'
                }}
              >
                <AlertTriangle size={16} />
                <span>
                  <strong>Stock Warning:</strong> Requested {quantity} {selectedMaterial.unit} exceeds total on-hand stock ({selectedMaterial.currentStock} {selectedMaterial.unit}).
                </span>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '16px' }}>
              <FormField
                label="Issued To (Karigar or Job #)"
                required
                placeholder="e.g. Rajeshbhai Panchal / JOB-2026-001"
                value={issuedTo}
                onChange={e => setIssuedTo(e.target.value)}
                error={errors.issuedTo}
                helpText="Machinist name or active job card number"
              />
              <SelectField
                label="Issue Purpose / Reason"
                required
                options={reasonOptions}
                value={reason}
                onChange={e => setReason(e.target.value)}
                error={errors.reason}
                allowOther
              />
              <DatePicker
                label="Issue Date"
                required
                value={outwardDate}
                onChange={e => setOutwardDate(e.target.value)}
                error={errors.date}
              />
            </div>

            <FormField
              label="Additional Notes / Machine Station"
              placeholder="e.g. For Doosan Lynx 220 spindle batch 1. Operator confirmed rod diameter inspection."
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
              disabled={Boolean(selectedMaterial && Number(quantity) > selectedMaterial.currentStock)}
            >
              Issue Material & Deduct Stock
            </Button>
          </div>
        </form>
      </div>

      {/* Outward History Table */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            Recent Material Issue Slips ({outwardMovements.length})
          </h3>
        </div>

        <DataTable
          data={outwardMovements}
          columns={columns}
          searchPlaceholder="Search outward history by worker, job card, reason..."
          emptyTitle="No material issue slips recorded yet"
          emptySubtitle="Logged floor issue slips will appear here."
        />
      </div>
    </div>
  );
};
