import { Router } from 'express';
import { prisma } from '../db';
import { qualityInspectionSchema, updateQualityInspectionSchema } from '../validation';
import { requireAuth, requireRole } from '../middleware/auth';

export const qualityRouter = Router();

function formatInspection(raw: any) {
  let defectTypes: string[] = [];
  try {
    defectTypes = typeof raw.defectTypes === 'string' ? JSON.parse(raw.defectTypes) : raw.defectTypes || [];
  } catch {
    defectTypes = [];
  }
  return {
    ...raw,
    defectTypes
  };
}

// GET /api/quality/inspections
qualityRouter.get('/inspections', async (req, res, next) => {
  try {
    const { result, inspectionType, jobId, search } = req.query;

    const where: any = {};
    if (result && typeof result === 'string') {
      where.result = result;
    }
    if (inspectionType && typeof inspectionType === 'string') {
      where.inspectionType = inspectionType;
    }
    if (jobId && typeof jobId === 'string') {
      where.jobId = jobId;
    }
    if (search && typeof search === 'string') {
      where.OR = [
        { jobNumber: { contains: search } },
        { productCode: { contains: search } },
        { productName: { contains: search } },
        { inspectedBy: { contains: search } }
      ];
    }

    const inspections = await prisma.qualityInspection.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    return res.json(inspections.map(formatInspection));
  } catch (err) {
    next(err);
  }
});

// GET /api/quality/inspections/:id
qualityRouter.get('/inspections/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const inspection = await prisma.qualityInspection.findUnique({
      where: { id }
    });

    if (!inspection) {
      return res.status(404).json({ error: 'Inspection not found' });
    }

    return res.json(formatInspection(inspection));
  } catch (err) {
    next(err);
  }
});

// POST /api/quality/inspections
qualityRouter.post('/inspections', requireAuth, requireRole('Admin', 'Plant Manager', 'Quality Inspector'), async (req, res, next) => {
  try {
    const parsed = qualityInspectionSchema.parse(req.body);

    const count = await prisma.qualityInspection.count();
    const assignedId = `QC-${String(count + 1).padStart(4, '0')}`;

    const newInspection = await prisma.qualityInspection.create({
      data: {
        id: assignedId,
        jobId: parsed.jobId,
        jobNumber: parsed.jobNumber,
        productCode: parsed.productCode,
        productName: parsed.productName,
        inspectionType: parsed.inspectionType,
        sampleSize: parsed.sampleSize,
        inspectedQuantity: parsed.inspectedQuantity,
        passedQuantity: parsed.passedQuantity,
        rejectedQuantity: parsed.rejectedQuantity,
        defectTypes: JSON.stringify(parsed.defectTypes || []),
        dimensionalNotes: parsed.dimensionalNotes,
        result: parsed.result,
        inspectedBy: parsed.inspectedBy,
        date: parsed.date,
        remarks: parsed.remarks
      }
    });

    return res.status(201).json(formatInspection(newInspection));
  } catch (err) {
    next(err);
  }
});

// PUT /api/quality/inspections/:id
qualityRouter.put('/inspections/:id', requireAuth, requireRole('Admin', 'Plant Manager', 'Quality Inspector'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const parsed = updateQualityInspectionSchema.parse(req.body);

    const existing = await prisma.qualityInspection.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Inspection not found' });
    }

    const dataToUpdate: any = { ...parsed };
    if (parsed.defectTypes !== undefined) {
      dataToUpdate.defectTypes = JSON.stringify(parsed.defectTypes);
    }

    const updated = await prisma.qualityInspection.update({
      where: { id },
      data: dataToUpdate
    });

    return res.json(formatInspection(updated));
  } catch (err) {
    next(err);
  }
});

// DELETE /api/quality/inspections/:id
qualityRouter.delete('/inspections/:id', requireAuth, requireRole('Admin'), async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.qualityInspection.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Inspection not found' });
    }

    await prisma.qualityInspection.delete({
      where: { id }
    });

    return res.json({ success: true, message: 'Inspection deleted successfully' });
  } catch (err) {
    next(err);
  }
});
