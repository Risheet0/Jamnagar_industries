import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Product } from '../types';
import { mockProducts as initialProducts } from '../mock/productsData';

interface ProductsContextType {
  products: Product[];
  addProduct: (data: Omit<Product, 'id'>) => Product;
  updateProduct: (id: string, updated: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  getProduct: (id: string) => Product | undefined;
  refreshProducts?: () => Promise<void>;
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

const STORAGE_KEY = 'jamnagar_erp_products_v1';

export const ProductsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(() => {
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
    return initialProducts;
  });

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/products', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setProducts(data);
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
    fetchProducts();
  }, [fetchProducts]);

  const addProduct = useCallback((data: Omit<Product, 'id'>): Product => {
    const newId = data.productCode || `PRD-${String(Date.now()).slice(-4)}`;
    const newProduct: Product = {
      ...data,
      id: newId,
      productCode: data.productCode || newId
    };

    setProducts(prev => {
      const next = [...prev, newProduct];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

    fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(newProduct)
    }).catch(err => console.error('Failed to sync product to backend:', err));

    return newProduct;
  }, []);

  const updateProduct = useCallback((id: string, updated: Partial<Product>) => {
    setProducts(prev => {
      const next = prev.map(p => (p.id === id || p.productCode === id ? { ...p, ...updated } : p));
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

    fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updated)
    }).catch(err => console.error('Failed to sync product update to backend:', err));
  }, []);

  const deleteProduct = useCallback((id: string) => {
    setProducts(prev => {
      const next = prev.filter(p => p.id !== id && p.productCode !== id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

    fetch(`/api/products/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    }).catch(err => console.error('Failed to sync product delete to backend:', err));
  }, []);

  const getProduct = useCallback((id: string): Product | undefined => {
    return products.find(p => p.id === id || p.productCode === id);
  }, [products]);

  return (
    <ProductsContext.Provider
      value={{
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        getProduct,
        refreshProducts: fetchProducts
      }}
    >
      {children}
    </ProductsContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductsContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductsProvider');
  }
  return context;
};
