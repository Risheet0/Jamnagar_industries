import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Plus,
  ChevronDown,
  UserPlus,
  PackagePlus,
  Box,
  PlusCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Menu,
  Building2,
  HardHat
} from 'lucide-react';
import { useNavigation } from '../../context/NavigationContext';
import { mockCompanyProfile } from '../../mock/companyData';
import { NotificationDropdown } from '../common/NotificationDropdown';

export const Header: React.FC = () => {
  const { toggleSidebar, isSidebarCollapsed, openGlobalSearch, openQuickAdd, navigate } = useNavigation();
  const [isQuickAddDropdownOpen, setIsQuickAddDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const quickAddMenuRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (quickAddMenuRef.current && !quickAddMenuRef.current.contains(e.target as Node)) {
        setIsQuickAddDropdownOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleQuickAddSelect = (type: string) => {
    setIsQuickAddDropdownOpen(false);
    openQuickAdd(type);
  };

  return (
    <header style={{
      height: 'var(--header-height)',
      backgroundColor: 'var(--color-bg-surface)',
      borderBottom: '1px solid var(--color-border-subtle)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: 'var(--shadow-sm)'
    }}>
      {/* Left Section: Sidebar Toggle & Global Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, maxWidth: '640px' }}>
        <button
          type="button"
          onClick={toggleSidebar}
          className="btn btn-ghost btn-icon-only"
          title={isSidebarCollapsed ? 'Expand Navigation Sidebar' : 'Collapse Navigation Sidebar'}
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <Menu size={20} />
        </button>

        {/* Global Search Input Trigger */}
        <div
          onClick={openGlobalSearch}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: 'var(--color-bg-subtle)',
            border: '1px solid var(--color-border-default)',
            borderRadius: 'var(--radius-md)',
            padding: '6px 12px',
            width: '100%',
            maxWidth: '420px',
            cursor: 'pointer',
            transition: 'border-color 0.15s, background-color 0.15s'
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-brand-primary)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border-default)'}
        >
          <Search size={15} style={{ color: 'var(--color-text-muted)' }} />
          <span style={{ fontSize: '13px', color: 'var(--color-text-muted)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Search worker, material, product, job...
          </span>
          <span className="kbd-shortcut" style={{ flexShrink: 0 }}>Ctrl K</span>
        </div>
      </div>

      {/* Right Section: System Offline Mode, Quick Add, Notifications, Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Offline Manufacturing Status Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            backgroundColor: 'var(--color-bg-subtle)',
            border: '1px solid var(--color-border-subtle)',
            padding: '4px 10px',
            borderRadius: 'var(--radius-full)',
            fontSize: '11px',
            color: 'var(--color-text-secondary)'
          }}
          title="System operating in offline standalone industrial mode on local storage"
        >
          <span className="offline-pulse" />
          <span style={{ fontWeight: 600 }}>Local Plant Mode</span>
          <span style={{ color: 'var(--color-text-muted)' }}>• {mockCompanyProfile.shiftTiming.currentShift.split(' ')[0]}</span>
        </div>

        {/* + Add New Dropdown */}
        <div ref={quickAddMenuRef} style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setIsQuickAddDropdownOpen(!isQuickAddDropdownOpen)}
            className="btn btn-primary btn-sm"
            style={{ fontWeight: 600, gap: '6px' }}
          >
            <Plus size={16} />
            <span>+ Add New</span>
            <ChevronDown size={14} />
          </button>

          {isQuickAddDropdownOpen && (
            <div
              className="card"
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                right: 0,
                width: '210px',
                zIndex: 1100,
                boxShadow: 'var(--shadow-modal)',
                padding: '6px'
              }}
            >
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', padding: '6px 8px' }}>
                Fast Data Entry
              </div>
              <button
                type="button"
                onClick={() => handleQuickAddSelect('worker')}
                className="btn btn-ghost btn-sm"
                style={{ width: '100%', justifyContent: 'flex-start', padding: '7px 8px' }}
              >
                <UserPlus size={15} style={{ color: 'var(--color-brand-primary)' }} />
                <span>Add Worker</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickAddSelect('material')}
                className="btn btn-ghost btn-sm"
                style={{ width: '100%', justifyContent: 'flex-start', padding: '7px 8px' }}
              >
                <PackagePlus size={15} style={{ color: 'var(--color-brand-accent)' }} />
                <span>Add Material</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickAddSelect('product')}
                className="btn btn-ghost btn-sm"
                style={{ width: '100%', justifyContent: 'flex-start', padding: '7px 8px' }}
              >
                <Box size={15} style={{ color: 'var(--color-status-purple-text)' }} />
                <span>Add Product</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickAddSelect('job')}
                className="btn btn-ghost btn-sm"
                style={{ width: '100%', justifyContent: 'flex-start', padding: '7px 8px' }}
              >
                <PlusCircle size={15} style={{ color: 'var(--color-status-warning-solid)' }} />
                <span>Create Job</span>
              </button>
              <div style={{ height: '1px', backgroundColor: 'var(--color-border-subtle)', margin: '4px 0' }} />
              <button
                type="button"
                onClick={() => handleQuickAddSelect('inward')}
                className="btn btn-ghost btn-sm"
                style={{ width: '100%', justifyContent: 'flex-start', padding: '7px 8px' }}
              >
                <ArrowDownLeft size={15} style={{ color: 'var(--color-status-success-solid)' }} />
                <span>Material Inward</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickAddSelect('outward')}
                className="btn btn-ghost btn-sm"
                style={{ width: '100%', justifyContent: 'flex-start', padding: '7px 8px' }}
              >
                <ArrowUpRight size={15} style={{ color: 'var(--color-status-info-solid)' }} />
                <span>Material Outward</span>
              </button>
            </div>
          )}
        </div>

        {/* Notifications Dropdown */}
        <NotificationDropdown />

        {/* User Profile Badge */}
        <div ref={profileMenuRef} style={{ position: 'relative' }}>
          <div
            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '9px',
              padding: '4px 8px',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'background-color 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-bg-subtle)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                backgroundColor: 'var(--color-brand-primary)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                letterSpacing: '0.02em'
              }}
            >
              {mockCompanyProfile.currentUser.avatarInitials}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                {mockCompanyProfile.currentUser.username}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                {mockCompanyProfile.currentUser.role}
              </span>
            </div>

            <ChevronDown size={14} style={{ color: 'var(--color-text-muted)', marginLeft: '2px' }} />
          </div>

          {isProfileDropdownOpen && (
            <div
              className="card"
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                right: 0,
                width: '260px',
                zIndex: 1100,
                boxShadow: 'var(--shadow-modal)',
                padding: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '10px', borderBottom: '1px solid var(--color-border-subtle)' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '6px', backgroundColor: 'var(--color-brand-primary)', color: '#ffffff', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {mockCompanyProfile.currentUser.avatarInitials}
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {mockCompanyProfile.currentUser.name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                    {mockCompanyProfile.currentUser.role}
                  </div>
                </div>
              </div>

              <div style={{ padding: '10px 0', fontSize: '12px', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Building2 size={14} style={{ color: 'var(--color-text-muted)' }} />
                  <span style={{ fontWeight: 600 }}>{mockCompanyProfile.name}</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', paddingLeft: '20px' }}>
                  {mockCompanyProfile.location}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                  <HardHat size={14} style={{ color: 'var(--color-text-muted)' }} />
                  <span>{mockCompanyProfile.shiftTiming.currentShift}</span>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--color-border-subtle)', paddingTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileDropdownOpen(false);
                    navigate('/settings');
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Factory & System Settings
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
