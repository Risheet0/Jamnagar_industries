import React from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { StatusBadge } from '../components/common/StatusBadge';
import { Button } from '../components/common/Button';
import { useNavigation } from '../context/NavigationContext';
import { mockProducts } from '../mock/productsData';
import { ArrowLeft, Cpu, FileText, Clock, IndianRupee, Layers } from 'lucide-react';

interface ProductDetailPageProps {
  id?: string;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ id }) => {
  const { currentPath, navigate, openQuickAdd } = useNavigation();

  const pathParts = currentPath.split('/');
  const productId = id || pathParts[2] || 'PRD-001';

  const product = mockProducts.find(p => p.id === productId || p.productCode === productId) || mockProducts[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader
        title={product.productName}
        description={`Component Engineering Record • Code: ${product.productCode} • Category: ${product.category}`}
        breadcrumbs={[
          { label: 'Products', path: '/products' },
          { label: product.productCode }
        ]}
        badge={<StatusBadge status={product.status} />}
        actions={
          <>
            <Button
              variant="secondary"
              icon={<ArrowLeft size={14} />}
              onClick={() => navigate('/products')}
            >
              Back to Products
            </Button>
            <Button
              variant="primary"
              icon={<Layers size={14} />}
              onClick={() => openQuickAdd('job')}
            >
              Issue Production Job
            </Button>
          </>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
        {/* Engineering Card */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Cpu size={16} style={{ color: 'var(--color-brand-primary)' }} />
              <span>Technical Specifications</span>
            </div>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Product Code</div>
              <div style={{ marginTop: '2px' }}><span className="mono-code">{product.productCode}</span></div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>CAD Drawing</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                <FileText size={15} style={{ color: 'var(--color-brand-primary)' }} />
                <span style={{ fontWeight: 600 }}>{product.drawing}</span>
                <span className="status-badge status-badge-info" style={{ fontSize: '10px' }}>{product.drawingRevision}</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Material Grade</div>
              <div style={{ marginTop: '2px' }}>{product.material}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Finished Unit Weight</div>
              <div style={{ marginTop: '2px', fontWeight: 600 }}>{product.weight} {product.weightUnit}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Machining Cycle Time</div>
              <div style={{ marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={13} style={{ color: 'var(--color-brand-accent)' }} />
                <span>{product.targetCycleTimeSec} seconds / unit</span>
              </div>
            </div>
          </div>
        </div>

        {/* Commercial & Production History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <IndianRupee size={16} style={{ color: 'var(--color-status-success-solid)' }} />
                <span>Commercial & Pricing</span>
              </div>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                <div style={{ padding: '12px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Finished Unit Price</div>
                  <div className="tabular-nums" style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-brand-primary)', marginTop: '2px' }}>
                    ₹{product.unitPrice}
                  </div>
                </div>
                <div style={{ padding: '12px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Target Output / Hour</div>
                  <div className="tabular-nums" style={{ fontSize: '20px', fontWeight: 700, marginTop: '2px' }}>
                    {Math.round(3600 / product.targetCycleTimeSec)} pcs/hr
                  </div>
                </div>
                <div style={{ padding: '12px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Standard Unit</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '4px' }}>{product.unit}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
