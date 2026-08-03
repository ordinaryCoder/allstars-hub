'use client';

import { useState, useMemo, useEffect, useRef } from 'react';

export interface LocationItem {
  id: string;
  name: string;
}

export interface WeeklyAttendanceRecord {
  player_id: string;
  marked_at: Date | string;
  session?: {
    location_id?: string;
  } | null;
}

export interface WeeklyAttendanceChartProps {
  locations: LocationItem[];
  locationPlayerCounts?: Record<string, number>;
  weeklyAttendances: WeeklyAttendanceRecord[];
  totalPlayers: number;
}

const LOCATION_THEMES = [
  { barColor: 'bg-emerald-500', dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700' },
  { barColor: 'bg-amber-500', dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700' },
  { barColor: 'bg-rose-500', dot: 'bg-rose-500', badge: 'bg-rose-50 text-rose-700' },
  { barColor: 'bg-cyan-500', dot: 'bg-cyan-500', badge: 'bg-cyan-50 text-cyan-700' },
  { barColor: 'bg-teal-500', dot: 'bg-teal-500', badge: 'bg-teal-50 text-teal-700' },
  { barColor: 'bg-violet-600', dot: 'bg-violet-600', badge: 'bg-violet-50 text-violet-700' },
];

const ALL_LOCATIONS_THEME = {
  barColor: 'bg-indigo-600',
  dot: 'bg-indigo-600',
  badge: 'bg-indigo-50 text-indigo-700',
};

export function WeeklyAttendanceChart({
  locations = [],
  locationPlayerCounts = {},
  weeklyAttendances = [],
  totalPlayers = 0
}: WeeklyAttendanceChartProps) {
  const [selectedLocationId, setSelectedLocationId] = useState('all');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeLocationIndex = locations.findIndex((l) => l.id === selectedLocationId);
  const activeTheme = selectedLocationId === 'all'
    ? ALL_LOCATIONS_THEME
    : LOCATION_THEMES[activeLocationIndex >= 0 ? activeLocationIndex % LOCATION_THEMES.length : 0];

  const chartData = useMemo(() => {
    // Determine active player count denominator based on location selection
    const targetTotalPlayers = selectedLocationId === 'all'
      ? totalPlayers
      : (locationPlayerCounts[selectedLocationId] || 0);

    // Filter attendances for selected location
    const filtered = selectedLocationId === 'all'
      ? weeklyAttendances
      : weeklyAttendances.filter((a) => a.session?.location_id === selectedLocationId);

    // Collect unique active student IDs per day of the week (0 = Mon, 6 = Sun)
    const dayPlayerSets: Set<string>[] = Array.from({ length: 7 }, () => new Set<string>());

    filtered.forEach((a) => {
      if (!a.marked_at) return;
      const date = new Date(a.marked_at);
      let day = date.getDay() - 1; // 0 = Mon, 6 = Sun
      if (day === -1) day = 6;
      if (day >= 0 && day < 7 && a.player_id) {
        dayPlayerSets[day].add(a.player_id);
      }
    });

    return dayPlayerSets.map((set) => {
      const count = set.size; // unique active students attending on this day
      const percent = targetTotalPlayers > 0 ? Math.round((count / targetTotalPlayers) * 100) : 0;
      return { count, percent: Math.min(percent, 100) };
    });
  }, [weeklyAttendances, selectedLocationId, totalPlayers, locationPlayerCounts]);

  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const selectedLocationName = selectedLocationId === 'all'
    ? 'All Locations'
    : locations.find((l) => l.id === selectedLocationId)?.name || 'Unknown Location';

  return (
    <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 relative">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Weekly Attendance Trend</h2>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`w-2 h-2 rounded-full ${activeTheme.dot}`}></span>
            <p className="text-xs font-medium text-slate-500">{selectedLocationName}</p>
          </div>
        </div>
        
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            aria-label="Select location filter"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-50 active:scale-95 transition-all text-slate-400 hover:text-slate-600"
          >
            <span className="material-symbols-outlined">more_horiz</span>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50 animate-in fade-in zoom-in duration-200">
              <button
                type="button"
                onClick={() => { setSelectedLocationId('all'); setDropdownOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors flex items-center gap-2 ${selectedLocationId === 'all' ? 'font-bold text-slate-900 bg-slate-50' : 'text-slate-600'}`}
              >
                <span className={`w-2 h-2 rounded-full ${ALL_LOCATIONS_THEME.dot}`}></span>
                <span>All Locations</span>
              </button>
              {locations.map((loc, idx) => {
                const locTheme = LOCATION_THEMES[idx % LOCATION_THEMES.length];
                return (
                  <button
                    type="button"
                    key={loc.id}
                    onClick={() => { setSelectedLocationId(loc.id); setDropdownOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors flex items-center gap-2 truncate ${selectedLocationId === loc.id ? 'font-bold text-slate-900 bg-slate-50' : 'text-slate-600'}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${locTheme.dot}`}></span>
                    <span className="truncate">{loc.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="relative h-44 px-2">
        {/* Grid Lines */}
        <div className="absolute inset-0 flex flex-col justify-between py-2 border-b border-slate-100">
          {[...Array(4)].map((_, i) => <div key={i} className="w-full border-t border-slate-50"></div>)}
        </div>
        {/* Bars Container */}
        <div className="relative z-20 flex items-end justify-between h-full pt-4 group/chart">
          {chartData.map((data, idx) => (
            <div key={idx} className="flex flex-col items-center gap-2 w-full group relative cursor-crosshair">
              <div className="w-3 bg-slate-100 rounded-full h-32 relative overflow-hidden">
                <div className={`absolute bottom-0 left-0 w-full rounded-full transition-all duration-500 ${activeTheme.barColor}`} style={{ height: `${data.percent}%` }}></div>
              </div>
              <span className="text-[10px] font-bold text-slate-400">{days[idx]}</span>
              <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bottom-full mb-1 bg-slate-800 text-white text-[10px] px-2 py-1 rounded shadow-lg pointer-events-none whitespace-nowrap z-50">
                {data.percent}% ({data.count})
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}