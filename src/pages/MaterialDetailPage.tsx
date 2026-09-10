import React from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { StatusBadge } from '../components/common/StatusBadge';
import { Button } from '../components/common/Button';
import { useNavigation } from '../context/NavigationContext';
import { mockMaterials } from '../mock/materialsData';
import { ArrowLeft, Package, Boxes, ArrowDownLeft, Truck, MapPin } from 'lucide-react';

interface MaterialDetailPageProps {
  id?: string;
}

export const MaterialDetailPage: React.FC<MaterialDetailPageProps> = ({ id }) => {
  const { currentPath, navigate, openQuickAdd } = useNavigation();

  const pathParts = currentPath.split('/');
  const materialId = id || pathParts[2] || 'MAT-001';

  const material = mockMaterials.find(m => m.id === materialId || m.materialCode === materialId) || mockMaterials[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader
        title={material.materialName}
        description={`Raw Material Specification • Code: ${material.materialCode}`}
        breadcrumbs={[
          { label: 'Materials', path: '/materials' },
          { label: material.materialCode }
        ]}
        badge={<StatusBadge status={material.status} />}
        actions={
          <>
            <Button
              variant="secondary"
              icon={<ArrowLeft size={14} />}
              onClick={() => navigate('/materials')}
            >
              Back to Materials
            </Button>
            <Button
              variant="primary"
              icon={<ArrowDownLeft size={14} />}
              onClick={() => openQuickAdd('inward')}
            >
              Inward Stock
            </Button>
          </>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
        {/* Specification Card */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Package size={16} style={{ color: 'var(--color-brand-primary)' }} />
              <span>Material Specifications</span>
            </div>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Material Code</div>
              <div style={{ marginTop: '2px' }}><span className="mono-code">{material.materialCode}</span></div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Material Category</div>
              <div style={{ fontWeight: 600, marginTop: '2px' }}>{material.type}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Grade / Standard</div>
              <div style={{ marginTop: '2px' }}>{material.grade}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Dimension / Size</div>
              <div style={{ marginTop: '2px' }}>{material.size}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Plant Warehouse Location</div>
              <div style={{ marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={13} style={{ color: 'var(--color-brand-primary)' }} />
                <span>{material.locationRack}</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Registered Supplier</div>
              <div style={{ marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Truck size={13} style={{ color: 'var(--color-brand-accent)' }} />
                <span>{material.supplier}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stock Ledger Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <Boxes size={16} style={{ color: 'var(--color-brand-accent)' }} />
                <span>Inventory Balance & Valuation</span>
              </div>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                <div style={{ padding: '12px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Current Balance</div>
                  <div className="tabular-nums" style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '2px' }}>
                    {material.currentStock} {material.unit}
                  </div>
                </div>
                <div style={{ padding: '12px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Minimum Safety Limit</div>
                  <div className="tabular-nums" style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-status-warning-solid)', marginTop: '2px' }}>
                    {material.minimumStock} {material.unit}
                  </div>
                </div>
                <div style={{ padding: '12px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Estimated Valuation</div>
                  <div className="tabular-nums" style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-brand-primary)', marginTop: '2px' }}>
                    ₹{(material.currentStock * material.unitPrice).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
