import React, { useState } from 'react';
import { CloseIcon, LockIcon } from './icons';

interface FinancialSecurityModalProps {
  isOpen: boolean;
  mode: 'set_password' | 'unlock' | 'change_password';
  onClose: () => void;
  onVerifyAndUnlock: (password: string) => boolean;
  onSetInitialPassword: (newPass: string) => { success: boolean; message: string };
  onChangePassword: (currentPass: string, newPass: string) => { success: boolean; message: string };
  onSwitchMode: (mode: 'set_password' | 'unlock' | 'change_password') => void;
}

export const FinancialSecurityModal: React.FC<FinancialSecurityModalProps> = ({
  isOpen,
  mode,
  onClose,
  onVerifyAndUnlock,
  onSetInitialPassword,
  onChangePassword,
  onSwitchMode,
}) => {
  const [passwordInput, setPasswordInput] = useState('');
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSetInitialPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (newPasswordInput !== confirmPasswordInput) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    const result = onSetInitialPassword(newPasswordInput);
    if (result.success) {
      setSuccessMsg(result.message);
      setNewPasswordInput('');
      setConfirmPasswordInput('');
    } else {
      setErrorMsg(result.message);
    }
  };

  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const success = onVerifyAndUnlock(passwordInput);
    if (!success) {
      setErrorMsg('Incorrect owner password.');
    } else {
      setPasswordInput('');
    }
  };

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (newPasswordInput !== confirmPasswordInput) {
      setErrorMsg('New password and confirmation do not match.');
      return;
    }

    const result = onChangePassword(currentPasswordInput, newPasswordInput);
    if (result.success) {
      setSuccessMsg(result.message);
      setCurrentPasswordInput('');
      setNewPasswordInput('');
      setConfirmPasswordInput('');
      setTimeout(() => {
        onSwitchMode('unlock');
        setSuccessMsg('');
      }, 1500);
    } else {
      setErrorMsg(result.message);
    }
  };

  const getHeaderTitle = () => {
    if (mode === 'set_password') return 'Set Owner Password';
    if (mode === 'change_password') return 'Change Owner Password';
    return 'Financial Security Lock';
  };

  const getHeaderSub = () => {
    if (mode === 'set_password') return 'Set an owner password first to lock & protect financial data';
    if (mode === 'change_password') return 'Set a custom password to protect financial balances';
    return 'Balances & financial reports are password-protected';
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-surface rounded-2xl shadow-2xl p-6 md:p-8 w-full max-w-md relative border border-gray-700/80">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-secondary hover:text-text-primary p-2 rounded-lg hover:bg-secondary transition-colors"
        >
          <CloseIcon className="h-5 w-5" />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-amber-500/20 text-amber-400 p-3 rounded-xl border border-amber-500/30">
            <LockIcon className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-text-primary">
              {getHeaderTitle()}
            </h3>
            <p className="text-xs text-text-secondary">
              {getHeaderSub()}
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-500/15 border border-red-500/30 rounded-lg text-red-400 text-xs font-semibold flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs font-semibold flex items-center gap-2">
            <span>✅</span>
            <span>{successMsg}</span>
          </div>
        )}

        {mode === 'set_password' && (
          <form onSubmit={handleSetInitialPasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1">
                New Owner Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPasswordInput}
                  onChange={(e) => {
                    setNewPasswordInput(e.target.value);
                    setErrorMsg('');
                  }}
                  placeholder="Enter new owner password"
                  required
                  minLength={3}
                  autoFocus
                  className="w-full bg-secondary py-3 px-4 pr-16 rounded-xl text-sm font-semibold text-text-primary border border-gray-700 focus:outline-none focus:border-primary transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-text-secondary hover:text-text-primary px-2 py-1 rounded bg-surface/80 border border-gray-700/60 hover:bg-secondary transition-colors cursor-pointer"
                >
                  {showNewPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPasswordInput}
                  onChange={(e) => {
                    setConfirmPasswordInput(e.target.value);
                    setErrorMsg('');
                  }}
                  placeholder="Confirm owner password"
                  required
                  minLength={3}
                  className="w-full bg-secondary py-3 px-4 pr-16 rounded-xl text-sm font-semibold text-text-primary border border-gray-700 focus:outline-none focus:border-primary transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-text-secondary hover:text-text-primary px-2 py-1 rounded bg-surface/80 border border-gray-700/60 hover:bg-secondary transition-colors cursor-pointer"
                >
                  {showConfirmPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-xl text-xs font-bold text-text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-primary hover:bg-primary-hover rounded-xl text-xs font-bold text-white shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                <LockIcon className="h-4 w-4" />
                <span>Set Password & Unlock</span>
              </button>
            </div>
          </form>
        )}

        {mode === 'unlock' && (
          <form onSubmit={handleUnlockSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">
                Owner Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setErrorMsg('');
                  }}
                  placeholder="Enter owner password"
                  autoFocus
                  required
                  className="w-full bg-secondary py-3 px-4 pr-16 rounded-xl text-sm font-semibold text-text-primary border border-gray-700 focus:outline-none focus:border-primary transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-text-secondary hover:text-text-primary px-2 py-1 rounded bg-surface/80 border border-gray-700/60 hover:bg-secondary transition-colors cursor-pointer"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <div className="text-[11px] text-text-secondary mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg('');
                    onSwitchMode('change_password');
                  }}
                  className="text-primary hover:underline font-semibold"
                >
                  Change Password
                </button>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-xl text-xs font-bold text-text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-primary hover:bg-primary-hover rounded-xl text-xs font-bold text-white shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                <LockIcon className="h-4 w-4" />
                <span>Unlock Financials</span>
              </button>
            </div>
          </form>
        )}

        {mode === 'change_password' && (
          <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPasswordInput}
                  onChange={(e) => setCurrentPasswordInput(e.target.value)}
                  placeholder="Enter current password"
                  required
                  className="w-full bg-secondary py-2.5 px-3 pr-16 rounded-xl text-sm font-semibold text-text-primary border border-gray-700 focus:outline-none focus:border-primary transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-text-secondary hover:text-text-primary px-2 py-1 rounded bg-surface/80 border border-gray-700/60 hover:bg-secondary transition-colors cursor-pointer"
                >
                  {showCurrentPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="Enter new password"
                  required
                  minLength={3}
                  className="w-full bg-secondary py-2.5 px-3 pr-16 rounded-xl text-sm font-semibold text-text-primary border border-gray-700 focus:outline-none focus:border-primary transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-text-secondary hover:text-text-primary px-2 py-1 rounded bg-surface/80 border border-gray-700/60 hover:bg-secondary transition-colors cursor-pointer"
                >
                  {showNewPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPasswordInput}
                  onChange={(e) => setConfirmPasswordInput(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  minLength={3}
                  className="w-full bg-secondary py-2.5 px-3 pr-16 rounded-xl text-sm font-semibold text-text-primary border border-gray-700 focus:outline-none focus:border-primary transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-text-secondary hover:text-text-primary px-2 py-1 rounded bg-surface/80 border border-gray-700/60 hover:bg-secondary transition-colors cursor-pointer"
                >
                  {showConfirmPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center pt-3">
              <button
                type="button"
                onClick={() => {
                  setErrorMsg('');
                  onSwitchMode('unlock');
                }}
                className="text-xs text-text-secondary hover:text-text-primary underline"
              >
                ← Back to Unlock
              </button>

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-xl text-xs font-bold text-text-primary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-primary-hover rounded-xl text-xs font-bold text-white shadow-lg transition-all"
                >
                  Save New Password
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

