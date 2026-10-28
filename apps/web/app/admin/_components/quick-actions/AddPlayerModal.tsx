'use client';

import { useState, useTransition } from 'react';
import { addPlayerAdmin } from '@/app/admin/_actions/action';
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

    startTransition(async () => {
      const res = await addPlayerAdmin(formData);
      if (!res.success) {
        setError(res.error);
        showSnackbar({ message: res.error, type: 'error' });
      } else {
        showSnackbar({
          message: `Player ${res.playerName} added successfully`,
          type: 'success',
        });
        onSuccess?.();
        onClose?.();
      }
    });
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
    </>
  );
}
