import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Worker, AttendanceRecord } from '../types';
import { mockWorkers as initialWorkers } from '../mock/workersData';

interface WorkerContextType {
  workers: Worker[];
  attendance: AttendanceRecord[];
  addWorker: (worker: Omit<Worker, 'id'>) => Worker;
  updateWorker: (id: string, updated: Partial<Worker>) => void;
  deleteWorker: (id: string) => void;
  getWorker: (id: string) => Worker | undefined;
  markPresent: (workerId: string, checkInTime?: string, notes?: string) => void;
  markAbsent: (workerId: string, notes?: string) => void;
  toggleAttendance: (workerId: string) => void;
  getTodayAttendance: (workerId: string) => AttendanceRecord | undefined;
  getPresentCount: (date?: string) => number;
  getAbsentCount: (date?: string) => number;
}

const WorkerContext = createContext<WorkerContextType | undefined>(undefined);

const WORKERS_STORAGE_KEY = 'jamnagar_erp_workers_v2';
const ATTENDANCE_STORAGE_KEY = 'jamnagar_erp_attendance_v1';

const getTodayDateString = () => new Date().toISOString().split('T')[0];

const generateInitialAttendance = (workerList: Worker[]): AttendanceRecord[] => {
  const today = getTodayDateString();
  return workerList.map((w, idx) => {
    const isPresent = w.status === 'Active' && idx !== 3; // make one active worker absent for realistic floor state
    return {
      workerId: w.workerId || w.id,
      date: today,
      present: isPresent,
      checkInTime: isPresent ? `08:${String(10 + (idx * 5) % 45).padStart(2, '0')} AM` : undefined,
      notes: !isPresent && w.status === 'On Leave' ? 'Approved Casual Leave' : undefined
    };
  });
};

export const WorkerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [workers, setWorkers] = useState<Worker[]>(() => {
    try {
      const saved = localStorage.getItem(WORKERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore JSON error
    }
    return initialWorkers;
  });

  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    try {
      const saved = localStorage.getItem(ATTENDANCE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore JSON error
    }
    return generateInitialAttendance(initialWorkers);
  });

  useEffect(() => {
    try {
      localStorage.setItem(WORKERS_STORAGE_KEY, JSON.stringify(workers));
    } catch {
      // ignore quota error
    }
  }, [workers]);

  useEffect(() => {
    try {
      localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(attendance));
    } catch {
      // ignore quota error
    }
  }, [attendance]);

  const addWorker = useCallback((workerData: Omit<Worker, 'id'>): Worker => {
    const newId = `WRK-${String(Date.now()).slice(-3)}`;
    const newWorker: Worker = {
      ...workerData,
      id: workerData.workerId || newId,
      workerId: workerData.workerId || newId
    };

    setWorkers(prev => [...prev, newWorker]);

    // Automatically record present attendance if active
    if (newWorker.status === 'Active') {
      const today = getTodayDateString();
      setAttendance(prev => [
        ...prev,
        {
          workerId: newWorker.workerId,
          date: today,
          present: true,
          checkInTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }

    return newWorker;
  }, []);

  const updateWorker = useCallback((id: string, updated: Partial<Worker>) => {
    setWorkers(prev =>
      prev.map(w => (w.id === id || w.workerId === id ? { ...w, ...updated } : w))
    );
  }, []);

  const deleteWorker = useCallback((id: string) => {
    setWorkers(prev => prev.filter(w => w.id !== id && w.workerId !== id));
    setAttendance(prev => prev.filter(a => a.workerId !== id));
  }, []);

  const getWorker = useCallback((id: string): Worker | undefined => {
    return workers.find(w => w.id === id || w.workerId === id);
  }, [workers]);

  const markPresent = useCallback((workerId: string, checkInTime?: string, notes?: string) => {
    const today = getTodayDateString();
    const time = checkInTime || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    setAttendance(prev => {
      const existingIdx = prev.findIndex(a => a.workerId === workerId && a.date === today);
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = {
          ...copy[existingIdx],
          present: true,
          checkInTime: copy[existingIdx].checkInTime || time,
          notes: notes !== undefined ? notes : copy[existingIdx].notes
        };
        return copy;
      }
      return [
        ...prev,
        {
          workerId,
          date: today,
          present: true,
          checkInTime: time,
          notes
        }
      ];
    });
  }, []);

  const markAbsent = useCallback((workerId: string, notes?: string) => {
    const today = getTodayDateString();
    setAttendance(prev => {
      const existingIdx = prev.findIndex(a => a.workerId === workerId && a.date === today);
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = {
          ...copy[existingIdx],
          present: false,
          notes: notes !== undefined ? notes : copy[existingIdx].notes
        };
        return copy;
      }
      return [
        ...prev,
        {
          workerId,
          date: today,
          present: false,
          notes
        }
      ];
    });
  }, []);

  const toggleAttendance = useCallback((workerId: string) => {
    const today = getTodayDateString();
    const record = attendance.find(a => a.workerId === workerId && a.date === today);
    if (record && record.present) {
      markAbsent(workerId);
    } else {
      markPresent(workerId);
    }
  }, [attendance, markAbsent, markPresent]);

  const getTodayAttendance = useCallback((workerId: string): AttendanceRecord | undefined => {
    const today = getTodayDateString();
    return attendance.find(a => (a.workerId === workerId || a.workerId === workerId.replace(/^WRK-/, '')) && a.date === today);
  }, [attendance]);

  const getPresentCount = useCallback((date?: string): number => {
    const targetDate = date || getTodayDateString();
    return attendance.filter(a => a.date === targetDate && a.present).length;
  }, [attendance]);

  const getAbsentCount = useCallback((date?: string): number => {
    const targetDate = date || getTodayDateString();
    const activeWorkers = workers.filter(w => w.status === 'Active');
    const presentCount = attendance.filter(a => a.date === targetDate && a.present).length;
    return Math.max(0, activeWorkers.length - presentCount);
  }, [attendance, workers]);

  return (
    <WorkerContext.Provider
      value={{
        workers,
        attendance,
        addWorker,
        updateWorker,
        deleteWorker,
        getWorker,
        markPresent,
        markAbsent,
        toggleAttendance,
        getTodayAttendance,
        getPresentCount,
        getAbsentCount
      }}
    >
      {children}
    </WorkerContext.Provider>
  );
};

export const useWorkers = () => {
  const context = useContext(WorkerContext);
  if (!context) {
    throw new Error('useWorkers must be used within a WorkerProvider');
  }
  return context;
};
