import React, { useState, useRef, useEffect } from 'react';
import { Bell, AlertTriangle, CheckCircle2, Clock, ShieldAlert, ArrowRight } from 'lucide-react';
import { mockNotifications } from '../../mock/notificationsData';
import { useNavigation } from '../../context/NavigationContext';

export const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { navigate } = useNavigation();

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
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleNotificationClick = (actionRoute?: string, id?: string) => {
    if (id) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    }
    setIsOpen(false);
    if (actionRoute) {
      navigate(actionRoute);
    }
  };

  const getIcon = (type: string, severity: string) => {
    if (severity === 'danger') {
      return <ShieldAlert size={16} style={{ color: 'var(--color-status-danger-solid)' }} />;
    }
    if (type === 'quality') {
      return <CheckCircle2 size={16} style={{ color: 'var(--color-status-warning-solid)' }} />;
    }
    if (type === 'stock') {
      return <AlertTriangle size={16} style={{ color: 'var(--color-status-danger-solid)' }} />;
    }
    return <Clock size={16} style={{ color: 'var(--color-brand-accent)' }} />;
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
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
              fontSize: '10px',
              fontWeight: 700,
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #ffffff'
            }}
          >
            {unreadCount}
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
            width: '360px',
            maxWidth: '90vw',
            zIndex: 1100,
            boxShadow: 'var(--shadow-modal)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Header */}
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--color-border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--color-bg-surface)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                Plant Notifications
              </span>
              <span className="status-badge status-badge-neutral" style={{ fontSize: '11px', padding: '0 5px' }}>
                {unreadCount} new
              </span>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-brand-primary)',
                  fontSize: '11px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
            {notifications.length > 0 ? (
              notifications.map(item => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item.actionRoute, item.id)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--color-border-subtle)',
                    backgroundColor: item.isRead ? 'var(--color-bg-surface)' : 'rgba(239, 246, 255, 0.4)',
                    cursor: 'pointer',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start',
                    transition: 'background-color 0.1s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-bg-subtle)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = item.isRead ? 'var(--color-bg-surface)' : 'rgba(239, 246, 255, 0.4)'}
                >
                  <div style={{ marginTop: '2px', flexShrink: 0 }}>
                    {getIcon(item.type, item.severity)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: item.isRead ? 500 : 700, color: 'var(--color-text-primary)' }}>
                        {item.title}
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                        {item.timestamp}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '3px', lineHeight: 1.4 }}>
                      {item.message}
                    </p>
                    {item.actionLabel && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', fontSize: '11px', fontWeight: 600, color: 'var(--color-brand-primary)' }}>
                        <span>{item.actionLabel}</span>
                        <ArrowRight size={12} />
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '12px' }}>
                No notifications right now.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
