import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Worker } from '../types';
import { mockWorkers as initialWorkers } from '../mock/workersData';

interface WorkerContextType {
  workers: Worker[];
  addWorker: (worker: Omit<Worker, 'id'>) => Worker;
  updateWorker: (id: string, updated: Partial<Worker>) => void;
  deleteWorker: (id: string) => void;
  getWorker: (id: string) => Worker | undefined;
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
      // ignore JSON error
    }
    return initialWorkers;
  });

  useEffect(() => {
    try {
      localStorage.setItem(WORKERS_STORAGE_KEY, JSON.stringify(workers));
    } catch {
      // ignore quota error
    }
  }, [workers]);

  const addWorker = useCallback((workerData: Omit<Worker, 'id'>): Worker => {
    const newId = `WRK-${String(Date.now()).slice(-3)}`;
    const newWorker: Worker = {
      ...workerData,
      id: workerData.workerId || newId,
      workerId: workerData.workerId || newId
    };

    setWorkers(prev => [...prev, newWorker]);
    return newWorker;
  }, []);

  const updateWorker = useCallback((id: string, updated: Partial<Worker>) => {
    setWorkers(prev =>
      prev.map(w => (w.id === id || w.workerId === id ? { ...w, ...updated } : w))
    );
  }, []);

  const deleteWorker = useCallback((id: string) => {
    setWorkers(prev => prev.filter(w => w.id !== id && w.workerId !== id));
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
        getWorker
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
