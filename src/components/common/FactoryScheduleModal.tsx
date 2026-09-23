import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { FormField } from './FormField';
import { SelectField } from './SelectField';
import { DatePicker } from './DatePicker';
import { Button } from './Button';
import { useFactoryCalendar } from '../../context/FactoryCalendarContext';
import { useAttendance, getTodayDateString } from '../../context/AttendanceContext';
import { useWorkers } from '../../context/WorkerContext';
import { useToast } from '../../context/ToastContext';
import {
  FactoryDayStatus,
  HolidayCategory
} from '../../types';
import {
  Trash2,
  AlertTriangle,
  RotateCcw,
  Search,
  Calendar,
  Settings,
  Flame,
  CheckCircle2
} from 'lucide-react';

interface FactoryScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: string;
}

export const FactoryScheduleModal: React.FC<FactoryScheduleModalProps> = ({
  isOpen,
  onClose,
  initialDate
}) => {
  const {
    entries,
    config,
    getFactoryDay,
    setFactoryDayStatus,
    deleteDayOverride,
    resetToDefaultHolidays,
    updateConfig
  } = useFactoryCalendar();
  const { bulkMarkAttendance } = useAttendance();
  const { workers } = useWorkers();
  const { showToast } = useToast();

  const todayStr = getTodayDateString();
  const [targetDate, setTargetDate] = useState<string>(initialDate || todayStr);
  const [status, setStatus] = useState<FactoryDayStatus>('Closed');
  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<HolidayCategory>('Festival');
  const [notes, setNotes] = useState<string>('');
  const [autoMarkWorkers, setAutoMarkWorkers] = useState<boolean>(true);

  // Search filter for holidays tab
  const [holidaySearchTerm, setHolidaySearchTerm] = useState<string>('');

  // Settings for Plant Weekly Off
  const [activeTab, setActiveTab] = useState<'declare' | 'weeklyOff' | 'manageHolidays'>('declare');
  const [weeklyOffDay, setWeeklyOffDay] = useState<number>(config.defaultWeeklyOffDay);
  const [weeklyOffTitle, setWeeklyOffTitle] = useState<string>(config.weeklyOffTitle);

  // Sync with initialDate and config when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialDate) {
        setTargetDate(initialDate);
      }
      setWeeklyOffDay(config.defaultWeeklyOffDay);
      setWeeklyOffTitle(config.weeklyOffTitle);
    }
  }, [isOpen, initialDate, config]);

  // When targetDate changes, read existing entry if any
  useEffect(() => {
    if (targetDate) {
      const existing = getFactoryDay(targetDate);
      if (existing.isCustomOverride) {
        setStatus(existing.status);
        setTitle(existing.title);
        setCategory(existing.category);
        setNotes(existing.notes || '');
      } else {
        if (existing.status === 'Closed') {
          setStatus('Closed');
          setTitle(existing.title);
          setCategory(existing.category);
          setNotes(existing.notes || '');
        } else {
          setStatus('Closed');
          setTitle('');
          setCategory('Festival');
          setNotes('');
        }
      }
    }
  }, [targetDate, getFactoryDay]);

  if (!isOpen) return null;

  const currentDayInfo = getFactoryDay(targetDate);

  const handleStatusChange = (newStatus: FactoryDayStatus) => {
    setStatus(newStatus);
    if (newStatus === 'Open') {
      if (category !== 'Special Working Day' && category !== 'Plant Maintenance') {
        setCategory('Special Working Day');
      }
      if (!title || title.includes('Holiday') || title.includes('Closed') || title.includes('Off')) {
        setTitle('Special Working Day (Production Active)');
      }
    } else {
      if (category === 'Special Working Day') {
        setCategory('Festival');
      }
      if (title.includes('Special Working Day') || title.includes('Production Active')) {
        setTitle('');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!targetDate) {
      showToast({ title: 'Invalid Date', message: 'Please select a valid date', type: 'danger' });
      return;
    }

    const effectiveTitle =
      title.trim() ||
      (status === 'Closed'
        ? `${category} Holiday`
        : 'Special Working Day (Production Active)');

    setFactoryDayStatus(targetDate, status, effectiveTitle, category, notes);

    // If marked closed and autoMarkWorkers is true, mark active workers as Holiday
    if (status === 'Closed' && autoMarkWorkers) {
      const activeWorkerIds = workers
        .filter(w => w.status === 'Active')
        .map(w => w.workerId || w.id);
      if (activeWorkerIds.length > 0) {
        bulkMarkAttendance(activeWorkerIds, targetDate, 'Holiday');
      }
    }

    showToast({
      title: status === 'Closed' ? 'Schedule Saved (Closed)' : 'Schedule Saved (Open)',
      message: `${targetDate}: ${effectiveTitle}`,
      type: 'success'
    });

    onClose();
  };

  const handleSaveWeeklyOff = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig({
      defaultWeeklyOffDay: Number(weeklyOffDay),
      weeklyOffTitle: weeklyOffTitle.trim() || 'Friday Factory Weekly Off'
    });
    showToast({
      title: 'Weekly Off Updated',
      message: 'Factory Weekly Off settings updated successfully',
      type: 'success'
    });
    setActiveTab('declare');
  };

  const handleDeleteOverride = (date: string) => {
    deleteDayOverride(date);
    showToast({
      title: 'Schedule Reverted',
      message: `Reverted to default schedule rule for ${date}`,
      type: 'info'
    });
  };

  const handleResetDefaultHolidays = () => {
    if (window.confirm('Reset all factory holidays to standard industrial schedule?')) {
      resetToDefaultHolidays();
      showToast({
        title: 'Holidays Restored',
        message: 'Restored standard plant holidays',
        type: 'success'
      });
    }
  };

  const filteredHolidays = entries
    .filter(e => {
      if (!holidaySearchTerm.trim()) return true;
      const term = holidaySearchTerm.toLowerCase();
      return (
        e.title.toLowerCase().includes(term) ||
        e.date.includes(term) ||
        e.category.toLowerCase().includes(term) ||
        (e.notes && e.notes.toLowerCase().includes(term))
      );
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Factory Operational Schedule Manager"
      maxWidth="680px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            borderBottom: '1px solid var(--color-border-subtle)',
            paddingBottom: '10px'
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('declare')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '13px',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              backgroundColor: activeTab === 'declare' ? 'var(--color-brand-primary)' : 'transparent',
              color: activeTab === 'declare' ? '#ffffff' : 'var(--color-text-secondary)',
              cursor: 'pointer'
            }}
          >
            <Calendar size={14} />
            Declare Day Schedule
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manageHolidays')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '13px',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              backgroundColor: activeTab === 'manageHolidays' ? 'var(--color-brand-primary)' : 'transparent',
              color: activeTab === 'manageHolidays' ? '#ffffff' : 'var(--color-text-secondary)',
              cursor: 'pointer'
            }}
          >
            <Flame size={14} />
            Holidays Directory ({entries.filter(e => e.status === 'Closed').length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('weeklyOff')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '13px',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              backgroundColor: activeTab === 'weeklyOff' ? 'var(--color-brand-primary)' : 'transparent',
              color: activeTab === 'weeklyOff' ? '#ffffff' : 'var(--color-text-secondary)',
              cursor: 'pointer'
            }}
          >
            <Settings size={14} />
            Weekly Off Rule
          </button>
        </div>

        {/* TAB 1: Declare Holiday / Work Schedule */}
        {activeTab === 'declare' && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Current State Strip */}
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor:
                  currentDayInfo.status === 'Open'
                    ? 'rgba(16, 185, 129, 0.08)'
                    : 'rgba(239, 68, 68, 0.08)',
                border: `1px solid ${
                  currentDayInfo.status === 'Open'
                    ? 'rgba(16, 185, 129, 0.25)'
                    : 'rgba(239, 68, 68, 0.25)'
                }`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                  Current Status for {targetDate}
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '2px' }}>
                  {currentDayInfo.status === 'Open' ? '🟢 Factory Open' : '🔴 Factory Closed'} — {currentDayInfo.title}
                </div>
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: currentDayInfo.isCustomOverride ? 'var(--color-brand-primary)' : 'var(--color-bg-subtle)',
                  color: currentDayInfo.isCustomOverride ? '#ffffff' : 'var(--color-text-secondary)'
                }}
              >
                {currentDayInfo.isCustomOverride ? 'Custom Override' : 'Default Rule'}
              </span>
            </div>

            {/* Target Date Picker & Status Selection */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <DatePicker
                label="Date"
                required
                value={targetDate}
                onChange={e => setTargetDate(e.target.value)}
              />

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                  Operational State *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => handleStatusChange('Closed')}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '12px',
                      fontWeight: 700,
                      border: '1.5px solid',
                      borderColor: status === 'Closed' ? 'var(--color-status-danger-solid)' : 'var(--color-border-subtle)',
                      backgroundColor: status === 'Closed' ? 'rgba(239, 68, 68, 0.12)' : 'transparent',
                      color: status === 'Closed' ? 'var(--color-status-danger-solid)' : 'var(--color-text-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px'
                    }}
                  >
                    🔴 CLOSED
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusChange('Open')}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '12px',
                      fontWeight: 700,
                      border: '1.5px solid',
                      borderColor: status === 'Open' ? 'var(--color-status-success-solid)' : 'var(--color-border-subtle)',
                      backgroundColor: status === 'Open' ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                      color: status === 'Open' ? 'var(--color-status-success-solid)' : 'var(--color-text-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px'
                    }}
                  >
                    🟢 OPEN
                  </button>
                </div>
              </div>
            </div>

            {/* Category and Title */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '14px' }}>
              <SelectField
                label="Category"
                required
                options={
                  status === 'Closed'
                    ? [
                        { value: 'Festival', label: 'Festival Holiday' },
                        { value: 'Weekly Off', label: 'Weekly Factory Off' },
                        { value: 'National Holiday', label: 'National Public Holiday' },
                        { value: 'Plant Maintenance', label: 'Plant Maintenance' },
                        { value: 'Power Outage / Torrent', label: 'Power Cut / Torrent Outage' },
                        { value: 'Emergency Shutdown', label: 'Emergency Shutdown' },
                        { value: 'Custom Holiday', label: 'Custom Plant Off' }
                      ]
                    : [
                        { value: 'Special Working Day', label: 'Special Working Day' },
                        { value: 'Plant Maintenance', label: 'Maintenance Floor Run' }
                      ]
                }
                value={category}
                onChange={e => setCategory(e.target.value as HolidayCategory)}
              />

              <FormField
                label="Title / Reason *"
                placeholder={
                  status === 'Closed'
                    ? 'e.g. Diwali Vacation or Maintenance'
                    : 'e.g. Urgent Batch Delivery Run'
                }
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>

            {/* Remarks */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                Remarks / Instructions (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Optional notes for supervisors and records..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border-subtle)',
                  backgroundColor: 'var(--color-bg-subtle)',
                  color: 'var(--color-text-primary)',
                  fontSize: '13px',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Auto Mark Workers checkbox (Only for Closed status) */}
            {status === 'Closed' && (
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12.5px',
                  color: 'var(--color-text-primary)',
                  cursor: 'pointer',
                  padding: '8px 12px',
                  backgroundColor: 'var(--color-bg-subtle)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border-subtle)'
                }}
              >
                <input
                  type="checkbox"
                  checked={autoMarkWorkers}
                  onChange={e => setAutoMarkWorkers(e.target.checked)}
                  style={{ cursor: 'pointer', width: '15px', height: '15px' }}
                />
                <span>Auto-mark active workers as <strong>"Holiday"</strong> in attendance records</span>
              </label>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
              {currentDayInfo.isCustomOverride ? (
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => handleDeleteOverride(targetDate)}
                  icon={<Trash2 size={13} />}
                >
                  Revert to Default
                </Button>
              ) : <div />}

              <div style={{ display: 'flex', gap: '8px' }}>
                <Button type="button" variant="secondary" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" icon={<CheckCircle2 size={14} />}>
                  Save Schedule
                </Button>
              </div>
            </div>
          </form>
        )}

        {/* TAB 2: Manage All Declared Holidays */}
        {activeTab === 'manageHolidays' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search holidays..."
                  value={holidaySearchTerm}
                  onChange={e => setHolidaySearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 10px 6px 32px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border-subtle)',
                    backgroundColor: 'var(--color-bg-subtle)',
                    color: 'var(--color-text-primary)',
                    fontSize: '12px'
                  }}
                />
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={handleResetDefaultHolidays}
                icon={<RotateCcw size={13} />}
              >
                Reset Defaults
              </Button>
            </div>

            <div
              style={{
                maxHeight: '320px',
                overflowY: 'auto',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-md)'
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-bg-subtle)', borderBottom: '1px solid var(--color-border-subtle)', textAlign: 'left' }}>
                    <th style={{ padding: '8px 12px', fontWeight: 600 }}>Date</th>
                    <th style={{ padding: '8px 12px', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '8px 12px', fontWeight: 600 }}>Title</th>
                    <th style={{ padding: '8px 12px', fontWeight: 600 }}>Category</th>
                    <th style={{ padding: '8px 12px', fontWeight: 600, textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHolidays.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-muted)' }}>
                        No holiday records found.
                      </td>
                    </tr>
                  ) : (
                    filteredHolidays.map(entry => (
                      <tr
                        key={entry.id || entry.date}
                        style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
                      >
                        <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                          {entry.date}
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: 'var(--radius-sm)',
                              backgroundColor:
                                entry.status === 'Open'
                                  ? 'rgba(16, 185, 129, 0.12)'
                                  : 'rgba(239, 68, 68, 0.12)',
                              color:
                                entry.status === 'Open'
                                  ? 'var(--color-status-success-solid)'
                                  : 'var(--color-status-danger-solid)'
                            }}
                          >
                            {entry.status === 'Open' ? 'OPEN' : 'CLOSED'}
                          </span>
                        </td>
                        <td style={{ padding: '8px 12px', fontWeight: 600 }}>
                          {entry.title}
                          {entry.notes && (
                            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 400 }}>
                              {entry.notes}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '8px 12px', color: 'var(--color-text-secondary)' }}>
                          {entry.category}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => handleDeleteOverride(entry.date)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--color-status-danger-solid)',
                              cursor: 'pointer',
                              padding: '4px'
                            }}
                            title="Delete this override"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: Weekly Off Settings */}
        {activeTab === 'weeklyOff' && (
          <form onSubmit={handleSaveWeeklyOff} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div
              style={{
                padding: '10px 14px',
                backgroundColor: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                borderRadius: 'var(--radius-md)',
                fontSize: '12.5px',
                color: 'var(--color-text-primary)',
                display: 'flex',
                gap: '8px',
                alignItems: 'center'
              }}
            >
              <AlertTriangle size={16} style={{ color: 'var(--color-status-warning-solid)', flexShrink: 0 }} />
              <div>
                Default plant weekly off day is automatically marked as <strong>Closed</strong> across all calendar dates.
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '14px' }}>
              <SelectField
                label="Weekly Off Day"
                required
                options={[
                  { value: '5', label: 'Friday (Standard)' },
                  { value: '0', label: 'Sunday' },
                  { value: '1', label: 'Monday' },
                  { value: '2', label: 'Tuesday' },
                  { value: '3', label: 'Wednesday' },
                  { value: '4', label: 'Thursday' },
                  { value: '6', label: 'Saturday' }
                ]}
                value={String(weeklyOffDay)}
                onChange={e => setWeeklyOffDay(Number(e.target.value))}
              />

              <FormField
                label="Display Title"
                required
                value={weeklyOffTitle}
                onChange={e => setWeeklyOffTitle(e.target.value)}
                placeholder="e.g. Friday Factory Weekly Off"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
              <Button type="button" variant="secondary" onClick={() => setActiveTab('declare')}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" icon={<CheckCircle2 size={14} />}>
                Save Settings
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
