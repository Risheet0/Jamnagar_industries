import React, { useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { FormField } from '../components/common/FormField';
import { SelectField } from '../components/common/SelectField';
import { Button } from '../components/common/Button';
import { useNavigation } from '../context/NavigationContext';
import { useToast } from '../context/ToastContext';
import { Cpu, ArrowLeft, Save } from 'lucide-react';

export const ProductAddPage: React.FC = () => {
  const { navigate } = useNavigation();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    productCode: '',
    productName: '',
    drawing: '',
    drawingRevision: 'Rev 1.0',
    material: 'Brass Round Rod CW614N',
    weight: '150',
    unitPrice: '120',
    targetCycleTimeSec: '45',
    category: 'Fittings'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showToast({
      title: 'Product Registered (Mock)',
      message: `${formData.productName} added to product catalog.`,
      type: 'success'
    });
    navigate('/products');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader
        title="Register Manufactured Product"
        description="Define CAD drawing revision, raw material bill-of-materials, cycle times, and sales pricing."
        breadcrumbs={[
          { label: 'Products', path: '/products' },
          { label: 'Add Product' }
        ]}
        actions={
          <Button
            variant="secondary"
            icon={<ArrowLeft size={14} />}
            onClick={() => navigate('/products')}
          >
            Back to Products
          </Button>
        }
      />

      <div className="card" style={{ maxWidth: '850px' }}>
        <div className="card-header">
          <div className="card-title">
            <Cpu size={16} style={{ color: 'var(--color-brand-primary)' }} />
            <span>Product Master Definition</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
              <FormField
                label="Product Code"
                required
                placeholder="e.g. PRD-BRS-VAL-09"
                value={formData.productCode}
                onChange={e => setFormData({ ...formData, productCode: e.target.value })}
              />
              <FormField
                label="Product / Component Name"
                required
                placeholder={'e.g. 1/2" Hex Brass Non-Return Valve Body'}
                value={formData.productName}
                onChange={e => setFormData({ ...formData, productName: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormField
                label="CAD Drawing Number / File"
                placeholder="e.g. DWG-2026-NRV-01.pdf"
                value={formData.drawing}
                onChange={e => setFormData({ ...formData, drawing: e.target.value })}
              />
              <FormField
                label="Drawing Revision"
                placeholder="e.g. Rev 2.1"
                value={formData.drawingRevision}
                onChange={e => setFormData({ ...formData, drawingRevision: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <SelectField
                label="Category"
                options={[
                  { value: 'Fittings', label: 'Fittings' },
                  { value: 'Valves', label: 'Valves' },
                  { value: 'Fasteners', label: 'Fasteners' },
                  { value: 'Shafts', label: 'Shafts' },
                  { value: 'Bushings', label: 'Bushings' },
                  { value: 'Custom Component', label: 'Custom Component' },
                ]}
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
              />

              <FormField
                label="Unit Weight"
                suffix="grams"
                type="number"
                value={formData.weight}
                onChange={e => setFormData({ ...formData, weight: e.target.value })}
              />

              <FormField
                label="Target Cycle Time"
                suffix="seconds"
                type="number"
                value={formData.targetCycleTimeSec}
                onChange={e => setFormData({ ...formData, targetCycleTimeSec: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormField
                label="Raw Material Requirement"
                value={formData.material}
                onChange={e => setFormData({ ...formData, material: e.target.value })}
              />

              <FormField
                label="Finished Component Unit Price"
                prefix="₹"
                type="number"
                value={formData.unitPrice}
                onChange={e => setFormData({ ...formData, unitPrice: e.target.value })}
              />
            </div>
          </div>

          <div className="card-footer">
            <Button variant="secondary" onClick={() => navigate('/products')} type="button">
              Cancel
            </Button>
            <Button variant="primary" icon={<Save size={14} />} type="submit">
              Save Product
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
