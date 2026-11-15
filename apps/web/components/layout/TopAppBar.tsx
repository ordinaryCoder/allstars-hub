'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ACADEMY_NAME } from '@/lib/constant';
import { signOut as defaultSignOut } from '@/app/(auth)/_actions/auth';

export interface TopAppBarProps {
  title?: string;
  backHref?: string;
  userName?: string;
  initials?: string;
  avatarUrl?: string;
  profileHref?: string;
  signOut?: () => Promise<void> | void;
  onSignOut?: () => void;
}

export function TopAppBar({
  title,
  backHref,
  userName,
  initials,
  avatarUrl,
  profileHref,
  signOut,
  onSignOut,
}: TopAppBarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname() || '';

  const handleSignOut = signOut || onSignOut || defaultSignOut;
  const displayName = userName || 'User';
  const displayInitials =
    initials || (displayName[0] ? displayName[0].toUpperCase() : 'U');

  // Resolve profile link if not explicitly provided
  let resolvedProfileHref = profileHref;
  if (!resolvedProfileHref) {
    if (pathname.startsWith('/admin')) {
      resolvedProfileHref = '/admin/profile';
    } else if (pathname.startsWith('/coach')) {
      resolvedProfileHref = '/coach/profile';
    } else {
      resolvedProfileHref = '/player/profile';
    }
  }

  // Resolve title if not explicitly provided
  let displayTitle = title;
  if (!displayTitle) {
    if (pathname.startsWith('/admin/pending-users')) {
      displayTitle = 'Pending User';
    } else if (pathname.startsWith('/admin/players')) {
      displayTitle = 'Player Details';
    } else if (pathname.startsWith('/admin/create-session')) {
      displayTitle = 'Schedule Session';
    } else if (pathname.startsWith('/admin/sessions/upcoming')) {
      displayTitle = 'Upcoming Sessions';
    } else if (pathname.startsWith('/admin/sessions/past')) {
      displayTitle = 'Past Sessions';
    } else if (pathname.startsWith('/admin/profile')) {
      displayTitle = 'Admin Profile';
    } else if (pathname.startsWith('/admin')) {
      displayTitle = 'Home';
    } else if (pathname.startsWith('/coach/player-list')) {
      displayTitle = 'Players';
    } else if (pathname.startsWith('/coach/attendance-report')) {
      displayTitle = 'Attendance Report';
    } else if (pathname.startsWith('/coach/new-session')) {
      displayTitle = 'New Session';
    } else if (pathname.startsWith('/coach/profile')) {
      displayTitle = 'Coach Profile';
    } else if (pathname.startsWith('/coach')) {
      displayTitle = 'Home';
    } else if (pathname.startsWith('/player/profile')) {
      displayTitle = 'Profile';
    } else if (pathname.startsWith('/player')) {
      displayTitle = 'Home';
    } else {
      displayTitle = ACADEMY_NAME;
    }
  }

  // Close dropdown on click outside or escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setDropdownOpen(false);
      }
    }

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [dropdownOpen]);

  return (
    <header className="flex justify-between items-center w-full px-4 h-16 sticky top-0 z-50 bg-white shadow-sm border-b border-slate-200">
      {/* Left side: Back arrow (if nested) + Page / Route name */}
      <div className="flex items-center gap-2.5 min-w-0 pr-2">
        {backHref && (
          <Link
            href={backHref}
            aria-label="Go back"
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95 flex items-center justify-center shrink-0 transition-all border border-slate-200/70"
          >
            <span className="material-symbols-outlined text-[20px]">
              arrow_back
            </span>
          </Link>
        )}
        <h1 className="font-bold text-lg text-slate-900 tracking-tight truncate">
          {displayTitle}
        </h1>
      </div>

      {/* Right side: Avatar with click dropdown */}
      <div className="relative shrink-0" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setDropdownOpen((prev) => !prev)}
          aria-expanded={dropdownOpen}
          aria-haspopup="true"
          aria-label="User account menu"
          className={`w-10 h-10 rounded-full overflow-hidden bg-slate-900 text-white border-2 flex items-center justify-center font-bold text-sm shrink-0 transition-all active:scale-95 cursor-pointer shadow-xs ${
            dropdownOpen
              ? 'border-slate-900 ring-2 ring-slate-900/20'
              : 'border-slate-200 hover:border-slate-400'
          }`}
        >
          {avatarUrl ? (
            <img
              className="w-full h-full object-cover"
              alt={`${displayName} portrait`}
              src={avatarUrl}
            />
          ) : (
            <span>{displayInitials}</span>
          )}
        </button>

        {/* Dropdown Menu */}
        {dropdownOpen && (
          <div className="absolute right-0 top-12 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-50 animate-in fade-in-50 zoom-in-95 duration-150 origin-top-right">
            {/* Identity info */}
            <div className="px-4 py-2.5 border-b border-slate-100 flex flex-col">
              <span className="text-xs font-bold text-slate-900 truncate capitalize">
                {displayName}
              </span>
              <span className="text-[10px] text-slate-400 font-medium truncate">
                {ACADEMY_NAME}
              </span>
            </div>

            {/* Option 1: Profile Details */}
            <Link
              href={resolvedProfileHref}
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px] text-slate-400">
                account_circle
              </span>
              <span>Profile Details</span>
            </Link>

            {/* Option 2: Logout */}
            <form action={handleSignOut} className="w-full">
              <button
                type="submit"
                onClick={() => setDropdownOpen(false)}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-left border-t border-slate-50"
              >
                <span className="material-symbols-outlined text-[18px] text-rose-500">
                  logout
                </span>
                <span>Logout</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </header>
  );
}
