import { Material } from '../types';

export const mockMaterials: Material[] = [
  {
    id: 'MAT-001',
    materialCode: 'MAT-BRS-ROD-25',
    materialName: 'Brass Round Rod CW614N (IS 319 Gr 1 Free Cutting)',
    type: 'Brass Bar / Rod',
    grade: 'CW614N / IS 319 Gr I',
    size: 'Dia 25mm x 3000mm length',
    unit: 'kg',
    openingStock: 1250,
    currentStock: 480,
    minimumStock: 600,
    reorderQuantity: 1000,
    unitPrice: 565, // ₹565 / kg
    supplier: 'Jamnagar Brass Syndicate Ltd.',
    locationRack: 'Bay 1 - Rack B-04',
    status: 'Low Stock',
    lastRestockedDate: '2026-08-20'
  }
];
