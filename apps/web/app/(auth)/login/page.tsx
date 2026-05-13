'use client';

import { useState } from 'react';
import { createClient } from '../../../lib/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Using signInWithPassword to match the new password field in the UI
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) alert(error.message);
    else alert('Logged in successfully!');
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    });
    
    if (error) alert(error.message);
  };

  return (
    <div className="bg-app-bg text-on-surface antialiased min-h-screen flex flex-col items-center justify-center p-container-padding font-body-base">
      {/* Top Area: Academy Logo Placeholder */}
      <header className="w-full max-w-max-width mb-8 flex flex-col items-center justify-center text-center">
        <div className="h-12 w-12 bg-surface-variant rounded-full mb-4 flex items-center justify-center overflow-hidden">
          <span aria-hidden="true" className="material-symbols-outlined text-on-surface-variant">sports_score</span>
        </div>
        <h1 className="font-headline-xl text-headline-xl text-primary">Academy Attendance</h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">Log in to manage attendance and records</p>
      </header>

      {/* Auth Container */}
      <main className="w-full max-w-max-width bg-surface shadow-sm rounded-2xl p-6 sm:p-8">
        <form onSubmit={handleLogin} className="flex flex-col gap-stack-gap">
          {/* Email Input */}
          <div className="flex flex-col gap-1">
            <label className="font-label-md text-label-md text-on-surface" htmlFor="email">Email Address</label>
            <input 
              id="email" 
              name="email" 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="coach@academy.com" 
              aria-label="Email Address" 
              className="h-touch-target px-4 bg-surface-container-lowest border border-border-subtle rounded-lg font-body-base text-body-base text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow" 
            />
          </div>

          {/* Password Input */}
          <div className="flex flex-col gap-1 mt-2">
            <div className="flex justify-between items-center">
              <label className="font-label-md text-label-md text-on-surface" htmlFor="password">Password</label>
              <a href="#" className="font-label-sm text-label-sm text-secondary hover:text-primary transition-colors">Forgot?</a>
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
                className="w-full h-touch-target pl-4 pr-12 bg-surface-container-lowest border border-border-subtle rounded-lg font-body-base text-body-base text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow" 
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility" 
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-on-surface-variant hover:text-primary focus:outline-none"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showPassword ? 'visibility' : 'visibility_off'}
                </span>
              </button>
            </div>
          </div>

          {/* Primary Login Button */}
          <button type="submit" className="mt-6 w-full h-touch-target bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center shadow-sm">
            Log In
          </button>

          {/* Divider */}
          <div className="flex items-center my-4">
            <div className="flex-grow border-t border-border-subtle"></div>
            <span className="px-3 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Or</span>
            <div className="flex-grow border-t border-border-subtle"></div>
          </div>

          {/* Secondary SSO Button */}
          <button 
            type="button" 
            onClick={handleGoogleLogin}
            className="w-full h-touch-target bg-surface border border-border-subtle text-on-surface rounded-lg font-label-md text-label-md hover:bg-surface-container-low active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <svg aria-hidden="true" className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
            </svg>
            Continue with Google
          </button>
          
          <p className="mt-6 text-center font-body-sm text-body-sm text-on-surface-variant">
            Don't have an account? <a href="#" className="text-primary font-medium hover:underline">Sign Up</a>
          </p>
        </form>
      </main>

      {/* Footer Support Link */}
      <footer className="mt-8 text-center">
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Need help? <a href="#" className="text-primary font-medium hover:underline">Contact Support</a>
        </p>
      </footer>
    </div>
  );
}