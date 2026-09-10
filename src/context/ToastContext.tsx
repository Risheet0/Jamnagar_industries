import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export interface Toast {
  id: string;
  title: string;
  message?: string;
  type: 'success' | 'warning' | 'danger' | 'info';
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback(({ title, message, type = 'info', duration = 4000 }: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newToast: Toast = { id, title, message, type, duration };

    setToasts(prev => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      <div className="toast-container" style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '400px',
        pointerEvents: 'none'
      }}>
        {toasts.map(toast => {
          let bg = '#ffffff';
          let border = '#cbd5e1';
          let iconColor = '#0284c7';
          let Icon = Info;

          if (toast.type === 'success') {
            border = '#a7f3d0';
            iconColor = '#059669';
            Icon = CheckCircle2;
          } else if (toast.type === 'warning') {
            border = '#fde68a';
            iconColor = '#d97706';
            Icon = AlertTriangle;
          } else if (toast.type === 'danger') {
            border = '#fecaca';
            iconColor = '#dc2626';
            Icon = XCircle;
          }

          return (
            <div
              key={toast.id}
              style={{
                pointerEvents: 'auto',
                backgroundColor: bg,
                border: `1px solid ${border}`,
                borderLeft: `4px solid ${iconColor}`,
                borderRadius: '6px',
                boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.12)',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                color: '#0f172a',
                animation: 'slideInRight 0.2s ease-out'
              }}
            >
              <Icon size={18} style={{ color: iconColor, flexShrink: 0, marginTop: '2px' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{toast.title}</div>
                {toast.message && (
                  <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px', lineHeight: 1.4 }}>
                    {toast.message}
                  </div>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '2px',
                  lineHeight: 1
                }}
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
