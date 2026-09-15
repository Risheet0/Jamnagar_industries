import { Router } from 'express';
import { prisma } from '../db';
import { salaryAdjustmentSchema, shiftConfigSchema } from '../validation';
import { calculateWorkerPayroll, generatePayrollExcelBuffer } from '../utils/payroll';
import { requireAuth, requireRole } from '../middleware/auth';

export const payrollRouter = Router();

// GET /api/payroll/shift-config
payrollRouter.get('/shift-config', async (req, res, next) => {
  try {
    let config = await prisma.shiftConfig.findUnique({
      where: { id: 'singleton' }
    });

    if (!config) {
      config = await prisma.shiftConfig.create({
        data: {
          id: 'singleton',
          standardStartTime: '08:00',
          standardEndTime: '20:00',
          overtimeMultiplier: 1.5
        }
      });
    }

    return res.json(config);
  } catch (err) {
    next(err);
  }
});

// PUT /api/payroll/shift-config
payrollRouter.put('/shift-config', requireAuth, requireRole('Admin'), async (req, res, next) => {
  try {
    const parsed = shiftConfigSchema.parse(req.body);

    const updated = await prisma.shiftConfig.upsert({
      where: { id: 'singleton' },
      create: {
        id: 'singleton',
        ...parsed
      },
      update: parsed
    });

    return res.json(updated);
  } catch (err) {
    next(err);
  }
});

// GET /api/payroll/adjustments
payrollRouter.get('/adjustments', async (req, res, next) => {
  try {
    const { workerId, dateFrom, dateTo } = req.query;

    const where: any = {};
    if (workerId && typeof workerId === 'string') {
      where.workerId = workerId;
    }
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom && typeof dateFrom === 'string') where.date.gte = dateFrom;
      if (dateTo && typeof dateTo === 'string') where.date.lte = dateTo;
    }

    const adjustments = await prisma.salaryAdjustment.findMany({
      where,
      orderBy: { date: 'desc' }
    });

    return res.json(adjustments);
  } catch (err) {
    next(err);
  }
});

// POST /api/payroll/adjustments
payrollRouter.post('/adjustments', requireAuth, requireRole('Admin', 'Plant Manager'), async (req, res, next) => {
  try {
    const parsed = salaryAdjustmentSchema.parse(req.body);

    const count = await prisma.salaryAdjustment.count();
    const assignedId = `ADJ-${String(count + 101).padStart(3, '0')}`;

    const newAdj = await prisma.salaryAdjustment.create({
      data: {
        id: assignedId,
        workerId: parsed.workerId,
        date: parsed.date,
        type: parsed.type,
        amount: parsed.amount,
        reason: parsed.reason
      }
    });

    return res.status(201).json(newAdj);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/payroll/adjustments/:id
payrollRouter.delete('/adjustments/:id', requireAuth, requireRole('Admin', 'Plant Manager'), async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.salaryAdjustment.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Adjustment not found' });
    }

    await prisma.salaryAdjustment.delete({
      where: { id }
    });

    return res.json({ success: true, message: 'Adjustment deleted' });
  } catch (err) {
    next(err);
  }
});

// Helper to compute payroll summaries
async function computePayrollData(query: any) {
  const { periodStart, periodEnd, workerId, periodLabel } = query;

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');

  const start = (typeof periodStart === 'string' && periodStart) || `${year}-${month}-01`;
  const end = (typeof periodEnd === 'string' && periodEnd) || `${year}-${month}-30`;
  const label = (typeof periodLabel === 'string' && periodLabel) || `${start} to ${end}`;

  const workerWhere: any = { status: 'Active' };
  if (workerId && typeof workerId === 'string') {
    workerWhere.OR = [{ id: workerId }, { workerId }];
    delete workerWhere.status;
  }

  const workers = await prisma.worker.findMany({
    where: workerWhere,
    orderBy: { workerId: 'asc' }
  });

  let shiftConfig = await prisma.shiftConfig.findUnique({
    where: { id: 'singleton' }
  });
  if (!shiftConfig) {
    shiftConfig = {
      id: 'singleton',
      standardStartTime: '08:00',
      standardEndTime: '20:00',
      overtimeMultiplier: 1.5
    };
  }

  const attendanceRecords = await prisma.attendanceRecord.findMany({
    where: {
      date: {
        gte: start,
        lte: end
      }
    }
  });

  const adjustments = await prisma.salaryAdjustment.findMany({
    where: {
      date: {
        gte: start,
        lte: end
      }
    }
  });

  const summaries = workers.map(worker => {
    const workerAttendance = attendanceRecords.filter(
      r => r.workerId === worker.workerId || r.workerId === worker.id
    );
    const workerAdjustments = adjustments.filter(
      a => a.workerId === worker.workerId || a.workerId === worker.id
    );

    return calculateWorkerPayroll(
      worker,
      workerAttendance,
      shiftConfig,
      workerAdjustments,
      label,
      start,
      end
    );
  });

  return { summaries, label, start, end };
}

// GET /api/payroll/report
payrollRouter.get('/report', async (req, res, next) => {
  try {
    const { summaries, label, start, end } = await computePayrollData(req.query);
    return res.json({
      periodLabel: label,
      periodStart: start,
      periodEnd: end,
      summaries
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/payroll/report/excel (Download binary Excel report)
payrollRouter.get('/report/excel', async (req, res, next) => {
  try {
    const { summaries, label } = await computePayrollData(req.query);

    const profile = await prisma.companyProfile.findUnique({
      where: { id: 'singleton' }
    });

    const companyName = profile?.name || 'Vadilal Engineering Industries';
    const buffer = generatePayrollExcelBuffer(summaries, label, companyName);

    const filename = `Payroll_Statement_${label.replace(/[^a-zA-Z0-9_-]/g, '_')}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(buffer);
  } catch (err) {
    next(err);
  }
});
