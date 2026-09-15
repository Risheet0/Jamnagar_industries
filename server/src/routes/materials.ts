import { Router } from 'express';
import { prisma } from '../db';
import { materialSchema, updateMaterialSchema, stockInwardSchema, stockOutwardSchema } from '../validation';
import { computeMaterialStatus, executeStockInward, executeStockOutward } from '../utils/materials';
import { requireAuth, requireRole } from '../middleware/auth';

export const materialsRouter = Router();

// GET /api/materials
materialsRouter.get('/', async (req, res, next) => {
  try {
    const { status, type, search } = req.query;

    const where: any = {};
    if (status && typeof status === 'string') {
      where.status = status;
    }
    if (type && typeof type === 'string') {
      where.type = type;
    }
    if (search && typeof search === 'string') {
      where.OR = [
        { materialName: { contains: search } },
        { materialCode: { contains: search } },
        { supplier: { contains: search } }
      ];
    }

    const materials = await prisma.material.findMany({
      where,
      orderBy: { materialCode: 'asc' }
    });

    return res.json(materials);
  } catch (err) {
    next(err);
  }
});

// GET /api/materials/movements
materialsRouter.get('/movements', async (req, res, next) => {
  try {
    const movements = await prisma.stockMovement.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200
    });
    return res.json(movements);
  } catch (err) {
    next(err);
  }
});

// GET /api/materials/:id
materialsRouter.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const material = await prisma.material.findFirst({
      where: {
        OR: [{ id }, { materialCode: id }]
      }
    });

    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }

    return res.json(material);
  } catch (err) {
    next(err);
  }
});

// GET /api/materials/:id/movements
materialsRouter.get('/:id/movements', async (req, res, next) => {
  try {
    const { id } = req.params;
    const material = await prisma.material.findFirst({
      where: { OR: [{ id }, { materialCode: id }] }
    });

    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }

    const movements = await prisma.stockMovement.findMany({
      where: {
        OR: [{ materialId: material.id }, { materialCode: material.materialCode }]
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(movements);
  } catch (err) {
    next(err);
  }
});

// POST /api/materials
materialsRouter.post('/', requireAuth, requireRole('Admin', 'Store Manager', 'Plant Manager'), async (req, res, next) => {
  try {
    const parsed = materialSchema.parse(req.body);

    const initialStock = parsed.currentStock ?? parsed.openingStock;
    const status = parsed.status || computeMaterialStatus(initialStock, parsed.minimumStock);

    const count = await prisma.material.count();
    const assignedId = `MAT-${String(count + 1).padStart(3, '0')}`;

    const newMaterial = await prisma.material.create({
      data: {
        id: assignedId,
        materialCode: parsed.materialCode,
        materialName: parsed.materialName,
        type: parsed.type,
        grade: parsed.grade,
        size: parsed.size,
        unit: parsed.unit,
        openingStock: parsed.openingStock,
        currentStock: initialStock,
        minimumStock: parsed.minimumStock,
        reorderQuantity: parsed.reorderQuantity,
        unitPrice: parsed.unitPrice,
        supplier: parsed.supplier,
        locationRack: parsed.locationRack,
        status,
        lastRestockedDate: parsed.lastRestockedDate
      }
    });

    return res.status(201).json(newMaterial);
  } catch (err) {
    next(err);
  }
});

// PUT /api/materials/:id (Guarded: currentStock is stripped and cannot be overwritten)
materialsRouter.put('/:id', requireAuth, requireRole('Admin', 'Store Manager', 'Plant Manager'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const parsed = updateMaterialSchema.parse(req.body);

    const existing = await prisma.material.findFirst({
      where: { OR: [{ id }, { materialCode: id }] }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Material not found' });
    }

    // Recompute status if minimumStock changed
    const minStock = parsed.minimumStock ?? existing.minimumStock;
    const updatedStatus = computeMaterialStatus(existing.currentStock, minStock);

    const updated = await prisma.material.update({
      where: { id: existing.id },
      data: {
        ...parsed,
        status: updatedStatus
      }
    });

    return res.json(updated);
  } catch (err) {
    next(err);
  }
});

// POST /api/materials/:id/inward
materialsRouter.post('/:id/inward', requireAuth, requireRole('Admin', 'Store Manager', 'Plant Manager'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const body = stockInwardSchema.parse(req.body);

    const material = await prisma.material.findFirst({
      where: { OR: [{ id }, { materialCode: id }] }
    });

    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }

    const result = await prisma.$transaction(async (tx) => {
      return executeStockInward(tx, {
        materialId: material.id,
        quantity: body.quantity,
        date: body.date,
        reference: body.reference,
        supplier: body.supplier,
        heatNumber: body.heatNumber,
        notes: body.notes
      });
    });

    return res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/materials/:id/outward
materialsRouter.post('/:id/outward', requireAuth, requireRole('Admin', 'Store Manager', 'Plant Manager'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const body = stockOutwardSchema.parse(req.body);

    const material = await prisma.material.findFirst({
      where: { OR: [{ id }, { materialCode: id }] }
    });

    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }

    const result = await prisma.$transaction(async (tx) => {
      return executeStockOutward(tx, {
        materialId: material.id,
        quantity: body.quantity,
        date: body.date,
        reference: body.reference,
        issuedTo: body.issuedTo,
        notes: body.notes
      });
    });

    return res.json(result);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/materials/:id
materialsRouter.delete('/:id', requireAuth, requireRole('Admin'), async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.material.findFirst({
      where: { OR: [{ id }, { materialCode: id }] }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Material not found' });
    }

    await prisma.material.delete({
      where: { id: existing.id }
    });

    return res.json({ success: true, message: 'Material deleted successfully' });
  } catch (err) {
    next(err);
  }
});
