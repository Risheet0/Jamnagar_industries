import { Prisma, PrismaClient } from '@prisma/client';

export function enumerateDatesInRange(
  startDate: string,
  endDate: string,
  includeWeekends: boolean = false
): string[] {
  const dates: string[] = [];
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
    return dates;
  }

  const curr = new Date(start);
  while (curr <= end) {
    const dayOfWeek = curr.getDay(); // 0 is Sunday, 6 is Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    if (includeWeekends || !isWeekend) {
      const y = curr.getFullYear();
      const m = String(curr.getMonth() + 1).padStart(2, '0');
      const d = String(curr.getDate()).padStart(2, '0');
      dates.push(`${y}-${m}-${d}`);
    }
    curr.setDate(curr.getDate() + 1);
  }
  return dates;
}

export async function processLeaveApplication(
  prisma: PrismaClient,
  params: {
    workerId: string;
    startDate: string;
    endDate: string;
    leaveType: string;
    reason?: string;
    includeWeekends: boolean;
    force?: boolean;
  }
) {
  const { workerId, startDate, endDate, leaveType, reason, includeWeekends, force } = params;

  if (!startDate || !endDate) {
    throw new Error('Start date and end date are required.');
  }
  if (endDate < startDate) {
    throw new Error('End date cannot be earlier than start date.');
  }

  const targetDates = enumerateDatesInRange(startDate, endDate, includeWeekends);
  if (targetDates.length === 0) {
    throw new Error('No valid working days found in the selected range.');
  }

  // Find conflicts: any existing record for this worker on target dates that is not 'On Leave'
  const existingRecords = await prisma.attendanceRecord.findMany({
    where: {
      workerId,
      date: { in: targetDates }
    }
  });

  const conflicts = existingRecords.filter(r => r.status !== 'On Leave');

  if (conflicts.length > 0 && !force) {
    return {
      success: false,
      conflicts,
      error: `${conflicts.length} day(s) already have marked attendance in this range.`
    };
  }

  // Count existing leaves to generate sequential ID
  const leaveCount = await prisma.leaveRecord.count();
  const leaveId = `LV-${String(leaveCount + 1).padStart(4, '0')}`;

  const todayStr = new Date().toISOString().split('T')[0];

  // Execute in transaction
  const result = await prisma.$transaction(async (tx) => {
    const leave = await tx.leaveRecord.create({
      data: {
        id: leaveId,
        workerId,
        startDate,
        endDate,
        totalDays: targetDates.length,
        leaveType,
        reason,
        appliedDate: todayStr,
        includeWeekends
      }
    });

    for (const dateStr of targetDates) {
      await tx.attendanceRecord.upsert({
        where: {
          workerId_date: {
            workerId,
            date: dateStr
          }
        },
        create: {
          workerId,
          date: dateStr,
          status: 'On Leave',
          notes: reason ? `${leaveType} Leave: ${reason}` : `${leaveType} Leave`,
          leaveRecordId: leaveId
        },
        update: {
          status: 'On Leave',
          checkInTime: null,
          checkOutTime: null,
          notes: reason ? `${leaveType} Leave: ${reason}` : `${leaveType} Leave`,
          leaveRecordId: leaveId
        }
      });
    }

    return leave;
  });

  return {
    success: true,
    leave: result,
    conflicts: []
  };
}
