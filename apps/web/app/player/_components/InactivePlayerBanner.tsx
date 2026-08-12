export function InactivePlayerBanner({ playerName }: { playerName: string }) {
  return (
    <div className="bg-amber-50/90 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3.5 text-amber-900 shadow-sm animate-in fade-in duration-300">
      <div className="w-9 h-9 rounded-xl bg-amber-100/80 border border-amber-200 flex items-center justify-center flex-shrink-0 text-amber-700">
        <span className="material-symbols-outlined text-[20px]">person_off</span>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold text-amber-950 flex items-center gap-1.5">
          <span>Player Inactive</span>
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500"></span>
        </h3>
        <p className="text-xs text-amber-800/90 mt-1 leading-relaxed">
          <strong className="font-semibold text-amber-900">{playerName}</strong> is currently unable to attend training. Please contact academy management to request account reactivation.
        </p>
      </div>
    </div>
  );
}
