import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { QualityInspection } from '../types';

interface QualityContextType {
  inspections: QualityInspection[];
  addInspection: (inspection: Omit<QualityInspection, 'id'>) => QualityInspection;
  updateInspection: (id: string, updated: Partial<QualityInspection>) => void;
  deleteInspection: (id: string) => void;
  getInspection: (id: string) => QualityInspection | undefined;
  refreshInspections?: () => Promise<void>;
}

const QualityContext = createContext<QualityContextType | undefined>(undefined);

const STORAGE_KEY = 'jamnagar_erp_quality_v1';

const initialInspections: QualityInspection[] = [
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
    defectTypes: [],
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
    defectTypes: ['Burr', 'Thread Damage'],
    dimensionalNotes: 'Minor burr on internal chamfer; 1 pc thread crest chipped.',
    result: 'Fail',
    inspectedBy: 'Mukeshbhai Suthar',
    date: '2026-09-10',
    remarks: 'Operator notified to change insert on CNC station 01.'
  }
];

export const QualityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [inspections, setInspections] = useState<QualityInspection[]>(() => {
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
    return initialInspections;
  });

  const fetchInspections = useCallback(async () => {
    try {
      const res = await fetch('/api/quality/inspections', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setInspections(data);
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
    fetchInspections();
  }, [fetchInspections]);

  const addInspection = useCallback((data: Omit<QualityInspection, 'id'>): QualityInspection => {
    const newId = `QC-${String(Date.now()).slice(-4)}`;
    const newInspection: QualityInspection = {
      ...data,
      id: newId
    };

    setInspections(prev => {
      const next = [newInspection, ...prev];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

    fetch('/api/quality/inspections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(newInspection)
    }).catch(err => console.error('Failed to sync inspection to backend:', err));

    return newInspection;
  }, []);

  const updateInspection = useCallback((id: string, updated: Partial<QualityInspection>) => {
    setInspections(prev => {
      const next = prev.map(item => (item.id === id ? { ...item, ...updated } : item));
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

    fetch(`/api/quality/inspections/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updated)
    }).catch(err => console.error('Failed to sync inspection update to backend:', err));
  }, []);

  const deleteInspection = useCallback((id: string) => {
    setInspections(prev => {
      const next = prev.filter(item => item.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

    fetch(`/api/quality/inspections/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    }).catch(err => console.error('Failed to sync inspection delete to backend:', err));
  }, []);

  const getInspection = useCallback((id: string): QualityInspection | undefined => {
    return inspections.find(item => item.id === id);
  }, [inspections]);

  return (
    <QualityContext.Provider
      value={{
        inspections,
        addInspection,
        updateInspection,
        deleteInspection,
        getInspection,
        refreshInspections: fetchInspections
      }}
    >
      {children}
    </QualityContext.Provider>
  );
};

export const useQuality = () => {
  const context = useContext(QualityContext);
  if (!context) {
    throw new Error('useQuality must be used within a QualityProvider');
  }
  return context;
};
