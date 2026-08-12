'use client';

import type { NamedEntity } from './types';

interface DeactivateConfirmModalProps {
  user: NamedEntity | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
}

export function DeactivateConfirmModal({
  user,
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
}: DeactivateConfirmModalProps) {
  if (!isOpen || !user) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 flex flex-col gap-5 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-[24px]">person_off</span>
          </div>
          <div>
            <h3 className="text-[17px] font-bold text-slate-900 leading-tight">Deactivate Player</h3>
            <p className="text-[12px] font-medium text-slate-500 mt-0.5">Confirmation Required</p>
          </div>
        </div>

        <p className="text-[14px] leading-relaxed text-slate-600">
          Are you sure you want to deactivate{' '}
          <strong className="text-slate-900 font-semibold">
            {user.first_name} {user.last_name}
          </strong>
          ?
          <br />
          <br />
          Once deactivated, this player will{' '}
          <span className="font-semibold text-rose-600">
            not appear while marking attendance
          </span>
          .
        </p>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 h-11 rounded-xl text-[14px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex-1 h-11 rounded-xl text-[14px] font-semibold text-white bg-rose-600 hover:bg-rose-700 active:scale-[0.98] transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <span className="material-symbols-outlined text-[18px] animate-spin">
                  progress_activity
                </span>
                <span>Deactivating...</span>
              </>
            ) : (
              'Deactivate'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
