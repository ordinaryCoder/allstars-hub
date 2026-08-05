'use client';

import { useState, useTransition } from 'react';
import { addCoachAdmin } from '@/app/admin/_actions/action';
import { useSnackbar } from '@/components/ui/Snackbar';
import { Spinner } from '@/components/ui/Loading';
import {
  validateCoachData,
  normalizeIndianMobile,
  type CoachInputData,
} from '@/lib/validations/signup';
import {
  DEFAULT_PRESET_PASSWORD,
  generateRandomPassword,
} from '@/lib/constants/auth';
import type { CreatedCredentials } from './CredentialSuccessModal';
import type { LocationOption } from './AddPlayerModal';

interface AddCoachModalProps {
  locations: LocationOption[];
  onSuccess: (credentials: CreatedCredentials) => void;
}

export function AddCoachModal({ locations, onSuccess }: AddCoachModalProps) {
  const [coachFirstName, setCoachFirstName] = useState('');
  const [coachLastName, setCoachLastName] = useState('');
  const [coachEmail, setCoachEmail] = useState('');
  const [coachMobile, setCoachMobile] = useState('');
  const [coachLocationId, setCoachLocationId] = useState('');

  const [customPassword, setCustomPassword] = useState(DEFAULT_PRESET_PASSWORD);
  const [showPasswordText, setShowPasswordText] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();
  const { showSnackbar } = useSnackbar();

  const handleCoachSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const coachData: CoachInputData = {
      firstName: coachFirstName.trim(),
      lastName: coachLastName.trim(),
      email: coachEmail.trim().toLowerCase(),
      mobileNumber: normalizeIndianMobile(coachMobile),
      locationId: coachLocationId,
    };

    const validation = validateCoachData(coachData);
    if (!validation.isValid && validation.error) {
      setError(validation.error);
      return;
    }

    const formData = new FormData(e.currentTarget);
    formData.set('email', coachData.email);
    formData.set('firstName', coachData.firstName);
    formData.set('lastName', coachData.lastName);
    formData.set('mobileNumber', coachData.mobileNumber);
    formData.set('locationId', coachData.locationId);
    formData.set('password', customPassword.trim() || DEFAULT_PRESET_PASSWORD);

    startTransition(async () => {
      const res = await addCoachAdmin(formData);
      if (!res.success) {
        setError(res.error);
        showSnackbar({ message: res.error, type: 'error' });
      } else {
        onSuccess({
          name: `${coachFirstName} ${coachLastName}`,
          email: res.email,
          role: 'Coach',
          passwordUsed: res.passwordUsed,
        });
        showSnackbar({
          message: 'Coach added directly into public database (Active).',
          type: 'success',
        });
      }
    });
  };

  return (
    <>
      <h3 className="text-xl font-bold text-slate-900 mb-4">Add New Coach</h3>

      {error && (
        <div
          role="alert"
          className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2 animate-in fade-in-50"
        >
          <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">error</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleCoachSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-900">First Name</label>
            <input
              required
              name="firstName"
              type="text"
              value={coachFirstName}
              onChange={(e) => setCoachFirstName(e.target.value)}
              placeholder="Vikram"
              className="w-full h-12 px-4 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-900">Last Name</label>
            <input
              required
              name="lastName"
              type="text"
              value={coachLastName}
              onChange={(e) => setCoachLastName(e.target.value)}
              placeholder="Singh"
              className="w-full h-12 px-4 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 outline-none"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-900">Email Address</label>
          <input
            required
            name="email"
            type="email"
            value={coachEmail}
            onChange={(e) => setCoachEmail(e.target.value)}
            placeholder="coach@example.com"
            className="w-full h-12 px-4 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 outline-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-900">Mobile Number</label>
          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-slate-500 font-medium text-sm select-none pointer-events-none">
              +91
            </span>
            <input
              name="mobileNumber"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              required
              value={coachMobile}
              onChange={(e) => setCoachMobile(normalizeIndianMobile(e.target.value))}
              placeholder="9876543210"
              className="w-full h-12 pl-14 pr-4 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 outline-none"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-900">Location</label>
          <select
            required
            name="locationId"
            value={coachLocationId}
            onChange={(e) => setCoachLocationId(e.target.value)}
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

        {/* Editable Password Field */}
        <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-100">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-slate-900">Account Password</label>
            <button
              type="button"
              onClick={() => setCustomPassword(generateRandomPassword())}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px]">casino</span>
              <span>Generate Random</span>
            </button>
          </div>

          <div className="relative flex items-center">
            <input
              required
              name="password"
              type={showPasswordText ? 'text' : 'password'}
              value={customPassword}
              onChange={(e) => setCustomPassword(e.target.value)}
              placeholder={DEFAULT_PRESET_PASSWORD}
              className="w-full h-12 pl-4 pr-10 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 outline-none font-mono"
            />
            <button
              type="button"
              onClick={() => setShowPasswordText(!showPasswordText)}
              className="absolute right-3 text-slate-400 hover:text-slate-600 p-1"
            >
              <span className="material-symbols-outlined text-[18px]">
                {showPasswordText ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>
          <p className="text-[11px] text-slate-500">
            Defaulted to{' '}
            <code className="bg-slate-100 px-1 py-0.5 rounded font-bold text-slate-800">
              {DEFAULT_PRESET_PASSWORD}
            </code>
            . You can edit it manually or click Generate Random.
          </p>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="mt-2 w-full h-14 bg-slate-900 text-white rounded-xl font-semibold hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isPending ? (
            <>
              <Spinner size="sm" color="white" />
              <span>Creating...</span>
            </>
          ) : (
            <span>Create Coach</span>
          )}
        </button>
      </form>
    </>
  );
}
