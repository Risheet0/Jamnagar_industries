import { Router } from 'express';
import { prisma } from '../db';
import { attendanceMarkSchema, attendanceBulkMarkSchema } from '../validation';
import { requireAuth, requireRole } from '../middleware/auth';

export const attendanceRouter = Router();

// GET /api/attendance/day/:date
attendanceRouter.get('/day/:date', async (req, res, next) => {
  try {
    const { date } = req.params;
    const records = await prisma.attendanceRecord.findMany({
      where: { date }
    });
    return res.json(records);
  } catch (err) {
    next(err);
  }
});

// GET /api/attendance/worker/:workerId/month/:year/:month
attendanceRouter.get('/worker/:workerId/month/:year/:month', async (req, res, next) => {
  try {
    const { workerId, year, month } = req.params;
    const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;

    const records = await prisma.attendanceRecord.findMany({
      where: {
        workerId,
        date: { startsWith: monthPrefix }
      },
      orderBy: { date: 'asc' }
    });

    return res.json(records);
  } catch (err) {
    next(err);
  }
});

// GET /api/attendance/all
attendanceRouter.get('/all', async (req, res, next) => {
  try {
    const { workerId, dateFrom, dateTo, month } = req.query;

    const where: any = {};
    if (workerId && typeof workerId === 'string') {
      where.workerId = workerId;
    }
    if (month && typeof month === 'string') {
      where.date = { startsWith: month };
    } else if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom && typeof dateFrom === 'string') where.date.gte = dateFrom;
      if (dateTo && typeof dateTo === 'string') where.date.lte = dateTo;
    }

    const records = await prisma.attendanceRecord.findMany({
      where,
      orderBy: [{ date: 'asc' }, { workerId: 'asc' }]
    });

    return res.json(records);
  } catch (err) {
    next(err);
  }
});

// POST /api/attendance/mark
attendanceRouter.post('/mark', requireAuth, requireRole('Admin', 'Plant Manager'), async (req, res, next) => {
  try {
    const parsed = attendanceMarkSchema.parse(req.body);

    const defaultCheckIn =
      parsed.status === 'Present' || parsed.status === 'Half Day'
        ? parsed.checkInTime || '08:15'
        : undefined;

    const defaultCheckOut =
      parsed.status === 'Present'
        ? parsed.checkOutTime || '20:00'
        : parsed.status === 'Half Day'
        ? parsed.checkOutTime || '14:00'
        : undefined;

    const record = await prisma.attendanceRecord.upsert({
      where: {
        workerId_date: {
          workerId: parsed.workerId,
          date: parsed.date
        }
      },
      create: {
        workerId: parsed.workerId,
        date: parsed.date,
        status: parsed.status,
        checkInTime: defaultCheckIn,
        checkOutTime: defaultCheckOut,
        notes: parsed.notes,
        leaveRecordId: parsed.leaveRecordId
      },
      update: {
        status: parsed.status,
        checkInTime: defaultCheckIn,
        checkOutTime: defaultCheckOut,
        notes: parsed.notes,
        leaveRecordId: parsed.leaveRecordId
      }
    });

    return res.json(record);
  } catch (err) {
    next(err);
  }
});

// POST /api/attendance/bulk-mark
attendanceRouter.post('/bulk-mark', requireAuth, requireRole('Admin', 'Plant Manager'), async (req, res, next) => {
  try {
    const { workerIds, date, status } = attendanceBulkMarkSchema.parse(req.body);

    const defaultCheckIn = status === 'Present' || status === 'Half Day' ? '08:15' : undefined;
    const defaultCheckOut =
      status === 'Present' ? '20:00' : status === 'Half Day' ? '14:00' : undefined;

    await prisma.$transaction(async (tx) => {
      for (const workerId of workerIds) {
        await tx.attendanceRecord.upsert({
          where: {
            workerId_date: {
              workerId,
              date
            }
          },
          create: {
            workerId,
            date,
            status,
            checkInTime: defaultCheckIn,
            checkOutTime: defaultCheckOut
          },
          update: {
            status,
            checkInTime: defaultCheckIn,
            checkOutTime: defaultCheckOut
          }
        });
      }
    });

    const updatedRecords = await prisma.attendanceRecord.findMany({
      where: {
        date,
        workerId: { in: workerIds }
      }
    });

    return res.json(updatedRecords);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/attendance/:workerId/:date
attendanceRouter.delete('/:workerId/:date', requireAuth, requireRole('Admin', 'Plant Manager'), async (req, res, next) => {
  try {
    const { workerId, date } = req.params;

    await prisma.attendanceRecord.deleteMany({
      where: {
        workerId,
        date
      }
    });

    return res.json({ success: true, message: 'Attendance record deleted' });
  } catch (err) {
    next(err);
  }
});
