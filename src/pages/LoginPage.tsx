import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCompany } from '../context/CompanyContext';
import { AlertCircle, CheckCircle, ArrowRight, KeyRound, Eye, EyeOff } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, changePassword, user } = useAuth();
  const { companyProfile } = useCompany();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Change password modal state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }
    setError(null);
    setLoading(true);
    const result = await login(username, password);
    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Invalid credentials. Please try again.');
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwError('Please fill in all fields.');
      return;
    }
    if (newPassword.length < 6) {
      setPwError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match.');
      return;
    }

    setPwError(null);
    setPwLoading(true);
    const result = await changePassword(currentPassword, newPassword);
    setPwLoading(false);

    if (!result.success) {
      setPwError(result.error || 'Failed to update password.');
    } else {
      setPwSuccess(true);
    }
  };

  return (
    <div style={styles.page}>
      {/* Background decoration */}
      <div style={styles.bgDecor1} />
      <div style={styles.bgDecor2} />

      <div style={styles.container}>
        {/* Brand Header */}
        <div style={styles.brandHeader}>
          <div style={styles.logoBox}>
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <rect width="36" height="36" rx="8" fill="#1e3a8a" opacity="0.12" />
              <path d="M6 26V14l6-4 6 4v4l6-4 6 4v12H24v-6h-4v6H12v-6H8v6H6z" fill="#1e3a8a" />
            </svg>
          </div>
          <h1 style={styles.brandName}>{companyProfile.name}</h1>
          <p style={styles.brandSub}>{companyProfile.location ? `${companyProfile.location} • Industrial ERP` : 'Industrial Plant & Operations Control ERP'}</p>
        </div>

        {/* Login Card */}
        <div style={styles.card}>
          {/* Card Header */}
          <div style={styles.cardHeader}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#1e3a8a' }}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span style={styles.cardHeaderText}>Plant Floor Authentication</span>
          </div>

          {error && (
            <div style={styles.errorBox}>
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={styles.form}>
            {/* Username */}
            <div style={styles.fieldGroup}>
              <label style={styles.label} htmlFor="login-username">Username / Plant ID</label>
              <div style={styles.inputWrapper}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={styles.inputIcon}>
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
                <input
                  id="login-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. admin or manager"
                  style={styles.input}
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password */}
            <div style={styles.fieldGroup}>
              <label style={styles.label} htmlFor="login-password">Password</label>
              <div style={styles.inputWrapper}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={styles.inputIcon}>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  style={{ ...styles.input, paddingRight: '42px' }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              style={loading ? { ...styles.submitBtn, opacity: 0.7, cursor: 'not-allowed' } : styles.submitBtn}
            >
              {loading ? (
                <span style={styles.spinner} />
              ) : (
                <>
                  <span>Sign In to Plant System</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p style={styles.footer}>
          🔒 Offline LAN Deployment — Central SQLite Database
        </p>
      </div>

      {/* Force Change Password Modal */}
      {user?.mustChangePassword && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalBox}>
            <div style={styles.modalHeader}>
              <div style={styles.modalIconBox}>
                <KeyRound size={20} color="#d97706" />
              </div>
              <div>
                <h3 style={styles.modalTitle}>Password Change Required</h3>
                <p style={styles.modalSub}>Default credentials detected. Please choose a new secure password.</p>
              </div>
            </div>

            {pwError && (
              <div style={styles.errorBox}>
                <AlertCircle size={14} />
                <span>{pwError}</span>
              </div>
            )}

            {pwSuccess ? (
              <div style={styles.successBox}>
                <CheckCircle size={16} />
                <span>Password changed successfully! Proceeding...</span>
              </div>
            ) : (
              <form onSubmit={handleChangePasswordSubmit} style={styles.form}>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password (e.g. admin123)"
                    style={styles.input}
                  />
                </div>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>New Password (min 6 characters)</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new strong password"
                    style={styles.input}
                  />
                </div>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    style={styles.input}
                  />
                </div>
                <button
                  type="submit"
                  disabled={pwLoading}
                  style={pwLoading ? { ...styles.submitBtn, opacity: 0.7 } : styles.submitBtn}
                >
                  {pwLoading ? 'Updating Password...' : 'Save & Continue'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ──────────────────────────────────────────────────────────
// Inline styles — matches the app's CSS token system
// ──────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    width: '100%',
    background: 'linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 50%, #f1f5f9 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  bgDecor1: {
    position: 'absolute',
    top: '10%',
    left: '5%',
    width: '400px',
    height: '400px',
    background: 'radial-gradient(circle, rgba(30,58,138,0.07) 0%, transparent 70%)',
    borderRadius: '50%',
    pointerEvents: 'none',
  },
  bgDecor2: {
    position: 'absolute',
    bottom: '10%',
    right: '5%',
    width: '350px',
    height: '350px',
    background: 'radial-gradient(circle, rgba(2,132,199,0.06) 0%, transparent 70%)',
    borderRadius: '50%',
    pointerEvents: 'none',
  },
  container: {
    width: '100%',
    maxWidth: '420px',
    zIndex: 10,
  },
  brandHeader: {
    textAlign: 'center',
    marginBottom: '28px',
  },
  logoBox: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px',
    background: 'rgba(30,58,138,0.08)',
    border: '1px solid rgba(30,58,138,0.15)',
    borderRadius: '16px',
    marginBottom: '14px',
    boxShadow: '0 4px 12px rgba(30,58,138,0.08)',
  },
  brandName: {
    fontSize: '1.35rem',
    fontWeight: 700,
    color: '#0f172a',
    letterSpacing: '-0.02em',
    margin: '0 0 4px',
  },
  brandSub: {
    fontSize: '0.8125rem',
    color: '#64748b',
    margin: 0,
  },
  card: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    padding: '28px',
    boxShadow: '0 10px 30px rgba(15,23,42,0.08), 0 1px 3px rgba(15,23,42,0.05)',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    paddingBottom: '18px',
    marginBottom: '20px',
    borderBottom: '1px solid #f1f5f9',
  },
  cardHeaderText: {
    fontSize: '0.75rem',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    color: '#334155',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '10px',
    color: '#dc2626',
    fontSize: '0.8125rem',
    marginBottom: '16px',
  },
  successBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    background: '#ecfdf5',
    border: '1px solid #a7f3d0',
    borderRadius: '10px',
    color: '#059669',
    fontSize: '0.8125rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '14px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '5px',
  },
  label: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#334155',
    letterSpacing: '0.01em',
  },
  inputWrapper: {
    position: 'relative' as const,
  },
  inputIcon: {
    position: 'absolute' as const,
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#94a3b8',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '9px 14px 9px 36px',
    fontSize: '0.875rem',
    color: '#0f172a',
    outline: 'none',
    transition: 'border-color 150ms ease',
    boxSizing: 'border-box' as const,
    fontFamily: 'inherit',
  },
  eyeBtn: {
    position: 'absolute' as const,
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#94a3b8',
    display: 'flex',
    alignItems: 'center',
    padding: '2px',
  },
  submitBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    marginTop: '4px',
    background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    padding: '11px 20px',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(30,58,138,0.25)',
    transition: 'all 150ms ease',
    fontFamily: 'inherit',
  },
  spinner: {
    display: 'inline-block',
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#ffffff',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  },
  footer: {
    textAlign: 'center' as const,
    fontSize: '0.75rem',
    color: '#94a3b8',
    marginTop: '20px',
  },
  modalOverlay: {
    position: 'fixed' as const,
    inset: 0,
    zIndex: 100,
    background: 'rgba(15,23,42,0.6)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
  },
  modalBox: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    padding: '24px',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 20px 40px rgba(15,23,42,0.2)',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    marginBottom: '20px',
  },
  modalIconBox: {
    padding: '10px',
    background: '#fffbeb',
    border: '1px solid #fde68a',
    borderRadius: '12px',
    flexShrink: 0,
    display: 'flex',
  },
  modalTitle: {
    fontSize: '1rem',
    fontWeight: 700,
    color: '#0f172a',
    margin: '0 0 4px',
  },
  modalSub: {
    fontSize: '0.8125rem',
    color: '#64748b',
    margin: 0,
  },
};
