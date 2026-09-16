import React, { useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { DataTable } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/StatusBadge';
import { Button } from '../components/common/Button';
import { DrawingViewerModal } from '../components/common/DrawingViewerModal';
import { useNavigation } from '../context/NavigationContext';
import { useProducts } from '../context/ProductsContext';
import { Product, TableColumn } from '../types';
import { Plus, Eye, FileCode } from 'lucide-react';

export const ProductsPage: React.FC = () => {
  const { navigate, openQuickAdd } = useNavigation();
  const { products } = useProducts();
  const [selectedDrawingProduct, setSelectedDrawingProduct] = useState<Product | null>(null);

  const columns: TableColumn<Product>[] = [
    {
      header: 'Product Code',
      accessor: 'productCode',
      width: '140px',
      sortable: true,
      render: (p) => <span className="mono-code">{p.productCode}</span>
    },
    {
      header: 'Component Description',
      accessor: 'productName',
      sortable: true,
      render: (p) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{p.productName}</div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Category: {p.category}</div>
        </div>
      )
    },
    {
      header: 'Engineering Drawing',
      accessor: 'drawing',
      width: '210px',
      sortable: true,
      render: (p) => (
        <div
          onClick={(e) => {
            e.stopPropagation();
            setSelectedDrawingProduct(p);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 8px',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            backgroundColor: 'rgba(2, 132, 199, 0.05)',
            border: '1px solid rgba(2, 132, 199, 0.2)',
            transition: 'all 0.15s ease'
          }}
          title="Click to preview technical blueprint"
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-brand-primary)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(2, 132, 199, 0.2)'}
        >
          <FileCode size={16} style={{ color: 'var(--color-brand-primary)', flexShrink: 0 }} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-brand-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {p.drawingFileName || p.drawing}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{p.drawingRevision}</div>
          </div>
          <Eye size={13} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
        </div>
      )
    },
    {
      header: 'Raw Material Spec',
      accessor: 'material',
      sortable: true,
      render: (p) => (
        <div>
          <div style={{ fontSize: '12px' }}>{p.material}</div>
          <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{p.weight} {p.weightUnit} / pc</div>
        </div>
      )
    },
    {
      header: 'Unit Price',
      accessor: 'unitPrice',
      align: 'right',
      sortable: true,
      render: (p) => (
        <div className="tabular-nums" style={{ textAlign: 'right', fontWeight: 600 }}>
          ₹{p.unitPrice} <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 400 }}>/{p.unit}</span>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      width: '140px',
      align: 'center',
      sortable: true,
      render: (p) => <StatusBadge status={p.status} size="sm" />
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader
        title="Manufactured Products Catalogue"
        description="Master specifications for brass fittings, valve components, shafts, hex fasteners, and CNC turned parts with CAD drawings."
        breadcrumbs={[
          { label: 'Products' }
        ]}
        actions={
          <Button
            variant="primary"
            icon={<Plus size={15} />}
            onClick={() => openQuickAdd('product')}
          >
            + Add Product
          </Button>
        }
      />

      <DataTable
        data={products}
        columns={columns}
        searchPlaceholder="Search product by code, name, drawing, material, category..."
        onRowClick={(row) => navigate(`/products/${row.id}`)}
        actions={(row) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedDrawingProduct(row);
              }}
              className="btn btn-ghost btn-sm btn-icon-only"
              title="View Engineering Drawing Blueprint"
            >
              <FileCode size={14} style={{ color: 'var(--color-brand-primary)' }} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/products/${row.id}`);
              }}
              className="btn btn-ghost btn-sm btn-icon-only"
              title="View Product Specifications"
            >
              <Eye size={14} style={{ color: 'var(--color-text-secondary)' }} />
            </button>
          </div>
        )}
        onAddClick={() => openQuickAdd('product')}
        addLabel="Add Product"
      />

      {/* Engineering Drawing Viewer Modal */}
      {selectedDrawingProduct && (
        <DrawingViewerModal
          isOpen={Boolean(selectedDrawingProduct)}
          onClose={() => setSelectedDrawingProduct(null)}
          product={selectedDrawingProduct}
          onUploadNewDrawing={() => {
            const prod = selectedDrawingProduct;
            setSelectedDrawingProduct(null);
            navigate(`/products/${prod.id}`);
          }}
        />
      )}
    </div>
  );
};
