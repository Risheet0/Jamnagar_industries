import React from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { PlaceholderModule } from '../components/common/EmptyState';
import { Button } from '../components/common/Button';
import { useNavigation } from '../context/NavigationContext';
import { ArrowUpRight, ArrowLeft, Plus } from 'lucide-react';

export const MaterialOutwardPage: React.FC = () => {
  const { navigate, openQuickAdd } = useNavigation();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader
        title="Material Outward (Floor Issue Slips)"
        description="Issue raw material rods and tooling inserts to CNC operators, lathe machines, and job production batches."
        breadcrumbs={[
          { label: 'Materials', path: '/materials' },
          { label: 'Outward Issue' }
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
              onClick={() => openQuickAdd('outward')}
            >
              + Issue Material Slip
            </Button>
          </>
        }
      />

      <PlaceholderModule
        title="Material Issue Slip & Shop Floor Outward Control"
        moduleCode="MOD-MAT-OUTWARD"
        description="Tracks material requisition against specific Job Card numbers, operator authorization, scrap allowance tracking, and stock deductions."
        icon={<ArrowUpRight size={28} />}
        plannedFeatures={[
          'Job Card linked material requisition',
          'CNC / VMC Machine allocation tag',
          'Worker / Karigar issue acknowledgment',
          'Real-time deduction from inventory rack bins',
          'End-piece scrap & swarf weight recovery tracking',
          'Material variance & excess consumption alerts'
        ]}
        actionLabel="Quick Issue Material"
        onAction={() => openQuickAdd('outward')}
      />
    </div>
  );
};
