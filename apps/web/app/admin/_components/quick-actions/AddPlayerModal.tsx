'use client';

import { useState, useTransition } from 'react';
import { addPlayerAdmin, type ExistingPlayerConflict } from '@/app/admin/_actions/action';
import { DobInput } from '@/components/form/DobInput';
import { useSnackbar } from '@/components/ui/Snackbar';
import { Spinner } from '@/components/ui/Loading';
import {
  validateAdminPlayerData,
  normalizeIndianMobile,
} from '@/lib/validations/signup';

export interface LocationOption {
  id: string;
  name: string;
}

interface AddPlayerModalProps {
  locations: LocationOption[];
  onClose?: () => void;
  onSuccess?: () => void;
}

export function AddPlayerModal({ locations, onClose, onSuccess }: AddPlayerModalProps) {
  const [playerFirstName, setPlayerFirstName] = useState('');
  const [playerLastName, setPlayerLastName] = useState('');
  const [playerMobile, setPlayerMobile] = useState('');
  const [playerLocationId, setPlayerLocationId] = useState('');
  const [playerEmail, setPlayerEmail] = useState('');
  const [dob, setDob] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { showSnackbar } = useSnackbar();

  // Conflict modal state when phone or email already exists in players table
  const [conflictState, setConflictState] = useState<{
    isOpen: boolean;
    conflictType: 'mobile' | 'email' | 'both';
    existingPlayers: ExistingPlayerConflict[];
  }>({
    isOpen: false,
    conflictType: 'mobile',
    existingPlayers: [],
  });

  const handlePlayerSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const mobileClean = normalizeIndianMobile(playerMobile);
    const validation = validateAdminPlayerData({
      firstName: playerFirstName.trim(),
      lastName: playerLastName.trim(),
      mobileNumber: mobileClean,
      locationId: playerLocationId,
      email: playerEmail.trim() || undefined,
      dob: dob,
    });

    if (!validation.isValid && validation.error) {
      setError(validation.error);
      return;
    }

    const formData = new FormData(e.currentTarget);
    formData.set('firstName', playerFirstName.trim());
    formData.set('lastName', playerLastName.trim());
    formData.set('mobileNumber', mobileClean);
    formData.set('locationId', playerLocationId);
    formData.set('email', playerEmail.trim());
    formData.set('dob', dob);

    submitPlayer(formData, false);
  };

  const submitPlayer = (formData: FormData, allowDuplicate: boolean) => {
    if (allowDuplicate) {
      formData.set('allowDuplicate', 'true');
    }

    startTransition(async () => {
      const res = await addPlayerAdmin(formData);
      if (!res.success) {
        if (res.hasConflict) {
          setConflictState({
            isOpen: true,
            conflictType: res.conflictType,
            existingPlayers: res.existingPlayers,
          });
        } else {
          setError(res.error);
          showSnackbar({ message: res.error, type: 'error' });
        }
      } else {
        showSnackbar({
          message: `Player ${res.playerName} added successfully`,
          type: 'success',
        });
        setConflictState({ isOpen: false, conflictType: 'mobile', existingPlayers: [] });
        onSuccess?.();
        onClose?.();
      }
    });
  };

  const handleCreateDuplicateRecord = () => {
    const formData = new FormData();
    formData.set('firstName', playerFirstName.trim());
    formData.set('lastName', playerLastName.trim());
    formData.set('mobileNumber', normalizeIndianMobile(playerMobile));
    formData.set('locationId', playerLocationId);
    formData.set('email', playerEmail.trim());
    formData.set('dob', dob);
    submitPlayer(formData, true);
  };

  return (
    <>
      <h3 className="text-xl font-bold text-slate-900 mb-4">Add New Player</h3>

      {error && (
        <div
          role="alert"
          className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2 animate-in fade-in-50"
        >
          <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">error</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handlePlayerSubmit} className="space-y-4">
        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-900">First Name *</label>
            <input
              required
              name="firstName"
              type="text"
              value={playerFirstName}
              onChange={(e) => setPlayerFirstName(e.target.value)}
              placeholder="Aarav"
              className="w-full h-12 px-4 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-900">Last Name *</label>
            <input
              required
              name="lastName"
              type="text"
              value={playerLastName}
              onChange={(e) => setPlayerLastName(e.target.value)}
              placeholder="Sharma"
              className="w-full h-12 px-4 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 outline-none"
            />
          </div>
        </div>

        {/* Mobile Number Field */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-900">Mobile Number *</label>
          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-slate-500 font-medium text-sm select-none pointer-events-none">
              +91
            </span>
            <input
              required
              name="mobileNumber"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={playerMobile}
              onChange={(e) => setPlayerMobile(normalizeIndianMobile(e.target.value))}
              placeholder="9876543210"
              className="w-full h-12 pl-14 pr-4 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 outline-none"
            />
          </div>
          <span className="text-[11px] text-slate-500">
            Primary 10-digit phone used for roster contact and future account linking.
          </span>
        </div>

        {/* Location Dropdown */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-900">Location *</label>
          <select
            required
            name="locationId"
            value={playerLocationId}
            onChange={(e) => setPlayerLocationId(e.target.value)}
            className="w-full h-12 px-4 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 outline-none cursor-pointer"
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

        {/* Email Field (Optional) */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-slate-900">Email Address</label>
            <span className="text-xs text-slate-400">Optional</span>
          </div>
          <input
            name="email"
            type="email"
            value={playerEmail}
            onChange={(e) => setPlayerEmail(e.target.value)}
            placeholder="player@example.com"
            className="w-full h-12 px-4 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 outline-none"
          />
        </div>

        {/* Date of Birth Field (Required) */}
        <div className="flex flex-col gap-1">
          <DobInput
            value={dob}
            onChange={setDob}
            label="Date of Birth"
            required={true}
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="mt-2 w-full h-14 bg-slate-900 text-white rounded-xl font-semibold hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isPending ? (
            <>
              <Spinner size="sm" color="white" />
              <span>Adding Player...</span>
            </>
          ) : (
            <span>Add Player to Roster</span>
          )}
        </button>
      </form>

      {/* Duplicate Player Conflict Dialog */}
      {conflictState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 flex flex-col gap-4 relative animate-in zoom-in-95 duration-200">
            {/* Header Badge */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                <span className="material-symbols-outlined text-[22px]">warning</span>
              </div>
              <div className="flex flex-col">
                <h4 className="text-base font-bold text-slate-900">
                  {conflictState.conflictType === 'both'
                    ? 'Mobile & Email Already Exist'
                    : conflictState.conflictType === 'mobile'
                    ? 'Mobile Number Already Exists'
                    : 'Email Already Exists'}
                </h4>
                <span className="text-xs text-slate-500">Player roster match detected</span>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs text-slate-600 leading-relaxed">
              {conflictState.conflictType === 'both'
                ? `A player with mobile +91 ${normalizeIndianMobile(playerMobile)} or email ${playerEmail.trim()} is already on the roster:`
                : conflictState.conflictType === 'mobile'
                ? `A player with mobile number +91 ${normalizeIndianMobile(playerMobile)} is already registered in the academy:`
                : `A player with email ${playerEmail.trim()} is already registered in the academy:`}
            </p>

            {/* Existing Matching Players List */}
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

            <p className="text-[11px] text-slate-500">
              You can create a separate player record sharing this {conflictState.conflictType === 'both' ? 'contact info' : conflictState.conflictType} (e.g. sibling), or go back to change the {conflictState.conflictType === 'both' ? 'mobile number or email' : conflictState.conflictType === 'mobile' ? 'mobile number' : 'email'}.
            </p>

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                disabled={isPending}
                onClick={handleCreateDuplicateRecord}
                className="w-full h-11 bg-slate-900 text-white rounded-xl font-semibold text-xs hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isPending ? <Spinner size="sm" color="white" /> : null}
                <span>Create Separate Record (Same {conflictState.conflictType === 'both' ? 'Contact' : conflictState.conflictType === 'mobile' ? 'Mobile' : 'Email'})</span>
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => setConflictState({ isOpen: false, conflictType: 'mobile', existingPlayers: [] })}
                className="w-full h-11 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-semibold text-xs active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer"
              >
                Change {conflictState.conflictType === 'both' ? 'Mobile or Email' : conflictState.conflictType === 'mobile' ? 'Mobile Number' : 'Email'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
