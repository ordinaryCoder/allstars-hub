import { requireRole } from '@/lib/dal';
import { getCoachPlayersListCached } from '@/lib/cached-queries';
import { CoachBottomNav } from '@/components/layout/CoachBottomNav';
import { PlayerListBoard, SerializedPlayer, SerializedLocation } from './_components/PlayerListBoard';

export default async function CoachPlayersListPage() {
  const user = await requireRole('coach');

  const { locations, players } = await getCoachPlayersListCached(user.id);

  return (
    <div className="bg-slate-50 text-slate-900 antialiased min-h-screen font-sans">
      <div className="max-w-[448px] mx-auto min-h-screen bg-slate-50 flex flex-col relative pb-24">
        {/* Header */}
        <header className="flex justify-between items-center w-full px-4 h-16 sticky top-0 z-50 bg-white shadow-sm border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
              <span className="material-symbols-outlined text-[20px]">groups</span>
            </div>
            <div className="flex flex-col">
              <h1 className="font-bold text-base text-slate-900">Location Players</h1>
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                {locations.length} {locations.length === 1 ? 'Location' : 'Locations'} Assigned
              </span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 px-4 py-6">
          <PlayerListBoard players={players} locations={locations} />
        </main>

        <CoachBottomNav currentTab="player-list" />
      </div>
    </div>
  );
}
