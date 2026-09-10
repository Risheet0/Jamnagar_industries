import React from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { PlaceholderModule } from '../components/common/EmptyState';
import { BarChart3 } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader
        title="Industrial Reports & Production Analytics"
        description="Daily production summaries, machine uptime (OEE), karigar piece-rate wages, and stock consumption reports."
        breadcrumbs={[
          { label: 'Reports' }
        ]}
      />

      <PlaceholderModule
        title="Factory Analytics & Production Ledger Reports"
        moduleCode="MOD-REPORTS-LEDGER"
        description="Comprehensive offline reporting engine for production yield, scrap losses, worker wage sheets, CNC spindle utilization, and material inward/outward reconciliation."
        icon={<BarChart3 size={28} />}
        plannedFeatures={[
          'Daily Plant Production Summary (Shift-wise)',
          'Karigar Piece-Rate & Fixed Monthly Wage Payout Sheet',
          'Raw Material Consumption vs Finished Product Output Ratio',
          'CNC Machine OEE & Spindle Uptime Logs',
          'Customer Order On-Time Delivery (OTD) Tracking',
          'CSV / Excel format offline export'
        ]}
      />
    </div>
  );
};
