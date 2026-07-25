'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

export type PlayerBrief = { id: string; firstName: string; lastName: string };
export type PlayersByLocation = { locationId: string; locationName: string; players: PlayerBrief[] };

export default function AttendanceRoster({ playersByLocation, onSave }: { playersByLocation?: PlayersByLocation[], onSave?: (payload: any) => Promise<any> }) {
  const [query, setQuery] = useState('');
  const [attendance, setAttendance] = useState<Record<string, 'P'|'A'|'L' | ''>>({});
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const players = useMemo(() => {
    if (!playersByLocation) return [] as (PlayerBrief & { locationName?: string })[];
    return playersByLocation.flatMap(loc => loc.players.map(p => ({ ...p, locationName: loc.locationName })));
  }, [playersByLocation]);

  const filtered = players.filter(p => `${p.firstName} ${p.lastName}`.toLowerCase().includes(query.toLowerCase()));

  const presentCount = Object.values(attendance).filter(v => v === 'P').length;
  const total = filtered.length;

  function mark(id: string, val: 'P'|'A'|'L') {
    setAttendance(prev => ({ ...prev, [id]: prev[id] === val ? '' : val }));
  }

  function initials(name: string) {
    return name.split(' ').map(s => s[0]).slice(0,2).join('').toUpperCase();
  }

  return (
    <div className="px-4 pt-4 pb-28">
      <div className="mb-3">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">person_search</span>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search player to mark attendance..." className="w-full h-12 pl-12 pr-4 bg-white border border-black/10 rounded-xl focus:ring-2 focus:ring-black outline-none" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-white p-3 rounded-2xl shadow-sm border border-black/10 flex flex-col justify-between h-24">
          <span className="text-xs text-slate-500 uppercase tracking-wider">Present</span>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-bold text-green-500">{presentCount}</span>
            <span className="material-symbols-outlined text-green-500 opacity-20 text-3xl">check_circle</span>
          </div>
        </div>
        <div className="bg-white p-3 rounded-2xl shadow-sm border border-black/10 flex flex-col justify-between h-24">
          <span className="text-xs text-slate-500 uppercase tracking-wider">Remaining</span>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-bold text-slate-400">{Math.max(0, total - presentCount)}</span>
            <span className="material-symbols-outlined text-slate-400 opacity-20 text-3xl">pending</span>
          </div>
        </div>
      </div>

      <main className="space-y-3">
        {filtered.map((p) => {
          const state = attendance[p.id] || '';
          const name = `${p.firstName} ${p.lastName}`;
          return (
            <div key={p.id} className="bg-white p-4 rounded-2xl shadow-sm border border-black/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold">{initials(name)}</div>
                <div>
                  <h3 className="text-sm font-medium text-slate-900">{name}</h3>
                  <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded uppercase">Player</span>
                </div>
              </div>
              <div className="flex gap-1.5 p-1 bg-slate-50 rounded-xl">
                <button onClick={() => mark(p.id, 'P')} className={`w-10 h-10 flex items-center justify-center rounded-lg transition-transform active:scale-95 ${state === 'P' ? 'bg-green-500 text-white shadow-sm' : 'text-slate-700 hover:bg-white'}`}>
                  <span className="font-bold">P</span>
                </button>
                <button onClick={() => mark(p.id, 'A')} className={`w-10 h-10 flex items-center justify-center rounded-lg transition-transform active:scale-95 ${state === 'A' ? 'bg-red-500 text-white shadow-sm' : 'text-slate-700 hover:bg-white'}`}>
                  <span className="font-bold">A</span>
                </button>
                <button onClick={() => mark(p.id, 'L')} className={`w-10 h-10 flex items-center justify-center rounded-lg transition-transform active:scale-95 ${state === 'L' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-700 hover:bg-white'}`}>
                  <span className="font-bold">L</span>
                </button>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center text-sm text-slate-500 p-6">No players found</div>
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 max-w-[448px] mx-auto bg-white border-t border-black/10 p-4 z-50">
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center px-1">
            <span className="text-sm text-slate-500">Session Summary</span>
            <span className="text-sm font-medium">{presentCount}/{players.length} Present</span>
          </div>
          <button disabled={saving} onClick={async () => {
            if (saving) return;
            try {
              setSaving(true);
              if (onSave) {
                await onSave({ attendance, playersByLocation });
              } else {
                const res = await fetch('/coach/new-session', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ attendance, playersByLocation }),
                });
                if (!res.ok) {
                  const text = await res.text();
                  console.error('Save failed', text);
                  alert('Failed to save attendance');
                  setSaving(false);
                  return;
                }
              }
              router.push('/coach/attendance-report');
            } catch (e) {
              console.error(e);
              alert('Failed to save attendance');
              setSaving(false);
            }
          }} className="w-full h-14 bg-black text-white rounded-xl font-semibold text-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-sm disabled:opacity-50">
            <span>{saving ? 'Saving...' : 'Submit Attendance'}</span>
            <span className="material-symbols-outlined">send</span>
          </button>
        </div>
      </div>
    </div>
  );
}
