'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { changePassword } from '@/app/(auth)/_actions/auth';
import { useSnackbar } from '@/components/ui/Snackbar';
import { Spinner } from '@/components/ui/Loading';

interface Props {
  onClose: () => void;
}

function PasswordStrengthBar({ password }: { password: string }) {
  const hasLen = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const score = [hasLen, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
  const colors = ['bg-rose-400', 'bg-orange-400', 'bg-amber-400', 'bg-emerald-500'];
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];

  if (!password) return null;

  return (
    <div className="space-y-1.5 animate-in fade-in-50">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i < score ? colors[score - 1] : 'bg-slate-200'
            }`}
          />
        ))}
      </div>
      <div className="flex justify-between items-center">
        <span className={`text-[11px] font-semibold ${score < 2 ? 'text-rose-500' : score < 3 ? 'text-amber-500' : 'text-emerald-600'}`}>
          {labels[score - 1] || 'Too Short'}
        </span>
        <div className="flex gap-2 text-[10px] text-slate-400 font-medium">
          {!hasLen && <span>8+ chars</span>}
          {!hasUpper && <span>A–Z</span>}
          {!hasNumber && <span>0–9</span>}
          {!hasSpecial && <span>!@#</span>}
        </div>
      </div>
    </div>
  );
}

export function ChangePasswordModal({ onClose }: Props) {
  const { showSnackbar } = useSnackbar();
  const [state, action, isPending] = useActionState(changePassword, null);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmVal, setConfirmVal] = useState('');

  const formRef = useRef<HTMLFormElement>(null);
  const mismatch = confirmVal.length > 0 && confirmVal !== newPassword;

  useEffect(() => {
    if (state?.success) {
      showSnackbar({ message: 'Password changed successfully! 🎉', type: 'success', duration: 4000 });
      onClose();
    }
  }, [state]);

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col items-center justify-end sm:justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white w-full max-w-[448px] rounded-t-3xl sm:rounded-3xl shadow-2xl animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 max-h-[90vh] overflow-y-auto">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-slate-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-4 pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">lock_reset</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">Change Password</h2>
              <p className="text-[11px] text-slate-500 font-medium">Keep your account secure</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-100 mx-6 mb-5" />

        {/* Error Banner */}
        {state?.error && (
          <div className="mx-6 mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2 animate-in fade-in-50">
            <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">error</span>
            <span className="font-medium">{state.error}</span>
          </div>
        )}

        {/* Form */}
        <form ref={formRef} action={action} className="px-6 pb-8 space-y-4">

          {/* Current Password */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="cp-current" className="text-sm font-semibold text-slate-800">
              Current Password
            </label>
            <div className="relative flex items-center">
              <input
                id="cp-current"
                name="currentPassword"
                type={showCurrent ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="Enter your current password"
                className="w-full h-12 pl-4 pr-11 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                className="absolute right-3 text-slate-400 hover:text-slate-600 p-1 transition-colors"
                tabIndex={-1}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {showCurrent ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="cp-new" className="text-sm font-semibold text-slate-800">
              New Password
            </label>
            <div className="relative flex items-center">
              <input
                id="cp-new"
                name="newPassword"
                type={showNew ? 'text' : 'password'}
                required
                autoComplete="new-password"
                minLength={8}
                placeholder="Min. 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full h-12 pl-4 pr-11 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute right-3 text-slate-400 hover:text-slate-600 p-1 transition-colors"
                tabIndex={-1}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {showNew ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
            <PasswordStrengthBar password={newPassword} />
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="cp-confirm" className="text-sm font-semibold text-slate-800">
              Confirm New Password
            </label>
            <div className="relative flex items-center">
              <input
                id="cp-confirm"
                name="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                required
                autoComplete="new-password"
                placeholder="Re-enter new password"
                value={confirmVal}
                onChange={(e) => setConfirmVal(e.target.value)}
                className={`w-full h-12 pl-4 pr-11 bg-slate-50 border rounded-xl text-sm focus:ring-2 outline-none transition-all placeholder:text-slate-400 ${
                  mismatch
                    ? 'border-rose-300 focus:ring-rose-400 focus:border-rose-400'
                    : confirmVal && confirmVal === newPassword
                    ? 'border-emerald-400 focus:ring-emerald-400'
                    : 'border-slate-200 focus:ring-slate-900 focus:border-slate-900'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 text-slate-400 hover:text-slate-600 p-1 transition-colors"
                tabIndex={-1}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {showConfirm ? 'visibility_off' : 'visibility'}
                </span>
              </button>
              {confirmVal && (
                <span
                  className={`absolute right-10 material-symbols-outlined text-[16px] ${
                    mismatch ? 'text-rose-500' : 'text-emerald-500'
                  }`}
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {mismatch ? 'cancel' : 'check_circle'}
                </span>
              )}
            </div>
            {mismatch && (
              <p className="text-[11px] text-rose-500 font-medium animate-in fade-in-50">
                Passwords do not match
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isPending || mismatch}
            className="w-full h-13 mt-2 bg-slate-900 text-white rounded-xl font-semibold text-sm hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <>
                <Spinner size="sm" color="white" />
                <span>Updating…</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">lock</span>
                <span>Update Password</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
