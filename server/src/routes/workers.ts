import { Router } from 'express';
import { prisma } from '../db';
import { workerSchema, updateWorkerSchema } from '../validation';
import { requireAuth, requireRole } from '../middleware/auth';

export const workersRouter = Router();

// GET /api/workers
workersRouter.get('/', async (req, res, next) => {
  try {
    const { department, status, search } = req.query;

    const where: any = {};
    if (department && typeof department === 'string') {
      where.department = department;
    }
    if (status && typeof status === 'string') {
      where.status = status;
    }
    if (search && typeof search === 'string') {
      where.OR = [
        { name: { contains: search } },
        { workerId: { contains: search } },
        { mobile: { contains: search } }
      ];
    }

    const workers = await prisma.worker.findMany({
      where,
      orderBy: { workerId: 'asc' }
    });

    return res.json(workers);
  } catch (err) {
    next(err);
  }
});

// GET /api/workers/:id
workersRouter.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const worker = await prisma.worker.findFirst({
      where: {
        OR: [{ id }, { workerId: id }]
      }
    });

    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    return res.json(worker);
  } catch (err) {
    next(err);
  }
});

// POST /api/workers
workersRouter.post('/', requireAuth, requireRole('Admin', 'Plant Manager'), async (req, res, next) => {
  try {
    const parsed = workerSchema.parse(req.body);

    let assignedId = parsed.workerId;
    if (!assignedId) {
      const count = await prisma.worker.count();
      assignedId = `WRK-${String(count + 1).padStart(3, '0')}`;
    }

    const newWorker = await prisma.worker.create({
      data: {
        id: assignedId,
        workerId: assignedId,
        name: parsed.name,
        photo: parsed.photo,
        mobile: parsed.mobile,
        address: parsed.address,
        joiningDate: parsed.joiningDate,
        skill: parsed.skill,
        department: parsed.department,
        salaryType: parsed.salaryType,
        salary: parsed.salary,
        salaryNotes: parsed.salaryNotes,
        overtimeRate: parsed.overtimeRate,
        status: parsed.status,
        shift: parsed.shift,
        emergencyContact: parsed.emergencyContact,
        aadharNumber: parsed.aadharNumber
      }
    });

    return res.status(201).json(newWorker);
  } catch (err) {
    next(err);
  }
});

// PUT /api/workers/:id
workersRouter.put('/:id', requireAuth, requireRole('Admin', 'Plant Manager'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const parsed = updateWorkerSchema.parse(req.body);

    const existing = await prisma.worker.findFirst({
      where: { OR: [{ id }, { workerId: id }] }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    const updated = await prisma.worker.update({
      where: { id: existing.id },
      data: parsed
    });

    return res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/workers/:id
workersRouter.delete('/:id', requireAuth, requireRole('Admin'), async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.worker.findFirst({
      where: { OR: [{ id }, { workerId: id }] }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    await prisma.worker.delete({
      where: { id: existing.id }
    });

    return res.json({ success: true, message: 'Worker deleted successfully' });
  } catch (err) {
    next(err);
  }
});
