import React, { useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { SummaryCard } from '../components/common/SummaryCard';
import { DataTable } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/StatusBadge';
import { Button } from '../components/common/Button';
import { useNavigation } from '../context/NavigationContext';
import { useMaterials } from '../context/MaterialsContext';
import { Material, TableColumn } from '../types';
import { PackagePlus, ArrowDownLeft, ArrowUpRight, Eye, AlertTriangle, Boxes, Layers } from 'lucide-react';

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
      render: (m) => {
        const min = Math.max(1, m.minimumStock);
        const pct = Math.min(100, Math.max(4, Math.round((m.currentStock / (min * 2)) * 100)));
        const isRed = m.currentStock <= min;
        const isAmber = !isRed && m.currentStock <= min * 1.2;
        const barColor = isRed ? 'var(--color-status-danger-solid)' : isAmber ? 'var(--color-status-warning-solid)' : 'var(--color-status-success-solid)';

        return (
          <div style={{ textAlign: 'right', minWidth: '130px' }}>
            <div className="tabular-nums" style={{
              fontWeight: 700,
              fontSize: '13px',
              color: isRed ? 'var(--color-status-danger-solid)' : isAmber ? 'var(--color-status-warning-solid)' : 'var(--color-text-primary)'
            }}>
              {m.currentStock.toLocaleString('en-IN')} {m.unit}
            </div>
            {/* Visual Stock Health Bar */}
            <div style={{
              height: '5px',
              backgroundColor: 'var(--color-bg-muted)',
              borderRadius: '3px',
              overflow: 'hidden',
              margin: '3px 0 2px auto',
              width: '100%',
              maxWidth: '120px'
            }}>
              <div style={{
                height: '100%',
                width: `${pct}%`,
                backgroundColor: barColor,
                borderRadius: '3px',
                transition: 'width 0.3s ease'
              }} />
            </div>
            <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Min: {m.minimumStock} {m.unit}</div>
          </div>
        );
      }
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

      {/* Material Stock Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px' }}>
        <SummaryCard
          title="Total Raw Materials"
          value={`${materials.length} Items`}
          subtitle="Master brass, copper & steel stock"
          icon={<Boxes size={18} />}
          onClick={() => setActiveTab('all')}
        />
        <SummaryCard
          title="Low Stock Warning"
          value={`${materials.filter(m => m.status === 'Low Stock' || m.status === 'Out of Stock').length} Items`}
          subtitle="Below safety buffer threshold"
          icon={<AlertTriangle size={18} />}
          statusTag={{ label: 'Restock Required', variant: 'warning' }}
          onClick={() => setActiveTab('low')}
        />
        <SummaryCard
          title="Brass Raw Stock"
          value={`${materials.filter(m => m.type.includes('Brass')).length} Grades`}
          subtitle="CW614N, IS 319 Free Cutting"
          icon={<Layers size={18} />}
          onClick={() => setActiveTab('brass')}
        />
        <SummaryCard
          title="Steel & Alloys"
          value={`${materials.filter(m => m.type.includes('Steel')).length} Grades`}
          subtitle="SS 304, AISI 316, EN8 bars"
          icon={<Boxes size={18} />}
          onClick={() => setActiveTab('steel')}
        />
      </div>

      {/* Sub-Navigation Glass Pills */}
      <div className="glass-pill-nav" style={{ width: 'fit-content' }}>
        <button
          type="button"
          className={`glass-pill-tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          <span>All Materials ({materials.length})</span>
        </button>
        <button
          type="button"
          className={`glass-pill-tab ${activeTab === 'low' ? 'active-orange' : ''}`}
          onClick={() => setActiveTab('low')}
        >
          <span>Low / Out of Stock ({materials.filter(m => m.status === 'Low Stock' || m.status === 'Out of Stock').length})</span>
        </button>
        <button
          type="button"
          className={`glass-pill-tab ${activeTab === 'brass' ? 'active' : ''}`}
          onClick={() => setActiveTab('brass')}
        >
          <span>Brass Section ({materials.filter(m => m.type.includes('Brass')).length})</span>
        </button>
        <button
          type="button"
          className={`glass-pill-tab ${activeTab === 'steel' ? 'active' : ''}`}
          onClick={() => setActiveTab('steel')}
        >
          <span>Steel & Alloys ({materials.filter(m => m.type.includes('Steel')).length})</span>
        </button>
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
