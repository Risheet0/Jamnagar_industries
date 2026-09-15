import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { FormField } from './FormField';
import { SelectField } from './SelectField';
import { useWorkers } from '../../context/WorkerContext';
import { useAttendance, enumerateDatesInRange, getTodayDateString } from '../../context/AttendanceContext';
import { useToast } from '../../context/ToastContext';
import { LeaveType, AttendanceRecord } from '../../types';
import {
  AlertTriangle,
  CheckCircle2,
  CalendarDays
} from 'lucide-react';

interface ApplyLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  workerId?: string;
  initialStartDate?: string;
  initialEndDate?: string;
  existingLeaveId?: string;
  onSuccess?: () => void;
}

export const ApplyLeaveModal: React.FC<ApplyLeaveModalProps> = ({
  isOpen,
  onClose,
  workerId,
  initialStartDate,
  initialEndDate,
  existingLeaveId,
  onSuccess
}) => {
  const { workers } = useWorkers();
  const { applyLeave, editLeave, getLeaveById } = useAttendance();
  const { showToast } = useToast();

  const todayStr = getTodayDateString();

  // Form state
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>(workerId || '');
  const [startDate, setStartDate] = useState<string>(initialStartDate || todayStr);
  const [endDate, setEndDate] = useState<string>(initialEndDate || initialStartDate || todayStr);
  const [leaveType, setLeaveType] = useState<LeaveType>('Sick');
  const [reason, setReason] = useState<string>('');
  const [includeWeekends, setIncludeWeekends] = useState<boolean>(false);

  // Conflicts step state
  const [conflicts, setConflicts] = useState<AttendanceRecord[]>([]);
  const [isConflictStep, setIsConflictStep] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Reset or populate on modal open / props change
  useEffect(() => {
    if (isOpen) {
      if (existingLeaveId) {
        const existing = getLeaveById(existingLeaveId);
        if (existing) {
          setSelectedWorkerId(existing.workerId);
          setStartDate(existing.startDate);
          setEndDate(existing.endDate);
          setLeaveType(existing.leaveType);
          setReason(existing.reason || '');
          setIncludeWeekends(existing.includeWeekends || false);
        }
      } else {
        setSelectedWorkerId(workerId || (workers.length > 0 ? workers[0].workerId : ''));
        const sDate = initialStartDate || todayStr;
        setStartDate(sDate);
        setEndDate(initialEndDate || sDate);
        setLeaveType('Sick');
        setReason('');
        setIncludeWeekends(false);
      }
      setIsConflictStep(false);
      setConflicts([]);
    }
  }, [isOpen, workerId, initialStartDate, initialEndDate, existingLeaveId, getLeaveById, workers, todayStr]);

  // Sync End Date when Start Date changes if user hasn't explicitly set a different end date
  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    if (endDate < val || endDate === startDate) {
      setEndDate(val);
    }
  };

  // Target worker details
  const currentWorker = useMemo(() => {
    return workers.find(w => w.workerId === selectedWorkerId || w.id === selectedWorkerId);
  }, [workers, selectedWorkerId]);

  // Live calculation of included dates
  const calculatedDates = useMemo(() => {
    return enumerateDatesInRange(startDate, endDate, includeWeekends);
  }, [startDate, endDate, includeWeekends]);

  // Submission handler (First pass with force=false)
  const handleSubmit = (force: boolean = false) => {
    if (!selectedWorkerId) {
      showToast({ title: 'Select Worker', message: 'Please select a worker for this leave application.', type: 'warning' });
      return;
    }
    if (!startDate || !endDate) {
      showToast({ title: 'Missing Dates', message: 'Start date and end date are required.', type: 'warning' });
      return;
    }
    if (endDate < startDate) {
      showToast({ title: 'Invalid Date Range', message: 'End date cannot be earlier than start date.', type: 'danger' });
      return;
    }
    if (calculatedDates.length === 0) {
      showToast({
        title: 'Zero Days Selected',
        message: 'No active working days in this range (check weekend toggle).',
        type: 'warning'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const meta = {
        leaveType,
        reason: reason.trim() || undefined,
        includeWeekends
      };

      const result = existingLeaveId
        ? editLeave(existingLeaveId, startDate, endDate, meta, force)
        : applyLeave(selectedWorkerId, startDate, endDate, meta, force);

      if (!result.success) {
        if (result.conflicts && result.conflicts.length > 0) {
          setConflicts(result.conflicts);
          setIsConflictStep(true);
        } else {
          showToast({ title: 'Failed to Apply Leave', message: result.error || 'Unknown error.', type: 'danger' });
        }
        setIsSubmitting(false);
        return;
      }

      // Success
      const workerName = currentWorker?.name || selectedWorkerId;
      showToast({
        title: existingLeaveId ? 'Leave Updated' : 'Leave Applied Successfully',
        message: `Marked ${result.leave?.totalDays} day(s) as On Leave (${startDate} to ${endDate}) for ${workerName}.`,
        type: 'success'
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      showToast({ title: 'Error', message: err?.message || 'Could not process leave.', type: 'danger' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={existingLeaveId ? `Edit Leave Application (${existingLeaveId})` : 'Apply Multi-Day Leave'}
      subtitle={
        currentWorker
          ? `Worker: ${currentWorker.name} (${currentWorker.workerId}) • ${currentWorker.department}`
          : 'Automatically mark multi-day attendance records as On Leave'
      }
      footer={
        isConflictStep ? (
          <>
            <Button variant="secondary" onClick={() => setIsConflictStep(false)}>
              Back to Edit
            </Button>
            <Button
              variant="danger"
              icon={<AlertTriangle size={14} />}
              isLoading={isSubmitting}
              onClick={() => handleSubmit(true)}
            >
              Overwrite & Apply Leave
            </Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              icon={<CheckCircle2 size={14} />}
              isLoading={isSubmitting}
              onClick={() => handleSubmit(false)}
            >
              {existingLeaveId ? 'Update Leave Range' : 'Apply Leave'}
            </Button>
          </>
        )
      }
    >
      {isConflictStep ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div
            style={{
              padding: '14px 16px',
              backgroundColor: 'var(--color-status-warning-bg)',
              border: '1px solid var(--color-status-warning-border)',
              borderRadius: 'var(--radius-md)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-status-warning-text)', fontWeight: 700, fontSize: '13px' }}>
              <AlertTriangle size={16} />
              <span>Attendance Conflicts Detected ({conflicts.length} Day{conflicts.length > 1 ? 's' : ''})</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--color-status-warning-text)', marginTop: '4px', lineHeight: 1.4 }}>
              The following dates in the selected range already have recorded attendance. Overwriting will replace them with <strong>On Leave</strong> and clear check-in/out stamps.
            </p>
          </div>

          <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-md)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-bg-subtle)', borderBottom: '1px solid var(--color-border-default)' }}>
                  <th style={{ padding: '6px 12px', textAlign: 'left' }}>Date</th>
                  <th style={{ padding: '6px 12px', textAlign: 'left' }}>Current Status</th>
                  <th style={{ padding: '6px 12px', textAlign: 'left' }}>Logged Timings / Remarks</th>
                </tr>
              </thead>
              <tbody>
                {conflicts.map(c => (
                  <tr key={c.date} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                    <td style={{ padding: '6px 12px', fontWeight: 600 }}><span className="mono-code">{c.date}</span></td>
                    <td style={{ padding: '6px 12px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '1px 6px',
                          borderRadius: '3px',
                          backgroundColor: c.status === 'Present' ? 'var(--color-status-success-bg)' : 'var(--color-status-danger-bg)',
                          color: c.status === 'Present' ? 'var(--color-status-success-text)' : 'var(--color-status-danger-text)'
                        }}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td style={{ padding: '6px 12px', color: 'var(--color-text-secondary)', fontSize: '11px' }}>
                      {c.checkInTime ? `${c.checkInTime} - ${c.checkOutTime || 'Present'}` : c.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Worker Selector (if not preselected) */}
          {!workerId && (
            <SelectField
              label="Select Worker"
              required
              value={selectedWorkerId}
              onChange={e => setSelectedWorkerId(e.target.value)}
              options={workers.map(w => ({
                value: w.workerId || w.id,
                label: `${w.name} (${w.workerId}) — ${w.department}`
              }))}
            />
          )}

          {/* Date Range Inputs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <FormField
              label="Leave Start Date"
              type="date"
              required
              value={startDate}
              onChange={e => handleStartDateChange(e.target.value)}
            />
            <FormField
              label="Leave End Date"
              type="date"
              required
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              helpText="Keep same as Start Date for a 1-day leave"
            />
          </div>

          {/* Leave Type and Weekend Toggle */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '14px', alignItems: 'flex-start' }}>
            <SelectField
              label="Leave Type / Category"
              required
              value={leaveType}
              onChange={e => setLeaveType(e.target.value as LeaveType)}
              options={[
                { value: 'Sick', label: 'Sick / Medical Leave' },
                { value: 'Casual', label: 'Casual / Personal Leave' },
                { value: 'Personal', label: 'Personal Emergency' },
                { value: 'Emergency', label: 'Family Emergency' },
                { value: 'Other', label: 'Other Approved Leave' }
              ]}
            />

            <div style={{ marginTop: '26px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--color-text-primary)' }}>
                <input
                  type="checkbox"
                  checked={includeWeekends}
                  onChange={e => setIncludeWeekends(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <span>Count Sat/Sun as Leave</span>
              </label>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px', marginLeft: '24px' }}>
                Default skips weekends
              </div>
            </div>
          </div>

          {/* Reason / Notes */}
          <FormField
            label="Reason / Remarks (Optional)"
            placeholder="e.g. Doctor visit, Out of station for family wedding, Village visit"
            value={reason}
            onChange={e => setReason(e.target.value)}
          />

          {/* Live Preview Banner */}
          <div
            style={{
              padding: '12px 14px',
              backgroundColor: 'var(--color-bg-subtle)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border-subtle)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <CalendarDays size={18} style={{ color: 'var(--color-brand-primary)', flexShrink: 0 }} />
            <div style={{ fontSize: '12px', color: 'var(--color-text-primary)', lineHeight: 1.4 }}>
              This will automatically mark <strong>{calculatedDates.length} day{calculatedDates.length === 1 ? '' : 's'}</strong> as <strong>On Leave</strong> ({startDate === endDate ? startDate : `${startDate} to ${endDate}`}, {includeWeekends ? 'including weekends' : 'excluding Sundays/weekends'}).
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};
