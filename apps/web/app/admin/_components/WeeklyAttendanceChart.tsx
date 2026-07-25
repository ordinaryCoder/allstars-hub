'use client';

import { useState, useMemo, useEffect, useRef } from 'react';

export function WeeklyAttendanceChart({ locations, weeklyAttendances, totalPlayers }: any) {
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

  const chartData = useMemo(() => {
    const counts = new Array(7).fill(0);
    
    const filtered = selectedLocationId === 'all'
      ? weeklyAttendances
      : weeklyAttendances.filter((a: any) => a.session?.location_id === selectedLocationId);

    filtered.forEach((a: any) => {
      if (!a.marked_at) return;
      const date = new Date(a.marked_at);
      let day = date.getDay() - 1; // 0 = Mon, 6 = Sun
      if (day === -1) day = 6;
      counts[day]++;
    });

    return counts.map(count => {
      const percent = totalPlayers > 0 ? Math.round((count / totalPlayers) * 100) : 0;
      return { count, percent: Math.min(percent, 100) };
    });
  }, [weeklyAttendances, selectedLocationId, totalPlayers]);

  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const selectedLocationName = selectedLocationId === 'all'
    ? 'All Locations'
    : locations.find((l: any) => l.id === selectedLocationId)?.name || 'Unknown Location';

  return (
    <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 relative">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Weekly Attendance Trend</h2>
          <p className="text-xs font-medium text-slate-500">{selectedLocationName}</p>
        </div>
        
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-50 active:scale-95 transition-all text-slate-400 hover:text-slate-600"
          >
            <span className="material-symbols-outlined">more_horiz</span>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50 animate-in fade-in zoom-in duration-200">
              <button
                onClick={() => { setSelectedLocationId('all'); setDropdownOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors ${selectedLocationId === 'all' ? 'font-bold text-slate-900 bg-slate-50' : 'text-slate-600'}`}
              >
                All Locations
              </button>
              {locations.map((loc: any) => (
                <button
                  key={loc.id}
                  onClick={() => { setSelectedLocationId(loc.id); setDropdownOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors truncate ${selectedLocationId === loc.id ? 'font-bold text-slate-900 bg-slate-50' : 'text-slate-600'}`}
                >
                  {loc.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="relative h-44 px-2">
        {/* Grid Lines */}
        <div className="absolute inset-0 flex flex-col justify-between py-2 border-b border-slate-100">
          {[...Array(4)].map((_, i) => <div key={i} className="w-full border-t border-slate-50"></div>)}
        </div>
        {/* Goal Line */}
        <div className="absolute bottom-[75%] left-0 w-full border-t border-dashed border-emerald-500/40 z-10 pointer-events-none">
          <span className="absolute -top-4 right-0 text-[8px] font-bold text-emerald-500/60 uppercase">Goal 75%</span>
        </div>
        {/* Bars Container */}
        <div className="relative z-20 flex items-end justify-between h-full pt-4 group/chart">
          {chartData.map((data, idx) => (
            <div key={idx} className="flex flex-col items-center gap-2 w-full group relative cursor-crosshair">
              <div className="w-3 bg-slate-100 rounded-full h-32 relative overflow-hidden">
                <div className={`absolute bottom-0 left-0 w-full rounded-full transition-all duration-500 ${data.percent >= 75 ? 'bg-emerald-500' : 'bg-slate-900'}`} style={{ height: `${data.percent}%` }}></div>
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