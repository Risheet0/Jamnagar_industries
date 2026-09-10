import React from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { PlaceholderModule } from '../components/common/EmptyState';
import { Button } from '../components/common/Button';
import { useNavigation } from '../context/NavigationContext';
import { ArrowDownLeft, ArrowLeft, Plus } from 'lucide-react';

export const MaterialInwardPage: React.FC = () => {
  const { navigate, openQuickAdd } = useNavigation();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader
        title="Material Inward (GRN / Receipts)"
        description="Record incoming raw brass batches, mill test certificates, invoice matching, and store weighment entries."
        breadcrumbs={[
          { label: 'Materials', path: '/materials' },
          { label: 'Inward GRN' }
        ]}
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
              icon={<Plus size={14} />}
              onClick={() => openQuickAdd('inward')}
            >
              + Record Inward Entry
            </Button>
          </>
        }
      />

      <PlaceholderModule
        title="Material Inward Register & Goods Receipt Note (GRN)"
        moduleCode="MOD-MAT-INWARD"
        description="Comprehensive challan entry workflow for tracking inbound metal shipments, weighbridge slips, supplier invoice reconciliation, and automatic inventory stock balance increments."
        icon={<ArrowDownLeft size={28} />}
        plannedFeatures={[
          'Supplier Delivery Challan & E-Way Bill Capture',
          'Weighment Entry (Gross / Tare / Net Weight in kg)',
          'Chemical / Physical Mill Test Certificate (MTC) Attachment',
          'Heat / Lot Number Batch Traceability',
          'Auto-increment of stock balances in Rack locations',
          'GRN Voucher PDF print format for accounts audit'
        ]}
        actionLabel="Quick Inward Entry"
        onAction={() => openQuickAdd('inward')}
      />
    </div>
  );
};
