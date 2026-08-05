'use client';

import { useState } from 'react';

export interface CreatedCredentials {
  name: string;
  email: string;
  role: string;
  passwordUsed: string;
}

interface CredentialSuccessModalProps {
  credentials: CreatedCredentials;
  onClose: () => void;
  onCopy: () => void;
}

export function CredentialSuccessModal({
  credentials,
  onClose,
  onCopy,
}: CredentialSuccessModalProps) {
  const [showPasswordText, setShowPasswordText] = useState(false);

  return (
    <div className="space-y-4 pt-2">
      <div className="flex flex-col items-center text-center gap-2">
        <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
          <span className="material-symbols-outlined text-[28px]">check_circle</span>
        </div>
        <h3 className="text-xl font-bold text-slate-900">Account Created!</h3>
        <p className="text-xs text-slate-500">
          {credentials.role} account setup complete for{' '}
          <span className="font-semibold text-slate-800">{credentials.name}</span>.
        </p>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-500 font-medium">Role</span>
          <span className="font-bold text-slate-900 uppercase">{credentials.role}</span>
        </div>
        <div className="flex justify-between items-center text-xs border-t border-slate-200/60 pt-2">
          <span className="text-slate-500 font-medium">Email / Username</span>
          <span className="font-semibold text-slate-900 font-mono">{credentials.email}</span>
        </div>
        <div className="flex justify-between items-center text-xs border-t border-slate-200/60 pt-2">
          <span className="text-slate-500 font-medium">Account Password</span>
          <div className="flex items-center gap-1.5 bg-white border border-slate-300 px-2.5 py-1 rounded-lg">
            <span className="font-mono font-bold text-slate-900 text-sm">
              {showPasswordText ? credentials.passwordUsed : '••••••••••••'}
            </span>
            <button
              type="button"
              onClick={() => setShowPasswordText(!showPasswordText)}
              className="text-slate-400 hover:text-slate-600 p-0.5"
            >
              <span className="material-symbols-outlined text-[16px]">
                {showPasswordText ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2.5 items-start">
        <span className="material-symbols-outlined text-amber-600 text-[20px] shrink-0 mt-0.5">
          warning
        </span>
        <div className="text-[11px] text-amber-800 leading-relaxed font-medium">
          <strong className="font-bold block text-amber-900 mb-0.5">
            Important Password Notice:
          </strong>
          Please copy and share these credentials securely with the user. If lost, the password
          cannot be recovered without a password reset request.
        </div>
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <button
          type="button"
          onClick={onCopy}
          className="w-full h-12 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm"
        >
          <span className="material-symbols-outlined text-[18px]">content_copy</span>
          <span>Copy Credentials to Clipboard</span>
        </button>
        <button
          type="button"
          onClick={onClose}
          className="w-full h-10 text-slate-600 font-medium text-xs hover:text-slate-900"
        >
          Close
        </button>
      </div>
    </div>
  );
}
