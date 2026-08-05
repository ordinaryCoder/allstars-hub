import Link from 'next/link';

export function CoachBottomNav({ currentTab = 'home' }: { currentTab?: 'home' | 'player-list' | 'report' | 'reports' | 'attendance-report' | 'profile' }) {
  const isHome = currentTab === 'home';
  const isPlayers = currentTab === 'player-list';
  const isReports = currentTab === 'report' || currentTab === 'reports' || currentTab === 'attendance-report';
  const isProfile = currentTab === 'profile';

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 max-w-[448px] mx-auto w-full z-50 flex justify-around items-center h-20 px-2 pb-2 bg-white border-t border-slate-200 shadow-[0_-1px_3px_0_rgba(0,0,0,0.05)]" 
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <Link 
        href="/coach" 
        className={`flex flex-col items-center justify-center rounded-2xl px-3 py-1.5 transition-all active:scale-95 ${
          isHome ? 'text-slate-900 bg-slate-100 font-semibold' : 'text-slate-500 hover:bg-slate-50'
        }`}
      >
        <span className="material-symbols-outlined" style={{ fontVariationSettings: isHome ? "'FILL' 1" : "'FILL' 0" }}>
          home
        </span>
        <span className="text-[11px] font-medium mt-0.5">Home</span>
      </Link>

      <Link 
        href="/coach/player-list" 
        className={`flex flex-col items-center justify-center rounded-2xl px-3 py-1.5 transition-all active:scale-95 ${
          isPlayers ? 'text-slate-900 bg-slate-100 font-semibold' : 'text-slate-500 hover:bg-slate-50'
        }`}
      >
        <span className="material-symbols-outlined" style={{ fontVariationSettings: isPlayers ? "'FILL' 1" : "'FILL' 0" }}>
          group
        </span>
        <span className="text-[11px] font-medium mt-0.5">Players</span>
      </Link>

      <Link 
        href="/coach/attendance-report" 
        className={`flex flex-col items-center justify-center rounded-2xl px-3 py-1.5 transition-all active:scale-95 ${
          isReports ? 'text-slate-900 bg-slate-100 font-semibold' : 'text-slate-500 hover:bg-slate-50'
        }`}
      >
        <span className="material-symbols-outlined" style={{ fontVariationSettings: isReports ? "'FILL' 1" : "'FILL' 0" }}>
          bar_chart
        </span>
        <span className="text-[11px] font-medium mt-0.5">Reports</span>
      </Link>

      <Link 
        href="/coach/profile" 
        className={`flex flex-col items-center justify-center rounded-2xl px-3 py-1.5 transition-all active:scale-95 ${
          isProfile ? 'text-slate-900 bg-slate-100 font-semibold' : 'text-slate-500 hover:bg-slate-50'
        }`}
      >
        <span className="material-symbols-outlined" style={{ fontVariationSettings: isProfile ? "'FILL' 1" : "'FILL' 0" }}>
          person
        </span>
        <span className="text-[11px] font-medium mt-0.5">Profile</span>
      </Link>
    </nav>
  );
}
