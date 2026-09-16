import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ProductionJob } from '../types';
import { mockProductionJobs as initialJobs } from '../mock/productionData';
import { apiUrl } from '../utils/api';

interface ProductionContextType {
  jobs: ProductionJob[];
  addJob: (data: Omit<ProductionJob, 'id'>) => ProductionJob;
  updateJob: (id: string, updated: Partial<ProductionJob>) => void;
  deleteJob: (id: string) => void;
  getJob: (id: string) => ProductionJob | undefined;
  logProduction: (jobId: string, producedDelta: number, rejectedDelta: number) => { job?: ProductionJob; isNewlyCompleted: boolean };
  refreshJobs?: () => Promise<void>;
}

const ProductionContext = createContext<ProductionContextType | undefined>(undefined);

const STORAGE_KEY = 'jamnagar_erp_production_v1';

export const ProductionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [jobs, setJobs] = useState<ProductionJob[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return initialJobs;
  });

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch(apiUrl('/api/production/jobs'), { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setJobs(data);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
          } catch {}
        }
      }
    } catch {
      // fallback
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const addJob = useCallback((data: Omit<ProductionJob, 'id'>): ProductionJob => {
    const newId = data.jobNumber || `JOB-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`;
    const newJob: ProductionJob = {
      ...data,
      id: newId,
      jobNumber: newId
    };

    setJobs(prev => {
      const next = [newJob, ...prev];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

    fetch(apiUrl('/api/production/jobs'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(newJob)
    }).catch(err => console.error('Failed to sync job to backend:', err));

    return newJob;
  }, []);

  const updateJob = useCallback((id: string, updated: Partial<ProductionJob>) => {
    setJobs(prev => {
      const next = prev.map(j => {
        if (j.id === id || j.jobNumber === id) {
          const nextProduced = updated.producedQuantity !== undefined ? updated.producedQuantity : j.producedQuantity;
          const nextRejected = updated.rejectedQuantity !== undefined ? updated.rejectedQuantity : j.rejectedQuantity;
          const nextRequired = updated.requiredQuantity !== undefined ? updated.requiredQuantity : j.requiredQuantity;

          let nextStatus = updated.status || j.status;
          if (!updated.status && (nextProduced + nextRejected >= nextRequired || nextProduced >= nextRequired)) {
            nextStatus = 'Completed';
          }

          return {
            ...j,
            ...updated,
            producedQuantity: nextProduced,
            rejectedQuantity: nextRejected,
            status: nextStatus
          };
        }
        return j;
      });
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

    fetch(apiUrl(`/api/production/jobs/${id}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updated)
    }).catch(err => console.error('Failed to sync job update to backend:', err));
  }, []);

  const deleteJob = useCallback((id: string) => {
    setJobs(prev => {
      const next = prev.filter(j => j.id !== id && j.jobNumber !== id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

    fetch(apiUrl(`/api/production/jobs/${id}`), {
      method: 'DELETE',
      credentials: 'include'
    }).catch(err => console.error('Failed to sync job delete to backend:', err));
  }, []);

  const getJob = useCallback((id: string): ProductionJob | undefined => {
    return jobs.find(j => j.id === id || j.jobNumber === id);
  }, [jobs]);

  const logProduction = useCallback((jobId: string, producedDelta: number, rejectedDelta: number): { job?: ProductionJob; isNewlyCompleted: boolean } => {
    let resultJob: ProductionJob | undefined;
    let newlyCompleted = false;

    setJobs(prev => {
      const next = prev.map(j => {
        if (j.id === jobId || j.jobNumber === jobId) {
          const newProduced = Math.max(0, j.producedQuantity + producedDelta);
          const newRejected = Math.max(0, j.rejectedQuantity + rejectedDelta);
          const wasCompleted = j.status === 'Completed';
          const isNowCompleted = (newProduced + newRejected >= j.requiredQuantity) || (newProduced >= j.requiredQuantity);

          if (!wasCompleted && isNowCompleted) {
            newlyCompleted = true;
          }

          const updatedJob: ProductionJob = {
            ...j,
            producedQuantity: newProduced,
            rejectedQuantity: newRejected,
            status: isNowCompleted ? 'Completed' : j.status === 'Pending' ? 'In Production' : j.status
          };
          resultJob = updatedJob;
          return updatedJob;
        }
        return j;
      });
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

    // Sync to backend log-production endpoint
    fetch(apiUrl(`/api/production/jobs/${jobId}/log-production`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        additionalProduced: producedDelta,
        additionalRejected: rejectedDelta
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.job) {
          setJobs(prev => prev.map(j => (j.id === data.job.id ? data.job : j)));
        }
      })
      .catch(err => console.error('Failed to sync log-production to backend:', err));

    return { job: resultJob, isNewlyCompleted: newlyCompleted };
  }, []);

  return (
    <ProductionContext.Provider
      value={{
        jobs,
        addJob,
        updateJob,
        deleteJob,
        getJob,
        logProduction,
        refreshJobs: fetchJobs
      }}
    >
      {children}
    </ProductionContext.Provider>
  );
};

export const useProduction = () => {
  const context = useContext(ProductionContext);
  if (!context) {
    throw new Error('useProduction must be used within a ProductionProvider');
  }
  return context;
};
