import React from 'react';

interface SummaryCardProps {
  title: string;
  value: React.ReactNode;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  statusTag?: {
    label: string;
    variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  };
  onClick?: () => void;
  className?: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  statusTag,
  onClick,
  className = ''
}) => {
  return (
    <div
      onClick={onClick}
      className={`card ${onClick ? 'clickable-card' : ''} ${className}`}
      style={{
        padding: '16px 18px',
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: '112px',
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--color-bg-surface-solid)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-md)',
        boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {title}
        </span>
        {icon ? (
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            background: 'var(--color-bg-subtle)',
            color: 'var(--color-brand-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--color-border-subtle)'
          }}>
            {icon}
          </div>
        ) : null}
      </div>

      <div>
        <div className="tabular-nums" style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-text-primary)', lineHeight: 1.15 }}>
          {value}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px', flexWrap: 'wrap', gap: '4px' }}>
          {subtitle && (
            <span style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', fontWeight: 500 }}>
              {subtitle}
            </span>
          )}

          {trend && (
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              color: trend.isPositive ? 'var(--color-status-success-solid)' : 'var(--color-status-danger-solid)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '2px'
            }}>
              {trend.isPositive ? '↑' : '↓'} {trend.value} {trend.label && <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>{trend.label}</span>}
            </span>
          )}

          {statusTag && (
            <span style={{
              fontSize: '10px',
              fontWeight: 700,
              padding: '1px 6px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor:
                statusTag.variant === 'success' ? 'var(--color-status-success-bg)' :
                statusTag.variant === 'warning' ? 'var(--color-status-warning-bg)' :
                statusTag.variant === 'danger' ? 'var(--color-status-danger-bg)' :
                statusTag.variant === 'info' ? 'var(--color-status-info-bg)' : 'var(--color-bg-subtle)',
              color:
                statusTag.variant === 'success' ? 'var(--color-status-success-text)' :
                statusTag.variant === 'warning' ? 'var(--color-status-warning-text)' :
                statusTag.variant === 'danger' ? 'var(--color-status-danger-text)' :
                statusTag.variant === 'info' ? 'var(--color-status-info-text)' : 'var(--color-text-secondary)',
              border: `1px solid ${
                statusTag.variant === 'success' ? 'var(--color-status-success-border)' :
                statusTag.variant === 'warning' ? 'var(--color-status-warning-border)' :
                statusTag.variant === 'danger' ? 'var(--color-status-danger-border)' :
                statusTag.variant === 'info' ? 'var(--color-status-info-border)' : 'var(--color-border-subtle)'
              }`
            }}>
              {statusTag.label}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
