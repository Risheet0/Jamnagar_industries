import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { useNavigation } from '../../context/NavigationContext';
import { BreadcrumbItem } from '../../types';

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  badge?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  breadcrumbs,
  actions,
  badge
}) => {
  const { navigate } = useNavigation();

  return (
    <div style={{
      marginBottom: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              padding: 0
            }}
          >
            <Home size={13} />
          </button>
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              <ChevronRight size={12} style={{ color: 'var(--color-text-disabled)' }} />
              {crumb.path ? (
                <button
                  onClick={() => navigate(crumb.path!)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-text-secondary)',
                    cursor: 'pointer',
                    fontSize: '12px',
                    padding: 0
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--color-brand-primary)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-secondary)'}
                >
                  {crumb.label}
                </button>
              ) : (
                <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>
                  {crumb.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Main Title Row & Actions */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{
              fontSize: '22px',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              letterSpacing: '-0.01em',
              lineHeight: 1.2
            }}>
              {title}
            </h1>
            {badge}
          </div>
          {description && (
            <p style={{
              fontSize: '13px',
              color: 'var(--color-text-secondary)',
              marginTop: '4px',
              maxWidth: '680px'
            }}>
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap'
          }}>
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};
