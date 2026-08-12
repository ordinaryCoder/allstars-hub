import { requireRole } from '@/lib/dal';
import { prisma } from '@packages/database';
import { TopAppBar } from '@/components/layout/TopAppBar';
import { BottomNavBar } from '../../_components/BottomNavBar';
import { signOut } from '@/app/(auth)/_actions/auth';
import {
  UpcomingSessionsListView,
  type UpcomingSessionItem,
} from '../../_components/sessions/UpcomingSessionsListView';

export default async function UpcomingSessionsPage() {
  const user = await requireRole('admin');

  const now = new Date();

  // Fetch all upcoming sessions, user info, and location counts in parallel
  let upcomingSessionsList: UpcomingSessionItem[] = [];
  let adminName = user.email || 'Admin';
  let adminInitials = (user.email?.[0] || 'A').toUpperCase();

  try {
    const [dbUser, rawSessions, locationCounts] = await Promise.all([
      prisma.user.findUnique({
        where: { id: user.id },
        select: { first_name: true, last_name: true },
      }),
      prisma.session.findMany({
        where: {
          start_time: { gt: now },
          attendance: { none: {} },
        },
        orderBy: { start_time: 'asc' },
        take: 50,
        select: {
          id: true,
          start_time: true,
          location: {
            select: {
              id: true,
              name: true,
            },
          },
          coach: {
            select: {
              first_name: true,
              last_name: true,
            },
          },
        },
      }),
      prisma.player.groupBy({
        by: ['location_id'],
        where: { is_active: true },
        _count: { id: true },
      }),
    ]);

    if (dbUser) {
      adminName = `${dbUser.first_name} ${dbUser.last_name}`.trim() || adminName;
      adminInitials = `${dbUser.first_name?.[0] || ''}${dbUser.last_name?.[0] || ''}`.toUpperCase() || adminInitials;
    }

    const locationCountMap = new Map(
      locationCounts.map((lc) => [lc.location_id, lc._count.id])
    );

    for (const s of rawSessions) {
      const locationTotalPlayers = locationCountMap.get(s.location?.id ?? '') ?? 0;

      const scheduledAtText = s.start_time.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });

      const sessionDateText = s.start_time.toLocaleDateString([], {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });

      const coachName = s.coach
        ? `${s.coach.first_name} ${s.coach.last_name}`.trim()
        : 'Unassigned';

      upcomingSessionsList.push({
        id: s.id,
        locationName: s.location?.name || 'Unknown Location',
        coachName,
        scheduledAtText,
        totalPlayers: locationTotalPlayers,
        sessionDateText,
      });
    }
  } catch (e) {
    console.error('Upcoming sessions query failed:', e);
  }

  return (
    <div className="bg-slate-100 flex justify-center min-h-screen font-sans text-slate-900">
      <div className="w-full max-w-[448px] bg-slate-50 min-h-screen pb-24 relative shadow-2xl shadow-slate-200 flex flex-col overflow-x-hidden">
        <TopAppBar userName={adminName} initials={adminInitials} signOut={signOut} />

        <main className="flex-1 p-4 space-y-6">
          <UpcomingSessionsListView sessions={upcomingSessionsList} />
        </main>

        <BottomNavBar currentTab="home" />
      </div>
    </div>
  );
}
