import { Router } from 'express';
import { prisma } from '../db';
import { productSchema, updateProductSchema } from '../validation';
import { requireAuth, requireRole } from '../middleware/auth';

export const productsRouter = Router();

// GET /api/products
productsRouter.get('/', async (req, res, next) => {
  try {
    const { category, status, search } = req.query;

    const where: any = {};
    if (category && typeof category === 'string') {
      where.category = category;
    }
    if (status && typeof status === 'string') {
      where.status = status;
    }
    if (search && typeof search === 'string') {
      where.OR = [
        { productName: { contains: search } },
        { productCode: { contains: search } },
        { material: { contains: search } }
      ];
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { productCode: 'asc' }
    });

    return res.json(products);
  } catch (err) {
    next(err);
  }
});

// GET /api/products/:id
productsRouter.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id }, { productCode: id }]
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    return res.json(product);
  } catch (err) {
    next(err);
  }
});

// POST /api/products
productsRouter.post('/', requireAuth, requireRole('Admin', 'Plant Manager'), async (req, res, next) => {
  try {
    const parsed = productSchema.parse(req.body);

    const count = await prisma.product.count();
    const assignedId = `PRD-${String(count + 1).padStart(3, '0')}`;

    const newProduct = await prisma.product.create({
      data: {
        id: assignedId,
        productCode: parsed.productCode,
        productName: parsed.productName,
        photo: parsed.photo,
        drawing: parsed.drawing,
        drawingRevision: parsed.drawingRevision,
        material: parsed.material,
        materialCode: parsed.materialCode,
        weight: parsed.weight,
        weightUnit: parsed.weightUnit,
        unit: parsed.unit,
        targetCycleTimeSec: parsed.targetCycleTimeSec,
        unitPrice: parsed.unitPrice,
        status: parsed.status,
        category: parsed.category
      }
    });

    return res.status(201).json(newProduct);
  } catch (err) {
    next(err);
  }
});

// PUT /api/products/:id
productsRouter.put('/:id', requireAuth, requireRole('Admin', 'Plant Manager'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const parsed = updateProductSchema.parse(req.body);

    const existing = await prisma.product.findFirst({
      where: { OR: [{ id }, { productCode: id }] }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const updated = await prisma.product.update({
      where: { id: existing.id },
      data: parsed
    });

    return res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/products/:id
productsRouter.delete('/:id', requireAuth, requireRole('Admin'), async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.product.findFirst({
      where: { OR: [{ id }, { productCode: id }] }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await prisma.product.delete({
      where: { id: existing.id }
    });

    return res.json({ success: true, message: 'Product deleted successfully' });
  } catch (err) {
    next(err);
  }
});
