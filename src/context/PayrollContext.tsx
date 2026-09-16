import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SalaryAdjustment, AdjustmentType, ShiftConfig } from '../types';
import { mockWorkers } from '../mock/workersData';
import { apiUrl } from '../utils/api';

interface PayrollContextType {
  adjustments: SalaryAdjustment[];
  shiftConfig: ShiftConfig;
  updateShiftConfig: (cfg: Partial<ShiftConfig>) => void;
  addAdjustment: (
    workerId: string,
    date: string,
    type: AdjustmentType,
    amount: number,
    reason?: string
  ) => SalaryAdjustment;
  deleteAdjustment: (id: string) => void;
  getAdjustmentsForWorker: (workerId: string, dateFrom?: string, dateTo?: string) => SalaryAdjustment[];
  getAdjustmentTotals: (
    workerId: string,
    dateFrom?: string,
    dateTo?: string
  ) => { totalUppad: number; totalJama: number };
  refreshPayroll?: () => Promise<void>;
}

const PayrollContext = createContext<PayrollContextType | undefined>(undefined);

const ADJUSTMENTS_STORAGE_KEY = 'jamnagar_erp_adjustments_v1';
const SHIFT_CONFIG_STORAGE_KEY = 'jamnagar_erp_shift_config_v1';

export const DEFAULT_SHIFT_CONFIG: ShiftConfig = {
  standardStartTime: '08:00',
  standardEndTime: '20:00',
  overtimeMultiplier: 1.5
};

const generateInitialAdjustments = (): SalaryAdjustment[] => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');

  const activeWorkerIds = mockWorkers
    .filter(w => w.status === 'Active')
    .map(w => w.workerId || w.id);

  const initial: SalaryAdjustment[] = [];

  if (activeWorkerIds.length > 0) {
    initial.push({
      id: 'ADJ-101',
      workerId: activeWorkerIds[0],
      date: `${y}-${m}-04`,
      type: 'Uppad',
      amount: 1500,
      reason: 'Mid-month grocery advance'
    });
  }

  if (activeWorkerIds.length > 1) {
    initial.push({
      id: 'ADJ-102',
      workerId: activeWorkerIds[1],
      date: `${y}-${m}-06`,
      type: 'Jama',
      amount: 800,
      reason: 'Urgent weekend tool die maintenance bonus'
    });
  }

  if (activeWorkerIds.length > 2) {
    initial.push({
      id: 'ADJ-103',
      workerId: activeWorkerIds[2],
      date: `${y}-${m}-08`,
      type: 'Uppad',
      amount: 2000,
      reason: 'Medical emergency advance'
    });
  }

  if (activeWorkerIds.length > 3) {
    initial.push({
      id: 'ADJ-104',
      workerId: activeWorkerIds[3],
      date: `${y}-${m}-10`,
      type: 'Jama',
      amount: 500,
      reason: 'Zero defect brass turning batch reward'
    });
  }

  return initial;
};

export const PayrollProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [shiftConfig, setShiftConfig] = useState<ShiftConfig>(() => {
    try {
      const saved = localStorage.getItem(SHIFT_CONFIG_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return DEFAULT_SHIFT_CONFIG;
  });

  const [adjustments, setAdjustments] = useState<SalaryAdjustment[]>(() => {
    try {
      const saved = localStorage.getItem(ADJUSTMENTS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return generateInitialAdjustments();
  });

  const fetchPayroll = useCallback(async () => {
    try {
      const [adjRes, cfgRes] = await Promise.all([
        fetch(apiUrl('/api/payroll/adjustments'), { credentials: 'include' }),
        fetch(apiUrl('/api/payroll/shift-config'), { credentials: 'include' })
      ]);

      if (adjRes.ok) {
        const adjData = await adjRes.json();
        if (Array.isArray(adjData)) {
          setAdjustments(adjData);
          try {
            localStorage.setItem(ADJUSTMENTS_STORAGE_KEY, JSON.stringify(adjData));
          } catch {}
        }
      }

      if (cfgRes.ok) {
        const cfgData = await cfgRes.json();
        if (cfgData && cfgData.standardStartTime) {
          setShiftConfig(cfgData);
          try {
            localStorage.setItem(SHIFT_CONFIG_STORAGE_KEY, JSON.stringify(cfgData));
          } catch {}
        }
      }
    } catch {
      // fallback
    }
  }, []);

  useEffect(() => {
    fetchPayroll();
  }, [fetchPayroll]);

  const updateShiftConfig = useCallback((cfg: Partial<ShiftConfig>) => {
    setShiftConfig(prev => {
      const next = { ...prev, ...cfg };
      try {
        localStorage.setItem(SHIFT_CONFIG_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

    fetch(apiUrl('/api/payroll/shift-config'), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(cfg)
    }).catch(err => console.error('Failed to sync shift config to backend:', err));
  }, []);

  const addAdjustment = useCallback(
    (
      workerId: string,
      date: string,
      type: AdjustmentType,
      amount: number,
      reason?: string
    ): SalaryAdjustment => {
      const newId = `ADJ-${String(Date.now()).slice(-4)}`;
      const newAdj: SalaryAdjustment = {
        id: newId,
        workerId,
        date,
        type,
        amount: Math.max(0, amount),
        reason
      };

      setAdjustments(prev => {
        const next = [newAdj, ...prev];
        try {
          localStorage.setItem(ADJUSTMENTS_STORAGE_KEY, JSON.stringify(next));
        } catch {}
        return next;
      });

      fetch(apiUrl('/api/payroll/adjustments'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newAdj)
      }).catch(err => console.error('Failed to sync adjustment to backend:', err));

      return newAdj;
    },
    []
  );

  const deleteAdjustment = useCallback((id: string) => {
    setAdjustments(prev => {
      const next = prev.filter(a => a.id !== id);
      try {
        localStorage.setItem(ADJUSTMENTS_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

    fetch(apiUrl(`/api/payroll/adjustments/${id}`), {
      method: 'DELETE',
      credentials: 'include'
    }).catch(err => console.error('Failed to sync adjustment deletion to backend:', err));
  }, []);

  const getAdjustmentsForWorker = useCallback(
    (workerId: string, dateFrom?: string, dateTo?: string): SalaryAdjustment[] => {
      return adjustments.filter(a => {
        const matchWorker = a.workerId === workerId || a.workerId === workerId.replace(/^WRK-/, '');
        const matchFrom = !dateFrom || a.date >= dateFrom;
        const matchTo = !dateTo || a.date <= dateTo;
        return matchWorker && matchFrom && matchTo;
      });
    },
    [adjustments]
  );

  const getAdjustmentTotals = useCallback(
    (
      workerId: string,
      dateFrom?: string,
      dateTo?: string
    ): { totalUppad: number; totalJama: number } => {
      const workerAdjustments = getAdjustmentsForWorker(workerId, dateFrom, dateTo);
      let totalUppad = 0;
      let totalJama = 0;

      workerAdjustments.forEach(a => {
        if (a.type === 'Uppad') {
          totalUppad += a.amount;
        } else if (a.type === 'Jama') {
          totalJama += a.amount;
        }
      });

      return { totalUppad, totalJama };
    },
    [getAdjustmentsForWorker]
  );

  return (
    <PayrollContext.Provider
      value={{
        adjustments,
        shiftConfig,
        updateShiftConfig,
        addAdjustment,
        deleteAdjustment,
        getAdjustmentsForWorker,
        getAdjustmentTotals,
        refreshPayroll: fetchPayroll
      }}
    >
      {children}
    </PayrollContext.Provider>
  );
};

export const usePayroll = () => {
  const context = useContext(PayrollContext);
  if (!context) {
    throw new Error('usePayroll must be used within a PayrollProvider');
  }
  return context;
};
