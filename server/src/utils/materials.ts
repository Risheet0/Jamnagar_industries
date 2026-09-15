import { Prisma, PrismaClient } from '@prisma/client';

export type MaterialStatus = 'In Stock' | 'Low Stock' | 'Out of Stock' | 'On Order';

export function computeMaterialStatus(currentStock: number, minimumStock: number): MaterialStatus {
  if (currentStock <= 0) return 'Out of Stock';
  if (currentStock <= minimumStock) return 'Low Stock';
  return 'In Stock';
}

export async function executeStockInward(
  tx: Prisma.TransactionClient | PrismaClient,
  params: {
    materialId: string;
    quantity: number;
    date: string;
    reference?: string;
    supplier?: string;
    heatNumber?: string;
    notes?: string;
  }
) {
  const material = await tx.material.findUnique({
    where: { id: params.materialId }
  });

  if (!material) {
    throw new Error(`Material with ID ${params.materialId} not found`);
  }

  const newStock = material.currentStock + params.quantity;
  const newStatus = computeMaterialStatus(newStock, material.minimumStock);

  const updatedMaterial = await tx.material.update({
    where: { id: params.materialId },
    data: {
      currentStock: newStock,
      status: newStatus,
      lastRestockedDate: params.date
    }
  });

  const movementId = `MOV-${Date.now().toString().slice(-4)}`;
  const movement = await tx.stockMovement.create({
    data: {
      id: movementId,
      materialId: material.id,
      materialCode: material.materialCode,
      type: 'Inward',
      quantity: params.quantity,
      date: params.date,
      reference: params.reference,
      supplier: params.supplier || material.supplier,
      heatNumber: params.heatNumber,
      notes: params.notes
    }
  });

  return { material: updatedMaterial, movement };
}

export async function executeStockOutward(
  tx: Prisma.TransactionClient | PrismaClient,
  params: {
    materialId: string;
    quantity: number;
    date: string;
    reference?: string;
    issuedTo?: string;
    notes?: string;
  }
) {
  const material = await tx.material.findUnique({
    where: { id: params.materialId }
  });

  if (!material) {
    throw new Error(`Material with ID ${params.materialId} not found`);
  }

  if (material.currentStock < params.quantity) {
    throw new Error(
      `Insufficient stock for ${material.materialName}. Available: ${material.currentStock} ${material.unit}, Requested: ${params.quantity} ${material.unit}`
    );
  }

  const newStock = material.currentStock - params.quantity;
  const newStatus = computeMaterialStatus(newStock, material.minimumStock);

  const updatedMaterial = await tx.material.update({
    where: { id: params.materialId },
    data: {
      currentStock: newStock,
      status: newStatus
    }
  });

  const movementId = `MOV-${Date.now().toString().slice(-4)}`;
  const movement = await tx.stockMovement.create({
    data: {
      id: movementId,
      materialId: material.id,
      materialCode: material.materialCode,
      type: 'Outward',
      quantity: params.quantity,
      date: params.date,
      reference: params.reference,
      issuedTo: params.issuedTo,
      notes: params.notes
    }
  });

  return { material: updatedMaterial, movement };
}
