import { Product } from '../types';

export const mockProducts: Product[] = [
  {
    id: 'PRD-001',
    productCode: 'PRD-BRS-FIT-01',
    productName: '1/2" Male Hex Brass Flare Tube Fitting (BSPT)',
    drawing: 'DWG-2026-BF-01.pdf',
    drawingRevision: 'Rev 3.2',
    material: 'Brass Round Rod CW614N',
    materialCode: 'MAT-BRS-ROD-25',
    weight: 125,
    weightUnit: 'g',
    unit: 'pieces',
    targetCycleTimeSec: 42,
    unitPrice: 85,
    status: 'Active Production',
    category: 'Fittings'
  }
];
