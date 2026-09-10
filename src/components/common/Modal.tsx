import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = '560px'
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-modal)',
          animation: 'fadeInScale 0.15s ease-out'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="card-header" style={{ padding: '14px 20px', borderBottom: '1px solid var(--color-border-subtle)' }}>
          <div>
            <div className="card-title" style={{ fontSize: '16px' }}>{title}</div>
            {subtitle && <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>{subtitle}</div>}
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-icon-only btn-sm"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="card-body" style={{ padding: '20px', overflowY: 'auto' }}>
          {children}
        </div>

        {/* Modal Footer */}
        {footer && (
          <div className="card-footer" style={{ padding: '12px 20px' }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
