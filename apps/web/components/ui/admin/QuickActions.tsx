'use client';

import { useState, useTransition } from 'react';
import { addPlayerAdmin, addCoachAdmin } from '../../../app/admin/actions';
import { DobInput } from '../../../app/(auth)/signup/DobInput';
import { useSnackbar } from '../shared/Snackbar';

export function QuickActions() {
  const [modal, setModal] = useState<'none' | 'player' | 'coach'>('none');
  const [role, setRole] = useState('parent');
  const [dob, setDob] = useState('');
  const [isPending, startTransition] = useTransition();
  const { showSnackbar } = useSnackbar();

  const handlePlayerSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const currentRole = role === 'player' ? 'Player' : 'Parent';
    
    startTransition(async () => {
      const res = await addPlayerAdmin(formData);
      if (res?.error) {
        showSnackbar({ message: res.error, type: 'error' });
      } else {
        setModal('none');
        setDob('');
        showSnackbar({ message: `${currentRole} added successfully`, type: 'success' });
      }
    });
  };

  const handleCoachSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await addCoachAdmin(formData);
      if (res?.error) {
        showSnackbar({ message: res.error, type: 'error' });
      } else {
        setModal('none');
        showSnackbar({ message: 'Coach added successfully', type: 'success' });
      }
    });
  };

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold text-slate-900 px-1">Quick Actions</h2>
      <div className="grid grid-cols-3 gap-4">
        <button onClick={() => setModal('player')} className="bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col items-center justify-center gap-2 transition-transform active:scale-95 min-h-[100px]">
          <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center">
            <span className="material-symbols-outlined">person_add</span>
          </div>
          <span className="text-xs font-semibold text-slate-900">Add Player</span>
        </button>
        <button onClick={() => setModal('coach')} className="bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col items-center justify-center gap-2 transition-transform active:scale-95 min-h-[100px]">
          <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center">
            <span className="material-symbols-outlined">person_outline</span>
          </div>
          <span className="text-xs font-semibold text-slate-900">Add Coach</span>
        </button>
        <button className="bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col items-center justify-center gap-2 transition-transform active:scale-95 min-h-[100px]">
          <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center">
            <span className="material-symbols-outlined">calendar_view_day</span>
          </div>
          <span className="text-xs font-semibold text-slate-900">Manage Batches</span>
        </button>
      </div>

      {/* Modals Overlay */}
      {modal !== 'none' && (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-end sm:justify-center bg-black/40 backdrop-blur-sm sm:p-4 overflow-hidden overscroll-none">
          <div className="bg-white w-full max-w-[448px] rounded-t-3xl sm:rounded-3xl p-6 sm:pb-6 shadow-2xl animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 max-h-[85vh] relative">
            
            {/* Close Button */}
            <button onClick={() => setModal('none')} disabled={isPending} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 z-10">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            <h3 className="text-xl font-bold text-slate-900 mb-6">
              {modal === 'player' ? 'Add New Player' : 'Add New Coach'}
            </h3>

            {/* --- ADD PLAYER FORM --- */}
            {modal === 'player' && (
              <form onSubmit={handlePlayerSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-900">Registering as...</label>
                  <div className="flex gap-4 p-1 bg-slate-100 rounded-lg">
                    <label className="flex-1 flex items-center justify-center gap-2 h-10 rounded-md cursor-pointer has-[:checked]:bg-white has-[:checked]:shadow-sm transition-all">
                      <input className="sr-only" name="role" type="radio" value="parent" checked={role === 'parent'} onChange={(e) => setRole(e.target.value)} />
                      <span className="text-sm font-medium text-slate-900">Parent</span>
                    </label>
                    <label className="flex-1 flex items-center justify-center gap-2 h-10 rounded-md cursor-pointer has-[:checked]:bg-white has-[:checked]:shadow-sm transition-all">
                      <input className="sr-only" name="role" type="radio" value="player" checked={role === 'player'} onChange={(e) => setRole(e.target.value)} />
                      <span className="text-sm font-medium text-slate-900">Player</span>
                    </label>
                  </div>
                </div>

                {role === 'parent' && (
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-slate-900">Guardian / Parent Name</label>
                    <input name="guardianName" type="text" required placeholder="Guardian full name" className="w-full h-12 px-4 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 outline-none" />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-slate-900">{role === 'parent' ? 'Player First Name' : 'First Name'}</label>
                    <input name="firstName" type="text" required placeholder="First name" className="w-full h-12 px-4 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 outline-none" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-slate-900">{role === 'parent' ? 'Player Last Name' : 'Last Name'}</label>
                    <input name="lastName" type="text" required placeholder="Last name" className="w-full h-12 px-4 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 outline-none" />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-slate-900">Email Address</label>
                  <input name="email" type="email" required placeholder="name@example.com" className="w-full h-12 px-4 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 outline-none" />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-slate-900">Mobile Number</label>
                  <input name="mobileNumber" type="tel" required placeholder="+1 (555) 000-0000" className="w-full h-12 px-4 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 outline-none" />
                </div>

                {role === 'player' && (
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-slate-900">Emergency Contact Number</label>
                    <input name="emergencyContact" type="tel" required className="w-full h-12 px-4 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 outline-none" />
                  </div>
                )}

                <DobInput
                  id="dob"
                  name="dob"
                  label={role === 'parent' ? "Player's Date of Birth" : "Date of Birth"}
                  value={dob}
                  onChange={setDob}
                  required
                />

                <p className="text-[12px] text-slate-500 mt-2">
                  A temporary password will be securely generated and assigned to this user automatically.
                </p>

                <button type="submit" disabled={isPending} className="mt-2 w-full h-14 bg-slate-900 text-white rounded-xl font-semibold hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-50">
                  {isPending ? 'Creating...' : 'Create Player'}
                </button>
              </form>
            )}

            {/* --- ADD COACH FORM --- */}
            {modal === 'coach' && (
              <form onSubmit={handleCoachSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-slate-900">First Name</label>
                    <input name="firstName" type="text" required placeholder="First name" className="w-full h-12 px-4 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 outline-none" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-slate-900">Last Name</label>
                    <input name="lastName" type="text" required placeholder="Last name" className="w-full h-12 px-4 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 outline-none" />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-slate-900">Email Address</label>
                  <input name="email" type="email" required placeholder="coach@example.com" className="w-full h-12 px-4 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 outline-none" />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="tepxt-sm font-medium text-slate-900">Mobile Number</label>
                  <input name="mobileNumber" type="tel" required placeholder="+1 (555) 000-0000" className="w-full h-12 px-4 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 outline-none" />
                </div>

                <p className="text-[12px] text-slate-500 mt-2">
                  A temporary password will be securely generated and assigned to this user automatically.
                </p>

                <button type="submit" disabled={isPending} className="mt-2 w-full h-14 bg-slate-900 text-white rounded-xl font-semibold hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-50">
                  {isPending ? 'Creating...' : 'Create Coach'}
                </button>
              </form>
            )}

          </div>
        </div>
      )}
    </section>
  );
}