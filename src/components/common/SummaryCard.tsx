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
        transition: 'all 0.15s ease-in-out',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: '110px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {title}
        </span>
        {icon && (
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            backgroundColor: 'var(--color-brand-primary-light)',
            color: 'var(--color-brand-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {icon}
          </div>
        )}
      </div>

      <div>
        <div className="tabular-nums" style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1.2 }}>
          {value}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
          {subtitle && (
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
              {subtitle}
            </span>
          )}

          {trend && (
            <span style={{
              fontSize: '11px',
              fontWeight: 600,
              color: trend.isPositive ? 'var(--color-status-success-solid)' : 'var(--color-status-danger-solid)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '2px'
            }}>
              {trend.value} <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>{trend.label}</span>
            </span>
          )}

          {statusTag && (
            <span className={`status-badge status-badge-${statusTag.variant}`} style={{ fontSize: '11px', padding: '1px 6px' }}>
              {statusTag.label}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
