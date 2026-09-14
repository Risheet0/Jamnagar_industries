import React, { useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { DataTable } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/StatusBadge';
import { Button } from '../components/common/Button';
import { useNavigation } from '../context/NavigationContext';
import { useMaterials } from '../context/MaterialsContext';
import { Material, TableColumn } from '../types';
import { PackagePlus, ArrowDownLeft, ArrowUpRight, Eye } from 'lucide-react';

export const MaterialsPage: React.FC = () => {
  const { navigate, openQuickAdd } = useNavigation();
  const { materials } = useMaterials();
  const [activeTab, setActiveTab] = useState<'all' | 'low' | 'brass' | 'steel'>('all');

  const filteredMaterials = materials.filter(m => {
    if (activeTab === 'low') return m.status === 'Low Stock' || m.status === 'Out of Stock';
    if (activeTab === 'brass') return m.type.includes('Brass');
    if (activeTab === 'steel') return m.type.includes('Steel');
    return true;
  });

  const columns: TableColumn<Material>[] = [
    {
      header: 'Code',
      accessor: 'materialCode',
      width: '130px',
      sortable: true,
      render: (m) => <span className="mono-code">{m.materialCode}</span>
    },
    {
      header: 'Material Name & Grade',
      accessor: 'materialName',
      sortable: true,
      render: (m) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{m.materialName}</div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{m.grade} • {m.size}</div>
        </div>
      )
    },
    {
      header: 'Rack Location',
      accessor: 'locationRack',
      width: '140px',
      sortable: true,
      render: (m) => <span style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>{m.locationRack}</span>
    },
    {
      header: 'Current Stock',
      accessor: 'currentStock',
      align: 'right',
      sortable: true,
      render: (m) => (
        <div style={{ textAlign: 'right' }}>
          <div className="tabular-nums" style={{
            fontWeight: 700,
            color: m.status === 'Out of Stock' ? 'var(--color-status-danger-solid)' : m.status === 'Low Stock' ? 'var(--color-status-warning-solid)' : 'var(--color-text-primary)'
          }}>
            {m.currentStock} {m.unit}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Min: {m.minimumStock} {m.unit}</div>
        </div>
      )
    },
    {
      header: 'Unit Rate',
      accessor: 'unitPrice',
      align: 'right',
      sortable: true,
      render: (m) => (
        <div className="tabular-nums" style={{ textAlign: 'right', fontWeight: 600 }}>
          ₹{m.unitPrice} <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 400 }}>/{m.unit}</span>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      width: '120px',
      align: 'center',
      sortable: true,
      render: (m) => <StatusBadge status={m.status} size="sm" />
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader
        title="Raw Materials & Inventory"
        description="Master inventory of brass rods, stainless steel bars, tooling inserts, and consumables for machine shop."
        breadcrumbs={[
          { label: 'Materials' }
        ]}
        actions={
          <>
            <Button
              variant="secondary"
              icon={<ArrowDownLeft size={14} />}
              onClick={() => navigate('/materials/inward')}
            >
              Inward (GRN)
            </Button>
            <Button
              variant="secondary"
              icon={<ArrowUpRight size={14} />}
              onClick={() => navigate('/materials/outward')}
            >
              Issue Outward
            </Button>
            <Button
              variant="primary"
              icon={<PackagePlus size={15} />}
              onClick={() => openQuickAdd('material')}
            >
              + Add Material
            </Button>
          </>
        }
      />

      {/* Sub-Navigation Tabs */}
      <div className="card" style={{ padding: 0 }}>
        <div className="tabs-header">
          <button
            type="button"
            className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <span>All Materials</span>
            <span className="tab-badge">{materials.length}</span>
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'low' ? 'active' : ''}`}
            onClick={() => setActiveTab('low')}
          >
            <span>Low / Out of Stock</span>
            <span className="tab-badge" style={{ backgroundColor: 'var(--color-status-warning-bg)', color: 'var(--color-status-warning-text)' }}>
              {materials.filter(m => m.status === 'Low Stock' || m.status === 'Out of Stock').length}
            </span>
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'brass' ? 'active' : ''}`}
            onClick={() => setActiveTab('brass')}
          >
            <span>Brass Section</span>
            <span className="tab-badge">{materials.filter(m => m.type.includes('Brass')).length}</span>
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'steel' ? 'active' : ''}`}
            onClick={() => setActiveTab('steel')}
          >
            <span>Steel & Alloys</span>
            <span className="tab-badge">{materials.filter(m => m.type.includes('Steel')).length}</span>
          </button>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={filteredMaterials}
        columns={columns}
        searchPlaceholder="Search material by code, name, grade, supplier, rack..."
        onRowClick={(row) => navigate(`/materials/${row.id}`)}
        actions={(row) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/materials/${row.id}`);
              }}
              className="btn btn-ghost btn-sm btn-icon-only"
              title="View Material Specifications"
            >
              <Eye size={14} style={{ color: 'var(--color-brand-primary)' }} />
            </button>
          </div>
        )}
        onAddClick={() => openQuickAdd('material')}
        addLabel="Add Material"
      />
    </div>
  );
};
