import React from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { PlaceholderModule } from '../components/common/EmptyState';
import { CheckSquare } from 'lucide-react';

export const QualityPage: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader
        title="Quality Control & Inspection (QC)"
        description="First-piece dimensional approval, in-process sampling, thread pitch gauge verification, and batch rejection logs."
        breadcrumbs={[
          { label: 'Quality Control' }
        ]}
      />

      <PlaceholderModule
        title="Quality Assurance & Inspection Control"
        moduleCode="MOD-QC-CONTROL"
        description="Tracks vernier caliper & micrometer inspection readings against engineering drawings, first-off clearance certificates, scrap rate analytics, and non-conformance reports (NCR)."
        icon={<CheckSquare size={28} />}
        plannedFeatures={[
          'First-Piece Setup Inspection Sign-off',
          'Sampling Frequency Check (Every 50 pcs batch sample)',
          'Thread Gauging (Go / No-Go Gauge) Verification',
          'Dimensional tolerance variance graphs (±0.02mm)',
          'Defect Categorization (Burr, Thread Damage, Undersize, Surface Finish)',
          'Inspection Certificate (COA) PDF generation for customers'
        ]}
      />
    </div>
  );
};
