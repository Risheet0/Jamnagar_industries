import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Jamnagar ERP database...');

  // 1. Clear existing data
  await prisma.qualityInspection.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.productionJob.deleteMany();
  await prisma.salaryAdjustment.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.leaveRecord.deleteMany();
  await prisma.product.deleteMany();
  await prisma.material.deleteMany();
  await prisma.worker.deleteMany();
  await prisma.factoryCalendarEntry.deleteMany();
  await prisma.plantOperationalConfig.deleteMany();
  await prisma.shiftConfig.deleteMany();
  await prisma.companyProfile.deleteMany();
  await prisma.user.deleteMany();

  // 2. Users
  const adminHash = await bcrypt.hash('admin123', 10);
  const managerHash = await bcrypt.hash('manager123', 10);
  const qualityHash = await bcrypt.hash('quality123', 10);
  const storeHash = await bcrypt.hash('store123', 10);
  const viewerHash = await bcrypt.hash('viewer123', 10);

  await prisma.user.createMany({
    data: [
      {
        username: 'admin',
        passwordHash: adminHash,
        role: 'Admin',
        mustChangePassword: true
      },
      {
        username: 'manager',
        passwordHash: managerHash,
        role: 'Plant Manager',
        mustChangePassword: false
      },
      {
        username: 'quality',
        passwordHash: qualityHash,
        role: 'Quality Inspector',
        mustChangePassword: false
      },
      {
        username: 'store',
        passwordHash: storeHash,
        role: 'Store Manager',
        mustChangePassword: false
      },
      {
        username: 'viewer',
        passwordHash: viewerHash,
        role: 'Viewer',
        mustChangePassword: false
      }
    ]
  });

  // 3. Singletons
  await prisma.plantOperationalConfig.create({
    data: {
      id: 'singleton',
      defaultWeeklyOffDay: 5, // Friday
      weeklyOffTitle: 'Friday Factory Weekly Off',
      standardShiftTimings: 'Day Shift: 8:00 AM - 8:00 PM (12h)',
      emergencyContact: '+91 98251 99881'
    }
  });

  await prisma.shiftConfig.create({
    data: {
      id: 'singleton',
      standardStartTime: '08:00',
      standardEndTime: '20:00',
      overtimeMultiplier: 1.5
    }
  });

  await prisma.companyProfile.create({
    data: {
      id: 'singleton',
      name: 'Vadilal Engineering Industries',
      location: 'Ahmedabad, Gujarat',
      plantAddress: 'Plot No. 48/B, Phase 2, GIDC Industrial Estate, Vatva, Ahmedabad - 382445, Gujarat, India',
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

  // 4. Workers
  await prisma.worker.createMany({
    data: [
      {
        id: 'WRK-001',
        workerId: 'WRK-001',
        name: 'Rajeshbhai Panchal',
        mobile: '+91 98251 44321',
        address: 'Block C-12, Ambica Nagar, Odhav, Ahmedabad',
        joiningDate: '2021-03-15',
        skill: 'CNC Operator',
        department: 'Machining',
        salaryType: 'Monthly Fixed',
        salary: 28500,
        salaryNotes: 'Overtime computed at 1.5x regular hourly equivalent',
        overtimeRate: 164.42,
        status: 'Active',
        shift: 'Shift A (8:00 AM - 8:00 PM)',
        emergencyContact: '+91 98251 99881',
        aadharNumber: 'XXXX-XXXX-4512'
      },
      {
        id: 'WRK-002',
        workerId: 'WRK-002',
        name: 'Hareshbhai Vaghela',
        mobile: '+91 98252 55432',
        address: 'Plot 44, GIDC Colony, Vatva, Ahmedabad',
        joiningDate: '2022-06-01',
        skill: 'VMC Specialist',
        department: 'Machining',
        salaryType: 'Monthly Fixed',
        salary: 32000,
        overtimeRate: 184.62,
        status: 'Active',
        shift: 'Shift A (8:00 AM - 8:00 PM)',
        emergencyContact: '+91 98252 88776',
        aadharNumber: 'XXXX-XXXX-8921'
      },
      {
        id: 'WRK-003',
        workerId: 'WRK-003',
        name: 'Dineshbhai Mistry',
        mobile: '+91 98253 66543',
        address: 'Shree Ram Society, Narol, Ahmedabad',
        joiningDate: '2020-01-10',
        skill: 'Tool & Die Maker',
        department: 'Tool Room',
        salaryType: 'Monthly Fixed',
        salary: 35000,
        overtimeRate: 201.92,
        status: 'Active',
        shift: 'Shift A (8:00 AM - 8:00 PM)',
        emergencyContact: '+91 98253 11223',
        aadharNumber: 'XXXX-XXXX-3344'
      },
      {
        id: 'WRK-004',
        workerId: 'WRK-004',
        name: 'Mukeshbhai Suthar',
        mobile: '+91 98254 77654',
        address: '15, Kailash Nagar, Isanpur, Ahmedabad',
        joiningDate: '2023-08-15',
        skill: 'Lathe Master',
        department: 'Machining',
        salaryType: 'Daily Wage',
        salary: 950,
        overtimeRate: 118.75,
        status: 'Active',
        shift: 'Shift A (8:00 AM - 8:00 PM)',
        emergencyContact: '+91 98254 99001',
        aadharNumber: 'XXXX-XXXX-6712'
      }
    ]
  });

  // 5. Materials
  await prisma.material.createMany({
    data: [
      {
        id: 'MAT-001',
        materialCode: 'MAT-BRS-ROD-25',
        materialName: 'Brass Round Rod CW614N (IS 319 Gr 1 Free Cutting)',
        type: 'Brass Bar / Rod',
        grade: 'CW614N / IS 319 Gr I',
        size: 'Dia 25mm x 3000mm length',
        unit: 'kg',
        openingStock: 1250,
        currentStock: 480,
        minimumStock: 600,
        reorderQuantity: 1000,
        unitPrice: 565,
        supplier: 'Jamnagar Brass Syndicate Ltd.',
        locationRack: 'Bay 1 - Rack B-04',
        status: 'Low Stock',
        lastRestockedDate: '2026-08-20'
      },
      {
        id: 'MAT-002',
        materialCode: 'MAT-SS-HEX-19',
        materialName: 'Stainless Steel Hex Bar AISI 304',
        type: 'Stainless Steel',
        grade: 'AISI 304 / SS 304',
        size: 'Across Flats 19mm x 3000mm',
        unit: 'kg',
        openingStock: 800,
        currentStock: 920,
        minimumStock: 400,
        reorderQuantity: 600,
        unitPrice: 380,
        supplier: 'Shah Stainless & Alloys, Ahmedabad',
        locationRack: 'Bay 2 - Rack S-12',
        status: 'In Stock',
        lastRestockedDate: '2026-09-02'
      },
      {
        id: 'MAT-003',
        materialCode: 'MAT-MS-ROD-32',
        materialName: 'Mild Steel Bright Bar EN8 / Grade 080M40',
        type: 'Mild Steel',
        grade: 'EN8 Bright',
        size: 'Dia 32mm x 3000mm',
        unit: 'kg',
        openingStock: 1500,
        currentStock: 1420,
        minimumStock: 500,
        reorderQuantity: 1000,
        unitPrice: 88,
        supplier: 'Gujarat Steels Trading Corp.',
        locationRack: 'Bay 3 - Rack M-01',
        status: 'In Stock',
        lastRestockedDate: '2026-08-28'
      }
    ]
  });

  // 6. Products
  await prisma.product.createMany({
    data: [
      {
        id: 'PRD-001',
        productCode: 'PRD-BRS-FIT-01',
        productName: '1/2" Male Hex Brass Flare Tube Fitting (BSPT)',
        drawing: 'DWG-2026-BF-01.pdf',
        drawingRevision: 'Rev 3.2',
        material: 'Brass Round Rod CW614N',
        materialCode: 'MAT-BRS-ROD-25',
        weight: 125,
        weightUnit: 'g',
        unit: 'pieces',
        targetCycleTimeSec: 42,
        unitPrice: 85,
        status: 'Active Production',
        category: 'Fittings'
      },
      {
        id: 'PRD-002',
        productCode: 'PRD-SS-VLV-04',
        productName: '3/4" SS 304 High-Pressure Ball Valve Stem',
        drawing: 'DWG-2026-SS-04.pdf',
        drawingRevision: 'Rev 1.4',
        material: 'Stainless Steel Hex Bar AISI 304',
        materialCode: 'MAT-SS-HEX-19',
        weight: 210,
        weightUnit: 'g',
        unit: 'pieces',
        targetCycleTimeSec: 68,
        unitPrice: 195,
        status: 'Active Production',
        category: 'Valves'
      }
    ]
  });

  // 7. Production Jobs
  await prisma.productionJob.createMany({
    data: [
      {
        id: 'JOB-2026-001',
        jobNumber: 'JOB-2026-001',
        date: '2026-09-08',
        customer: 'Bharat Heavy Engineering & Automation Corp.',
        productCode: 'PRD-BRS-FIT-01',
        productName: '1/2" Male Hex Brass Flare Tube Fitting (BSPT)',
        requiredQuantity: 2500,
        producedQuantity: 1840,
        rejectedQuantity: 24,
        assignedWorker: 'Rajeshbhai Panchal',
        assignedWorkerId: 'WRK-001',
        machine: 'CNC Lathe 01 (Doosan Lynx 220)',
        dueDate: '2026-09-20',
        status: 'In Production',
        priority: 'High',
        notes: 'Tolerance ±0.02mm critical on BSPT thread taper.'
      },
      {
        id: 'JOB-2026-002',
        jobNumber: 'JOB-2026-002',
        date: '2026-09-10',
        customer: 'L&T Valves Division',
        productCode: 'PRD-SS-VLV-04',
        productName: '3/4" SS 304 High-Pressure Ball Valve Stem',
        requiredQuantity: 1000,
        producedQuantity: 350,
        rejectedQuantity: 6,
        assignedWorker: 'Hareshbhai Vaghela',
        assignedWorkerId: 'WRK-002',
        machine: 'VMC 02 (BFW Chakra)',
        dueDate: '2026-09-22',
        status: 'In Production',
        priority: 'Normal',
        notes: 'Mirror finish required on seal stem seat.'
      }
    ]
  });

  // 8. Quality Inspections
  await prisma.qualityInspection.createMany({
    data: [
      {
        id: 'QC-0001',
        jobId: 'JOB-2026-001',
        jobNumber: 'JOB-2026-001',
        productCode: 'PRD-BRS-FIT-01',
        productName: '1/2" Male Hex Brass Flare Tube Fitting (BSPT)',
        inspectionType: 'First-Piece',
        sampleSize: 5,
        inspectedQuantity: 5,
        passedQuantity: 5,
        rejectedQuantity: 0,
        defectTypes: JSON.stringify([]),
        dimensionalNotes: 'OD hex 22.00mm (pass), thread BSPT 1/2" pitch verified on gauge.',
        result: 'Pass',
        inspectedBy: 'Ramesh Patel (QC Master)',
        date: '2026-09-08',
        remarks: 'First-off clearance approved for mass production batch.'
      },
      {
        id: 'QC-0002',
        jobId: 'JOB-2026-001',
        jobNumber: 'JOB-2026-001',
        productCode: 'PRD-BRS-FIT-01',
        productName: '1/2" Male Hex Brass Flare Tube Fitting (BSPT)',
        inspectionType: 'In-Process Sample',
        sampleSize: 50,
        inspectedQuantity: 50,
        passedQuantity: 47,
        rejectedQuantity: 3,
        defectTypes: JSON.stringify(['Burr', 'Thread Damage']),
        dimensionalNotes: 'Minor burr on internal chamfer; 1 pc thread crest chipped.',
        result: 'Fail',
        inspectedBy: 'Mukeshbhai Suthar',
        date: '2026-09-10',
        remarks: 'Operator notified to change insert on CNC station 01.'
      }
    ]
  });

  // 9. Factory Calendar (2026 Gujarat & National Holidays)
  await prisma.factoryCalendarEntry.createMany({
    data: [
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
    ]
  });

  // 10. Leaves & Attendance (September 2026 baseline)
  await prisma.leaveRecord.createMany({
    data: [
      {
        id: 'LV-0001',
        workerId: 'WRK-001',
        startDate: '2026-09-05',
        endDate: '2026-09-05',
        totalDays: 1,
        leaveType: 'Sick',
        reason: 'Approved Medical Leave',
        appliedDate: '2026-09-04',
        includeWeekends: false
      },
      {
        id: 'LV-0002',
        workerId: 'WRK-004',
        startDate: '2026-09-15',
        endDate: '2026-09-18',
        totalDays: 4,
        leaveType: 'Casual',
        reason: 'Family wedding out of town',
        appliedDate: '2026-09-10',
        includeWeekends: false
      }
    ]
  });

  // Attendance for workers 1..15 of September 2026
  const attendanceRecords = [];
  const workerIds = ['WRK-001', 'WRK-002', 'WRK-003', 'WRK-004'];
  for (let day = 1; day <= 15; day++) {
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `2026-09-${dayStr}`;
    const d = new Date(2026, 8, day);
    const dayOfWeek = d.getDay();

    if (dayOfWeek === 5) {
      // Friday - Factory weekly off
      for (const wId of workerIds) {
        attendanceRecords.push({
          workerId: wId,
          date: dateStr,
          status: 'Holiday',
          notes: 'Friday Factory Weekly Off'
        });
      }
      continue;
    }

    if (dateStr === '2026-09-04') {
      // Janmashtami Holiday
      for (const wId of workerIds) {
        attendanceRecords.push({
          workerId: wId,
          date: dateStr,
          status: 'Holiday',
          notes: 'Janmashtami (Lord Krishna Birth)'
        });
      }
      continue;
    }

    for (let i = 0; i < workerIds.length; i++) {
      const wId = workerIds[i];
      if (wId === 'WRK-001' && day === 5) {
        attendanceRecords.push({
          workerId: wId,
          date: dateStr,
          status: 'On Leave',
          notes: 'Sick Leave: Approved Medical Leave',
          leaveRecordId: 'LV-0001'
        });
      } else if (wId === 'WRK-004' && day === 15) {
        attendanceRecords.push({
          workerId: wId,
          date: dateStr,
          status: 'On Leave',
          notes: 'Casual Leave: Family wedding out of town',
          leaveRecordId: 'LV-0002'
        });
      } else if (i === 0 && day === 3) {
        attendanceRecords.push({
          workerId: wId,
          date: dateStr,
          status: 'Half Day',
          checkInTime: '08:15',
          checkOutTime: '13:30',
          notes: 'First half floor shift'
        });
      } else {
        attendanceRecords.push({
          workerId: wId,
          date: dateStr,
          status: 'Present',
          checkInTime: `08:${String(10 + ((i * 7 + day) % 35)).padStart(2, '0')}`,
          checkOutTime: '20:30',
          notes: undefined
        });
      }
    }
  }

  await prisma.attendanceRecord.createMany({
    data: attendanceRecords
  });

  // 11. Salary Adjustments
  await prisma.salaryAdjustment.createMany({
    data: [
      {
        id: 'ADJ-101',
        workerId: 'WRK-001',
        date: '2026-09-04',
        type: 'Uppad',
        amount: 1500,
        reason: 'Mid-month grocery advance'
      },
      {
        id: 'ADJ-102',
        workerId: 'WRK-002',
        date: '2026-09-06',
        type: 'Jama',
        amount: 800,
        reason: 'Urgent weekend tool die maintenance bonus'
      },
      {
        id: 'ADJ-103',
        workerId: 'WRK-003',
        date: '2026-09-08',
        type: 'Uppad',
        amount: 2000,
        reason: 'Medical emergency advance'
      },
      {
        id: 'ADJ-104',
        workerId: 'WRK-004',
        date: '2026-09-10',
        type: 'Jama',
        amount: 500,
        reason: 'Zero defect brass turning batch reward'
      }
    ]
  });

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
