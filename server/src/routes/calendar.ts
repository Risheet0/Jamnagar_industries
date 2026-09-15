import { Router } from 'express';
import { prisma } from '../db';
import { calendarOverrideSchema, plantConfigSchema } from '../validation';
import { requireAuth, requireRole } from '../middleware/auth';

export const calendarRouter = Router();

const DEFAULT_HOLIDAYS_2026 = [
  {
    id: 'HOL-2026-01-14',
    date: '2026-01-14',
    status: 'Closed',
    title: 'Makar Sankranti / Uttarayan',
    category: 'Festival',
    notes: 'Gujarat state kite festival — factory completely closed',
    isCustomOverride: true,
    declaredBy: 'Plant Admin'
  },
  {
    id: 'HOL-2026-01-26',
    date: '2026-01-26',
    status: 'Closed',
    title: 'Republic Day',
    category: 'National Holiday',
    notes: 'National Flag hoisting in morning, plant operations closed',
    isCustomOverride: true,
    declaredBy: 'Plant Admin'
  },
  {
    id: 'HOL-2026-03-04',
    date: '2026-03-04',
    status: 'Closed',
    title: 'Holi (Dhuleti)',
    category: 'Festival',
    notes: 'Festival of colors factory holiday',
    isCustomOverride: true,
    declaredBy: 'Plant Admin'
  },
  {
    id: 'HOL-2026-05-01',
    date: '2026-05-01',
    status: 'Closed',
    title: 'Gujarat Gaurav Din / Labour Day',
    category: 'National Holiday',
    notes: 'Official state formation & workers day',
    isCustomOverride: true,
    declaredBy: 'Plant Admin'
  },
  {
    id: 'HOL-2026-08-15',
    date: '2026-08-15',
    status: 'Closed',
    title: 'Independence Day',
    category: 'National Holiday',
    notes: '79th Independence Day national holiday',
    isCustomOverride: true,
    declaredBy: 'Plant Admin'
  },
  {
    id: 'HOL-2026-09-04',
    date: '2026-09-04',
    status: 'Closed',
    title: 'Janmashtami (Lord Krishna Birth)',
    category: 'Festival',
    notes: 'Major Saurashtra cultural festival — brass foundry shutdown',
    isCustomOverride: true,
    declaredBy: 'Plant Admin'
  },
  {
    id: 'HOL-2026-10-02',
    date: '2026-10-02',
    status: 'Closed',
    title: 'Mahatma Gandhi Jayanti',
    category: 'National Holiday',
    notes: 'Porbandar / Gujarat national remembrance day',
    isCustomOverride: true,
    declaredBy: 'Plant Admin'
  },
  {
    id: 'HOL-2026-10-20',
    date: '2026-10-20',
    status: 'Closed',
    title: 'Dussehra / Vijaya Dashami (Shastra Puja)',
    category: 'Festival',
    notes: 'Plant machinery & tools Puja at 10:00 AM, production off',
    isCustomOverride: true,
    declaredBy: 'Plant Admin'
  },
  {
    id: 'HOL-2026-11-08',
    date: '2026-11-08',
    status: 'Closed',
    title: 'Diwali (Deepavali Plant Shutdown)',
    category: 'Festival',
    notes: 'Diwali foundry maintenance & vacation shutdown',
    isCustomOverride: true,
    declaredBy: 'Plant Admin'
  },
  {
    id: 'HOL-2026-11-09',
    date: '2026-11-09',
    status: 'Closed',
    title: 'Nutan Varsh (Gujarati New Year)',
    category: 'Festival',
    notes: 'Bestu Varas annual new year',
    isCustomOverride: true,
    declaredBy: 'Plant Admin'
  },
  {
    id: 'HOL-2026-11-10',
    date: '2026-11-10',
    status: 'Closed',
    title: 'Bhai Dooj (Bhai Bij)',
    category: 'Festival',
    notes: 'Post-Diwali holiday',
    isCustomOverride: true,
    declaredBy: 'Plant Admin'
  }
];

// GET /api/calendar/config
calendarRouter.get('/config', async (req, res, next) => {
  try {
    let config = await prisma.plantOperationalConfig.findUnique({
      where: { id: 'singleton' }
    });

    if (!config) {
      config = await prisma.plantOperationalConfig.create({
        data: {
          id: 'singleton',
          defaultWeeklyOffDay: 5,
          weeklyOffTitle: 'Friday Factory Weekly Off',
          standardShiftTimings: 'Day Shift: 8:00 AM - 8:00 PM (12h)'
        }
      });
    }

    return res.json(config);
  } catch (err) {
    next(err);
  }
});

// PUT /api/calendar/config
calendarRouter.put('/config', requireAuth, requireRole('Admin', 'Plant Manager'), async (req, res, next) => {
  try {
    const parsed = plantConfigSchema.parse(req.body);

    const updated = await prisma.plantOperationalConfig.upsert({
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

// GET /api/calendar/entries (all overrides and custom entries)
calendarRouter.get('/entries', async (req, res, next) => {
  try {
    const entries = await prisma.factoryCalendarEntry.findMany({
      orderBy: { date: 'asc' }
    });
    return res.json(entries);
  } catch (err) {
    next(err);
  }
});

// GET /api/calendar/day/:date
calendarRouter.get('/day/:date', async (req, res, next) => {
  try {
    const { date } = req.params;

    const entry = await prisma.factoryCalendarEntry.findUnique({
      where: { date }
    });

    if (entry) {
      return res.json(entry);
    }

    // Compute from plant operational config default weekly-off
    const config = await prisma.plantOperationalConfig.findUnique({
      where: { id: 'singleton' }
    });
    const weeklyOffDay = config ? config.defaultWeeklyOffDay : 5;
    const weeklyOffTitle = config ? config.weeklyOffTitle : 'Friday Factory Weekly Off';

    const d = new Date(date + 'T00:00:00');
    const dayOfWeek = d.getDay();

    if (dayOfWeek === weeklyOffDay) {
      return res.json({
        id: `CAL-${date}`,
        date,
        status: 'Closed',
        title: weeklyOffTitle,
        category: 'Weekly Off',
        isCustomOverride: false
      });
    }

    return res.json({
      id: `CAL-${date}`,
      date,
      status: 'Open',
      title: 'Standard Working Day',
      category: 'Special Working Day',
      shiftTimings: config ? config.standardShiftTimings : '8:00 AM - 8:00 PM',
      isCustomOverride: false
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/calendar/override
calendarRouter.post('/override', requireAuth, requireRole('Admin', 'Plant Manager'), async (req, res, next) => {
  try {
    const parsed = calendarOverrideSchema.parse(req.body);

    const entry = await prisma.factoryCalendarEntry.upsert({
      where: { date: parsed.date },
      create: {
        id: `CAL-${parsed.date}`,
        date: parsed.date,
        status: parsed.status,
        title: parsed.title,
        category: parsed.category,
        notes: parsed.notes,
        shiftTimings: parsed.shiftTimings,
        isCustomOverride: true,
        declaredBy: parsed.declaredBy || req.session.username || 'Plant Admin'
      },
      update: {
        status: parsed.status,
        title: parsed.title,
        category: parsed.category,
        notes: parsed.notes,
        shiftTimings: parsed.shiftTimings,
        isCustomOverride: true,
        declaredBy: parsed.declaredBy || req.session.username || 'Plant Admin'
      }
    });

    return res.json(entry);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/calendar/override/:date
calendarRouter.delete('/override/:date', requireAuth, requireRole('Admin', 'Plant Manager'), async (req, res, next) => {
  try {
    const { date } = req.params;

    await prisma.factoryCalendarEntry.deleteMany({
      where: { date }
    });

    return res.json({ success: true, message: `Override for ${date} removed` });
  } catch (err) {
    next(err);
  }
});

// POST /api/calendar/reset-holidays
calendarRouter.post('/reset-holidays', requireAuth, requireRole('Admin'), async (req, res, next) => {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.factoryCalendarEntry.deleteMany();
      await tx.factoryCalendarEntry.createMany({
        data: DEFAULT_HOLIDAYS_2026
      });
    });

    return res.json({ success: true, message: 'Factory holidays reset to 2026 default schedule' });
  } catch (err) {
    next(err);
  }
});
