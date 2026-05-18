'use client';

import { useState } from 'react';
import { createClient } from '../../../lib/client';
import { AcademyLogo, GoogleIcon, VisibilityIcon, VisibilityOffIcon } from '../../../components/ui/icons';
import { login } from './action';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  // const supabase = createClient();

  const handleLogin = async (e: any) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget); // Get data
    try {
      await login(formData); // Async work here
    } catch (err) {
      console.error(err);
    }
  };

  const handleGoogleLogin = async (e: any) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget); // Get data
    try {
      await login(formData); // Async work here
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-gray-50 text-gray-900 antialiased min-h-screen flex flex-col items-center justify-center p-4 sm:p-8">
      {/* Top Area: Academy Logo Placeholder */}
      <header className="w-full max-w-md mb-8 flex flex-col items-center justify-center text-center">
        <div className="h-12 w-12 bg-gray-200 rounded-full mb-4 flex items-center justify-center overflow-hidden">
          <AcademyLogo className="w-6 h-6 text-gray-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Academy Attendance</h1>
        <p className="text-sm text-gray-600 mt-2">Log in to manage attendance and records</p>
      </header>

      {/* Auth Container */}
      <main className="w-full max-w-md mx-auto bg-white shadow-xl border border-black/10 rounded-2xl p-6 sm:p-10">
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          {/* Email Input */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-900" htmlFor="email">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="coach@academy.com"
              aria-label="Email Address"
              className="w-full h-14 px-4 bg-white border border-gray-300 rounded-xl text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
            />
          </div>

          {/* Password Input */}
          <div className="flex flex-col gap-1 mt-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-gray-900" htmlFor="password">Password</label>
              <a href="#" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Forgot?</a>
            </div>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                aria-label="Password"
                className="w-full h-14 pl-4 pr-12 bg-white border border-gray-300 rounded-xl text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center text-gray-500 hover:text-gray-900 focus:outline-none"
              >
                {showPassword ? <VisibilityIcon className="w-5 h-5" /> : <VisibilityOffIcon className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Primary Login Button */}
          <button type="submit" className="mt-6 w-full h-14 bg-black text-white rounded-xl font-semibold text-lg hover:opacity-90 hover:shadow-md active:scale-[0.98] transition-all flex items-center justify-center shadow-sm">
            Log In
          </button>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Or</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          {/* Secondary SSO Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full h-14 bg-white border border-gray-300 text-gray-900 rounded-xl font-semibold text-base hover:bg-gray-50 hover:shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-sm"
          >
            <GoogleIcon className="w-6 h-6" />
            Continue with Google
          </button>

          <p className="mt-6 text-center text-sm text-gray-600">
            Don't have an account? <a href="#" className="text-black font-semibold hover:underline">Sign Up</a>
          </p>
        </form>
      </main>

      {/* Footer Support Link */}
      <footer className="mt-8 text-center">
        <p className="text-sm text-gray-600">
          Need help? <a href="#" className="text-black font-semibold hover:underline">Contact Support</a>
        </p>
      </footer>
    </div>
  );
}