'use client';

import type { PlayerRecord } from './types';
import { Tooltip } from '@/components/ui/Tooltip';

interface PlayerRecordCardProps {
  player: PlayerRecord;
  onDeactivate?: (player: PlayerRecord) => void;
  onReactivate?: (player: PlayerRecord) => void;
  isInactive?: boolean;
}

function formatAge(dob?: Date | string | null): string {
  if (!dob) return '';
  const birth = new Date(dob);
  const now = new Date();
  const age =
    now.getFullYear() -
    birth.getFullYear() -
    (now < new Date(now.getFullYear(), birth.getMonth(), birth.getDate()) ? 1 : 0);
  return `${age} yrs`;
}

export function PlayerRecordCard({
  player,
  onDeactivate,
  onReactivate,
  isInactive = false,
}: PlayerRecordCardProps) {
  const initials =
    `${player.first_name[0] ?? ''}${player.last_name[0] ?? ''}`.toUpperCase();

  // Determine account linkage label
  const hasParents = (player.parent_accounts?.length ?? 0) > 0;
  const hasSelfLogin = !!player.linked_user;
  const parentNames = player.parent_accounts?.map(
    (p) => `${p.first_name} ${p.last_name}`,
  );

  let linkageLabel: string | null = null;
  if (hasSelfLogin && player.linked_user) {
    linkageLabel = `${player.linked_user.first_name} ${player.linked_user.last_name}`;
  } else if (hasParents && parentNames) {
    linkageLabel = parentNames.join(', ');
  }

  const linkageIcon = hasSelfLogin ? 'person' : hasParents ? 'family_restroom' : null;

  return (
    <div
      className={`rounded-2xl border flex justify-between items-center p-4 transition-all animate-in fade-in duration-300 ${
        isInactive
          ? 'bg-slate-100/70 border-slate-200'
          : 'bg-slate-50 border-slate-200'
      }`}
    >
      {/* Avatar */}
      <div
        className={`w-11 h-11 rounded-full shadow-sm flex-shrink-0 flex items-center justify-center font-bold border text-sm uppercase mr-3 ${
          isInactive
            ? 'bg-slate-200 text-slate-400 border-slate-300'
            : 'bg-white text-slate-500 border-slate-200'
        }`}
      >
        {initials}
      </div>

      {/* Main info */}
      <div className="flex-1 flex flex-col justify-center gap-0.5 min-w-0">
        <span className="text-[14px] font-semibold text-slate-900 truncate">
          {player.first_name} {player.last_name}
        </span>

        {/* Location pill + age */}
        <div className="flex items-center gap-2 flex-wrap">
          {player.location?.name && (
            <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-slate-500">
              <span className="material-symbols-outlined text-[13px] text-slate-400">
                location_on
              </span>
              {player.location.name}
            </span>
          )}
          {player.dob && (
            <span className="text-[11px] font-medium text-slate-400">
              · {formatAge(player.dob)}
            </span>
          )}
        </div>

        {/* Account linkage (parent / self-login) */}
        {linkageLabel && linkageIcon && (
          <div className="flex items-center gap-1 mt-0.5">
            <span className="material-symbols-outlined text-[13px] text-slate-300">
              {linkageIcon}
            </span>
            <span
              className="text-[11px] text-slate-400 truncate"
              title={linkageLabel}
            >
              {linkageLabel}
            </span>
          </div>
        )}
      </div>

      {/* Right actions */}
      <div className="flex flex-col items-end justify-center gap-1 flex-shrink-0 ml-3">
        {/* No-account badge */}
        {!hasSelfLogin && !hasParents && (
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            No account
          </span>
        )}

        {onDeactivate && !isInactive && (
          <Tooltip content="Deactivate Player" position="left">
            <button
              type="button"
              onClick={() => onDeactivate(player)}
              aria-label={`Deactivate ${player.first_name} ${player.last_name}`}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all flex items-center justify-center group"
            >
              <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">
                person_off
              </span>
            </button>
          </Tooltip>
        )}

        {onReactivate && isInactive && (
          <Tooltip content="Reactivate Player" position="left">
            <button
              type="button"
              onClick={() => onReactivate(player)}
              aria-label={`Reactivate ${player.first_name} ${player.last_name}`}
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
  );
}
