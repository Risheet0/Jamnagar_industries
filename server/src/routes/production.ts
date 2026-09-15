import { Router } from 'express';
import { prisma } from '../db';
import { productionJobSchema, updateProductionJobSchema, logProductionSchema } from '../validation';
import { executeStockOutward } from '../utils/materials';
import { requireAuth, requireRole } from '../middleware/auth';

export const productionRouter = Router();

// GET /api/production/jobs
productionRouter.get('/jobs', async (req, res, next) => {
  try {
    const { status, priority, workerId, search } = req.query;

    const where: any = {};
    if (status && typeof status === 'string') {
      where.status = status;
    }
    if (priority && typeof priority === 'string') {
      where.priority = priority;
    }
    if (workerId && typeof workerId === 'string') {
      where.assignedWorkerId = workerId;
    }
    if (search && typeof search === 'string') {
      where.OR = [
        { jobNumber: { contains: search } },
        { customer: { contains: search } },
        { productName: { contains: search } },
        { productCode: { contains: search } },
        { assignedWorker: { contains: search } }
      ];
    }

    const jobs = await prisma.productionJob.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    return res.json(jobs);
  } catch (err) {
    next(err);
  }
});

// GET /api/production/jobs/:id
productionRouter.get('/jobs/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const job = await prisma.productionJob.findFirst({
      where: {
        OR: [{ id }, { jobNumber: id }]
      }
    });

    if (!job) {
      return res.status(404).json({ error: 'Production Job not found' });
    }

    return res.json(job);
  } catch (err) {
    next(err);
  }
});

// POST /api/production/jobs (Creates job and atomically deducts material stock)
productionRouter.post('/jobs', requireAuth, requireRole('Admin', 'Plant Manager'), async (req, res, next) => {
  try {
    const parsed = productionJobSchema.parse(req.body);

    const year = new Date().getFullYear();
    let assignedJobNumber = parsed.jobNumber;
    if (!assignedJobNumber) {
      const count = await prisma.productionJob.count();
      assignedJobNumber = `JOB-${year}-${String(count + 1).padStart(3, '0')}`;
    }

    // Run job creation + material deduction in atomic transaction
    const createdJob = await prisma.$transaction(async (tx) => {
      // 1. If material deduction requested, find material and deduct
      if (parsed.deductMaterialStock && parsed.materialCode && parsed.materialQuantityToDeduct) {
        const material = await tx.material.findFirst({
          where: {
            OR: [
              { materialCode: parsed.materialCode },
              { id: parsed.materialCode }
            ]
          }
        });

        if (material) {
          await executeStockOutward(tx, {
            materialId: material.id,
            quantity: parsed.materialQuantityToDeduct,
            date: parsed.date,
            reference: assignedJobNumber,
            issuedTo: `${parsed.assignedWorker} (${assignedJobNumber})`,
            notes: `Auto-issued for production job ${assignedJobNumber}`
          });
        }
      }

      // 2. Create Job
      return tx.productionJob.create({
        data: {
          id: assignedJobNumber,
          jobNumber: assignedJobNumber,
          date: parsed.date,
          customer: parsed.customer,
          productCode: parsed.productCode,
          productName: parsed.productName,
          requiredQuantity: parsed.requiredQuantity,
          producedQuantity: parsed.producedQuantity ?? 0,
          rejectedQuantity: parsed.rejectedQuantity ?? 0,
          assignedWorker: parsed.assignedWorker,
          assignedWorkerId: parsed.assignedWorkerId,
          machine: parsed.machine,
          dueDate: parsed.dueDate,
          status: parsed.status,
          priority: parsed.priority,
          notes: parsed.notes
        }
      });
    });

    return res.status(201).json(createdJob);
  } catch (err) {
    next(err);
  }
});

// POST /api/production/jobs/:id/log-production
productionRouter.post('/jobs/:id/log-production', requireAuth, requireRole('Admin', 'Plant Manager', 'Quality Inspector'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { additionalProduced, additionalRejected, notes } = logProductionSchema.parse(req.body);

    const job = await prisma.productionJob.findFirst({
      where: { OR: [{ id }, { jobNumber: id }] }
    });

    if (!job) {
      return res.status(404).json({ error: 'Production Job not found' });
    }

    const newProduced = job.producedQuantity + additionalProduced;
    const newRejected = job.rejectedQuantity + additionalRejected;
    const isCompleted = newProduced >= job.requiredQuantity;
    const isNewlyCompleted = isCompleted && job.status !== 'Completed';

    const updatedJob = await prisma.productionJob.update({
      where: { id: job.id },
      data: {
        producedQuantity: newProduced,
        rejectedQuantity: newRejected,
        status: isCompleted ? 'Completed' : job.status,
        notes: notes ? (job.notes ? `${job.notes}\n${notes}` : notes) : job.notes
      }
    });

    return res.json({
      job: updatedJob,
      isNewlyCompleted
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/production/jobs/:id
productionRouter.put('/jobs/:id', requireAuth, requireRole('Admin', 'Plant Manager'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const parsed = updateProductionJobSchema.parse(req.body);

    const existing = await prisma.productionJob.findFirst({
      where: { OR: [{ id }, { jobNumber: id }] }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Production Job not found' });
    }

    const updated = await prisma.productionJob.update({
      where: { id: existing.id },
      data: {
        customer: parsed.customer,
        productCode: parsed.productCode,
        productName: parsed.productName,
        requiredQuantity: parsed.requiredQuantity,
        producedQuantity: parsed.producedQuantity,
        rejectedQuantity: parsed.rejectedQuantity,
        assignedWorker: parsed.assignedWorker,
        assignedWorkerId: parsed.assignedWorkerId,
        machine: parsed.machine,
        dueDate: parsed.dueDate,
        status: parsed.status,
        priority: parsed.priority,
        notes: parsed.notes
      }
    });

    return res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/production/jobs/:id
productionRouter.delete('/jobs/:id', requireAuth, requireRole('Admin'), async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.productionJob.findFirst({
      where: { OR: [{ id }, { jobNumber: id }] }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Production Job not found' });
    }

    await prisma.productionJob.delete({
      where: { id: existing.id }
    });

    return res.json({ success: true, message: 'Production Job deleted successfully' });
  } catch (err) {
    next(err);
  }
});
