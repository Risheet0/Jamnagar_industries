import React from 'react';

interface SummaryCardProps {
  title: string;
  value: React.ReactNode;
  subtitle?: string;
  icon?: React.ReactNode;
  image3d?: string;
  image3dAlt?: string;
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
  image3d,
  image3dAlt,
  trend,
  statusTag,
  onClick,
  className = ''
}) => {
  return (
    <div
      onClick={onClick}
      className={`card card-3d-hover ${onClick ? 'clickable-card' : ''} ${className}`}
      style={{
        padding: '16px 20px',
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: '118px',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.88) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.95)',
        boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.05), inset 0 1px 0 rgba(255, 255, 255, 1)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {title}
        </span>
        {image3d ? (
          <img
            src={image3d}
            alt={image3dAlt || title}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              objectFit: 'cover',
              boxShadow: '0 4px 10px rgba(0, 0, 0, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.9)'
            }}
          />
        ) : icon ? (
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
            color: 'var(--color-brand-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(2, 132, 199, 0.12)'
          }}>
            {icon}
          </div>
        ) : null}
      </div>

      <div>
        <div className="tabular-nums" style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text-primary)', lineHeight: 1.15, fontFamily: 'monospace' }}>
          {value}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px', flexWrap: 'wrap', gap: '4px' }}>
          {subtitle && (
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 500 }}>
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
            <span className={`status-badge status-badge-${statusTag.variant}`} style={{ fontSize: '10px', padding: '1px 8px' }}>
              {statusTag.label}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

