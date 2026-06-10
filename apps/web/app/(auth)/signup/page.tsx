'use client';

import { useState, useEffect } from 'react';
import { signup, getLocations } from './action';
import { AcademyLogo, VisibilityIcon, VisibilityOffIcon } from '../../../components/ui/icons';
import { ACADEMY_NAME } from '@/lib/constant';
import { DobInput } from './DobInput';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const router = useRouter();
  const [role, setRole] = useState('parent');
  const [error, setError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [dob, setDob] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [locations, setLocations] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    getLocations().then(setLocations);
  }, []);

  const handleSignup = async (e: any) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    try {
      const res = await signup(formData);
      if (res?.error) {
        setError(res.error);
      } else if (res?.success) {
        router.push(`/pending?email=${encodeURIComponent(res.email!)}`);
      }
    } catch (err: any) {
      setError(err.message || 'Unable to complete signup');
    }
  };

  return (
    <div className="bg-gray-50 text-gray-900 antialiased min-h-screen flex flex-col items-center justify-center p-4 sm:p-8">
      {/* Top Area: Academy Logo Placeholder */}
      <header className="w-full max-w-md mb-8 flex flex-col items-center justify-center text-center">
        <div className="h-12 w-12 bg-gray-200 rounded-full mb-4 flex items-center justify-center overflow-hidden">
          <AcademyLogo className="w-6 h-6 text-gray-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{ACADEMY_NAME}</h1>
        <p className="text-sm text-gray-600 mt-2">Join our sports community to track your progress and attendance.</p>
      </header>

      {/* Auth Container */}
      <main className="w-full max-w-md mx-auto bg-white shadow-xl border border-black/10 rounded-2xl p-6 sm:p-10">
        <form onSubmit={handleSignup} method="POST" className="flex flex-col gap-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl text-center font-medium">
              {error}
            </div>
          )}
          {/* Role Selection */}
          <div className="flex flex-col gap-1.5 mb-2">
            <label className="text-sm font-medium text-gray-900">I am a...</label>
            <div className="flex gap-4 p-1 bg-gray-100 rounded-lg">
              <label className="flex-1 flex items-center justify-center gap-2 h-10 rounded-md cursor-pointer has-[:checked]:bg-white has-[:checked]:shadow-sm transition-all">
                <input
                  className="sr-only"
                  name="role"
                  type="radio"
                  value="parent"
                  checked={role === 'parent'}
                  onChange={(e) => setRole(e.target.value)}
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
                  onChange={(e) => setRole(e.target.value)}
                />
                <span className="text-sm font-medium text-gray-900">Player</span>
              </label>
            </div>
          </div>

          {role === 'parent' && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-900" htmlFor="guardianName">Guardian / Parent Name</label>
              <input id="guardianName" name="guardianName" type="text" required value={guardianName} onChange={(e) => setGuardianName(e.target.value)} placeholder="Guardian full name" className="w-full h-12 px-4 bg-white border border-gray-300 rounded-xl text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-900" htmlFor="firstName">
                {role === 'parent' ? 'Player First Name' : 'First Name'}
              </label>
              <input id="firstName" name="firstName" type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder={role === 'parent' ? 'Player first name' : 'First name'} className="w-full h-12 px-4 bg-white border border-gray-300 rounded-xl text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-900" htmlFor="lastName">
                {role === 'parent' ? 'Player Last Name' : 'Last Name'}
              </label>
              <input id="lastName" name="lastName" type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder={role === 'parent' ? 'Player last name' : 'Last name'} className="w-full h-12 px-4 bg-white border border-gray-300 rounded-xl text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-900" htmlFor="email">Email Address</label>
            <input id="email" name="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" className="w-full h-12 px-4 bg-white border border-gray-300 rounded-xl text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all" />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-900" htmlFor="mobileNumber">Mobile Number</label>
            <input id="mobileNumber" name="mobileNumber" type="tel" required value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} className="w-full h-12 px-4 bg-white border border-gray-300 rounded-xl text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all" />
          </div>

          {role === 'player' && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-900" htmlFor="emergencyContact">Emergency Contact Number</label>
              <input id="emergencyContact" name="emergencyContact" type="tel" required value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} className="w-full h-12 px-4 bg-white border border-gray-300 rounded-xl text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all" />
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-900" htmlFor="locationId">Location</label>
            <select id="locationId" name="locationId" required defaultValue="" className="w-full h-12 px-4 bg-white border border-gray-300 rounded-xl text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all">
              <option value="" disabled>Select a location</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>

          <DobInput
            id="dob"
            name="dob"
            label={role === 'parent' ? "Player's Date of Birth" : "Date of Birth"}
            value={dob}
            onChange={setDob}
            required
          />

          <div className="flex flex-col gap-1 mt-2">
            <label className="text-sm font-medium text-gray-900" htmlFor="password">Password</label>
            <div className="relative">
              <input id="password" name="password" type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full h-12 pl-4 pr-12 bg-white border border-gray-300 rounded-xl text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label="Toggle password visibility" className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-900 focus:outline-none">
                {showPassword ? <VisibilityIcon className="w-5 h-5" /> : <VisibilityOffIcon className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button type="submit" className="mt-4 w-full h-14 bg-black text-white rounded-xl font-semibold text-lg hover:opacity-90 hover:shadow-md active:scale-[0.98] transition-all flex items-center justify-center shadow-sm">
            Sign Up
          </button>

          <p className="mt-4 text-center text-sm text-gray-600">
            Already have an account? <a href="/login" className="text-black font-semibold hover:underline">Log In</a>
          </p>
        </form>
      </main>
    </div>
  );
}