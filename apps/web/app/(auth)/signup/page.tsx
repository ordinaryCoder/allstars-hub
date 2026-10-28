'use client';

import { useState, useEffect, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signup, getLocations } from './_actions/action';
import { ACADEMY_NAME } from '@/lib/constant';
import { DobInput } from '@/components/form/DobInput';
import { AuthLayoutContainer } from '@/components/auth/AuthLayoutContainer';
import { PasswordInput } from '@/components/auth/PasswordInput';
import {
  validateSignupData,
  normalizeIndianMobile,
  type SignupInputData,
} from '@/lib/validations/signup';
import type { LocationOption } from '@/types/auth';

export default function SignupPage() {
  const router = useRouter();
  const [role, setRole] = useState<'parent' | 'player'>('parent');
  const [error, setError] = useState<string | null>(null);
  const [duplicateModal, setDuplicateModal] = useState<{
    isOpen: boolean;
    message: string;
    conflictField?: 'email' | 'mobile' | 'both';
  }>({
    isOpen: false,
    message: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [locationId, setLocationId] = useState('');
  const [dob, setDob] = useState('');
  const [password, setPassword] = useState('');
  const [locations, setLocations] = useState<LocationOption[]>([]);

  useEffect(() => {
    let isMounted = true;
    getLocations().then((data) => {
      if (isMounted) {
        setLocations(data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSignup = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const inputData: SignupInputData = {
      email: email.trim().toLowerCase(),
      password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      mobileNumber: normalizeIndianMobile(mobileNumber),
      role,
      guardianName: guardianName.trim(),
      dob,
      locationId,
    };

    const validationResult = validateSignupData(inputData);
    if (!validationResult.isValid && validationResult.error) {
      setError(validationResult.error);
      return;
    }

    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set('firstName', inputData.firstName);
    formData.set('lastName', inputData.lastName);
    formData.set('guardianName', inputData.guardianName ?? '');
    formData.set('email', inputData.email);

    try {
      const res = await signup(formData);
      if (!res.success) {
        if (res.isDuplicate) {
          setDuplicateModal({
            isOpen: true,
            message: res.error,
            conflictField: res.conflictField,
          });
        } else {
          setError(res.error);
        }
        setIsLoading(false);
      } else {
        router.push(`/confirm-email?email=${encodeURIComponent(res.email)}`);
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Unable to complete signup'
      );
      setIsLoading(false);
    }
  };

  return (
    <AuthLayoutContainer
      title={ACADEMY_NAME}
      subtitle="Join our sports community to track your progress and attendance."
      pending={isLoading}
    >
      <form onSubmit={handleSignup} className="flex flex-col gap-4">
        {error && (
          <div
            role="alert"
            className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl text-center font-medium"
          >
            {error}
          </div>
        )}

        {/* Role Selection */}
        <div className="flex flex-col gap-1.5 mb-2">
          <span className="text-sm font-medium text-gray-900">I am a...</span>
          <div className="flex gap-4 p-1 bg-gray-100 rounded-lg">
            <label className="flex-1 flex items-center justify-center gap-2 h-10 rounded-md cursor-pointer has-[:checked]:bg-white has-[:checked]:shadow-sm transition-all">
              <input
                className="sr-only"
                name="role"
                type="radio"
                value="parent"
                checked={role === 'parent'}
                onChange={() => setRole('parent')}
              />
              <span className="text-sm font-medium text-gray-900">Parent</span>
            </label>
            <label className="flex-1 flex items-center justify-center gap-2 h-10 rounded-md cursor-pointer has-[:checked]:bg-white has-[:checked]:shadow-sm transition-all">
              <input
                className="sr-only"
                name="role"
                type="radio"
                value="player"
                checked={role === 'player'}
                onChange={() => setRole('player')}
              />
              <span className="text-sm font-medium text-gray-900">Player</span>
            </label>
          </div>
        </div>

        {role === 'parent' && (
          <div className="flex flex-col gap-1">
            <label
              className="text-sm font-medium text-gray-900"
              htmlFor="guardianName"
            >
              Guardian / Parent Name
            </label>
            <input
              id="guardianName"
              name="guardianName"
              type="text"
              required
              value={guardianName}
              onChange={(e) => setGuardianName(e.target.value)}
              placeholder="Guardian full name"
              disabled={isLoading}
              className="w-full h-12 px-4 bg-white border border-gray-300 rounded-xl text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all disabled:opacity-50"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label
              className="text-sm font-medium text-gray-900"
              htmlFor="firstName"
            >
              {role === 'parent' ? 'Player First Name' : 'First Name'}
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder={
                role === 'parent' ? 'Player first name' : 'First name'
              }
              disabled={isLoading}
              className="w-full h-12 px-4 bg-white border border-gray-300 rounded-xl text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all disabled:opacity-50"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label
              className="text-sm font-medium text-gray-900"
              htmlFor="lastName"
            >
              {role === 'parent' ? 'Player Last Name' : 'Last Name'}
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder={
                role === 'parent' ? 'Player last name' : 'Last name'
              }
              disabled={isLoading}
              className="w-full h-12 px-4 bg-white border border-gray-300 rounded-xl text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all disabled:opacity-50"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label
            className="text-sm font-medium text-gray-900"
            htmlFor="email"
          >
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            disabled={isLoading}
            className="w-full h-12 px-4 bg-white border border-gray-300 rounded-xl text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all disabled:opacity-50"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label
            className="text-sm font-medium text-gray-900"
            htmlFor="mobileNumber"
          >
            Mobile Number
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center px-3 border-r border-gray-300 text-sm font-medium text-gray-600 bg-gray-50 rounded-l-xl">
              +91
            </div>
            <input
              id="mobileNumber"
              name="mobileNumber"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              required
              value={mobileNumber}
              onChange={(e) =>
                setMobileNumber(normalizeIndianMobile(e.target.value))
              }
              placeholder="9876543210"
              disabled={isLoading}
              className="w-full h-12 pl-16 pr-4 bg-white border border-gray-300 rounded-xl text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all disabled:opacity-50"
            />
          </div>
          <p className="text-xs text-gray-500">
            Enter only the 10-digit Indian mobile number.
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <label
            className="text-sm font-medium text-gray-900"
            htmlFor="locationId"
          >
            Location
          </label>
          <select
            id="locationId"
            name="locationId"
            required
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            disabled={isLoading}
            className="w-full h-12 px-4 bg-white border border-gray-300 rounded-xl text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all disabled:opacity-50 cursor-pointer"
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

        <DobInput
          id="dob"
          name="dob"
          label={
            role === 'parent' ? "Player's Date of Birth" : 'Date of Birth'
          }
          value={dob}
          onChange={setDob}
          required
          disabled={isLoading}
        />
        <p className="-mt-1 text-xs text-gray-500">
          Minimum age must be 6 years.
        </p>

        <div className="mt-2">
          <PasswordInput
            id="password"
            name="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            disabled={isLoading}
            autoComplete="new-password"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="mt-4 w-full h-14 bg-black text-white rounded-xl font-semibold text-lg hover:opacity-90 hover:shadow-md active:scale-[0.98] transition-all flex items-center justify-center shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? 'Signing Up...' : 'Sign Up'}
        </button>

        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="text-black font-semibold hover:underline">
            Log In
          </Link>
        </p>
      </form>

      {/* Duplicate Account Modal Popup */}
      {duplicateModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 flex flex-col gap-5 text-center relative animate-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setDuplicateModal({ isOpen: false, message: '' })}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
              aria-label="Close modal"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            {/* Warning / Support Icon */}
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-sm mt-1">
              <span className="material-symbols-outlined text-[30px]">contact_support</span>
            </div>

            {/* Title & Description */}
            <div className="flex flex-col gap-2">
              <h3 className="text-xl font-bold text-slate-900">
                {duplicateModal.conflictField === 'email'
                  ? 'Email Already Registered'
                  : duplicateModal.conflictField === 'mobile'
                  ? 'Mobile Number Already Registered'
                  : 'Account Already Exists'}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {duplicateModal.message}
              </p>
            </div>

            {/* Support Callout Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left flex items-start gap-3">
              <span className="material-symbols-outlined text-[20px] text-slate-700 shrink-0 mt-0.5">help_outline</span>
              <p className="text-xs text-slate-600 leading-relaxed">
                If this is your account, please sign in. If you need assistance linking another family member or resetting access, contact academy support.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2.5 pt-1">
              <Link
                href="/contactus"
                className="w-full h-12 bg-slate-900 text-white rounded-xl font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">support_agent</span>
                <span>Contact Support</span>
              </Link>
              <Link
                href="/login"
                className="w-full h-12 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-semibold text-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">login</span>
                <span>Go to Log In</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </AuthLayoutContainer>
  );
}
