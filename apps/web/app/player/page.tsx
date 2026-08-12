import { TopAppBar } from '@/components/layout/TopAppBar';
import { NextCoachingSession } from './_components/NextCoachingSession';
import { AttendanceStats } from './_components/AttendanceStats';
import { CalendarWidget } from './_components/CalendarWidget';
import { PlayerSwitcher } from './_components/PlayerSwitcher';
import { InactivePlayerBanner } from './_components/InactivePlayerBanner';
import { BottomNav } from '@/components/layout/BottomNav';
import { requireRole } from '@/lib/dal';
import { prisma } from '@packages/database';
import { signOut } from '@/app/(auth)/_actions/auth';

export default async function PlayerPage({
  searchParams,
}: {
  searchParams: Promise<{ playerId?: string }>;
}) {
  const user = await requireRole(['player', 'parent']);
  const { playerId: requestedPlayerId } = await searchParams;

  // ── Fetch all players (both active and inactive) this user can view ───────
  // A parent can have multiple children; a self-registered player has one entry.
  const linkedPlayers = await prisma.player.findMany({
    where: {
      OR: [
        { user_id: user.id },
        { parents: { some: { parent_user_id: user.id } } },
      ],
    },
    select: {
      id: true,
      first_name: true,
      last_name: true,
      location_id: true,
      user_id: true,
      is_active: true,
      attendance: {
        select: {
          status: true,
          session: { select: { start_time: true } },
        },
        orderBy: { marked_at: 'asc' },
      },
    },
    orderBy: [{ is_active: 'desc' }, { first_name: 'asc' }],
  });

  // If no player records exist at all, show a minimal page
  if (linkedPlayers.length === 0) {
    const userName = user.email?.split('@')[0] || 'Player';
    const initials = userName[0]?.toUpperCase() || 'P';
    return (
      <>
        <div className="bg-slate-100 flex justify-center min-h-screen font-sans text-slate-900 antialiased">
          <div className="w-full max-w-[448px] bg-slate-50 min-h-screen pb-24 relative shadow-2xl shadow-slate-200 flex flex-col overflow-x-hidden">
            <TopAppBar userName={userName} initials={initials} signOut={signOut} />
            <main className="flex-1 px-4 py-6 flex flex-col gap-6 items-center justify-center">
              <p className="text-slate-500 text-sm text-center">No player profile found for your account.</p>
            </main>
            <BottomNav />
          </div>
        </div>
      </>
    );
  }

  // ── Resolve which player to display ──────────────────────────────────────
  const isParent = linkedPlayers.length > 1 || !linkedPlayers.some((p) => p.user_id === user.id);
  const validIds = new Set(linkedPlayers.map((p) => p.id));
  const selectedId =
    requestedPlayerId && validIds.has(requestedPlayerId)
      ? requestedPlayerId
      : linkedPlayers[0].id;

  const player = linkedPlayers.find((p) => p.id === selectedId)!;

  // ── Display name ──────────────────────────────────────────────────────────
  const userName = `${player.first_name} ${player.last_name}`;
  const initials = `${player.first_name[0] || ''}${player.last_name[0] || ''}`.toUpperCase();

  // ── Attendance computations ───────────────────────────────────────────────
  let attended = 0;
  let missed = 0;
  let late = 0;
  const total = player.attendance.length;

  const attendanceMap: Record<number, string> = {};
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  for (const att of player.attendance) {
    if (att.status === 'PRESENT') attended++;
    else if (att.status === 'ABSENT') missed++;
    else if (att.status === 'LATE') late++;

    const date = new Date(att.session.start_time);
    if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
      attendanceMap[date.getDate()] = att.status;
    }
  }

  const attendanceStats = {
    percentage: total > 0 ? Math.round(((attended + late) / total) * 100) : 0,
    attended: attended + late,
    missed,
    total,
  };

  const monthName = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  // ── Next upcoming session for selected player (only if player is active) ──
  const nextSession = player.is_active
    ? await prisma.session.findFirst({
        where: {
          start_time: { gt: new Date() },
          attendance: { none: {} },
          location_id: player.location_id,
          batches: {
            some: {
              batch: {
                players: { some: { player_id: player.id } },
              },
            },
          },
        },
        orderBy: { start_time: 'asc' },
        include: {
          location: true,
          coach: true,
          batches: { include: { batch: true } },
        },
      })
    : null;

  // ── Switcher options (visible for parents or multi-player setups) ─────────
  const switcherPlayers = isParent
    ? linkedPlayers.map((p) => ({
        id: p.id,
        first_name: p.first_name,
        last_name: p.last_name,
        is_active: p.is_active,
      }))
    : [];

  return (
    <>
      <div className="bg-slate-100 flex justify-center min-h-screen font-sans text-slate-900 antialiased">
        <div className="w-full max-w-[448px] bg-slate-50 min-h-screen pb-24 relative shadow-2xl shadow-slate-200 flex flex-col overflow-x-hidden">
          <TopAppBar userName={userName} initials={initials} signOut={signOut} />

          {/* Parent player switcher — rendered when parent has >1 child */}
          {switcherPlayers.length > 1 && (
            <PlayerSwitcher players={switcherPlayers} selectedPlayerId={selectedId} />
          )}

          <main className="flex-1 px-4 py-6 flex flex-col gap-6">
            {!player.is_active && (
              <InactivePlayerBanner playerName={userName} />
            )}
            <NextCoachingSession session={nextSession} />
            <AttendanceStats stats={attendanceStats} />
            <CalendarWidget monthName={monthName} attendanceMap={attendanceMap} />
          </main>

          <BottomNav />
        </div>
      </div>
    </>
  );
}
