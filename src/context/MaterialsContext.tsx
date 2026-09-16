import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Material, StockMovement, MaterialStatus } from '../types';
import { mockMaterials as initialMaterials } from '../mock/materialsData';
import { apiUrl } from '../utils/api';

interface InwardMeta {
  supplier: string;
  invoiceNumber: string;
  heatNumber?: string;
  date: string;
  unitPrice?: number;
  notes?: string;
}

interface OutwardMeta {
  jobId?: string;
  issuedTo?: string;
  date: string;
  reason: string;
  notes?: string;
  allowDeficit?: boolean;
}

interface MaterialsContextType {
  materials: Material[];
  stockMovements: StockMovement[];
  addMaterial: (material: Omit<Material, 'id'>) => Material;
  updateMaterial: (id: string, updated: Partial<Material>) => void;
  deleteMaterial: (id: string) => void;
  getMaterial: (id: string) => Material | undefined;
  recordInward: (materialId: string, qty: number, meta: InwardMeta) => void;
  recordOutward: (materialId: string, qty: number, meta: OutwardMeta) => boolean;
  refreshMaterials?: () => Promise<void>;
}

const MaterialsContext = createContext<MaterialsContextType | undefined>(undefined);

const MATERIALS_STORAGE_KEY = 'jamnagar_erp_materials_v1';
const MOVEMENTS_STORAGE_KEY = 'jamnagar_erp_stock_movements_v1';

const initialStockMovements: StockMovement[] = [
  {
    id: 'MOV-0001',
    materialId: 'MAT-001',
    materialCode: 'MAT-BRS-ROD-25',
    type: 'Inward',
    quantity: 500,
    date: '2026-08-20',
    reference: 'INV-2026-8841',
    supplier: 'Jamnagar Brass Syndicate Ltd.',
    heatNumber: 'HEAT-BRS-9042',
    notes: 'IS 319 Gr 1 certified batch'
  },
  {
    id: 'MOV-0002',
    materialId: 'MAT-001',
    materialCode: 'MAT-BRS-ROD-25',
    type: 'Outward',
    quantity: 120,
    date: '2026-09-08',
    reference: 'JOB-2026-001',
    issuedTo: 'Rajeshbhai Panchal (JOB-2026-001)',
    notes: 'Production Use for 1/2" Male Hex Brass Flare Tube Fitting'
  }
];

const computeStatus = (currentStock: number, minimumStock: number): MaterialStatus => {
  if (currentStock <= 0) return 'Out of Stock';
  if (currentStock <= minimumStock) return 'Low Stock';
  return 'In Stock';
};

export const MaterialsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [materials, setMaterials] = useState<Material[]>(() => {
    try {
      const saved = localStorage.getItem(MATERIALS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return initialMaterials;
  });

  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => {
    try {
      const saved = localStorage.getItem(MOVEMENTS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return initialStockMovements;
  });

  const fetchMaterials = useCallback(async () => {
    try {
      const [matRes, movRes] = await Promise.all([
        fetch(apiUrl('/api/materials'), { credentials: 'include' }),
        fetch(apiUrl('/api/materials/movements'), { credentials: 'include' })
      ]);

      if (matRes.ok) {
        const matData = await matRes.json();
        if (Array.isArray(matData)) {
          setMaterials(matData);
          try {
            localStorage.setItem(MATERIALS_STORAGE_KEY, JSON.stringify(matData));
          } catch {}
        }
      }

      if (movRes.ok) {
        const movData = await movRes.json();
        if (Array.isArray(movData)) {
          setStockMovements(movData);
          try {
            localStorage.setItem(MOVEMENTS_STORAGE_KEY, JSON.stringify(movData));
          } catch {}
        }
      }
    } catch {
      // fallback to current state
    }
  }, []);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const addMaterial = useCallback((materialData: Omit<Material, 'id'>): Material => {
    const newId = materialData.materialCode || `MAT-${String(Date.now()).slice(-3)}`;
    const newMat: Material = {
      ...materialData,
      id: newId,
      status: computeStatus(materialData.currentStock, materialData.minimumStock)
    };

    setMaterials(prev => {
      const next = [...prev, newMat];
      try {
        localStorage.setItem(MATERIALS_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

    // Sync to backend
    fetch(apiUrl('/api/materials'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(newMat)
    }).catch(err => console.error('Failed to sync material to backend:', err));

    return newMat;
  }, []);

  const updateMaterial = useCallback((id: string, updated: Partial<Material>) => {
    setMaterials(prev => {
      const next = prev.map(m => {
        if (m.id === id || m.materialCode === id) {
          const nextStock = updated.currentStock !== undefined ? updated.currentStock : m.currentStock;
          const nextMin = updated.minimumStock !== undefined ? updated.minimumStock : m.minimumStock;
          const nextStatus = updated.status || computeStatus(nextStock, nextMin);
          return { ...m, ...updated, status: nextStatus };
        }
        return m;
      });
      try {
        localStorage.setItem(MATERIALS_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

    // Sync to backend
    fetch(apiUrl(`/api/materials/${id}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updated)
    }).catch(err => console.error('Failed to sync material update to backend:', err));
  }, []);

  const deleteMaterial = useCallback((id: string) => {
    setMaterials(prev => {
      const next = prev.filter(m => m.id !== id && m.materialCode !== id);
      try {
        localStorage.setItem(MATERIALS_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

    fetch(apiUrl(`/api/materials/${id}`), {
      method: 'DELETE',
      credentials: 'include'
    }).catch(err => console.error('Failed to sync material delete to backend:', err));
  }, []);

  const getMaterial = useCallback((id: string): Material | undefined => {
    return materials.find(m => m.id === id || m.materialCode === id);
  }, [materials]);

  const recordInward = useCallback((materialId: string, qty: number, meta: InwardMeta) => {
    const target = materials.find(m => m.id === materialId || m.materialCode === materialId);
    if (!target) return;

    const newStock = target.currentStock + qty;
    const newStatus = computeStatus(newStock, target.minimumStock);

    setMaterials(prev => {
      const next = prev.map(m =>
        m.id === target.id
          ? {
              ...m,
              currentStock: newStock,
              lastRestockedDate: meta.date,
              unitPrice: meta.unitPrice !== undefined && meta.unitPrice > 0 ? meta.unitPrice : m.unitPrice,
              status: newStatus
            }
          : m
      );
      try {
        localStorage.setItem(MATERIALS_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

    const newMovement: StockMovement = {
      id: `MOV-${String(Date.now()).slice(-4)}`,
      materialId: target.id,
      materialCode: target.materialCode,
      type: 'Inward',
      quantity: qty,
      date: meta.date,
      reference: meta.invoiceNumber,
      supplier: meta.supplier,
      heatNumber: meta.heatNumber,
      notes: meta.notes
    };

    setStockMovements(prev => {
      const next = [newMovement, ...prev];
      try {
        localStorage.setItem(MOVEMENTS_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

    // Sync to backend atomic endpoint
    fetch(apiUrl(`/api/materials/${target.id}/inward`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        quantity: qty,
        date: meta.date,
        reference: meta.invoiceNumber,
        supplier: meta.supplier,
        heatNumber: meta.heatNumber,
        notes: meta.notes
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.material && data.movement) {
          setMaterials(prev => prev.map(m => (m.id === data.material.id ? data.material : m)));
          setStockMovements(prev => [data.movement, ...prev.filter(x => x.id !== newMovement.id)]);
        }
      })
      .catch(err => console.error('Failed to sync inward movement to backend:', err));
  }, [materials]);

  const recordOutward = useCallback((materialId: string, qty: number, meta: OutwardMeta): boolean => {
    const target = materials.find(m => m.id === materialId || m.materialCode === materialId);
    if (!target) return false;

    if (qty > target.currentStock && !meta.allowDeficit) {
      return false;
    }

    const newStock = Math.max(0, target.currentStock - qty);
    const newStatus = computeStatus(newStock, target.minimumStock);

    setMaterials(prev => {
      const next = prev.map(m =>
        m.id === target.id
          ? {
              ...m,
              currentStock: newStock,
              status: newStatus
            }
          : m
      );
      try {
        localStorage.setItem(MATERIALS_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

    const newMovement: StockMovement = {
      id: `MOV-${String(Date.now()).slice(-4)}`,
      materialId: target.id,
      materialCode: target.materialCode,
      type: 'Outward',
      quantity: qty,
      date: meta.date,
      reference: meta.jobId,
      issuedTo: meta.issuedTo || meta.jobId,
      notes: `${meta.reason}${meta.notes ? ` - ${meta.notes}` : ''}`
    };

    setStockMovements(prev => {
      const next = [newMovement, ...prev];
      try {
        localStorage.setItem(MOVEMENTS_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

    // Sync to backend atomic endpoint
    fetch(apiUrl(`/api/materials/${target.id}/outward`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        quantity: qty,
        date: meta.date,
        reference: meta.jobId,
        issuedTo: meta.issuedTo || meta.jobId,
        notes: `${meta.reason}${meta.notes ? ` - ${meta.notes}` : ''}`
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.material && data.movement) {
          setMaterials(prev => prev.map(m => (m.id === data.material.id ? data.material : m)));
          setStockMovements(prev => [data.movement, ...prev.filter(x => x.id !== newMovement.id)]);
        }
      })
      .catch(err => console.error('Failed to sync outward movement to backend:', err));

    return true;
  }, [materials]);

  return (
    <MaterialsContext.Provider
      value={{
        materials,
        stockMovements,
        addMaterial,
        updateMaterial,
        deleteMaterial,
        getMaterial,
        recordInward,
        recordOutward,
        refreshMaterials: fetchMaterials
      }}
    >
      {children}
    </MaterialsContext.Provider>
  );
};

export const useMaterials = () => {
  const context = useContext(MaterialsContext);
  if (!context) {
    throw new Error('useMaterials must be used within a MaterialsProvider');
  }
  return context;
};
