import React, { useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { DataTable } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/StatusBadge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { useMaterials } from '../context/MaterialsContext';
import { useNavigation } from '../context/NavigationContext';
import { Material, StockMovement, TableColumn } from '../types';
import {
  ArrowDownLeft,
  ArrowUpRight,
  History,
  AlertTriangle,
  ArrowLeft,
  Layers
} from 'lucide-react';

export const MaterialStockPage: React.FC = () => {
  const { navigate } = useNavigation();
  const { materials, stockMovements } = useMaterials();
  const [activeTab, setActiveTab] = useState<'all' | 'low' | 'out' | 'sufficient'>('all');
  const [selectedMaterialForHistory, setSelectedMaterialForHistory] = useState<Material | null>(null);

  const lowStockCount = materials.filter(m => m.status === 'Low Stock').length;
  const outStockCount = materials.filter(m => m.status === 'Out of Stock').length;

  const filteredMaterials = materials.filter(m => {
    if (activeTab === 'low') return m.status === 'Low Stock';
    if (activeTab === 'out') return m.status === 'Out of Stock';
    if (activeTab === 'sufficient') return m.status === 'In Stock';
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
      header: 'Rack Bin',
      accessor: 'locationRack',
      width: '130px',
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
              fontSize: '14px',
              color: isRed ? 'var(--color-status-danger-solid)' : isAmber ? 'var(--color-status-warning-solid)' : 'var(--color-status-success-solid)'
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
      header: 'Reorder Qty',
      accessor: 'reorderQuantity',
      align: 'right',
      sortable: true,
      render: (m) => (
        <div className="tabular-nums" style={{ textAlign: 'right', color: 'var(--color-text-secondary)' }}>
          {m.reorderQuantity} {m.unit}
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
      header: 'Last Restocked',
      accessor: 'lastRestockedDate',
      width: '130px',
      sortable: true,
      render: (m) => (
        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
          {m.lastRestockedDate ? (
            <span className="mono-code" style={{ fontSize: '11px' }}>{m.lastRestockedDate}</span>
          ) : (
            <span style={{ color: 'var(--color-text-muted)' }}>—</span>
          )}
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

  // Movements for the selected material modal
  const materialMovements = selectedMaterialForHistory
    ? stockMovements
        .filter(
          mov =>
            mov.materialId === selectedMaterialForHistory.id ||
            mov.materialCode === selectedMaterialForHistory.materialCode
        )
        .sort((a, b) => (b.date > a.date ? 1 : -1))
    : [];

  const movementColumns: TableColumn<StockMovement>[] = [
    {
      header: 'Date',
      accessor: 'date',
      width: '100px',
      render: (m) => <span className="mono-code" style={{ fontSize: '11px' }}>{m.date}</span>
    },
    {
      header: 'Type',
      accessor: 'type',
      width: '90px',
      render: (m) => (
        <span
          className="status-badge"
          style={{
            backgroundColor: m.type === 'Inward' ? 'var(--color-status-success-bg)' : 'var(--color-status-danger-bg)',
            color: m.type === 'Inward' ? 'var(--color-status-success-text)' : 'var(--color-status-danger-text)',
            fontSize: '11px',
            padding: '2px 8px'
          }}
        >
          {m.type === 'Inward' ? '+ Inward' : '- Outward'}
        </span>
      )
    },
    {
      header: 'Qty',
      accessor: 'quantity',
      align: 'right',
      render: (m) => (
        <span
          className="tabular-nums"
          style={{
            fontWeight: 700,
            color: m.type === 'Inward' ? 'var(--color-status-success-solid)' : 'var(--color-status-danger-solid)'
          }}
        >
          {m.type === 'Inward' ? `+${m.quantity}` : `-${m.quantity}`} {selectedMaterialForHistory?.unit}
        </span>
      )
    },
    {
      header: 'Reference / Invoice / Job #',
      accessor: 'reference',
      render: (m) => <span className="mono-code" style={{ fontSize: '11px' }}>{m.reference || '—'}</span>
    },
    {
      header: 'Party / Issued To',
      render: (m) => <span>{m.supplier || m.issuedTo || '—'}</span>
    },
    {
      header: 'Notes',
      accessor: 'notes',
      render: (m) => <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{m.notes || '—'}</span>
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader
        title="Stock Ledger & Warehouse Audit"
        description="Real-time bin-card balances, minimum stock thresholds, inventory reorder status, and item transaction histories."
        breadcrumbs={[
          { label: 'Materials', path: '/materials' },
          { label: 'Stock Ledger' }
        ]}
        actions={
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button
              variant="secondary"
              icon={<ArrowLeft size={14} />}
              onClick={() => navigate('/materials')}
            >
              Back
            </Button>
            <Button
              variant="secondary"
              icon={<ArrowDownLeft size={14} />}
              onClick={() => navigate('/materials/inward')}
            >
              Record Inward
            </Button>
            <Button
              variant="primary"
              icon={<ArrowUpRight size={14} />}
              onClick={() => navigate('/materials/outward')}
            >
              Record Outward
            </Button>
          </div>
        }
      />

      {/* Tabs Header */}
      <div className="card" style={{ padding: 0 }}>
        <div className="tabs-header">
          <button
            type="button"
            className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <Layers size={14} />
            <span>All Materials Ledger</span>
            <span className="tab-badge">{materials.length}</span>
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'low' ? 'active' : ''}`}
            onClick={() => setActiveTab('low')}
          >
            <AlertTriangle size={14} />
            <span>Low Stock</span>
            <span
              className="tab-badge"
              style={{
                backgroundColor: 'var(--color-status-warning-bg)',
                color: 'var(--color-status-warning-text)'
              }}
            >
              {lowStockCount}
            </span>
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'out' ? 'active' : ''}`}
            onClick={() => setActiveTab('out')}
          >
            <span>Out of Stock</span>
            <span
              className="tab-badge"
              style={{
                backgroundColor: 'var(--color-status-danger-bg)',
                color: 'var(--color-status-danger-text)'
              }}
            >
              {outStockCount}
            </span>
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'sufficient' ? 'active' : ''}`}
            onClick={() => setActiveTab('sufficient')}
          >
            <span>Sufficient Stock</span>
            <span className="tab-badge">
              {materials.filter(m => m.status === 'In Stock').length}
            </span>
          </button>
        </div>
      </div>

      {/* Stock Ledger DataTable */}
      <DataTable
        data={filteredMaterials}
        columns={columns}
        searchPlaceholder="Filter stock ledger by code, name, rack, supplier..."
        onRowClick={(row) => setSelectedMaterialForHistory(row)}
        actions={(row) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
            <Button
              variant="outline"
              size="sm"
              icon={<History size={13} />}
              onClick={() => setSelectedMaterialForHistory(row)}
            >
              History
            </Button>
          </div>
        )}
        emptyTitle="No stock records found"
        emptySubtitle="Try adjusting the filter or add new raw materials."
      />

      {/* Movement History Modal */}
      {selectedMaterialForHistory && (
        <Modal
          isOpen={Boolean(selectedMaterialForHistory)}
          onClose={() => setSelectedMaterialForHistory(null)}
          title={`Bin Card History: ${selectedMaterialForHistory.materialCode}`}
          subtitle={`${selectedMaterialForHistory.materialName} • Rack: ${selectedMaterialForHistory.locationRack}`}
          maxWidth="850px"
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                Current Balance: <strong className="tabular-nums">{selectedMaterialForHistory.currentStock} {selectedMaterialForHistory.unit}</strong> (Min: {selectedMaterialForHistory.minimumStock})
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<ArrowDownLeft size={13} />}
                  onClick={() => {
                    setSelectedMaterialForHistory(null);
                    navigate('/materials/inward');
                  }}
                >
                  Inward GRN
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<ArrowUpRight size={13} />}
                  onClick={() => {
                    setSelectedMaterialForHistory(null);
                    navigate('/materials/outward');
                  }}
                >
                  Issue Outward
                </Button>
              </div>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <DataTable
              data={materialMovements}
              columns={movementColumns}
              searchPlaceholder="Filter movement history..."
              emptyTitle="No movement transactions recorded"
              emptySubtitle="Inward GRNs and outward issues for this item will be logged here."
              pageSizeDefault={5}
            />
          </div>
        </Modal>
      )}
    </div>
  );
};
