'use client';

import { useState, useActionState, useEffect } from 'react';
import Link from 'next/link';
import { login } from './_actions/action';
import { AuthLayoutContainer } from '@/components/auth/AuthLayoutContainer';
import { PasswordInput } from '@/components/auth/PasswordInput';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [shake, setShake] = useState(false);

  const [state, action, pending] = useActionState(login, undefined);

  useEffect(() => {
    if (state?.error) {
      setShake(true);
      const timer = setTimeout(() => setShake(false), 400);
      return () => clearTimeout(timer);
    }
  }, [state?.error]);

  return (
    <AuthLayoutContainer
      title="AllStars Attendance"
      subtitle="Log in to manage attendance and records"
      pending={pending}
    >
      <form action={action} className="flex flex-col gap-4">
        {state?.error && (
          <div
            role="alert"
            className={`p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl text-center font-medium ${
              shake ? 'animate-shake' : ''
            }`}
          >
            {state.error}
          </div>
        )}

        {/* Email Input */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-900" htmlFor="email">
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="coach@academy.com"
            aria-label="Email Address"
            disabled={pending}
            className="w-full h-14 px-4 bg-white border border-gray-300 rounded-xl text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all disabled:opacity-50 disabled:bg-gray-50"
          />
        </div>

        {/* Password Input */}
        <div className="mt-2">
          <PasswordInput
            id="password"
            name="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            disabled={pending}
          />
        </div>

        {/* Primary Login Button */}
        <button
          type="submit"
          disabled={pending}
          className="mt-6 w-full h-14 bg-black text-white rounded-xl font-semibold text-lg hover:opacity-90 hover:shadow-md active:scale-[0.98] transition-all flex items-center justify-center shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          Log In
        </button>

        <p className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link href="/signup" className="text-black font-semibold hover:underline">
            Sign Up
          </Link>
        </p>
      </form>
    </AuthLayoutContainer>
  );
}