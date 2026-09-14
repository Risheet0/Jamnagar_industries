import React from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { StatusBadge } from '../components/common/StatusBadge';
import { Button } from '../components/common/Button';
import { useNavigation } from '../context/NavigationContext';
import { useMaterials } from '../context/MaterialsContext';
import { ArrowLeft, Package, Boxes, ArrowDownLeft, ArrowUpRight, Truck, MapPin, History } from 'lucide-react';

interface MaterialDetailPageProps {
  id?: string;
}

export const MaterialDetailPage: React.FC<MaterialDetailPageProps> = ({ id }) => {
  const { currentPath, navigate } = useNavigation();
  const { getMaterial, materials, stockMovements } = useMaterials();

  const pathParts = currentPath.split('/');
  const materialId = id || pathParts[2] || (materials[0]?.id ?? 'MAT-001');

  const material = getMaterial(materialId) || materials[0];

  if (!material) {
    return (
      <div style={{ padding: '20px' }}>
        <Button variant="secondary" icon={<ArrowLeft size={14} />} onClick={() => navigate('/materials')}>
          Back to Materials
        </Button>
        <p style={{ marginTop: '20px' }}>Material item not found.</p>
      </div>
    );
  }

  const linkedMovements = stockMovements
    .filter(m => m.materialId === material.id || m.materialCode === material.materialCode)
    .sort((a, b) => (b.date > a.date ? 1 : -1));

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
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              variant="secondary"
              icon={<ArrowLeft size={14} />}
              onClick={() => navigate('/materials')}
            >
              Back to Materials
            </Button>
            <Button
              variant="secondary"
              icon={<ArrowDownLeft size={14} />}
              onClick={() => navigate('/materials/inward')}
            >
              Inward Stock
            </Button>
            <Button
              variant="primary"
              icon={<ArrowUpRight size={14} />}
              onClick={() => navigate('/materials/outward')}
            >
              Issue Outward
            </Button>
          </div>
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
            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Last Restocked Date</div>
              <div style={{ marginTop: '2px' }}>
                {material.lastRestockedDate ? <span className="mono-code">{material.lastRestockedDate}</span> : '—'}
              </div>
            </div>
          </div>
        </div>

        {/* Stock Ledger Summary & Movements */}
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
                  <div className="tabular-nums" style={{ fontSize: '20px', fontWeight: 700, color: material.currentStock <= material.minimumStock ? 'var(--color-status-warning-solid)' : 'var(--color-text-primary)', marginTop: '2px' }}>
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

          {/* Real-time Item Movements Table */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <History size={16} style={{ color: 'var(--color-brand-primary)' }} />
                <span>Item Movement History ({linkedMovements.length})</span>
              </div>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {linkedMovements.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--color-bg-subtle)', borderBottom: '1px solid var(--color-border-subtle)' }}>
                      <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Date</th>
                      <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Type</th>
                      <th style={{ padding: '8px 14px', textAlign: 'right', fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Quantity</th>
                      <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Reference / Party</th>
                      <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {linkedMovements.map(m => (
                      <tr key={m.id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                        <td style={{ padding: '8px 14px' }}><span className="mono-code" style={{ fontSize: '11px' }}>{m.date}</span></td>
                        <td style={{ padding: '8px 14px' }}>
                          <span
                            className="status-badge"
                            style={{
                              fontSize: '11px',
                              padding: '2px 6px',
                              backgroundColor: m.type === 'Inward' ? 'var(--color-status-success-bg)' : 'var(--color-status-danger-bg)',
                              color: m.type === 'Inward' ? 'var(--color-status-success-text)' : 'var(--color-status-danger-text)'
                            }}
                          >
                            {m.type === 'Inward' ? '+ Inward' : '- Outward'}
                          </span>
                        </td>
                        <td style={{ padding: '8px 14px', textAlign: 'right', fontWeight: 600 }} className="tabular-nums">
                          <span style={{ color: m.type === 'Inward' ? 'var(--color-status-success-solid)' : 'var(--color-status-danger-solid)' }}>
                            {m.type === 'Inward' ? `+${m.quantity}` : `-${m.quantity}`} {material.unit}
                          </span>
                        </td>
                        <td style={{ padding: '8px 14px' }}>{m.reference || m.supplier || m.issuedTo || '—'}</td>
                        <td style={{ padding: '8px 14px', color: 'var(--color-text-secondary)', fontSize: '12px' }}>{m.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                  No inward receipts or outward issues logged for this material yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
