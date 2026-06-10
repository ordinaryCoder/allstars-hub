'use client';

import { useState } from 'react';

export type PerformanceData = {
  weeklyAvgAttendance: number;
  monthlyAvgAttendance: number;
  weeklyActivePlayers: number;
  monthlyActivePlayers: number;
};

export function PerformanceTrack({ data }: { data: PerformanceData }) {
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly');

  const avgAttendance = period === 'weekly' ? data.weeklyAvgAttendance : data.monthlyAvgAttendance;
  const activePlayers = period === 'weekly' ? data.weeklyActivePlayers : data.monthlyActivePlayers;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex justify-between items-center px-1">
        <h2 className="text-lg font-bold text-slate-900">Performance Track</h2>
        <div className="flex bg-slate-200 rounded-lg p-1">
          <button
            onClick={() => setPeriod('weekly')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${period === 'weekly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
          >
            Weekly
          </button>
          <button
            onClick={() => setPeriod('monthly')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${period === 'monthly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
          >
            Monthly
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-2">
          <span className="material-symbols-outlined text-slate-400" style={{ fontVariationSettings: "'FILL' 1" }}>trending_up</span>
          <span className="text-[24px] font-bold text-slate-900">{avgAttendance}%</span>
          <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase">Avg. Attendance</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-2">
          <span className="material-symbols-outlined text-slate-400" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
          <span className="text-[24px] font-bold text-slate-900">{activePlayers}</span>
          <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase">Active Players</span>
        </div>
      </div>
    </section>
  );
}