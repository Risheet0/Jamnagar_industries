import React from 'react';
import {
  LayoutDashboard,
  Users,
  Boxes,
  Cpu,
  Factory,
  CheckSquare,
  BarChart3,
  Settings,
  Flame,
  ChevronLeft,
  ChevronRight,
  Database
} from 'lucide-react';
import { useNavigation } from '../../context/NavigationContext';
import { useWorkers } from '../../context/WorkerContext';
import { useMaterials } from '../../context/MaterialsContext';
import { useProduction } from '../../context/ProductionContext';

interface NavItemConfig {
  id: string;
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: string | number;
  badgeVariant?: 'warning' | 'info' | 'danger' | 'neutral';
  matchPrefix?: string;
}

export const Sidebar: React.FC = () => {
  const { currentPath, navigate, isSidebarCollapsed, toggleSidebar } = useNavigation();
  const { workers } = useWorkers();
  const { materials } = useMaterials();
  const { jobs } = useProduction();

  // Compute live badges from reactive dataset
  const lowStockCount = materials.filter(m => m.status === 'Low Stock' || m.status === 'Out of Stock').length;
  const activeJobsCount = jobs.filter(j => j.status === 'In Production').length;
  const activeWorkersCount = workers.filter(w => w.status === 'Active').length;

  const navItems: NavItemConfig[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/dashboard',
      icon: <LayoutDashboard size={19} />,
      matchPrefix: '/dashboard'
    },
    {
      id: 'workers',
      label: 'Workers / Karigar',
      path: '/workers',
      icon: <Users size={19} />,
      badge: activeWorkersCount,
      badgeVariant: 'neutral',
      matchPrefix: '/workers'
    },
    {
      id: 'materials',
      label: 'Materials',
      path: '/materials',
      icon: <Boxes size={19} />,
      badge: lowStockCount > 0 ? `${lowStockCount} Low` : undefined,
      badgeVariant: 'warning',
      matchPrefix: '/materials'
    },
    {
      id: 'products',
      label: 'Products',
      path: '/products',
      icon: <Cpu size={19} />,
      matchPrefix: '/products'
    },
    {
      id: 'production',
      label: 'Production',
      path: '/production',
      icon: <Factory size={19} />,
      badge: activeJobsCount,
      badgeVariant: 'info',
      matchPrefix: '/production'
    },
    {
      id: 'quality',
      label: 'Quality Control',
      path: '/quality',
      icon: <CheckSquare size={19} />,
      badge: '1 QC',
      badgeVariant: 'warning',
      matchPrefix: '/quality'
    },
    {
      id: 'reports',
      label: 'Reports',
      path: '/reports',
      icon: <BarChart3 size={19} />,
      matchPrefix: '/reports'
    },
    {
      id: 'settings',
      label: 'Settings',
      path: '/settings',
      icon: <Settings size={19} />,
      matchPrefix: '/settings'
    },
  ];

  const isNavActive = (item: NavItemConfig) => {
    if (item.matchPrefix) {
      return currentPath.startsWith(item.matchPrefix);
    }
    return currentPath === item.path;
  };

  return (
    <aside
      style={{
        width: isSidebarCollapsed ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width)',
        backgroundColor: 'var(--color-sidebar-bg)',
        borderRight: '1px solid var(--color-sidebar-border)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        flexShrink: 0,
        transition: 'width var(--transition-normal)',
        userSelect: 'none',
        zIndex: 200,
        overflow: 'hidden'
      }}
    >
      {/* Brand Header */}
      <div
        onClick={() => navigate('/dashboard')}
        style={{
          height: 'var(--header-height)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: isSidebarCollapsed ? '0 18px' : '0 18px',
          borderBottom: '1px solid var(--color-sidebar-border)',
          cursor: 'pointer',
          backgroundColor: 'rgba(15, 23, 42, 0.95)'
        }}
      >
        <div
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '6px',
            backgroundColor: 'var(--color-brand-primary)',
            color: '#38bdf8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            border: '1px solid #1e40af'
          }}
        >
          <Flame size={20} />
        </div>

        {!isSidebarCollapsed && (
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-sidebar-text-bright)', letterSpacing: '0.02em', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              VADILAL
            </span>
            <span style={{ fontSize: '10px', color: 'var(--color-sidebar-text)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
              Engineering ERP
            </span>
          </div>
        )}
      </div>

      {/* Navigation List */}
      <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{
          fontSize: '10px',
          fontWeight: 700,
          color: 'var(--color-sidebar-text)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          padding: '6px 10px',
          marginBottom: '2px',
          display: isSidebarCollapsed ? 'none' : 'block'
        }}>
          Plant Operations
        </div>

        {navItems.map(item => {
          const active = isNavActive(item);

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(item.path)}
              title={isSidebarCollapsed ? item.label : undefined}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: isSidebarCollapsed ? '10px 0' : '9px 12px',
                justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                backgroundColor: active ? 'var(--color-sidebar-surface)' : 'transparent',
                color: active ? 'var(--color-sidebar-text-bright)' : 'var(--color-sidebar-text)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                position: 'relative',
                textAlign: 'left'
              }}
              onMouseEnter={e => {
                if (!active) {
                  e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.5)';
                  e.currentTarget.style.color = '#e2e8f0';
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--color-sidebar-text)';
                }
              }}
            >
              {/* Active Indicator Bar */}
              {active && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '6px',
                    bottom: '6px',
                    width: '3px',
                    backgroundColor: 'var(--color-sidebar-active-indicator)',
                    borderRadius: '0 2px 2px 0'
                  }}
                />
              )}

              <span style={{
                color: active ? '#38bdf8' : 'currentColor',
                display: 'inline-flex',
                alignItems: 'center',
                flexShrink: 0
              }}>
                {item.icon}
              </span>

              {!isSidebarCollapsed && (
                <span style={{
                  fontSize: '13px',
                  fontWeight: active ? 600 : 500,
                  flex: 1,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {item.label}
                </span>
              )}

              {!isSidebarCollapsed && item.badge && (
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: item.badgeVariant === 'warning' ? '#78350f' : item.badgeVariant === 'danger' ? '#7f1d1d' : item.badgeVariant === 'info' ? '#075985' : '#334155',
                    color: item.badgeVariant === 'warning' ? '#fde68a' : item.badgeVariant === 'danger' ? '#fecaca' : item.badgeVariant === 'info' ? '#bae6fd' : '#cbd5e1',
                    border: '1px solid rgba(255,255,255,0.08)'
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer: Collapse Toggle & System Stats */}
      <div style={{
        padding: '12px 10px',
        borderTop: '1px solid var(--color-sidebar-border)',
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {!isSidebarCollapsed && (
          <div style={{
            padding: '8px 10px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-sidebar-surface)',
            fontSize: '11px',
            color: 'var(--color-sidebar-text)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Database size={13} style={{ color: '#38bdf8' }} />
              <span>Offline Database</span>
            </div>
            <span style={{ color: '#10b981', fontWeight: 600 }}>v1.0.0</span>
          </div>
        )}

        <button
          type="button"
          onClick={toggleSidebar}
          className="btn btn-ghost btn-sm"
          style={{
            width: '100%',
            justifyContent: isSidebarCollapsed ? 'center' : 'space-between',
            color: 'var(--color-sidebar-text)',
            padding: '6px 8px'
          }}
          title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {!isSidebarCollapsed && <span style={{ fontSize: '12px' }}>Collapse Menu</span>}
          {isSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </aside>
  );
};
