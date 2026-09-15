import { Router } from 'express';
import { prisma } from '../db';

export const dashboardRouter = Router();

// GET /api/dashboard/summary
dashboardRouter.get('/summary', async (req, res, next) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];

    const [
      totalWorkers,
      activeWorkers,
      totalMaterials,
      lowStockMaterials,
      totalJobs,
      activeJobs,
      inspections,
      todayAttendance,
      companyProfile,
      calendarDay
    ] = await Promise.all([
      prisma.worker.count(),
      prisma.worker.count({ where: { status: 'Active' } }),
      prisma.material.count(),
      prisma.material.findMany({
        where: {
          OR: [{ status: 'Low Stock' }, { status: 'Out of Stock' }]
        },
        take: 5
      }),
      prisma.productionJob.count(),
      prisma.productionJob.findMany({
        where: { status: 'In Production' },
        take: 5,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.qualityInspection.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.attendanceRecord.findMany({
        where: { date: todayStr }
      }),
      prisma.companyProfile.findUnique({
        where: { id: 'singleton' }
      }),
      prisma.factoryCalendarEntry.findUnique({
        where: { date: todayStr }
      })
    ]);

    const passedInspections = inspections.filter(i => i.result === 'Pass').length;
    const qualityPassRate =
      inspections.length > 0 ? Math.round((passedInspections / inspections.length) * 100) : 100;

    let presentToday = 0;
    let absentToday = 0;
    let halfDayToday = 0;
    let onLeaveToday = 0;
    let holidayToday = 0;

    todayAttendance.forEach(a => {
      if (a.status === 'Present') presentToday++;
      else if (a.status === 'Absent') absentToday++;
      else if (a.status === 'Half Day') halfDayToday++;
      else if (a.status === 'On Leave') onLeaveToday++;
      else if (a.status === 'Holiday') holidayToday++;
    });

    return res.json({
      workers: {
        total: totalWorkers,
        active: activeWorkers
      },
      materials: {
        total: totalMaterials,
        lowStockCount: lowStockMaterials.length,
        lowStockItems: lowStockMaterials
      },
      jobs: {
        total: totalJobs,
        activeCount: activeJobs.length,
        activeJobs
      },
      quality: {
        inspectionsCount: inspections.length,
        passRate: qualityPassRate
      },
      todayAttendance: {
        date: todayStr,
        present: presentToday,
        absent: absentToday,
        halfDay: halfDayToday,
        onLeave: onLeaveToday,
        holiday: holidayToday,
        totalMarked: todayAttendance.length
      },
      plantStatus: {
        calendarStatus: calendarDay ? calendarDay.status : 'Open',
        calendarTitle: calendarDay ? calendarDay.title : 'Standard Working Day'
      }
    });
  } catch (err) {
    next(err);
  }
});
