import { requireRole } from '@/lib/dal';
import { getCoachPlayersListCached } from '@/lib/cached-queries';
import { CoachBottomNav } from '@/components/layout/CoachBottomNav';
import { TopAppBar } from '@/components/layout/TopAppBar';
import { signOut } from '@/app/(auth)/_actions/auth';
import { prisma } from '@packages/database';
import { PlayerListBoard, SerializedPlayer, SerializedLocation } from './_components/PlayerListBoard';

export default async function CoachPlayersListPage() {
  const user = await requireRole('coach');

  const [dbUser, { locations, players }] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: { first_name: true, last_name: true },
    }),
    getCoachPlayersListCached(user.id),
  ]);

  const coachName = dbUser?.first_name && dbUser?.last_name
    ? `${dbUser.first_name} ${dbUser.last_name}`.trim()
    : user.email?.split('@')[0] || 'Coach';

  const initials = coachName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="bg-slate-50 text-slate-900 antialiased min-h-screen font-sans">
      <div className="max-w-[448px] mx-auto min-h-screen bg-slate-50 flex flex-col relative pb-24">
        <TopAppBar
          title="Location Players"
          userName={coachName}
          initials={initials}
          signOut={signOut}
        />

        {/* Content */}
        <main className="flex-1 px-4 py-6">
          <PlayerListBoard players={players} locations={locations} />
        </main>

        <CoachBottomNav currentTab="player-list" />
      </div>
    </div>
  );
}
