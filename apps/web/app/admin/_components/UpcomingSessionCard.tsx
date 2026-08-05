'use client';

export interface UpcomingSessionCardProps {
  locationName: string;
  coachName: string;
  scheduledAtText: string;
  totalPlayers: number;
  sessionDateText: string;
}

export function UpcomingSessionCard({
  locationName,
  coachName,
  scheduledAtText,
  totalPlayers,
  sessionDateText,
}: UpcomingSessionCardProps) {
  return (
    <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col gap-4 relative overflow-hidden">
      {/* Top Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-extrabold text-slate-900">{locationName}</h3>
        <div className="flex items-center gap-2">
          <span className="bg-indigo-50 text-indigo-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-indigo-200 shrink-0">
            Scheduled
          </span>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg font-mono">
            {sessionDateText}
          </span>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[18px]">sports</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
              Coach
            </span>
            <span className="text-xs font-bold text-slate-800 truncate">{coachName}</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[18px]">schedule</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
              Scheduled At
            </span>
            <span className="text-xs font-bold text-slate-800 truncate">{scheduledAtText}</span>
          </div>
        </div>
      </div>

      {/* Total Players Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-1.5 text-slate-600 font-medium">
          <span className="material-symbols-outlined text-[16px] text-slate-400">group</span>
          <span>Total Players in Location</span>
        </div>
        <span className="font-bold text-slate-900">{totalPlayers} Players</span>
      </div>
    </section>
  );
}
