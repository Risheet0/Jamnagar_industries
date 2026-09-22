import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { useWorkers } from '../../context/WorkerContext';
import { useAttendance, getTodayDateString } from '../../context/AttendanceContext';
import { useToast } from '../../context/ToastContext';
import {
  ScanFace,
  Fingerprint,
  Clock,
  UserCheck
} from 'lucide-react';

interface BiometricKioskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BiometricKioskModal: React.FC<BiometricKioskModalProps> = ({
  isOpen,
  onClose
}) => {
  const { workers } = useWorkers();
  const { markAttendance } = useAttendance();
  const { showToast } = useToast();

  const [selectedWorkerId, setSelectedWorkerId] = useState<string>(workers[0]?.id || '');
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'verified' | 'failed'>('idle');
  const [scanType, setScanType] = useState<'face' | 'fingerprint'>('face');
  const [verifiedTime, setVerifiedTime] = useState<string>('');

  const selectedWorker = workers.find(w => w.id === selectedWorkerId);
  const todayStr = getTodayDateString();

  const handleTriggerScan = (status: 'Present' | 'Half Day') => {
    if (!selectedWorker) return;
    setScanStatus('scanning');

    setTimeout(() => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setVerifiedTime(timeStr);
      setScanStatus('verified');

      markAttendance(todayStr, selectedWorker.id, status, { checkInTime: timeStr });
      showToast({
        title: 'Biometric Verified',
        message: `Match confirmed for ${selectedWorker.name} (${status})`,
        type: 'success'
      });
    }, 1400);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="ASTRA-3D Biometric Factory Kiosk Terminal"
      maxWidth="780px"
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '20px' }}>
        {/* Left: 3D Kiosk Visualization */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            borderRadius: '16px',
            padding: '20px',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '340px',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            boxShadow: '0 20px 40px rgba(15, 23, 42, 0.4)'
          }}
        >
          {scanStatus === 'scanning' && <div className="hologram-scanner" />}

          <div
            style={{
              position: 'relative',
              width: '200px',
              height: '240px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <img
              src="/assets/3d/biometric_terminal_3d.jpg"
              alt="Biometric Terminal 3D"
              style={{
                width: '180px',
                height: '220px',
                objectFit: 'contain',
                borderRadius: '12px',
                filter: scanStatus === 'scanning' ? 'drop-shadow(0 0 15px #38bdf8)' : 'drop-shadow(0 8px 16px rgba(0,0,0,0.5))',
                transition: 'all 0.3s ease'
              }}
            />

            {/* Laser Face Scan Overlay Effect */}
            {scanStatus === 'scanning' && (
              <div
                style={{
                  position: 'absolute',
                  top: '15%',
                  width: '120px',
                  height: '120px',
                  border: '2px dashed #38bdf8',
                  borderRadius: '50%',
                  animation: 'laser-pulse 1.2s infinite',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <ScanFace size={36} style={{ color: '#38bdf8', opacity: 0.8 }} />
              </div>
            )}
          </div>

          <div
            style={{
              marginTop: '12px',
              padding: '6px 14px',
              borderRadius: '999px',
              fontSize: '11px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background:
                scanStatus === 'verified'
                  ? 'rgba(16, 185, 129, 0.2)'
                  : scanStatus === 'scanning'
                  ? 'rgba(56, 189, 248, 0.2)'
                  : 'rgba(255, 255, 255, 0.1)',
              color:
                scanStatus === 'verified'
                  ? '#34d399'
                  : scanStatus === 'scanning'
                  ? '#38bdf8'
                  : '#94a3b8',
              border: `1px solid ${
                scanStatus === 'verified'
                  ? '#059669'
                  : scanStatus === 'scanning'
                  ? '#0284c7'
                  : 'rgba(255, 255, 255, 0.1)'
              }`
            }}
          >
            {scanStatus === 'scanning' ? (
              <span>⚡ Optical Laser Matrix Active...</span>
            ) : scanStatus === 'verified' ? (
              <span>✓ Match Confirmed at {verifiedTime}</span>
            ) : (
              <span>● Kiosk Online (Shift 1 Active)</span>
            )}
          </div>
        </div>

        {/* Right: Worker Selection & Punch Simulator */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '6px' }}>
              Select Karigar / Worker:
            </label>
            <select
              className="form-select"
              value={selectedWorkerId}
              onChange={e => {
                setSelectedWorkerId(e.target.value);
                setScanStatus('idle');
              }}
              style={{ width: '100%', padding: '8px 10px', fontSize: '13px' }}
            >
              {workers.map(w => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.workerId}) - {w.skill}
                </option>
              ))}
            </select>
          </div>

          {selectedWorker && (
            <div
              style={{
                padding: '12px',
                background: 'var(--color-bg-subtle)',
                borderRadius: '12px',
                border: '1px solid var(--color-border-subtle)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <img
                src="/assets/3d/worker_operator_3d.jpg"
                alt={selectedWorker.name}
                style={{ width: '46px', height: '46px', borderRadius: '10px', objectFit: 'cover' }}
              />
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px' }}>{selectedWorker.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  ID: {selectedWorker.workerId} • Wage: ₹{selectedWorker.salary} ({selectedWorker.salaryType})
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setScanType('face')}
              className={`glass-pill-tab ${scanType === 'face' ? 'active' : ''}`}
              style={{ flex: 1, padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <ScanFace size={14} />
              <span>Face AI Scan</span>
            </button>
            <button
              type="button"
              onClick={() => setScanType('fingerprint')}
              className={`glass-pill-tab ${scanType === 'fingerprint' ? 'active' : ''}`}
              style={{ flex: 1, padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <Fingerprint size={14} />
              <span>Optical Fingerprint</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
            <button
              type="button"
              className="btn-3d-action btn-3d-emerald"
              onClick={() => handleTriggerScan('Present')}
              disabled={scanStatus === 'scanning'}
              style={{ width: '100%', padding: '10px 16px' }}
            >
              <UserCheck size={16} />
              <span>Punch In / Out (Full Day Present)</span>
            </button>

            <button
              type="button"
              className="btn-3d-action btn-3d-orange"
              onClick={() => handleTriggerScan('Half Day')}
              disabled={scanStatus === 'scanning'}
              style={{ width: '100%', padding: '8px 16px', fontSize: '12px' }}
            >
              <Clock size={14} />
              <span>Punch Half-Day (4.5 hrs)</span>
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto', paddingTop: '8px' }}>
            <Button variant="secondary" onClick={onClose}>
              Close Kiosk
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
