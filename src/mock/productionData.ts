import { ProductionJob } from '../types';

export const mockProductionJobs: ProductionJob[] = [
  {
    id: 'JOB-2026-001',
    jobNumber: 'JOB-2026-001',
    date: '2026-09-08',
    customer: 'Bharat Heavy Engineering & Automation Corp.',
    productCode: 'PRD-BRS-FIT-01',
    productName: '1/2" Male Hex Brass Flare Tube Fitting (BSPT)',
    requiredQuantity: 2500,
    producedQuantity: 1840,
    rejectedQuantity: 24,
    assignedWorker: 'Rajeshbhai Panchal',
    assignedWorkerId: 'WRK-001',
    machine: 'CNC Lathe 01 (Doosan Lynx 220)',
    dueDate: '2026-09-14',
    status: 'In Production',
    priority: 'High',
    notes: 'Tolerance ±0.02mm critical on BSPT thread taper.'
  }
];
