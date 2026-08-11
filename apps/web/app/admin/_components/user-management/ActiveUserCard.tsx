'use client';

import type { User } from './types';
import { getPermissionsStr, getPrimaryRole } from './types';
import { Tooltip } from '@/components/ui/Tooltip';

interface ActiveUserCardProps {
  user: User;
  isAdmin?: boolean;
  onDeactivate?: (user: User) => void;
  onReactivate?: (user: User) => void;
  isInactive?: boolean;
}

export function ActiveUserCard({
  user,
  isAdmin = false,
  onDeactivate,
  onReactivate,
  isInactive = false,
}: ActiveUserCardProps) {
  const permStr = getPermissionsStr(user);
  const roleText = getPrimaryRole(user);

  return (
    <div
      className={`rounded-2xl p-4 border flex justify-between items-center transition-all animate-in fade-in duration-300 ${
        isInactive ? 'bg-slate-100/70 border-slate-200' : 'bg-slate-50 border-slate-200'
      }`}
    >
      <div className="flex gap-3 items-center w-full">
        {/* Avatar */}
        <div
          className={`w-12 h-12 rounded-full shadow-sm flex-shrink-0 flex items-center justify-center font-bold border uppercase ${
            isInactive
              ? 'bg-slate-200 text-slate-400 border-slate-300'
              : 'bg-white text-slate-400 border-slate-200'
          }`}
        >
          {user.first_name?.[0] || ''}
          {user.last_name?.[0] || ''}
        </div>

        {/* User Details */}
        <div className="flex-1 flex flex-col justify-center gap-0.5 min-w-0">
          <span className="text-[14px] font-semibold text-slate-900 truncate">
            {user.first_name} {user.last_name}
          </span>
          <span className="text-[13px] text-slate-500 truncate">{user.email}</span>
          <span className="text-[13px] text-slate-900">{user.mobile_number || 'N/A'}</span>
        </div>

        {/* Right Column: Role + Action */}
        <div className="flex flex-col items-end justify-center gap-1 flex-shrink-0 ml-2">
          {isAdmin ? (
            <div className="flex items-center gap-1 text-slate-900">
              <span
                className="material-symbols-outlined text-[13px]"
                style={{ fontVariationSettings: '"FILL" 1' }}
              >
                verified_user
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider">Admin</span>
            </div>
          ) : (
            <span
              className={`text-[12px] font-semibold ${
                isInactive ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              {roleText}
            </span>
          )}

          {/* Deactivation button — coaches only in this card */}
          {!isAdmin && onDeactivate && !isInactive && (
            <Tooltip content="Deactivate" position="left">
              <button
                type="button"
                onClick={() => onDeactivate(user)}
                aria-label={`Deactivate ${user.first_name || ''} ${user.last_name || ''}`}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all flex items-center justify-center group"
              >
                <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">
                  person_off
                </span>
              </button>
            </Tooltip>
          )}

          {/* Reactivation button */}
          {onReactivate && isInactive && (
            <Tooltip content="Reactivate" position="left">
              <button
                type="button"
                onClick={() => onReactivate(user)}
                aria-label={`Reactivate ${user.first_name || ''} ${user.last_name || ''}`}
                className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all flex items-center justify-center group"
              >
                <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">
                  person_add
                </span>
              </button>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
}
