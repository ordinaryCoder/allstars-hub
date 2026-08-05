'use client';

import { useState } from 'react';
import { ChangePasswordModal } from '@/components/ui/ChangePasswordModal';

/**
 * A self-contained client component: renders a "Change Password" button
 * and manages the modal open/close state internally.
 * Designed to be embedded inside server-rendered profile pages.
 */
export function ChangePasswordButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        id="change-password-btn"
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 hover:bg-indigo-50 hover:border-indigo-200 group transition-all active:scale-[0.98] cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0 group-hover:bg-indigo-700 transition-colors">
            <span className="material-symbols-outlined text-[18px]">key</span>
          </div>
          <div className="flex flex-col items-start">
            <span className="text-sm font-semibold text-slate-900 group-hover:text-indigo-800 transition-colors">
              Change Password
            </span>
            <span className="text-[11px] text-slate-400">Update your account password</span>
          </div>
        </div>
        <span className="material-symbols-outlined text-[18px] text-slate-400 group-hover:text-indigo-500 transition-colors">
          chevron_right
        </span>
      </button>

      {open && <ChangePasswordModal onClose={() => setOpen(false)} />}
    </>
  );
}
