import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, User, Shield, AlertCircle, CheckCircle, Factory, ArrowRight, KeyRound } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, changePassword, user } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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
      setError('Please enter both username and password');
      return;
    }

    setLoading(true);
    setError(null);

    const res = await login(username, password);
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Invalid credentials');
    }
  };

  const handleQuickLogin = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError(null);
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwError('Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      setPwError('New password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match');
      return;
    }

    setPwLoading(true);
    setPwError(null);

    const res = await changePassword(currentPassword, newPassword);
    setPwLoading(false);

    if (!res.success) {
      setPwError(res.error || 'Failed to update password');
    } else {
      setPwSuccess(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Subtle Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl mb-4 shadow-lg shadow-amber-500/5">
            <Factory className="w-10 h-10 text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
            Vadilal Engineering Industries
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Industrial Plant & Operations Control ERP
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-7 shadow-2xl shadow-black/50">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-800/80">
            <Shield className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-semibold uppercase tracking-wider text-slate-300">
              Plant Floor Authentication
            </span>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-3 text-rose-400 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Username / Plant ID
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. admin or manager"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:opacity-50 text-slate-950 font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-sm transition-all shadow-lg shadow-amber-500/20"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Plant System</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Logins */}
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <span className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-2.5 text-center">
              Quick Role Switch (Demo)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin', 'admin123')}
                className="px-2.5 py-1.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 rounded-lg text-xs text-slate-300 text-left transition-colors flex items-center justify-between"
              >
                <span>Admin</span>
                <span className="text-[10px] text-amber-400 font-mono">admin123</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('manager', 'manager123')}
                className="px-2.5 py-1.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 rounded-lg text-xs text-slate-300 text-left transition-colors flex items-center justify-between"
              >
                <span>Manager</span>
                <span className="text-[10px] text-blue-400 font-mono">manager123</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('quality', 'quality123')}
                className="px-2.5 py-1.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 rounded-lg text-xs text-slate-300 text-left transition-colors flex items-center justify-between"
              >
                <span>Quality</span>
                <span className="text-[10px] text-emerald-400 font-mono">quality123</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('store', 'store123')}
                className="px-2.5 py-1.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 rounded-lg text-xs text-slate-300 text-left transition-colors flex items-center justify-between"
              >
                <span>Store</span>
                <span className="text-[10px] text-purple-400 font-mono">store123</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-500 mt-6">
          🔒 Offline LAN Deployment — Central SQLite Database
        </p>
      </div>

      {/* Force Change Password Modal */}
      {user?.mustChangePassword && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-6 w-full max-w-md shadow-2xl shadow-amber-500/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                <KeyRound className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  Password Change Required
                </h3>
                <p className="text-xs text-slate-400">
                  Default credentials detected. Please choose a new password.
                </p>
              </div>
            </div>

            {pwError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{pwError}</span>
              </div>
            )}

            {pwSuccess ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm flex items-center gap-2">
                <CheckCircle className="w-5 h-5 shrink-0" />
                <span>Password changed successfully! Proceeding...</span>
              </div>
            ) : (
              <form onSubmit={handleChangePasswordSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password (e.g. admin123)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    New Password (min 6 characters)
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new strong password"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={pwLoading}
                  className="w-full mt-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold py-2 px-4 rounded-xl text-sm transition-colors shadow-lg shadow-amber-500/20"
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
