'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

export interface PlayerOption {
  id: string;
  first_name: string;
  last_name: string;
  is_active?: boolean;
}

interface PlayerSwitcherProps {
  players: PlayerOption[];
  selectedPlayerId: string;
}

export function PlayerSwitcher({ players, selectedPlayerId }: PlayerSwitcherProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  if (players.length <= 1) return null;

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('playerId', e.target.value);
    startTransition(() => {
      router.push(`/player?${params.toString()}`);
    });
  }

  return (
    <div
      className={`mx-4 mt-2 mb-1 transition-opacity duration-200 ${isPending ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}
    >
      <div className="relative w-full">
        {/* Label */}
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 px-1">
          Viewing player
        </p>

        {/* Dropdown */}
        <div className="relative">
          <select
            id="player-switcher"
            value={selectedPlayerId}
            onChange={handleChange}
            aria-label="Switch player"
            className="w-full h-12 pl-4 pr-10 appearance-none bg-white border border-slate-200 hover:border-slate-300 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none cursor-pointer shadow-sm transition-all"
          >
            {players.map((p) => (
              <option key={p.id} value={p.id} className="bg-white text-slate-900 py-1 font-medium">
                {p.first_name} {p.last_name}{p.is_active === false ? ' (Inactive)' : ''}
              </option>
            ))}
          </select>
          <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px] pointer-events-none">
            unfold_more
          </span>
        </div>
      </div>
    </div>
  );
}
