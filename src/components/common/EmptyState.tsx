import React from 'react';
import { Inbox, AlertCircle, RefreshCw, Layers } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  className = ''
}) => {
  return (
    <div
      className={`card ${className}`}
      style={{
        padding: '48px 24px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: 'var(--color-brand-primary-light)',
          color: 'var(--color-brand-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px'
        }}
      >
        {icon || <Inbox size={28} />}
      </div>
      <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
        {title}
      </h3>
      {description && (
        <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '6px', maxWidth: '420px', lineHeight: 1.5 }}>
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction} style={{ marginTop: '20px' }}>
          + {actionLabel}
        </Button>
      )}
    </div>
  );
};

interface LoadingStateProps {
  message?: string;
  rows?: number;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading factory data...',
  rows = 4
}) => {
  return (
    <div className="card" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <div style={{ width: '18px', height: '18px', border: '2px solid var(--color-brand-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
        <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
          {message}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            style={{
              height: '36px',
              backgroundColor: 'var(--color-bg-subtle)',
              borderRadius: 'var(--radius-sm)',
              animation: 'pulse 1.5s infinite ease-in-out'
            }}
          />
        ))}
      </div>
    </div>
  );
};

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'An error occurred while loading this module. Please try again.',
  onRetry
}) => {
  return (
    <div
      className="card"
      style={{
        padding: '48px 24px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        borderLeft: '4px solid var(--color-status-danger-solid)'
      }}
    >
      <div
        style={{
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          backgroundColor: 'var(--color-status-danger-bg)',
          color: 'var(--color-status-danger-solid)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px'
        }}
      >
        <AlertCircle size={26} />
      </div>
      <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
        {title}
      </h3>
      <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '6px', maxWidth: '420px', lineHeight: 1.5 }}>
        {message}
      </p>
      {onRetry && (
        <Button variant="secondary" icon={<RefreshCw size={14} />} onClick={onRetry} style={{ marginTop: '20px' }}>
          Retry
        </Button>
      )}
    </div>
  );
};

interface PlaceholderModuleProps {
  title: string;
  moduleCode: string;
  description: string;
  icon: React.ReactNode;
  breadcrumbs?: { label: string; path?: string }[];
  badgeText?: string;
  plannedFeatures: string[];
  actionLabel?: string;
  onAction?: () => void;
}

export const PlaceholderModule: React.FC<PlaceholderModuleProps> = ({
  title,
  moduleCode,
  description,
  icon,
  badgeText = 'Foundation Phase - Task 1 Ready',
  plannedFeatures,
  actionLabel,
  onAction
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="card" style={{ padding: '32px 28px', borderLeft: '4px solid var(--color-brand-primary)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '18px' }}>
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '8px',
              backgroundColor: 'var(--color-brand-primary-light)',
              color: 'var(--color-brand-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {icon}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span className="mono-code">{moduleCode}</span>
                <span className="status-badge status-badge-info" style={{ fontSize: '11px' }}>
                  {badgeText}
                </span>
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '6px' }}>
                {title}
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px', maxWidth: '650px', lineHeight: 1.5 }}>
                {description}
              </p>
            </div>
          </div>

          {actionLabel && (
            <Button variant="primary" onClick={onAction}>
              + {actionLabel}
            </Button>
          )}
        </div>

        <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid var(--color-border-subtle)' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
            <Layers size={14} />
            <span>Architecture & Feature Scope for Next Implementation Task</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
            {plannedFeatures.map((feat, idx) => (
              <div
                key={idx}
                style={{
                  padding: '10px 14px',
                  backgroundColor: 'var(--color-bg-subtle)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border-subtle)',
                  fontSize: '12px',
                  color: 'var(--color-text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--color-brand-primary)' }} />
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
