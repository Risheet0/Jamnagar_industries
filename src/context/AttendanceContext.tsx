import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AttendanceRecord, AttendanceStatus, Worker, LeaveRecord, LeaveType } from '../types';
import { apiUrl } from '../utils/api';

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
  refreshAttendance?: () => Promise<void>;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

const ATTENDANCE_STORAGE_KEY = 'jamnagar_erp_attendance_v2';
const LEAVES_STORAGE_KEY = 'jamnagar_erp_leaves_v1';

export function getTodayDateString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function enumerateDatesInRange(startDate: string, endDate: string, includeWeekends: boolean = false): string[] {
  const dates: string[] = [];
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
    return dates;
  }

  const curr = new Date(start);
  while (curr <= end) {
    const dayOfWeek = curr.getDay();
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

const initialMockLeaves: LeaveRecord[] = [
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
];

export const AttendanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [records, setRecords] = useState<AttendanceRecord[]>(() => {
    try {
      const saved = localStorage.getItem(ATTENDANCE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return [];
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

  const fetchAttendanceAndLeaves = useCallback(async () => {
    try {
      const [attRes, leavesRes] = await Promise.all([
        fetch(apiUrl('/api/attendance/all'), { credentials: 'include' }),
        fetch(apiUrl('/api/leaves'), { credentials: 'include' })
      ]);

      if (attRes.ok) {
        const attData = await attRes.json();
        if (Array.isArray(attData)) {
          setRecords(attData);
          try {
            localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(attData));
          } catch {}
        }
      }

      if (leavesRes.ok) {
        const leavesData = await leavesRes.json();
        if (Array.isArray(leavesData)) {
          setLeaveRecords(leavesData);
          try {
            localStorage.setItem(LEAVES_STORAGE_KEY, JSON.stringify(leavesData));
          } catch {}
        }
      }
    } catch {
      // fallback
    }
  }, []);

  useEffect(() => {
    fetchAttendanceAndLeaves();
  }, [fetchAttendanceAndLeaves]);

  const markAttendance = useCallback(
    (
      workerId: string,
      date: string,
      status: AttendanceStatus,
      meta?: { checkInTime?: string; checkOutTime?: string; notes?: string; leaveRecordId?: string }
    ) => {
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

      setRecords(prev => {
        const index = prev.findIndex(r => r.workerId === workerId && r.date === date);
        let updated: AttendanceRecord[];
        if (index >= 0) {
          updated = [...prev];
          updated[index] = {
            ...updated[index],
            ...newRecord,
            notes: meta?.notes !== undefined ? meta.notes : updated[index].notes,
            leaveRecordId: meta?.leaveRecordId !== undefined ? meta.leaveRecordId : updated[index].leaveRecordId
          };
        } else {
          updated = [...prev, newRecord];
        }
        try {
          localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(updated));
        } catch {}
        return updated;
      });

      // Sync to backend
      fetch(apiUrl('/api/attendance/mark'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          workerId,
          date,
          status,
          checkInTime: defaultCheckIn,
          checkOutTime: defaultCheckOut,
          notes: meta?.notes,
          leaveRecordId: meta?.leaveRecordId
        })
      }).catch(err => console.error('Failed to sync attendance mark to backend:', err));
    },
    []
  );

  const bulkMarkAttendance = useCallback(
    (workerIds: string[], date: string, status: AttendanceStatus) => {
      const defaultCheckIn = status === 'Present' || status === 'Half Day' ? '08:15' : undefined;
      const defaultCheckOut = status === 'Present' ? '20:00' : status === 'Half Day' ? '14:00' : undefined;

      setRecords(prev => {
        const updated = [...prev];
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
        try {
          localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(updated));
        } catch {}
        return updated;
      });

      // Sync to backend
      fetch(apiUrl('/api/attendance/bulk-mark'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          workerIds,
          date,
          status
        })
      }).catch(err => console.error('Failed to sync bulk attendance to backend:', err));
    },
    []
  );

  const deleteAttendanceRecord = useCallback((workerId: string, date: string) => {
    setRecords(prev => {
      const next = prev.filter(r => !(r.workerId === workerId && r.date === date));
      try {
        localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

    fetch(apiUrl(`/api/attendance/${workerId}/${date}`), {
      method: 'DELETE',
      credentials: 'include'
    }).catch(err => console.error('Failed to sync attendance deletion to backend:', err));
  }, []);

  const getAttendanceForDate = useCallback(
    (workerId: string, date: string): AttendanceRecord | undefined => {
      return records.find(
        r => (r.workerId === workerId || r.workerId === workerId.replace(/^WRK-/, '')) && r.date === date
      );
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
        r =>
          (r.workerId === workerId || r.workerId === workerId.replace(/^WRK-/, '')) &&
          r.date.startsWith(monthPrefix)
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

      const conflicts: AttendanceRecord[] = [];
      targetDates.forEach(d => {
        const existing = getAttendanceForDate(workerId, d);
        if (existing && existing.status !== 'On Leave') {
          conflicts.push(existing);
        }
      });

      if (conflicts.length > 0 && !force) {
        return {
          success: false,
          conflicts,
          error: `${conflicts.length} day(s) already have marked attendance in this range.`
        };
      }

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
        try {
          localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(updated));
        } catch {}
        return updated;
      });

      setLeaveRecords(prev => {
        const next = [newLeave, ...prev];
        try {
          localStorage.setItem(LEAVES_STORAGE_KEY, JSON.stringify(next));
        } catch {}
        return next;
      });

      // Sync to backend
      fetch(apiUrl('/api/leaves/apply'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          workerId,
          startDate,
          endDate,
          leaveType: meta.leaveType,
          reason: meta.reason,
          includeWeekends: meta.includeWeekends,
          force
        })
      }).catch(err => console.error('Failed to sync leave to backend:', err));

      return {
        success: true,
        leave: newLeave,
        conflicts: []
      };
    },
    [getAttendanceForDate, leaveRecords.length]
  );

  const cancelLeave = useCallback((leaveId: string) => {
    setRecords(prev => {
      const next = prev.filter(r => r.leaveRecordId !== leaveId);
      try {
        localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

    setLeaveRecords(prev => {
      const next = prev.filter(l => l.id !== leaveId);
      try {
        localStorage.setItem(LEAVES_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

    fetch(apiUrl(`/api/leaves/${leaveId}`), {
      method: 'DELETE',
      credentials: 'include'
    }).catch(err => console.error('Failed to sync leave cancellation to backend:', err));
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

      setRecords(prev => {
        const filtered = prev.filter(r => r.leaveRecordId !== leaveId);
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
        try {
          localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(filtered));
        } catch {}
        return filtered;
      });

      const updatedLeave: LeaveRecord = {
        ...existingLeave,
        startDate: newStartDate,
        endDate: newEndDate,
        totalDays: newTargetDates.length,
        leaveType: meta.leaveType,
        reason: meta.reason,
        includeWeekends: meta.includeWeekends
      };

      setLeaveRecords(prev => {
        const next = prev.map(l => (l.id === leaveId ? updatedLeave : l));
        try {
          localStorage.setItem(LEAVES_STORAGE_KEY, JSON.stringify(next));
        } catch {}
        return next;
      });

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
        editLeave,
        refreshAttendance: fetchAttendanceAndLeaves
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
