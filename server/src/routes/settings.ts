import { Router } from 'express';
import { prisma } from '../db';
import { companyProfileSchema } from '../validation';
import { requireAuth, requireRole } from '../middleware/auth';

export const settingsRouter = Router();

function formatProfile(raw: any) {
  let currentUser = {
    name: 'Ramesh Patel',
    username: 'admin',
    role: 'Factory Manager',
    department: 'Plant Operations & Production Control',
    avatarInitials: 'RP'
  };
  let shiftTiming = {
    currentShift: 'Shift A (08:00 AM - 08:00 PM)',
    plantStatus: 'Operational',
    operatorCount: 42
  };

  try {
    if (raw.currentUserJson) currentUser = JSON.parse(raw.currentUserJson);
  } catch {}
  try {
    if (raw.shiftTimingJson) shiftTiming = JSON.parse(raw.shiftTimingJson);
  } catch {}

  return {
    name: raw.name,
    location: raw.location,
    plantAddress: raw.plantAddress,
    gstNumber: raw.gstNumber,
    phone: raw.phone,
    email: raw.email,
    currentUser,
    shiftTiming
  };
}

// GET /api/settings/company-profile
settingsRouter.get('/company-profile', async (req, res, next) => {
  try {
    let profile = await prisma.companyProfile.findUnique({
      where: { id: 'singleton' }
    });

    if (!profile) {
      profile = await prisma.companyProfile.create({
        data: {
          id: 'singleton',
          name: 'Vadilal Engineering Industries',
          location: 'Ahmedabad, Gujarat',
          plantAddress:
            'Plot No. 48/B, Phase 2, GIDC Industrial Estate, Vatva, Ahmedabad - 382445, Gujarat, India',
          gstNumber: '24AAACV1234F1Z5',
          phone: '+91 (079) 2583-4900',
          email: 'factory.manager@vadilaleng.in',
          currentUserJson: JSON.stringify({
            name: 'Ramesh Patel',
            username: 'admin',
            role: 'Factory Manager',
            department: 'Plant Operations & Production Control',
            avatarInitials: 'RP'
          }),
          shiftTimingJson: JSON.stringify({
            currentShift: 'Shift A (08:00 AM - 08:00 PM)',
            plantStatus: 'Operational',
            operatorCount: 42
          })
        }
      });
    }

    return res.json(formatProfile(profile));
  } catch (err) {
    next(err);
  }
});

// PUT /api/settings/company-profile
settingsRouter.put('/company-profile', async (req, res, next) => {
  try {
    const parsed = companyProfileSchema.parse(req.body);

    const defaultUser = {
      name: 'Ramesh Patel',
      username: 'admin',
      role: 'Factory Manager',
      department: 'Plant Operations & Production Control',
      avatarInitials: 'RP'
    };
    const defaultShift = {
      currentShift: 'Shift A (08:00 AM - 08:00 PM)',
      plantStatus: 'Operational',
      operatorCount: 42
    };

    const dataToSave: any = {
      name: parsed.name,
      location: parsed.location,
      plantAddress: parsed.plantAddress,
      gstNumber: parsed.gstNumber,
      phone: parsed.phone,
      email: parsed.email,
      currentUserJson: parsed.currentUser ? JSON.stringify(parsed.currentUser) : JSON.stringify(defaultUser),
      shiftTimingJson: parsed.shiftTiming ? JSON.stringify(parsed.shiftTiming) : JSON.stringify(defaultShift)
    };

    const updated = await prisma.companyProfile.upsert({
      where: { id: 'singleton' },
      create: {
        id: 'singleton',
        ...dataToSave
      },
      update: dataToSave
    });

    return res.json(formatProfile(updated));
  } catch (err) {
    next(err);
  }
});
