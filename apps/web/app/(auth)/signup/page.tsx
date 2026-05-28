'use client';

import { useState } from 'react';
import { AcademyLogo, GoogleIcon, VisibilityIcon, VisibilityOffIcon } from '../../../components/ui/icons';

export default function SignupPage() {
  const [role, setRole] = useState('parent');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [dob, setDob] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSignup = async (e: any) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      console.log('Account creation triggered');
    } catch (err) {
      console.error(err);
    }
  };

  const handleGoogleSignup = async (e: any) => {
    e.preventDefault();
    // Handle Google signup here
  };

  return (
    <div className="bg-gray-50 text-gray-900 antialiased min-h-screen flex flex-col items-center justify-center p-4 sm:p-8">
      {/* Top Area: Academy Logo Placeholder */}
      <header className="w-full max-w-md mb-8 flex flex-col items-center justify-center text-center">
        <div className="h-12 w-12 bg-gray-200 rounded-full mb-4 flex items-center justify-center overflow-hidden">
          <AcademyLogo className="w-6 h-6 text-gray-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Elite Academy</h1>
        <p className="text-sm text-gray-600 mt-2">Join our sports community to track your progress and attendance.</p>
      </header>

      {/* Auth Container */}
      <main className="w-full max-w-md mx-auto bg-white shadow-xl border border-black/10 rounded-2xl p-6 sm:p-10">
        <form onSubmit={handleSignup} method="POST" className="flex flex-col gap-4">
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

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-900" htmlFor="firstName">First Name</label>
              <input id="firstName" name="firstName" type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" className="w-full h-12 px-4 bg-white border border-gray-300 rounded-xl text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-900" htmlFor="lastName">Last Name</label>
              <input id="lastName" name="lastName" type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" className="w-full h-12 px-4 bg-white border border-gray-300 rounded-xl text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-900" htmlFor="email">Email Address</label>
            <input id="email" name="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" className="w-full h-12 px-4 bg-white border border-gray-300 rounded-xl text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all" />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-900" htmlFor="mobileNumber">Mobile Number</label>
            <input id="mobileNumber" name="mobileNumber" type="tel" required value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} placeholder="+1 (555) 000-0000" className="w-full h-12 px-4 bg-white border border-gray-300 rounded-xl text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all" />
          </div>

          {role === 'player' && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-900" htmlFor="emergencyContact">Emergency Contact</label>
              <input id="emergencyContact" name="emergencyContact" type="tel" required value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} placeholder="+1 (555) 000-0000" className="w-full h-12 px-4 bg-white border border-gray-300 rounded-xl text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all" />
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-900" htmlFor="dob">Date of Birth</label>
            <input id="dob" name="dob" type="date" required value={dob} onChange={(e) => setDob(e.target.value)} className="w-full h-12 px-4 bg-white border border-gray-300 rounded-xl text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all" />
          </div>

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

          <div className="flex items-center my-4">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Or</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignup}
            className="w-full h-14 bg-white border border-gray-300 text-gray-900 rounded-xl font-semibold text-base hover:bg-gray-50 hover:shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-sm"
          >
            <GoogleIcon className="w-6 h-6" />
            Continue with Google
          </button>

          <p className="mt-4 text-center text-sm text-gray-600">
            Already have an account? <a href="/login" className="text-black font-semibold hover:underline">Log In</a>
          </p>
        </form>
      </main>
    </div>
  );
}