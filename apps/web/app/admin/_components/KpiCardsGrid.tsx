'use client';

import Link from 'next/link';

export interface KpiCardsGridProps {
  totalPlayers: number;
  trendPercent: number;
  monthlyAttendancePercent: number;
  monthlyMetric: {
    label: string;
    icon: string;
    color: string;
  };
  activePlayersCount: number;
}

export function KpiCardsGrid({
  totalPlayers,
  trendPercent,
  monthlyAttendancePercent,
  monthlyMetric,
  activePlayersCount,
}: KpiCardsGridProps) {
  const isUp = trendPercent > 0;
  const isDown = trendPercent < 0;
  const trendIcon = isUp ? 'trending_up' : isDown ? 'trending_down' : 'horizontal_rule';
  const trendColor = isUp ? 'text-emerald-500' : isDown ? 'text-rose-500' : 'text-slate-500';
  const trendSign = isUp ? '+' : '';

  return (
    <section className="grid grid-cols-3 gap-3">
      {/* Total Players Card (Links to User Management Board listing all active players/parents across all locations) */}
      <Link
        href="/admin?tab=users"
        className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 flex flex-col items-center text-center hover:border-slate-300 hover:shadow-md transition-all active:scale-[0.98] cursor-pointer group"
      >
        <span className="text-xs font-semibold text-slate-500 mb-1 group-hover:text-slate-900 transition-colors">
          Total Players
        </span>
        <span className="text-3xl font-bold text-slate-900">{totalPlayers}</span>
        <div className={`flex items-center justify-center gap-1 mt-1 ${trendColor}`}>
          <span className="material-symbols-outlined text-[12px]">{trendIcon}</span>
          <span className="text-[10px] font-bold font-mono">
            {trendSign}
            {trendPercent.toFixed(1)}%
          </span>
        </div>
      </Link>

      {/* Average Monthly Attendance Card */}
      <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 flex flex-col items-center text-center">
        <span className="text-xs font-semibold text-slate-500 mb-1">Monthly Att.</span>
        <span className="text-3xl font-bold text-slate-900">{monthlyAttendancePercent}%</span>
        <div className={`flex items-center justify-center gap-1 mt-1 ${monthlyMetric.color}`}>
          <span className="material-symbols-outlined text-[12px]">{monthlyMetric.icon}</span>
          <span className="text-[10px] font-bold">{monthlyMetric.label}</span>
        </div>
      </div>

      {/* Active Players Card */}
      <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 flex flex-col items-center text-center">
        <span className="text-xs font-semibold text-slate-500 mb-1">Active</span>
        <span className="text-3xl font-bold text-slate-900">{activePlayersCount}</span>
        <div className="flex items-center justify-center gap-1 text-amber-500 mt-1">
          <span className="material-symbols-outlined text-[12px]">bolt</span>
        </div>
      </div>
    </section>
  );
}
