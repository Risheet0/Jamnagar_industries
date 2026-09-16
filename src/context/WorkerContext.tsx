import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Worker } from '../types';
import { mockWorkers as initialWorkers } from '../mock/workersData';
import { apiUrl } from '../utils/api';

interface WorkerContextType {
  workers: Worker[];
  addWorker: (worker: Omit<Worker, 'id'>) => Worker;
  updateWorker: (id: string, updated: Partial<Worker>) => void;
  deleteWorker: (id: string) => void;
  getWorker: (id: string) => Worker | undefined;
  refreshWorkers?: () => Promise<void>;
}

const WorkerContext = createContext<WorkerContextType | undefined>(undefined);

const WORKERS_STORAGE_KEY = 'jamnagar_erp_workers_v2';

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
      // ignore
    }
    return initialWorkers;
  });

  const fetchWorkers = useCallback(async () => {
    try {
      const res = await fetch(apiUrl('/api/workers'), { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setWorkers(data);
          try {
            localStorage.setItem(WORKERS_STORAGE_KEY, JSON.stringify(data));
          } catch {}
        }
      }
    } catch {
      // fallback to current state
    }
  }, []);

  useEffect(() => {
    fetchWorkers();
  }, [fetchWorkers]);

  const addWorker = useCallback((workerData: Omit<Worker, 'id'>): Worker => {
    const newId = workerData.workerId || `WRK-${String(Date.now()).slice(-3)}`;
    const newWorker: Worker = {
      ...workerData,
      id: newId,
      workerId: newId
    };

    setWorkers(prev => {
      const next = [...prev, newWorker];
      try {
        localStorage.setItem(WORKERS_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

    // Sync to backend
    fetch(apiUrl('/api/workers'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(newWorker)
    }).catch(err => console.error('Failed to sync worker to backend:', err));

    return newWorker;
  }, []);

  const updateWorker = useCallback((id: string, updated: Partial<Worker>) => {
    setWorkers(prev => {
      const next = prev.map(w => (w.id === id || w.workerId === id ? { ...w, ...updated } : w));
      try {
        localStorage.setItem(WORKERS_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

    // Sync to backend
    fetch(apiUrl(`/api/workers/${id}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updated)
    }).catch(err => console.error('Failed to sync worker update to backend:', err));
  }, []);

  const deleteWorker = useCallback((id: string) => {
    setWorkers(prev => {
      const next = prev.filter(w => w.id !== id && w.workerId !== id);
      try {
        localStorage.setItem(WORKERS_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

    // Sync to backend
    fetch(apiUrl(`/api/workers/${id}`), {
      method: 'DELETE',
      credentials: 'include'
    }).catch(err => console.error('Failed to sync worker delete to backend:', err));
  }, []);

  const getWorker = useCallback((id: string): Worker | undefined => {
    return workers.find(w => w.id === id || w.workerId === id);
  }, [workers]);

  return (
    <WorkerContext.Provider
      value={{
        workers,
        addWorker,
        updateWorker,
        deleteWorker,
        getWorker,
        refreshWorkers: fetchWorkers
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
