import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Bell, AlertTriangle, CheckCircle2, Clock, ShieldAlert, ArrowRight, Package, Wrench } from 'lucide-react';
import { useNavigation } from '../../context/NavigationContext';
import { useMaterials } from '../../context/MaterialsContext';
import { useProduction } from '../../context/ProductionContext';
import { useQuality } from '../../context/QualityContext';

interface LiveNotification {
  id: string;
  type: 'stock' | 'quality' | 'job' | 'info';
  severity: 'danger' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  actionRoute?: string;
  actionLabel?: string;
  isRead: boolean;
}

export const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { navigate } = useNavigation();

  // Real data sources
  const { materials } = useMaterials();
  const { jobs } = useProduction();
  const { inspections } = useQuality();

  // Build live notifications from real data
  const notifications: LiveNotification[] = useMemo(() => {
    const notifs: LiveNotification[] = [];

    // 1. Low Stock alerts
    materials
      .filter(m => m.currentStock <= m.minimumStock)
      .forEach(m => {
        const id = `low-stock-${m.id}`;
        notifs.push({
          id,
          type: 'stock',
          severity: m.currentStock === 0 ? 'danger' : 'warning',
          title: m.currentStock === 0 ? 'Out of Stock' : 'Low Stock Alert',
          message: `${m.materialName} — ${m.currentStock} ${m.unit} remaining (min: ${m.minimumStock} ${m.unit})`,
          timestamp: 'Now',
          actionRoute: '/materials',
          actionLabel: 'View Materials',
          isRead: readIds.has(id),
        });
      });

    // 2. Delayed jobs
    jobs
      .filter(j => j.status === 'Delayed')
      .forEach(j => {
        const id = `delayed-job-${j.id}`;
        notifs.push({
          id,
          type: 'job',
          severity: 'danger',
          title: 'Job Delayed',
          message: `${j.jobNumber} — ${j.productName} for ${j.customer} is delayed`,
          timestamp: j.date,
          actionRoute: `/production/jobs/${j.id}`,
          actionLabel: 'View Job',
          isRead: readIds.has(id),
        });
      });

    // 3. Jobs in Quality Check
    jobs
      .filter(j => j.status === 'Quality Check')
      .forEach(j => {
        const id = `qc-pending-job-${j.id}`;
        notifs.push({
          id,
          type: 'quality',
          severity: 'warning',
          title: 'Awaiting Quality Check',
          message: `${j.jobNumber} — ${j.productName} is ready for QC inspection`,
          timestamp: j.date,
          actionRoute: '/quality',
          actionLabel: 'Go to QC',
          isRead: readIds.has(id),
        });
      });

    // 4. Failed QC inspections
    inspections
      .filter(i => i.result === 'Fail')
      .slice(0, 3)
      .forEach(i => {
        const id = `qc-failed-${i.id}`;
        notifs.push({
          id,
          type: 'quality',
          severity: 'danger',
          title: 'QC Inspection Failed',
          message: `${i.inspectionType} on ${i.productName} — ${i.rejectedQuantity} piece(s) rejected`,
          timestamp: i.date,
          actionRoute: '/quality',
          actionLabel: 'Review Inspection',
          isRead: readIds.has(id),
        });
      });

    // Sort: unread & danger first
    return notifs.sort((a, b) => {
      if (!a.isRead && b.isRead) return -1;
      if (a.isRead && !b.isRead) return 1;
      if (a.severity === 'danger' && b.severity !== 'danger') return -1;
      if (a.severity !== 'danger' && b.severity === 'danger') return 1;
      return 0;
    });
  }, [materials, jobs, inspections, readIds]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllAsRead = () => {
    setReadIds(new Set(notifications.map(n => n.id)));
  };

  const handleNotificationClick = (actionRoute?: string, id?: string) => {
    if (id) setReadIds(prev => new Set([...prev, id]));
    setIsOpen(false);
    if (actionRoute) navigate(actionRoute);
  };

  const getIcon = (type: string, severity: string) => {
    if (severity === 'danger' && type === 'stock') return <Package size={15} style={{ color: 'var(--color-status-danger-solid)' }} />;
    if (severity === 'danger') return <ShieldAlert size={15} style={{ color: 'var(--color-status-danger-solid)' }} />;
    if (type === 'quality') return <CheckCircle2 size={15} style={{ color: 'var(--color-status-warning-solid)' }} />;
    if (type === 'stock') return <AlertTriangle size={15} style={{ color: 'var(--color-status-warning-solid)' }} />;
    if (type === 'job') return <Wrench size={15} style={{ color: 'var(--color-brand-accent)' }} />;
    return <Clock size={15} style={{ color: 'var(--color-brand-accent)' }} />;
  };

  const getSeverityBg = (severity: string) => {
    if (severity === 'danger') return 'rgba(254,242,242,0.7)';
    if (severity === 'warning') return 'rgba(255,251,235,0.7)';
    return 'rgba(239,246,255,0.5)';
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        id="notification-bell-btn"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-ghost btn-icon-only"
        style={{ position: 'relative', color: 'var(--color-text-secondary)' }}
        title="Plant Alerts & Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              backgroundColor: 'var(--color-status-danger-solid)',
              color: '#ffffff',
              fontSize: '9px',
              fontWeight: 700,
              minWidth: '16px',
              height: '16px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #ffffff',
              padding: '0 3px',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="card"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '380px',
            maxWidth: '90vw',
            zIndex: 1100,
            boxShadow: 'var(--shadow-modal)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--color-border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--color-bg-surface)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                Plant Alerts
              </span>
              {unreadCount > 0 && (
                <span
                  style={{
                    background: '#fee2e2',
                    color: '#dc2626',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '1px 7px',
                    borderRadius: '9px',
                  }}
                >
                  {unreadCount} new
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  style={{ background: 'none', border: 'none', color: 'var(--color-brand-primary)', fontSize: '11px', fontWeight: 500, cursor: 'pointer' }}
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {notifications.length > 0 ? (
              notifications.map(item => (
                <div
                  key={item.id}
                  id={`notification-${item.id}`}
                  onClick={() => handleNotificationClick(item.actionRoute, item.id)}
                  style={{
                    padding: '11px 14px',
                    borderBottom: '1px solid var(--color-border-subtle)',
                    backgroundColor: item.isRead ? 'var(--color-bg-surface)' : getSeverityBg(item.severity),
                    cursor: 'pointer',
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'flex-start',
                    transition: 'background-color 0.1s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-bg-subtle)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = item.isRead ? 'var(--color-bg-surface)' : getSeverityBg(item.severity)}
                >
                  {/* Icon */}
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: item.severity === 'danger' ? '#fee2e2' : item.severity === 'warning' ? '#fef3c7' : '#eff6ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {getIcon(item.type, item.severity)}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: item.isRead ? 500 : 700, color: 'var(--color-text-primary)' }}>
                        {item.title}
                      </span>
                      {!item.isRead && (
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: item.severity === 'danger' ? '#dc2626' : '#d97706', flexShrink: 0 }} />
                      )}
                    </div>
                    <p style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', marginTop: '2px', lineHeight: 1.4 }}>
                      {item.message}
                    </p>
                    {item.actionLabel && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '5px', fontSize: '11px', fontWeight: 600, color: 'var(--color-brand-primary)' }}>
                        <span>{item.actionLabel}</span>
                        <ArrowRight size={11} />
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '12px' }}>
                <CheckCircle2 size={28} style={{ color: '#a7f3d0', marginBottom: '8px' }} />
                <div style={{ fontWeight: 600 }}>All clear!</div>
                <div style={{ marginTop: '4px' }}>No low stock, delayed jobs, or QC issues.</div>
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div style={{ padding: '8px 14px', borderTop: '1px solid var(--color-border-subtle)', background: 'var(--color-bg-subtle)', fontSize: '11px', color: 'var(--color-text-muted)', textAlign: 'center' }}>
              {notifications.length} active alert{notifications.length !== 1 ? 's' : ''} · Live from plant data
            </div>
          )}
        </div>
      )}
    </div>
  );
};
