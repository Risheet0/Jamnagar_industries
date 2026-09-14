import React, { useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { FormField } from '../components/common/FormField';
import { SelectField } from '../components/common/SelectField';
import { Button } from '../components/common/Button';
import { useNavigation } from '../context/NavigationContext';
import { useMaterials } from '../context/MaterialsContext';
import { useToast } from '../context/ToastContext';
import { PackagePlus, ArrowLeft, Save } from 'lucide-react';

export const MaterialAddPage: React.FC = () => {
  const { navigate } = useNavigation();
  const { showToast } = useToast();
  const { addMaterial } = useMaterials();
  const [formData, setFormData] = useState({
    materialCode: '',
    materialName: '',
    type: 'Brass Bar / Rod',
    grade: '',
    size: '',
    unit: 'kg',
    openingStock: '500',
    minimumStock: '200',
    unitPrice: '560',
    supplier: '',
    locationRack: 'Bay 1 - Rack B-01'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const created = addMaterial({
      materialCode: formData.materialCode.trim() || `MAT-${String(Date.now()).slice(-3)}`,
      materialName: formData.materialName,
      type: formData.type as any,
      grade: formData.grade || 'IS 319 Gr 1',
      size: formData.size || 'Dia 25mm x 3000mm',
      unit: formData.unit as any,
      openingStock: Number(formData.openingStock) || 0,
      currentStock: Number(formData.openingStock) || 0,
      minimumStock: Number(formData.minimumStock) || 0,
      reorderQuantity: 300,
      unitPrice: Number(formData.unitPrice) || 0,
      supplier: formData.supplier || 'Jamnagar Brass Syndicate Ltd.',
      locationRack: formData.locationRack,
      status: 'In Stock'
    });

    showToast({
      title: 'Material Registered',
      message: `${created.materialCode} added to inventory database.`,
      type: 'success'
    });
    navigate('/materials');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader
        title="Add Raw Material"
        description="Register new raw stock, bar stock, or tooling inventory with warehouse rack locations and reorder levels."
        breadcrumbs={[
          { label: 'Materials', path: '/materials' },
          { label: 'Add Material' }
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

      <div className="card" style={{ maxWidth: '850px' }}>
        <div className="card-header">
          <div className="card-title">
            <PackagePlus size={16} style={{ color: 'var(--color-brand-primary)' }} />
            <span>Raw Material Master Entry</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
              <FormField
                label="Material Code"
                required
                placeholder="e.g. MAT-BRS-ROD-32"
                value={formData.materialCode}
                onChange={e => setFormData({ ...formData, materialCode: e.target.value })}
              />
              <FormField
                label="Material Description / Name"
                required
                placeholder="e.g. Brass Round Rod CW614N Free Cutting"
                value={formData.materialName}
                onChange={e => setFormData({ ...formData, materialName: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <SelectField
                label="Material Category"
                required
                options={[
                  { value: 'Brass Bar / Rod', label: 'Brass Bar / Rod' },
                  { value: 'Stainless Steel', label: 'Stainless Steel' },
                  { value: 'Mild Steel', label: 'Mild Steel' },
                  { value: 'Aluminum Alloy', label: 'Aluminum Alloy' },
                  { value: 'Cutting Tool', label: 'Cutting Tool' },
                  { value: 'Consumable / Oil', label: 'Consumable / Oil' },
                ]}
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
              />

              <FormField
                label="Grade / Alloy Spec"
                placeholder="e.g. IS 319 Gr I / CW614N"
                value={formData.grade}
                onChange={e => setFormData({ ...formData, grade: e.target.value })}
              />

              <FormField
                label="Size / Dimensions"
                placeholder="e.g. Dia 25mm x 3000mm"
                value={formData.size}
                onChange={e => setFormData({ ...formData, size: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px' }}>
              <SelectField
                label="Stock Unit"
                options={[
                  { value: 'kg', label: 'kg (Kilograms)' },
                  { value: 'pieces', label: 'pieces' },
                  { value: 'meters', label: 'meters' },
                  { value: 'liters', label: 'liters' },
                ]}
                value={formData.unit}
                onChange={e => setFormData({ ...formData, unit: e.target.value })}
              />

              <FormField
                label="Opening Stock"
                type="number"
                value={formData.openingStock}
                onChange={e => setFormData({ ...formData, openingStock: e.target.value })}
              />

              <FormField
                label="Min Safety Stock"
                type="number"
                value={formData.minimumStock}
                onChange={e => setFormData({ ...formData, minimumStock: e.target.value })}
              />

              <FormField
                label="Unit Rate (₹)"
                prefix="₹"
                type="number"
                value={formData.unitPrice}
                onChange={e => setFormData({ ...formData, unitPrice: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormField
                label="Primary Supplier"
                placeholder="e.g. Jamnagar Brass Syndicate Ltd."
                value={formData.supplier}
                onChange={e => setFormData({ ...formData, supplier: e.target.value })}
              />

              <FormField
                label="Rack / Storage Bay"
                placeholder="e.g. Bay 1 - Rack B-04"
                value={formData.locationRack}
                onChange={e => setFormData({ ...formData, locationRack: e.target.value })}
              />
            </div>
          </div>

          <div className="card-footer">
            <Button variant="secondary" onClick={() => navigate('/materials')} type="button">
              Cancel
            </Button>
            <Button variant="primary" icon={<Save size={14} />} type="submit">
              Save Material
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
