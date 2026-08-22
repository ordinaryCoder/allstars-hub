import React from 'react';
import Link from 'next/link';
import { AcademyLogo } from '@/components/icons';
import { Spinner } from '@/components/ui/Loading';

interface AuthLayoutContainerProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  pending?: boolean;
}

export function AuthLayoutContainer({
  title,
  subtitle,
  children,
  pending = false,
}: AuthLayoutContainerProps) {
  return (
    <div className="bg-gray-50 text-gray-900 antialiased min-h-screen flex flex-col items-center justify-center p-4 sm:p-8">
      {pending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm transition-all duration-300">
          <Spinner size="lg" color="black" />
        </div>
      )}

      {/* Top Area: Academy Logo Header */}
      <header className="w-full max-w-md mb-8 flex flex-col items-center justify-center text-center">
        <div className="mb-4 flex items-center justify-center">
          <AcademyLogo className="w-20 h-20" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="text-sm text-gray-600 mt-2">{subtitle}</p>
      </header>

      {/* Auth Container Card */}
      <main className="w-full max-w-md mx-auto bg-white shadow-xl border border-black/10 rounded-2xl p-6 sm:p-10">
        {children}
      </main>

      {/* Footer Support Link */}
      <footer className="mt-8 text-center">
        <p className="text-sm text-gray-600">
          Need help?{' '}
          <Link href="/contactus" className="text-black font-semibold hover:underline">
            Contact Support
          </Link>
        </p>
      </footer>
    </div>
  );
}
