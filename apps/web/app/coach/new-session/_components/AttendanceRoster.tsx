'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/components/ui/Loading';

export type LocationBrief = { id: string; name: string };
export type PlayerBrief = { id: string; firstName: string; lastName: string };
export type PlayersByLocation = { locationId: string; locationName: string; players: PlayerBrief[] };

export default function AttendanceRoster({ 
  locations = [], 
  selectedLocationId = '', 
  playersByLocation, 
  sessionId,
  onSave 
}: { 
  locations?: LocationBrief[];
  selectedLocationId?: string;
  playersByLocation?: PlayersByLocation[]; 
  sessionId?: string;
  onSave?: (payload: any) => Promise<any>;
}) {
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
  const absentCount = Object.values(attendance).filter(v => v === 'A').length;
  const lateCount = Object.values(attendance).filter(v => v === 'L').length;

  // Marked count (Present, Absent, or Late)
  const markedCount = Object.values(attendance).filter(v => v === 'P' || v === 'A' || v === 'L').length;

  const total = filtered.length;
  // Remaining only considers students who are NOT marked present, absent, or late
  const remainingCount = Math.max(0, total - markedCount);

  // Late is considered as attended (Present + Late)
  const attendedCount = presentCount + lateCount;

  const isAllPresent = filtered.length > 0 && filtered.every(p => attendance[p.id] === 'P');
  const isAllAbsent = filtered.length > 0 && filtered.every(p => attendance[p.id] === 'A');

  function mark(id: string, val: 'P'|'A'|'L') {
    setAttendance(prev => ({ ...prev, [id]: prev[id] === val ? '' : val }));
  }

  function markAll(val: 'P' | 'A') {
    setAttendance(prev => {
      const updated = { ...prev };
      const isCurrentlyActive = val === 'P'
        ? (filtered.length > 0 && filtered.every(p => prev[p.id] === 'P'))
        : (filtered.length > 0 && filtered.every(p => prev[p.id] === 'A'));

      filtered.forEach(p => {
        updated[p.id] = isCurrentlyActive ? '' : val;
      });
      return updated;
    });
  }

  function initials(name: string) {
    return name.split(' ').map(s => s[0]).slice(0,2).join('').toUpperCase();
  }

  return (
    <div className="px-4 pt-4 pb-28 relative">
      {/* Location Selector Dropdown */}
      {locations.length > 0 && (
        <div className="mb-3 bg-white p-3 rounded-2xl border border-black/10 shadow-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-700">
            <span className="material-symbols-outlined text-slate-500">location_on</span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Location</span>
          </div>
          <select
            value={selectedLocationId}
            onChange={(e) => {
              const newLocId = e.target.value;
              setAttendance({});
              router.push(`/coach/new-session?locationId=${newLocId}`);
            }}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-black cursor-pointer"
          >
            {locations.map(loc => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="mb-3">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">person_search</span>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search player to mark attendance..." className="w-full h-12 pl-12 pr-4 bg-white border border-black/10 rounded-xl focus:ring-2 focus:ring-black outline-none" />
        </div>
      </div>

      {/* 3 Summary Cards: Present, Absent, Remaining */}
      <div className="grid grid-cols-3 gap-2.5 mb-3">
        <div className="bg-white p-3 rounded-2xl shadow-sm border border-black/10 flex flex-col justify-between h-24">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Attended</span>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-bold text-emerald-600">{attendedCount}</span>
            <span className="material-symbols-outlined text-emerald-600 opacity-20 text-2xl">check_circle</span>
          </div>
        </div>
        <div className="bg-white p-3 rounded-2xl shadow-sm border border-black/10 flex flex-col justify-between h-24">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Absent</span>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-bold text-red-500">{absentCount}</span>
            <span className="material-symbols-outlined text-red-500 opacity-20 text-2xl">cancel</span>
          </div>
        </div>
        <div className="bg-white p-3 rounded-2xl shadow-sm border border-black/10 flex flex-col justify-between h-24">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Remaining</span>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-bold text-slate-400">{remainingCount}</span>
            <span className="material-symbols-outlined text-slate-400 opacity-20 text-2xl">pending</span>
          </div>
        </div>
      </div>

      {/* Quick Actions Bar: Mark All Present / Mark All Absent with Active State Indicators */}
      <div className="flex items-center justify-between gap-2 mb-3 bg-white p-2.5 rounded-2xl border border-black/10 shadow-sm flex-wrap">
        <span className="text-xs font-semibold text-slate-600 pl-1">Mark All</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => markAll('P')}
            aria-label="Mark all filtered players present"
            aria-pressed={isAllPresent}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1 border ${
              isAllPresent
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            {isAllPresent ? 'All Present' : 'Present'}
          </button>
          <button
            type="button"
            onClick={() => markAll('A')}
            aria-label="Mark all filtered players absent"
            aria-pressed={isAllAbsent}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1 border ${
              isAllAbsent
                ? 'bg-red-600 text-white border-red-600 shadow-sm'
                : 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">cancel</span>
            {isAllAbsent ? 'All Absent' : 'Absent'}
          </button>
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
                <button
                  type="button"
                  title="Present"
                  aria-label={`Mark ${name} Present`}
                  aria-pressed={state === 'P'}
                  onClick={() => mark(p.id, 'P')}
                  className={`w-10 h-10 flex items-center justify-center rounded-lg transition-transform active:scale-95 ${state === 'P' ? 'bg-emerald-600 text-white shadow-sm font-bold' : 'text-slate-700 hover:bg-white font-bold'}`}
                >
                  <span>P</span>
                </button>
                <button
                  type="button"
                  title="Absent"
                  aria-label={`Mark ${name} Absent`}
                  aria-pressed={state === 'A'}
                  onClick={() => mark(p.id, 'A')}
                  className={`w-10 h-10 flex items-center justify-center rounded-lg transition-transform active:scale-95 ${state === 'A' ? 'bg-red-500 text-white shadow-sm font-bold' : 'text-slate-700 hover:bg-white font-bold'}`}
                >
                  <span>A</span>
                </button>
                <button
                  type="button"
                  title="Late"
                  aria-label={`Mark ${name} Late`}
                  aria-pressed={state === 'L'}
                  onClick={() => mark(p.id, 'L')}
                  className={`w-10 h-10 flex items-center justify-center rounded-lg transition-transform active:scale-95 ${state === 'L' ? 'bg-amber-500 text-white shadow-sm font-bold' : 'text-slate-700 hover:bg-white font-bold'}`}
                >
                  <span>L</span>
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
            <span className="text-sm font-medium">{attendedCount}/{players.length} Attended</span>
          </div>
          <button disabled={saving} onClick={async () => {
            if (saving) return;
            try {
              setSaving(true);
              if (onSave) {
                await onSave({ attendance, playersByLocation, sessionId });
              } else {
                const res = await fetch('/coach/new-session', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ attendance, playersByLocation, sessionId }),
                });
                if (!res.ok) {
                  const text = await res.text();
                  console.error('Save failed', text);
                  alert('Failed to save attendance');
                  setSaving(false);
                  return;
                }
              }
              router.push('/coach');
            } catch (e: any) {
              console.error(e);
              alert(e?.message ? `Failed to save attendance: ${e.message}` : 'Failed to save attendance');
              setSaving(false);
            }
          }} className="w-full h-14 bg-black text-white rounded-xl font-semibold text-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-sm disabled:opacity-50">
            {saving ? (
              <>
                <Spinner size="sm" color="white" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <span>Submit Attendance</span>
                <span className="material-symbols-outlined">send</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
