import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { FormField } from './FormField';
import { SelectField } from './SelectField';
import { DatePicker } from './DatePicker';
import { Button } from './Button';
import { useFactoryCalendar } from '../../context/FactoryCalendarContext';
import { useAttendance } from '../../context/AttendanceContext';
import { useWorkers } from '../../context/WorkerContext';
import { useToast } from '../../context/ToastContext';
import {
  FactoryDayStatus,
  HolidayCategory
} from '../../types';
import {
  Trash2,
  AlertTriangle
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
    updateConfig
  } = useFactoryCalendar();
  const { bulkMarkAttendance } = useAttendance();
  const { workers } = useWorkers();
  const { showToast } = useToast();

  const todayStr = new Date().toISOString().split('T')[0];
  const [targetDate, setTargetDate] = useState<string>(initialDate || todayStr);
  const [status, setStatus] = useState<FactoryDayStatus>('Closed');
  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<HolidayCategory>('Festival');
  const [notes, setNotes] = useState<string>('');
  const [autoMarkWorkers, setAutoMarkWorkers] = useState<boolean>(true);

  // Settings for Plant Weekly Off
  const [activeTab, setActiveTab] = useState<'declare' | 'weeklyOff' | 'manageHolidays'>('declare');
  const [weeklyOffDay, setWeeklyOffDay] = useState<number>(config.defaultWeeklyOffDay);
  const [weeklyOffTitle, setWeeklyOffTitle] = useState<string>(config.weeklyOffTitle);

  // When initialDate or modal opens, pre-fill form
  useEffect(() => {
    if (initialDate) {
      setTargetDate(initialDate);
    }
  }, [initialDate, isOpen]);

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
          setNotes('');
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
        : 'Special Working Day');

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
      title: status === 'Closed' ? 'Factory Declared Closed' : 'Factory Declared Open',
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
      message: `Removed custom schedule override for ${date}`,
      type: 'info'
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Universal Factory Operational Calendar & Holiday Manager"
      maxWidth="680px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            borderBottom: '1px solid var(--color-border-subtle)',
            paddingBottom: '12px'
          }}
        >
          <Button
            variant={activeTab === 'declare' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setActiveTab('declare')}
          >
            Declare Holiday / Schedule
          </Button>
          <Button
            variant={activeTab === 'manageHolidays' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setActiveTab('manageHolidays')}
          >
            All Plant Holidays ({entries.filter(e => e.status === 'Closed').length})
          </Button>
          <Button
            variant={activeTab === 'weeklyOff' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setActiveTab('weeklyOff')}
          >
            ⚙ Weekly Off Settings (Friday)
          </Button>
        </div>

        {/* TAB 1: Declare Holiday / Work Schedule */}
        {activeTab === 'declare' && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Current Day Preview Card */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor:
                  currentDayInfo.status === 'Open'
                    ? 'rgba(16, 185, 129, 0.08)'
                    : 'rgba(239, 68, 68, 0.08)',
                border: `1px solid ${
                  currentDayInfo.status === 'Open'
                    ? 'rgba(16, 185, 129, 0.3)'
                    : 'rgba(239, 68, 68, 0.3)'
                }`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Current System State for {targetDate}
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '2px' }}>
                  {currentDayInfo.status === 'Open' ? '🟢 Factory is OPEN' : '🔴 Factory is CLOSED'}{' '}
                  <span style={{ fontSize: '12px', fontWeight: 500, opacity: 0.8 }}>
                    — {currentDayInfo.title}
                  </span>
                </div>
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: currentDayInfo.isCustomOverride ? 'var(--color-brand-primary)' : 'var(--color-bg-subtle)',
                  color: currentDayInfo.isCustomOverride ? '#ffffff' : 'var(--color-text-secondary)'
                }}
              >
                {currentDayInfo.isCustomOverride ? 'Manual Override Active' : 'Default Weekly / Holiday Rule'}
              </span>
            </div>

            {/* Target Date Picker & Status Selection */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px' }}>
              <DatePicker
                label="Select Calendar Date"
                required
                value={targetDate}
                onChange={e => setTargetDate(e.target.value)}
              />

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                  Factory Operating State *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setStatus('Closed')}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '13px',
                      fontWeight: 700,
                      border: '1px solid',
                      borderColor: status === 'Closed' ? 'var(--color-status-danger-solid)' : 'var(--color-border-subtle)',
                      backgroundColor: status === 'Closed' ? 'var(--color-status-danger-subtle)' : 'transparent',
                      color: status === 'Closed' ? 'var(--color-status-danger-text)' : 'var(--color-text-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    🔴 Factory CLOSED
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('Open')}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '13px',
                      fontWeight: 700,
                      border: '1px solid',
                      borderColor: status === 'Open' ? 'var(--color-status-success-solid)' : 'var(--color-border-subtle)',
                      backgroundColor: status === 'Open' ? 'var(--color-status-success-subtle)' : 'transparent',
                      color: status === 'Open' ? 'var(--color-status-success-text)' : 'var(--color-text-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    🟢 Factory OPEN
                  </button>
                </div>
              </div>
            </div>

            {/* Holiday Category and Title */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '14px' }}>
              <SelectField
                label={status === 'Closed' ? 'Holiday / Closure Category' : 'Operating Mode'}
                required
                options={
                  status === 'Closed'
                    ? [
                        { value: 'Festival', label: 'Festival / Religious Holiday' },
                        { value: 'Weekly Off', label: 'Weekly Factory Off' },
                        { value: 'National Holiday', label: 'National Public Holiday' },
                        { value: 'Plant Maintenance', label: 'Plant & Machine Overhaul Shutdown' },
                        { value: 'Power Outage / Torrent', label: 'Power Cut / Torrent Load Shedding' },
                        { value: 'Emergency Shutdown', label: 'Emergency Plant Shutdown' },
                        { value: 'Custom Holiday', label: 'Custom Plant Off' }
                      ]
                    : [
                        { value: 'Special Working Day', label: 'Special Working Day (Production Active)' },
                        { value: 'Plant Maintenance', label: 'Maintenance Floor Run' }
                      ]
                }
                value={category}
                onChange={e => setCategory(e.target.value as HolidayCategory)}
              />

              <FormField
                label={status === 'Closed' ? 'Holiday / Closure Title *' : 'Working Day Title *'}
                placeholder={
                  status === 'Closed'
                    ? 'e.g. Diwali Plant Shutdown or Torrent Power Load Shedding'
                    : 'e.g. Urgent Batch Delivery Run (Shift 8AM-8PM)'
                }
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>

            {/* Notes / Remarks */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                Operational Instructions / Remarks (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Type instructions for floor supervisors, security, or workers..."
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
                  fontSize: '13px',
                  color: 'var(--color-text-primary)',
                  cursor: 'pointer',
                  padding: '8px 10px',
                  backgroundColor: 'var(--color-bg-subtle)',
                  borderRadius: 'var(--radius-md)'
                }}
              >
                <input
                  type="checkbox"
                  checked={autoMarkWorkers}
                  onChange={e => setAutoMarkWorkers(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <span>
                  <strong>Auto-mark all workers as "Holiday"</strong> in the workforce attendance register for this date
                </span>
              </label>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
              {currentDayInfo.isCustomOverride ? (
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    handleDeleteOverride(targetDate);
                  }}
                >
                  <Trash2 size={14} /> Revert to Default Rule
                </Button>
              ) : <div />}

              <div style={{ display: 'flex', gap: '8px' }}>
                <Button type="button" variant="secondary" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  + Save Calendar Schedule
                </Button>
              </div>
            </div>
          </form>
        )}

        {/* TAB 2: Manage All Declared Holidays */}
        {activeTab === 'manageHolidays' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              Below is the list of declared factory holidays and custom operational overrides for the plant.
            </div>

            <div
              style={{
                maxHeight: '340px',
                overflowY: 'auto',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-md)'
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-bg-subtle)', borderBottom: '1px solid var(--color-border-subtle)', textAlign: 'left' }}>
                    <th style={{ padding: '8px 12px', fontWeight: 600 }}>Date</th>
                    <th style={{ padding: '8px 12px', fontWeight: 600 }}>Factory Status</th>
                    <th style={{ padding: '8px 12px', fontWeight: 600 }}>Holiday / Event Title</th>
                    <th style={{ padding: '8px 12px', fontWeight: 600 }}>Category</th>
                    <th style={{ padding: '8px 12px', fontWeight: 600, textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {entries
                    .slice()
                    .sort((a, b) => a.date.localeCompare(b.date))
                    .map(entry => (
                      <tr
                        key={entry.id}
                        style={{
                          borderBottom: '1px solid var(--color-border-subtle)'
                        }}
                      >
                        <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                          {entry.date}
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: 'var(--radius-sm)',
                              backgroundColor:
                                entry.status === 'Open'
                                  ? 'var(--color-status-success-subtle)'
                                  : 'var(--color-status-danger-subtle)',
                              color:
                                entry.status === 'Open'
                                  ? 'var(--color-status-success-text)'
                                  : 'var(--color-status-danger-text)'
                            }}
                          >
                            {entry.status === 'Open' ? '🟢 OPEN' : '🔴 CLOSED'}
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
                        <td style={{ padding: '8px 12px', color: 'var(--color-text-secondary)', fontSize: '12px' }}>
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
                            title="Delete this holiday entry"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: Weekly Off Settings (Friday Configuration) */}
        {activeTab === 'weeklyOff' && (
          <form onSubmit={handleSaveWeeklyOff} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              style={{
                padding: '12px',
                backgroundColor: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px',
                color: 'var(--color-text-primary)',
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start'
              }}
            >
              <AlertTriangle size={18} style={{ color: 'var(--color-status-warning-solid)', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Jamnagar Industrial Area Weekly Off:</strong> By default, brass part manufacturers, foundry units, and CNC machining workshops in Jamnagar observe <strong>Friday</strong> as the weekly factory off day. Every Friday is automatically treated as <strong>🔴 Factory Closed</strong> across all plant calendars.
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '14px' }}>
              <SelectField
                label="Default Weekly Off Day"
                required
                options={[
                  { value: '5', label: 'Friday (Default — Jamnagar Brass Industry)' },
                  { value: '0', label: 'Sunday (Standard)' },
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
                label="Weekly Off Display Title"
                required
                value={weeklyOffTitle}
                onChange={e => setWeeklyOffTitle(e.target.value)}
                placeholder="e.g. Friday Factory Weekly Off"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
              <Button type="button" variant="secondary" onClick={() => setActiveTab('declare')}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Save Weekly Off Settings
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
