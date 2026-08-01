import React from 'react';

/**
 * Reusable animated Skeleton shimmer element with optimized gradient animation
 */
export function Skeleton({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      style={style}
      className={`animate-pulse bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 rounded-xl ${className}`}
    />
  );
}

/**
 * Reusable animated Spinner component
 */
export function Spinner({
  size = 'md',
  color = 'black',
  className = '',
}: {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  color?: 'black' | 'white' | 'emerald' | 'indigo' | 'slate';
  className?: string;
}) {
  const sizeMap = {
    xs: 'w-3.5 h-3.5 border-2',
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  const colorMap = {
    black: 'border-slate-200 border-t-black',
    white: 'border-white/30 border-t-white',
    emerald: 'border-emerald-200 border-t-emerald-600',
    indigo: 'border-indigo-200 border-t-indigo-600',
    slate: 'border-slate-200 border-t-slate-600',
  };

  return (
    <div
      className={`rounded-full animate-spin ${sizeMap[size]} ${colorMap[color]} ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}

/**
 * Modular List Skeleton for internal container loading states
 */
export function ListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3 w-full">
            <Skeleton className="w-11 h-11 rounded-full flex-shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-36 rounded" />
              <Skeleton className="h-3 w-48 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Modular Card Skeleton for KPI or summary card loading states
 */
export function CardSkeleton({ count = 1 }: { count?: number }) {
  return (
    <div className="space-y-3 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-4 w-12 rounded" />
          </div>
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      ))}
    </div>
  );
}

/**
 * Central Full Page / App Loader overlay
 */
export function FullPageLoader({ message }: { message?: string }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col items-center gap-4 max-w-xs w-full text-center animate-in fade-in zoom-in-95 duration-200">
        <Spinner size="lg" color="black" />
        <div className="space-y-1">
          <p className="font-bold text-slate-900 text-base">{message || 'Loading...'}</p>
          <p className="text-xs text-slate-500">Please wait a moment</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Central Route & Page Skeleton Container matching application mobile layout
 */
export function PageSkeleton({
  hasHeader = true,
  headerTitle = '',
  cardCount = 1,
  listCount = 4,
}: {
  hasHeader?: boolean;
  headerTitle?: string;
  cardCount?: number;
  listCount?: number;
}) {
  return (
    <div className="bg-slate-50 text-slate-900 antialiased min-h-screen font-sans">
      <div className="max-w-[448px] mx-auto min-h-screen bg-slate-50 flex flex-col relative pb-28 border-x border-slate-200/50">
        {hasHeader && (
          <header className="flex items-center justify-between px-4 h-16 w-full sticky top-0 z-50 bg-white border-b border-slate-200">
            <div className="flex items-center gap-3">
              <Skeleton className="w-9 h-9 rounded-full" />
              {headerTitle ? (
                <span className="font-bold text-lg text-slate-900">{headerTitle}</span>
              ) : (
                <Skeleton className="h-5 w-32 rounded-lg" />
              )}
            </div>
            <Skeleton className="w-8 h-8 rounded-full" />
          </header>
        )}

        <main className="flex-1 px-4 py-6 space-y-4">
          <CardSkeleton count={cardCount} />
          <ListSkeleton count={listCount} />
        </main>
      </div>
    </div>
  );
}
