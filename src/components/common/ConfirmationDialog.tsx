import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle, Trash2, Info } from 'lucide-react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false
}) => {
  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return <Trash2 size={24} style={{ color: 'var(--color-status-danger-solid)' }} />;
      case 'warning':
        return <AlertTriangle size={24} style={{ color: 'var(--color-status-warning-solid)' }} />;
      default:
        return <Info size={24} style={{ color: 'var(--color-brand-primary)' }} />;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="440px"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : variant === 'warning' ? 'primary' : 'primary'}
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          backgroundColor: variant === 'danger' ? 'var(--color-status-danger-bg)' : 'var(--color-status-warning-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          {getIcon()}
        </div>
        <div>
          <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
            {message}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '6px' }}>
            This action cannot be undone.
          </div>
        </div>
      </div>
    </Modal>
  );
};
