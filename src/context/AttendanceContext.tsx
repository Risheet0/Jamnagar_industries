import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AttendanceRecord, AttendanceStatus, Worker, LeaveRecord, LeaveType } from '../types';
import { mockWorkers } from '../mock/workersData';

export interface ApplyLeaveResult {
  success: boolean;
  leave?: LeaveRecord;
  conflicts: AttendanceRecord[];
  error?: string;
}

interface AttendanceSummary {
  present: number;
  absent: number;
  halfDay: number;
  onLeave: number;
  holiday: number;
  totalMarked: number;
  attendancePercent: number;
}

export interface DaySummary {
  present: number;
  absent: number;
  halfDay: number;
  onLeave: number;
  holiday: number;
  notMarked: number;
  totalWorkers: number;
}

interface AttendanceContextType {
  records: AttendanceRecord[];
  leaveRecords: LeaveRecord[];
  markAttendance: (
    workerId: string,
    date: string,
    status: AttendanceStatus,
    meta?: { checkInTime?: string; checkOutTime?: string; notes?: string; leaveRecordId?: string }
  ) => void;
  bulkMarkAttendance: (workerIds: string[], date: string, status: AttendanceStatus) => void;
  deleteAttendanceRecord: (workerId: string, date: string) => void;
  getAttendanceForDate: (workerId: string, date: string) => AttendanceRecord | undefined;
  getAllForDate: (date: string) => AttendanceRecord[];
  getAttendanceForMonth: (workerId: string, year: number, month: number) => AttendanceRecord[];
  getMonthSummary: (workerId: string, year: number, month: number) => AttendanceSummary;
  getDaySummary: (date: string, activeWorkers?: Worker[]) => DaySummary;
  getPresentCountForDate: (date?: string) => number;
  getAbsentCountForDate: (date?: string, activeWorkers?: Worker[]) => number;
  getStatusBreakdownForDate: (date: string, activeWorkers: Worker[]) => {
    present: number;
    absent: number;
    halfDay: number;
    onLeave: number;
    holiday: number;
    unmarked: number;
  };
  // Multi-day Leave System
  applyLeave: (
    workerId: string,
    startDate: string,
    endDate: string,
    meta: { leaveType: LeaveType; reason?: string; includeWeekends: boolean },
    force?: boolean
  ) => ApplyLeaveResult;
  getLeaveRecords: (workerId?: string) => LeaveRecord[];
  getLeaveById: (leaveId: string) => LeaveRecord | undefined;
  cancelLeave: (leaveId: string) => void;
  editLeave: (
    leaveId: string,
    newStartDate: string,
    newEndDate: string,
    meta: { leaveType: LeaveType; reason?: string; includeWeekends: boolean },
    force?: boolean
  ) => ApplyLeaveResult;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

const ATTENDANCE_STORAGE_KEY = 'jamnagar_erp_attendance_v1';
const LEAVES_STORAGE_KEY = 'jamnagar_erp_leaves_v1';

export const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function enumerateDatesInRange(startDate: string, endDate: string, includeWeekends: boolean = false): string[] {
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

// Realistic mock seed generator for initial attendance
const generateInitialAttendanceData = (): AttendanceRecord[] => {
  const records: AttendanceRecord[] = [];
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed
  const todayDate = now.getDate();

  const workerIds = mockWorkers
    .filter(w => w.status === 'Active')
    .map(w => w.workerId || w.id);

  // Generate for days 1 to today in current month
  for (let day = 1; day <= todayDate; day++) {
    const d = new Date(currentYear, currentMonth, day);
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayOfWeek = d.getDay(); // 0 is Sunday

    if (dayOfWeek === 0) {
      // Sunday - Plant Off / Holiday
      workerIds.forEach(wId => {
        records.push({
          workerId: wId,
          date: dateStr,
          status: 'Holiday',
          notes: 'Weekly Factory Off (Sunday)'
        });
      });
      continue;
    }

    workerIds.forEach((wId, idx) => {
      // Create realistic diverse attendance patterns
      let status: AttendanceStatus = 'Present';
      let checkInTime: string | undefined = `08:${String(10 + ((idx * 7 + day) % 35)).padStart(2, '0')}`;
      let checkOutTime: string | undefined = '20:30';
      let notes: string | undefined = undefined;
      let leaveRecordId: string | undefined = undefined;

      if (idx === 0 && day === 3) {
        status = 'Half Day';
        checkOutTime = '13:30';
        notes = 'First half floor shift';
      } else if (idx === 1 && day === 5) {
        status = 'On Leave';
        checkInTime = undefined;
        checkOutTime = undefined;
        notes = 'Approved Medical Leave';
        leaveRecordId = 'LV-0001';
      } else if (idx === 2 && day === 8) {
        status = 'Absent';
        checkInTime = undefined;
        checkOutTime = undefined;
        notes = 'Unplanned absence';
      } else if (idx === 3 && day === todayDate) {
        status = 'Absent'; // Keep one absent today for demo visibility
        checkInTime = undefined;
        checkOutTime = undefined;
        notes = 'Not reported';
      } else if (idx === 4 && day === 4) {
        status = 'Half Day';
        checkOutTime = '13:00';
        notes = 'Tool maintenance half day';
      }

      records.push({
        workerId: wId,
        date: dateStr,
        status,
        checkInTime: status === 'Present' || status === 'Half Day' ? checkInTime : undefined,
        checkOutTime: status === 'Present' || status === 'Half Day' ? checkOutTime : undefined,
        notes,
        leaveRecordId
      });
    });
  }

  return records;
};

const initialMockLeaves: LeaveRecord[] = [
  {
    id: 'LV-0001',
    workerId: 'WRK-002',
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
];

export const AttendanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [records, setRecords] = useState<AttendanceRecord[]>(() => {
    try {
      const saved = localStorage.getItem(ATTENDANCE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (parsed[0].status) {
            return parsed;
          }
        }
      }
    } catch {
      // ignore
    }
    return generateInitialAttendanceData();
  });

  const [leaveRecords, setLeaveRecords] = useState<LeaveRecord[]>(() => {
    try {
      const saved = localStorage.getItem(LEAVES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return initialMockLeaves;
  });

  useEffect(() => {
    try {
      localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(records));
    } catch {
      // ignore
    }
  }, [records]);

  useEffect(() => {
    try {
      localStorage.setItem(LEAVES_STORAGE_KEY, JSON.stringify(leaveRecords));
    } catch {
      // ignore
    }
  }, [leaveRecords]);

  const markAttendance = useCallback(
    (
      workerId: string,
      date: string,
      status: AttendanceStatus,
      meta?: { checkInTime?: string; checkOutTime?: string; notes?: string; leaveRecordId?: string }
    ) => {
      setRecords(prev => {
        const index = prev.findIndex(r => r.workerId === workerId && r.date === date);
        const defaultCheckIn =
          status === 'Present' || status === 'Half Day'
            ? meta?.checkInTime || '08:15'
            : undefined;
        const defaultCheckOut =
          status === 'Present'
            ? meta?.checkOutTime || '20:00'
            : status === 'Half Day'
            ? meta?.checkOutTime || '14:00'
            : undefined;

        const newRecord: AttendanceRecord = {
          workerId,
          date,
          status,
          checkInTime: defaultCheckIn,
          checkOutTime: defaultCheckOut,
          notes: meta?.notes,
          leaveRecordId: meta?.leaveRecordId
        };

        if (index >= 0) {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            ...newRecord,
            notes: meta?.notes !== undefined ? meta.notes : updated[index].notes,
            leaveRecordId: meta?.leaveRecordId !== undefined ? meta.leaveRecordId : updated[index].leaveRecordId
          };
          return updated;
        }

        return [...prev, newRecord];
      });
    },
    []
  );

  const bulkMarkAttendance = useCallback(
    (workerIds: string[], date: string, status: AttendanceStatus) => {
      setRecords(prev => {
        const updated = [...prev];
        const defaultCheckIn = status === 'Present' || status === 'Half Day' ? '08:15' : undefined;
        const defaultCheckOut = status === 'Present' ? '20:00' : status === 'Half Day' ? '14:00' : undefined;

        workerIds.forEach(wId => {
          const idx = updated.findIndex(r => r.workerId === wId && r.date === date);
          const rec: AttendanceRecord = {
            workerId: wId,
            date,
            status,
            checkInTime: defaultCheckIn,
            checkOutTime: defaultCheckOut
          };
          if (idx >= 0) {
            updated[idx] = { ...updated[idx], ...rec };
          } else {
            updated.push(rec);
          }
        });

        return updated;
      });
    },
    []
  );

  const deleteAttendanceRecord = useCallback((workerId: string, date: string) => {
    setRecords(prev => prev.filter(r => !(r.workerId === workerId && r.date === date)));
  }, []);

  const getAttendanceForDate = useCallback(
    (workerId: string, date: string): AttendanceRecord | undefined => {
      return records.find(r => (r.workerId === workerId || r.workerId === workerId.replace(/^WRK-/, '')) && r.date === date);
    },
    [records]
  );

  const getAllForDate = useCallback(
    (date: string): AttendanceRecord[] => {
      return records.filter(r => r.date === date);
    },
    [records]
  );

  const getAttendanceForMonth = useCallback(
    (workerId: string, year: number, month: number): AttendanceRecord[] => {
      const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
      return records.filter(
        r => (r.workerId === workerId || r.workerId === workerId.replace(/^WRK-/, '')) && r.date.startsWith(monthPrefix)
      );
    },
    [records]
  );

  const getMonthSummary = useCallback(
    (workerId: string, year: number, month: number): AttendanceSummary => {
      const monthRecords = getAttendanceForMonth(workerId, year, month);
      let present = 0;
      let absent = 0;
      let halfDay = 0;
      let onLeave = 0;
      let holiday = 0;

      monthRecords.forEach(r => {
        if (r.status === 'Present') present++;
        else if (r.status === 'Absent') absent++;
        else if (r.status === 'Half Day') halfDay++;
        else if (r.status === 'On Leave') onLeave++;
        else if (r.status === 'Holiday') holiday++;
      });

      const totalMarked = monthRecords.length;
      const workingDaysMarked = present + absent + halfDay + onLeave;
      const attendancePercent =
        workingDaysMarked > 0
          ? Math.round(((present + halfDay * 0.5) / workingDaysMarked) * 100)
          : totalMarked > 0
          ? 100
          : 0;

      return {
        present,
        absent,
        halfDay,
        onLeave,
        holiday,
        totalMarked,
        attendancePercent
      };
    },
    [getAttendanceForMonth]
  );

  const getDaySummary = useCallback(
    (date: string, activeWorkers: Worker[] = []): DaySummary => {
      const activeIds = activeWorkers.map(w => w.workerId || w.id);
      const dateRecords = records.filter(
        r => r.date === date && (activeIds.length === 0 || activeIds.includes(r.workerId))
      );

      let present = 0;
      let absent = 0;
      let halfDay = 0;
      let onLeave = 0;
      let holiday = 0;

      dateRecords.forEach(r => {
        if (r.status === 'Present') present++;
        else if (r.status === 'Absent') absent++;
        else if (r.status === 'Half Day') halfDay++;
        else if (r.status === 'On Leave') onLeave++;
        else if (r.status === 'Holiday') holiday++;
      });

      const totalWorkers = activeWorkers.length > 0 ? activeWorkers.length : dateRecords.length;
      const notMarked = Math.max(0, totalWorkers - dateRecords.length);

      return {
        present,
        absent,
        halfDay,
        onLeave,
        holiday,
        notMarked,
        totalWorkers
      };
    },
    [records]
  );

  const getPresentCountForDate = useCallback(
    (date?: string): number => {
      const targetDate = date || getTodayDateString();
      return records.filter(
        r => r.date === targetDate && (r.status === 'Present' || r.status === 'Half Day')
      ).length;
    },
    [records]
  );

  const getAbsentCountForDate = useCallback(
    (date?: string, activeWorkers: Worker[] = []): number => {
      const targetDate = date || getTodayDateString();
      const absentMarked = records.filter(r => r.date === targetDate && r.status === 'Absent').length;
      if (activeWorkers.length === 0) return absentMarked;

      const activeIds = activeWorkers.filter(w => w.status === 'Active').map(w => w.workerId || w.id);
      const markedActive = records.filter(r => r.date === targetDate && activeIds.includes(r.workerId));
      const unmarkedCount = Math.max(0, activeIds.length - markedActive.length);
      return absentMarked + unmarkedCount;
    },
    [records]
  );

  const getStatusBreakdownForDate = useCallback(
    (date: string, activeWorkers: Worker[]) => {
      const activeIds = activeWorkers.map(w => w.workerId || w.id);
      const dateRecords = records.filter(r => r.date === date && activeIds.includes(r.workerId));

      let present = 0;
      let absent = 0;
      let halfDay = 0;
      let onLeave = 0;
      let holiday = 0;

      dateRecords.forEach(r => {
        if (r.status === 'Present') present++;
        else if (r.status === 'Absent') absent++;
        else if (r.status === 'Half Day') halfDay++;
        else if (r.status === 'On Leave') onLeave++;
        else if (r.status === 'Holiday') holiday++;
      });

      const unmarked = Math.max(0, activeIds.length - dateRecords.length);

      return {
        present,
        absent,
        halfDay,
        onLeave,
        holiday,
        unmarked
      };
    },
    [records]
  );

  // ==========================================
  // MULTI-DAY LEAVE ENGINE
  // ==========================================

  const getLeaveRecords = useCallback(
    (workerId?: string): LeaveRecord[] => {
      if (!workerId) {
        return [...leaveRecords].sort((a, b) => b.startDate.localeCompare(a.startDate));
      }
      return leaveRecords
        .filter(l => l.workerId === workerId || l.workerId === workerId.replace(/^WRK-/, ''))
        .sort((a, b) => b.startDate.localeCompare(a.startDate));
    },
    [leaveRecords]
  );

  const getLeaveById = useCallback(
    (leaveId: string): LeaveRecord | undefined => {
      return leaveRecords.find(l => l.id === leaveId);
    },
    [leaveRecords]
  );

  const applyLeave = useCallback(
    (
      workerId: string,
      startDate: string,
      endDate: string,
      meta: { leaveType: LeaveType; reason?: string; includeWeekends: boolean },
      force: boolean = false
    ): ApplyLeaveResult => {
      if (!startDate || !endDate) {
        return { success: false, conflicts: [], error: 'Start date and end date are required.' };
      }
      if (endDate < startDate) {
        return { success: false, conflicts: [], error: 'End date cannot be earlier than start date.' };
      }

      const targetDates = enumerateDatesInRange(startDate, endDate, meta.includeWeekends);
      if (targetDates.length === 0) {
        return {
          success: false,
          conflicts: [],
          error: 'No valid working days found in the selected range (e.g. range contains only weekends).'
        };
      }

      // Check conflicts: any existing record for this worker on target dates that is NOT already "On Leave"
      const conflicts: AttendanceRecord[] = [];
      targetDates.forEach(d => {
        const existing = getAttendanceForDate(workerId, d);
        if (existing && existing.status !== 'On Leave') {
          conflicts.push(existing);
        }
      });

      // If conflicts exist and force is false, stop and return conflicts for confirmation
      if (conflicts.length > 0 && !force) {
        return {
          success: false,
          conflicts,
          error: `${conflicts.length} day(s) already have marked attendance in this range.`
        };
      }

      // Generate unique leave ID: LV-XXXX
      const nextNum = leaveRecords.length + 1;
      const leaveId = `LV-${String(nextNum).padStart(4, '0')}`;

      const newLeave: LeaveRecord = {
        id: leaveId,
        workerId,
        startDate,
        endDate,
        totalDays: targetDates.length,
        leaveType: meta.leaveType,
        reason: meta.reason,
        appliedDate: getTodayDateString(),
        includeWeekends: meta.includeWeekends
      };

      // 1. Create/overwrite AttendanceRecords with status 'On Leave' and leaveRecordId
      setRecords(prev => {
        const updated = [...prev];
        targetDates.forEach(dateStr => {
          const idx = updated.findIndex(r => r.workerId === workerId && r.date === dateStr);
          const leaveAttRecord: AttendanceRecord = {
            workerId,
            date: dateStr,
            status: 'On Leave',
            checkInTime: undefined,
            checkOutTime: undefined,
            notes: meta.reason ? `${meta.leaveType} Leave: ${meta.reason}` : `${meta.leaveType} Leave`,
            leaveRecordId: leaveId
          };

          if (idx >= 0) {
            updated[idx] = leaveAttRecord;
          } else {
            updated.push(leaveAttRecord);
          }
        });
        return updated;
      });

      // 2. Add LeaveRecord
      setLeaveRecords(prev => [newLeave, ...prev]);

      return {
        success: true,
        leave: newLeave,
        conflicts: []
      };
    },
    [getAttendanceForDate, leaveRecords.length]
  );

  const cancelLeave = useCallback((leaveId: string) => {
    // 1. Delete all AttendanceRecords associated with this leaveId
    setRecords(prev => prev.filter(r => r.leaveRecordId !== leaveId));

    // 2. Remove the LeaveRecord
    setLeaveRecords(prev => prev.filter(l => l.id !== leaveId));
  }, []);

  const editLeave = useCallback(
    (
      leaveId: string,
      newStartDate: string,
      newEndDate: string,
      meta: { leaveType: LeaveType; reason?: string; includeWeekends: boolean },
      force: boolean = false
    ): ApplyLeaveResult => {
      const existingLeave = leaveRecords.find(l => l.id === leaveId);
      if (!existingLeave) {
        return { success: false, conflicts: [], error: 'Leave record not found.' };
      }

      if (!newStartDate || !newEndDate) {
        return { success: false, conflicts: [], error: 'Start date and end date are required.' };
      }
      if (newEndDate < newStartDate) {
        return { success: false, conflicts: [], error: 'End date cannot be earlier than start date.' };
      }

      const newTargetDates = enumerateDatesInRange(newStartDate, newEndDate, meta.includeWeekends);
      if (newTargetDates.length === 0) {
        return {
          success: false,
          conflicts: [],
          error: 'No valid working days found in the selected range.'
        };
      }

      // Check conflicts: existing records that do NOT belong to this leaveId and are not 'On Leave'
      const conflicts: AttendanceRecord[] = [];
      newTargetDates.forEach(d => {
        const existing = getAttendanceForDate(existingLeave.workerId, d);
        if (existing && existing.leaveRecordId !== leaveId && existing.status !== 'On Leave') {
          conflicts.push(existing);
        }
      });

      if (conflicts.length > 0 && !force) {
        return {
          success: false,
          conflicts,
          error: `${conflicts.length} day(s) have conflicting attendance records.`
        };
      }

      // 1. Remove old attendance records belonging to this leaveId that are outside the new range
      setRecords(prev => {
        // First filter out old records of this leaveId
        const filtered = prev.filter(r => r.leaveRecordId !== leaveId);

        // Then insert new records for all newTargetDates
        newTargetDates.forEach(dateStr => {
          const idx = filtered.findIndex(r => r.workerId === existingLeave.workerId && r.date === dateStr);
          const leaveAttRecord: AttendanceRecord = {
            workerId: existingLeave.workerId,
            date: dateStr,
            status: 'On Leave',
            checkInTime: undefined,
            checkOutTime: undefined,
            notes: meta.reason ? `${meta.leaveType} Leave: ${meta.reason}` : `${meta.leaveType} Leave`,
            leaveRecordId: leaveId
          };

          if (idx >= 0) {
            filtered[idx] = leaveAttRecord;
          } else {
            filtered.push(leaveAttRecord);
          }
        });

        return filtered;
      });

      // 2. Update LeaveRecord
      const updatedLeave: LeaveRecord = {
        ...existingLeave,
        startDate: newStartDate,
        endDate: newEndDate,
        totalDays: newTargetDates.length,
        leaveType: meta.leaveType,
        reason: meta.reason,
        includeWeekends: meta.includeWeekends
      };

      setLeaveRecords(prev => prev.map(l => (l.id === leaveId ? updatedLeave : l)));

      return {
        success: true,
        leave: updatedLeave,
        conflicts: []
      };
    },
    [getAttendanceForDate, leaveRecords]
  );

  return (
    <AttendanceContext.Provider
      value={{
        records,
        leaveRecords,
        markAttendance,
        bulkMarkAttendance,
        deleteAttendanceRecord,
        getAttendanceForDate,
        getAllForDate,
        getAttendanceForMonth,
        getMonthSummary,
        getDaySummary,
        getPresentCountForDate,
        getAbsentCountForDate,
        getStatusBreakdownForDate,
        applyLeave,
        getLeaveRecords,
        getLeaveById,
        cancelLeave,
        editLeave
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
};

export const useAttendance = () => {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }
  return context;
};

