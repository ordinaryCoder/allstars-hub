'use client';

import { useState } from 'react';
import { useSnackbar } from '@/components/ui/Snackbar';
import {
  CredentialSuccessModal,
  type CreatedCredentials,
} from './quick-actions/CredentialSuccessModal';
import { AddPlayerModal, type LocationOption } from './quick-actions/AddPlayerModal';
import { AddCoachModal } from './quick-actions/AddCoachModal';

export type { LocationOption as QuickActionsLocation };

export interface QuickActionsProps {
  locations?: LocationOption[];
}

export function QuickActions({ locations = [] }: QuickActionsProps) {
  const [modal, setModal] = useState<'none' | 'player' | 'coach' | 'credentials'>('none');
  const [createdCredentials, setCreatedCredentials] = useState<CreatedCredentials | null>(null);
  const { showSnackbar } = useSnackbar();

  const handleCopyCredentials = () => {
    if (!createdCredentials) return;
    const textToCopy = `Account Credentials:\nEmail: ${createdCredentials.email}\nPassword: ${createdCredentials.passwordUsed}`;
    navigator.clipboard.writeText(textToCopy);
    showSnackbar({ message: 'Credentials copied to clipboard!', type: 'success' });
  };

  const handleSuccess = (credentials: CreatedCredentials) => {
    setCreatedCredentials(credentials);
    setModal('credentials');
  };

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold text-slate-900 px-1">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => setModal('player')}
          className="bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col items-center justify-center gap-2 transition-transform active:scale-95 min-h-[100px]"
        >
          <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center">
            <span className="material-symbols-outlined">person_add</span>
          </div>
          <span className="text-xs font-semibold text-slate-900">Add Player</span>
        </button>
        <button
          onClick={() => setModal('coach')}
          className="bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col items-center justify-center gap-2 transition-transform active:scale-95 min-h-[100px]"
        >
          <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center">
            <span className="material-symbols-outlined">person_outline</span>
          </div>
          <span className="text-xs font-semibold text-slate-900">Add Coach</span>
        </button>
      </div>

      {/* Modals Overlay */}
      {modal !== 'none' && (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-end sm:justify-center bg-black/40 backdrop-blur-sm sm:p-4 overflow-hidden overscroll-none">
          <div className="bg-white w-full max-w-[448px] rounded-t-3xl sm:rounded-3xl p-6 sm:pb-6 shadow-2xl animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 max-h-[85vh] overflow-y-auto relative">
            {/* Close Button */}
            <button
              onClick={() => setModal('none')}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 z-10"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            {modal === 'credentials' && createdCredentials && (
              <CredentialSuccessModal
                credentials={createdCredentials}
                onClose={() => setModal('none')}
                onCopy={handleCopyCredentials}
              />
            )}

            {modal === 'player' && (
              <AddPlayerModal locations={locations} onSuccess={handleSuccess} />
            )}

            {modal === 'coach' && (
              <AddCoachModal locations={locations} onSuccess={handleSuccess} />
            )}
          </div>
        </div>
      )}
    </section>
  );
}