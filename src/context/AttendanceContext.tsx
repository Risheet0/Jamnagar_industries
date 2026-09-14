import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AttendanceRecord, AttendanceStatus, Worker } from '../types';
import { mockWorkers } from '../mock/workersData';

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
  markAttendance: (
    workerId: string,
    date: string,
    status: AttendanceStatus,
    meta?: { checkInTime?: string; checkOutTime?: string; notes?: string }
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
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

const ATTENDANCE_STORAGE_KEY = 'jamnagar_erp_attendance_v1';

export const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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
      let checkInTime: string | undefined = `08:${String(10 + ((idx * 7 + day) % 35)).padStart(2, '0')} AM`;
      let checkOutTime: string | undefined = '05:30 PM';
      let notes: string | undefined = undefined;

      if (idx === 0 && day === 3) {
        status = 'Half Day';
        checkOutTime = '01:30 PM';
        notes = 'First half floor shift';
      } else if (idx === 1 && day === 5) {
        status = 'On Leave';
        checkInTime = undefined;
        checkOutTime = undefined;
        notes = 'Approved Medical Leave';
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
        checkOutTime = '01:00 PM';
        notes = 'Tool maintenance half day';
      }

      records.push({
        workerId: wId,
        date: dateStr,
        status,
        checkInTime: status === 'Present' || status === 'Half Day' ? checkInTime : undefined,
        checkOutTime: status === 'Present' || status === 'Half Day' ? checkOutTime : undefined,
        notes
      });
    });
  }

  return records;
};

export const AttendanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [records, setRecords] = useState<AttendanceRecord[]>(() => {
    try {
      const saved = localStorage.getItem(ATTENDANCE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Check if parsed items match new AttendanceStatus schema
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

  useEffect(() => {
    try {
      localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(records));
    } catch {
      // ignore
    }
  }, [records]);

  const markAttendance = useCallback(
    (
      workerId: string,
      date: string,
      status: AttendanceStatus,
      meta?: { checkInTime?: string; checkOutTime?: string; notes?: string }
    ) => {
      setRecords(prev => {
        const index = prev.findIndex(r => r.workerId === workerId && r.date === date);
        const defaultCheckIn =
          status === 'Present' || status === 'Half Day'
            ? meta?.checkInTime || '08:15 AM'
            : undefined;
        const defaultCheckOut =
          status === 'Present'
            ? meta?.checkOutTime || '05:30 PM'
            : status === 'Half Day'
            ? meta?.checkOutTime || '01:30 PM'
            : undefined;

        const newRecord: AttendanceRecord = {
          workerId,
          date,
          status,
          checkInTime: defaultCheckIn,
          checkOutTime: defaultCheckOut,
          notes: meta?.notes
        };

        if (index >= 0) {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            ...newRecord,
            notes: meta?.notes !== undefined ? meta.notes : updated[index].notes
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
        const defaultCheckIn = status === 'Present' || status === 'Half Day' ? '08:15 AM' : undefined;
        const defaultCheckOut = status === 'Present' ? '05:30 PM' : status === 'Half Day' ? '01:30 PM' : undefined;

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

  return (
    <AttendanceContext.Provider
      value={{
        records,
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
        getStatusBreakdownForDate
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
