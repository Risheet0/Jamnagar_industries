import React from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { PlaceholderModule } from '../components/common/EmptyState';
import { Button } from '../components/common/Button';
import { useNavigation } from '../context/NavigationContext';
import { Boxes, ArrowLeft } from 'lucide-react';

export const MaterialStockPage: React.FC = () => {
  const { navigate } = useNavigation();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader
        title="Stock Ledger & Audit"
        description="Real-time stock ledger, physical stock verification, reorder point calculations, and bin cards."
        breadcrumbs={[
          { label: 'Materials', path: '/materials' },
          { label: 'Stock Ledger' }
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

      <PlaceholderModule
        title="Real-Time Stock Ledger & Inventory Valuation"
        moduleCode="MOD-MAT-STOCK"
        description="Comprehensive store bin-card view with historical inward/outward ledger, weighted average cost, minimum buffer warnings, and physical stock reconciliation."
        icon={<Boxes size={28} />}
        plannedFeatures={[
          'Store Bin-Card with running closing balances',
          'Automated Reorder Quantity (ROQ) calculations',
          'Physical vs Book stock variance audit tools',
          'Dead-stock & slow-moving item analysis',
          'Inventory valuation under FIFO and Weighted Average methods',
          'Daily stock snapshot export'
        ]}
      />
    </div>
  );
};
