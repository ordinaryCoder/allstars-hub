'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { DobInput } from '@/components/form/DobInput';
import { Spinner } from '@/components/ui/Loading';
import { useSnackbar } from '@/components/ui/Snackbar';
import {
  updatePlayerAdmin,
  type ExistingPlayerConflict,
} from '@/app/admin/_actions/action';
import {
  validateAdminPlayerData,
  normalizeIndianMobile,
} from '@/lib/validations/signup';

export interface LocationOption {
  id: string;
  name: string;
}

interface EditPlayerFormProps {
  playerId: string;
  initial: {
    firstName: string;
    lastName: string;
    mobileNumber: string;
    email: string;
    dob: string; // YYYY-MM-DD or ''
    locationId: string;
  };
  locations: LocationOption[];
}

export function EditPlayerForm({ playerId, initial, locations }: EditPlayerFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { showSnackbar } = useSnackbar();
  const router = useRouter();

  // Form field state — reset to `initial` on cancel
  const [firstName, setFirstName] = useState(initial.firstName);
  const [lastName, setLastName] = useState(initial.lastName);
  const [mobile, setMobile] = useState(initial.mobileNumber);
  const [email, setEmail] = useState(initial.email);
  const [dob, setDob] = useState(initial.dob);
  const [locationId, setLocationId] = useState(initial.locationId);
  const [fieldError, setFieldError] = useState<string | null>(null);

  // Conflict state
  const [conflictState, setConflictState] = useState<{
    isOpen: boolean;
    conflictType: 'mobile' | 'email' | 'both';
    existingPlayers: ExistingPlayerConflict[];
  }>({ isOpen: false, conflictType: 'mobile', existingPlayers: [] });

  const handleCancel = () => {
    setFirstName(initial.firstName);
    setLastName(initial.lastName);
    setMobile(initial.mobileNumber);
    setEmail(initial.email);
    setDob(initial.dob);
    setLocationId(initial.locationId);
    setFieldError(null);
    setConflictState({ isOpen: false, conflictType: 'mobile', existingPlayers: [] });
    setIsEditing(false);
  };

  const buildFormData = (allowDuplicate: boolean) => {
    const fd = new FormData();
    fd.set('firstName', firstName.trim());
    fd.set('lastName', lastName.trim());
    fd.set('mobileNumber', normalizeIndianMobile(mobile));
    fd.set('locationId', locationId);
    fd.set('email', email.trim());
    fd.set('dob', dob);
    if (allowDuplicate) fd.set('allowDuplicate', 'true');
    return fd;
  };

  const submit = (allowDuplicate: boolean) => {
    const mobileClean = normalizeIndianMobile(mobile);

    if (!allowDuplicate) {
      const validation = validateAdminPlayerData({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        mobileNumber: mobileClean,
        locationId,
        email: email.trim() || undefined,
        dob: dob || undefined,
      });
      if (!validation.isValid && validation.error) {
        setFieldError(validation.error);
        return;
      }
    }

    setFieldError(null);
    startTransition(async () => {
      const res = await updatePlayerAdmin(playerId, buildFormData(allowDuplicate));
      if (!res.success) {
        if (res.hasConflict) {
          setConflictState({
            isOpen: true,
            conflictType: res.conflictType,
            existingPlayers: res.existingPlayers,
          });
        } else {
          setFieldError(res.error);
          showSnackbar({ message: res.error, type: 'error' });
        }
      } else {
        showSnackbar({ message: `${res.playerName} updated successfully`, type: 'success' });
        setConflictState({ isOpen: false, conflictType: 'mobile', existingPlayers: [] });
        setIsEditing(false);
        router.refresh();
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit(false);
  };

  // ── Read-only view ──────────────────────────────────────────────────────────
  if (!isEditing) {
    return (
      <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-3.5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Player Details
          </h3>
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded-lg transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[15px]">edit</span>
            Edit
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-slate-400 font-medium block">First Name</span>
            <span className="text-slate-800 font-semibold mt-0.5 block">{initial.firstName}</span>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Last Name</span>
            <span className="text-slate-800 font-semibold mt-0.5 block">{initial.lastName}</span>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Mobile Number</span>
            <span className="text-slate-800 font-semibold mt-0.5 block">+91 {initial.mobileNumber}</span>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Email Address</span>
            <span className="text-slate-800 font-semibold mt-0.5 block truncate">
              {initial.email || <span className="text-slate-400 font-normal">Not Provided</span>}
            </span>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Date of Birth</span>
            <span className="text-slate-800 font-semibold mt-0.5 block">
              {initial.dob
                ? (() => {
                    const birth = new Date(initial.dob);
                    const now = new Date();
                    let age = now.getFullYear() - birth.getFullYear();
                    const m = now.getMonth() - birth.getMonth();
                    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
                    return `${birth.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} (${age} yrs)`;
                  })()
                : <span className="text-slate-400 font-normal">Not Provided</span>}
            </span>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Location / Branch</span>
            <span className="text-slate-800 font-semibold mt-0.5 block">
              {locations.find((l) => l.id === initial.locationId)?.name || 'Not Set'}
            </span>
          </div>
        </div>
      </section>
    );
  }

  // ── Edit form ───────────────────────────────────────────────────────────────
  return (
    <>
      <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Edit Player Details
          </h3>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isPending}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2.5 py-1 rounded-lg transition-all active:scale-95 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[15px]">close</span>
            Cancel
          </button>
        </div>

        {fieldError && (
          <div
            role="alert"
            className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2"
          >
            <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">error</span>
            <span>{fieldError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-700">First Name *</label>
              <input
                required
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Aarav"
                disabled={isPending}
                className="w-full h-11 px-3 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 outline-none disabled:opacity-50"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-700">Last Name *</label>
              <input
                required
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Sharma"
                disabled={isPending}
                className="w-full h-11 px-3 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 outline-none disabled:opacity-50"
              />
            </div>
          </div>

          {/* Mobile */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-700">Mobile Number *</label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-slate-500 font-medium text-sm select-none pointer-events-none">
                +91
              </span>
              <input
                required
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={mobile}
                onChange={(e) => setMobile(normalizeIndianMobile(e.target.value))}
                placeholder="9876543210"
                disabled={isPending}
                className="w-full h-11 pl-14 pr-4 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 outline-none disabled:opacity-50"
              />
            </div>
          </div>

          {/* Location */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-700">Location *</label>
            <select
              required
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              disabled={isPending}
              className="w-full h-11 px-3 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 outline-none cursor-pointer disabled:opacity-50"
            >
              <option value="" disabled>
                Select a location
              </option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Email (optional) */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-medium text-slate-700">Email Address</label>
              <span className="text-[11px] text-slate-400">Optional</span>
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="player@example.com"
              disabled={isPending}
              className="w-full h-11 px-3 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 outline-none disabled:opacity-50"
            />
          </div>

          {/* DOB (optional) */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-medium text-slate-700">Date of Birth</label>
              <span className="text-[11px] text-slate-400">Optional</span>
            </div>
            <DobInput value={dob} onChange={setDob} required={false} disabled={isPending} size="sm" />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full h-12 bg-slate-900 text-white rounded-xl font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Spinner size="sm" color="white" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">save</span>
                <span>Save Changes</span>
              </>
            )}
          </button>
        </form>
      </section>

      {/* Conflict Dialog */}
      {conflictState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 flex flex-col gap-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                <span className="material-symbols-outlined text-[22px]">warning</span>
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  {conflictState.conflictType === 'both'
                    ? 'Mobile & Email Already Exist'
                    : conflictState.conflictType === 'mobile'
                    ? 'Mobile Number Already Exists'
                    : 'Email Already Exists'}
                </h4>
                <span className="text-xs text-slate-500">Conflicts with another player on the roster</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {conflictState.conflictType === 'both'
                ? `Another player already has mobile +91 ${normalizeIndianMobile(mobile)} or email ${email.trim()}.`
                : conflictState.conflictType === 'mobile'
                ? `Another player is already registered with +91 ${normalizeIndianMobile(mobile)}.`
                : `Another player is already registered with email ${email.trim()}.`}
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 divide-y divide-slate-200/60 max-h-40 overflow-y-auto">
              {conflictState.existingPlayers.map((p) => (
                <div key={p.id} className="py-2 first:pt-0 last:pb-0 flex flex-col gap-0.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-900">
                      {p.first_name} {p.last_name}
                    </span>
                    <span className="text-[11px] text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                      {p.locationName}
                    </span>
                  </div>
                  <div className="flex gap-3 text-[11px] text-slate-500">
                    <span>+91 {p.mobile_number}</span>
                    {p.email && <span>• {p.email}</span>}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                disabled={isPending}
                onClick={() => submit(true)}
                className="w-full h-11 bg-slate-900 text-white rounded-xl font-semibold text-xs hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isPending ? <Spinner size="sm" color="white" /> : null}
                <span>Save Anyway</span>
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => setConflictState({ isOpen: false, conflictType: 'mobile', existingPlayers: [] })}
                className="w-full h-11 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-semibold text-xs active:scale-[0.98] transition-all flex items-center justify-center"
              >
                Change{' '}
                {conflictState.conflictType === 'both'
                  ? 'Mobile or Email'
                  : conflictState.conflictType === 'mobile'
                  ? 'Mobile Number'
                  : 'Email'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
