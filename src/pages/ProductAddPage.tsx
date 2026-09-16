import React, { useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { FormField } from '../components/common/FormField';
import { SelectField } from '../components/common/SelectField';
import { Button } from '../components/common/Button';
import { useNavigation } from '../context/NavigationContext';
import { useToast } from '../context/ToastContext';
import { useProducts } from '../context/ProductsContext';
import { useMaterials } from '../context/MaterialsContext';
import { DrawingUploader, UploadedDrawingData } from '../components/common/DrawingUploader';
import { DrawingViewerModal } from '../components/common/DrawingViewerModal';
import { Cpu, ArrowLeft, Save } from 'lucide-react';

export const ProductAddPage: React.FC = () => {
  const { navigate } = useNavigation();
  const { showToast } = useToast();
  const { addProduct } = useProducts();
  const { materials } = useMaterials();
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const [formData, setFormData] = useState({
    productCode: '',
    productName: '',
    drawing: '',
    drawingRevision: 'Rev 1.0',
    drawingUrl: undefined as string | undefined,
    drawingFileName: undefined as string | undefined,
    drawingFileSize: undefined as string | undefined,
    drawingUploadDate: undefined as string | undefined,
    materialCode: materials[0]?.materialCode || 'MAT-BRS-ROD-25',
    material: materials[0]?.materialName || 'Brass Round Rod CW614N',
    weight: '150',
    weightUnit: 'g' as 'g' | 'kg',
    unit: 'pieces' as 'pieces' | 'sets' | 'lots',
    unitPrice: '120',
    targetCycleTimeSec: '45',
    category: 'Fittings' as any
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleMaterialChange = (selectedMatCode: string) => {
    const mat = materials.find(m => m.materialCode === selectedMatCode || m.id === selectedMatCode);
    if (mat) {
      setFormData(prev => ({
        ...prev,
        materialCode: mat.materialCode,
        material: mat.materialName
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        materialCode: selectedMatCode,
        material: selectedMatCode
      }));
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.productCode.trim()) errs.productCode = 'Product code is required (e.g. PRD-BRS-VAL-09)';
    if (!formData.productName.trim()) errs.productName = 'Component name is required';
    if (!formData.weight || Number(formData.weight) <= 0) errs.weight = 'Weight must be > 0';
    if (!formData.unitPrice || Number(formData.unitPrice) <= 0) errs.unitPrice = 'Selling price must be > 0';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    addProduct({
      productCode: formData.productCode.trim(),
      productName: formData.productName.trim(),
      drawing: formData.drawing.trim() || formData.drawingFileName || `DWG-${formData.productCode.trim()}.pdf`,
      drawingRevision: formData.drawingRevision.trim() || 'Rev 1.0',
      drawingUrl: formData.drawingUrl,
      drawingFileName: formData.drawingFileName,
      drawingFileSize: formData.drawingFileSize,
      drawingUploadDate: formData.drawingUploadDate,
      material: formData.material.trim(),
      materialCode: formData.materialCode.trim(),
      weight: Number(formData.weight) || 100,
      weightUnit: formData.weightUnit,
      unit: formData.unit,
      targetCycleTimeSec: Number(formData.targetCycleTimeSec) || 30,
      unitPrice: Number(formData.unitPrice) || 0,
      status: 'Active Production',
      category: formData.category
    });

    showToast({
      title: 'Product Registered',
      message: `${formData.productName} with CAD drawing successfully added to product catalogue.`,
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
                error={errors.productCode}
              />
              <FormField
                label="Product / Component Name"
                required
                placeholder={'e.g. 1/2" Hex Brass Non-Return Valve Body'}
                value={formData.productName}
                onChange={e => setFormData({ ...formData, productName: e.target.value })}
                error={errors.productName}
              />
            </div>

            {/* Engineering Drawing Upload & Reference Section */}
            <div
              style={{
                padding: '14px 16px',
                backgroundColor: 'var(--color-bg-subtle)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Engineering Drawing / CAD Blueprint Document
              </div>

              <DrawingUploader
                currentDrawingUrl={formData.drawingUrl}
                currentDrawingFileName={formData.drawingFileName || formData.drawing}
                currentDrawingFileSize={formData.drawingFileSize}
                onDrawingUploaded={(data: UploadedDrawingData) => {
                  setFormData(prev => ({
                    ...prev,
                    drawingUrl: data.drawingUrl,
                    drawingFileName: data.drawingFileName,
                    drawingFileSize: data.drawingFileSize,
                    drawingUploadDate: data.drawingUploadDate,
                    drawing: prev.drawing || data.suggestedDrawingNumber || data.drawingFileName
                  }));
                  showToast({
                    title: 'Drawing Attached',
                    message: `${data.drawingFileName} loaded successfully.`,
                    type: 'success'
                  });
                }}
                onDrawingRemoved={() => {
                  setFormData(prev => ({
                    ...prev,
                    drawingUrl: undefined,
                    drawingFileName: undefined,
                    drawingFileSize: undefined,
                    drawingUploadDate: undefined
                  }));
                }}
                onPreviewClick={() => setIsViewerOpen(true)}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '4px' }}>
                <FormField
                  label="CAD Drawing Number / Reference"
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
                onChange={e => setFormData({ ...formData, category: e.target.value as any })}
              />

              <FormField
                label="Unit Weight"
                suffix="grams"
                type="number"
                value={formData.weight}
                onChange={e => setFormData({ ...formData, weight: e.target.value })}
                error={errors.weight}
              />

              <FormField
                label="Target Cycle Time"
                suffix="seconds"
                type="number"
                value={formData.targetCycleTimeSec}
                onChange={e => setFormData({ ...formData, targetCycleTimeSec: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px' }}>
              <SelectField
                label="Raw Material Requirement (BOM)"
                options={materials.map(m => ({
                  value: m.materialCode,
                  label: `${m.materialCode} - ${m.materialName}`
                }))}
                value={formData.materialCode}
                onChange={e => handleMaterialChange(e.target.value)}
                allowOther
                otherPlaceholder="e.g. Brass Round Rod Dia 28mm"
              />

              <FormField
                label="Component Selling Price"
                prefix="₹"
                type="number"
                value={formData.unitPrice}
                onChange={e => setFormData({ ...formData, unitPrice: e.target.value })}
                error={errors.unitPrice}
              />
            </div>
          </div>

          <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <Button variant="secondary" onClick={() => navigate('/products')} type="button">
              Cancel
            </Button>
            <Button variant="primary" icon={<Save size={14} />} type="submit">
              Save Product
            </Button>
          </div>
        </form>
      </div>

      {/* Engineering Drawing Blueprint Preview Modal */}
      {isViewerOpen && (
        <DrawingViewerModal
          isOpen={isViewerOpen}
          onClose={() => setIsViewerOpen(false)}
          product={{
            id: 'PREVIEW',
            productCode: formData.productCode || 'PRD-DRAFT',
            productName: formData.productName || 'Draft Component',
            drawing: formData.drawing || formData.drawingFileName || 'DWG-DRAFT.pdf',
            drawingRevision: formData.drawingRevision || 'Rev 1.0',
            drawingUrl: formData.drawingUrl,
            drawingFileName: formData.drawingFileName,
            drawingFileSize: formData.drawingFileSize,
            drawingUploadDate: formData.drawingUploadDate,
            material: formData.material,
            materialCode: formData.materialCode,
            weight: Number(formData.weight) || 100,
            weightUnit: formData.weightUnit,
            unit: formData.unit,
            targetCycleTimeSec: Number(formData.targetCycleTimeSec) || 30,
            unitPrice: Number(formData.unitPrice) || 0,
            status: 'Active Production',
            category: formData.category
          }}
        />
      )}
    </div>
  );
};
