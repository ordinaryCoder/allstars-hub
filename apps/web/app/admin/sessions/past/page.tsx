import { createClient } from '@/lib/server';
import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/dal';
import { prisma } from '@packages/database';
import { TopAppBar } from '@/components/layout/TopAppBar';
import { BottomNavBar } from '../../_components/BottomNavBar';
import { signOut } from '@/app/(auth)/_actions/auth';
import {
  PastSessionsListView,
  type PastSessionItem,
} from '../../_components/sessions/PastSessionsListView';

export default async function PastSessionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  await requireRole(user.id, 'admin');

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { first_name: true, last_name: true },
  });

  const adminName = dbUser
    ? `${dbUser.first_name} ${dbUser.last_name}`.trim()
    : user.email || 'Admin';

  const adminInitials = dbUser
    ? `${dbUser.first_name?.[0] || ''}${dbUser.last_name?.[0] || ''}`.toUpperCase() || 'A'
    : (user.email?.[0] || 'A').toUpperCase();

  const now = new Date();

  // Fetch all past sessions
  let pastSessionsList: PastSessionItem[] = [];
  try {
    const rawSessions = await prisma.session.findMany({
      where: {
        OR: [
          { start_time: { lte: now } },
          { attendance: { some: {} } },
        ],
      },
      orderBy: { start_time: 'desc' },
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
        attendance: {
          select: {
            id: true,
            status: true,
            marked_at: true,
          },
        },
      },
    });

    // Preload active-player counts for every location in one query,
    // then look them up via a Map — eliminates the N+1 pattern.
    const locationCounts = await prisma.player.groupBy({
      by: ['location_id'],
      where: { is_active: true },
      _count: { id: true },
    });
    const locationCountMap = new Map(
      locationCounts.map((lc) => [lc.location_id, lc._count.id])
    );

    for (const s of rawSessions) {
      const locationTotalPlayers = locationCountMap.get(s.location?.id ?? '') ?? 0;

      const attendedCount = s.attendance.filter(
        (a) => a.status === 'PRESENT' || a.status === 'LATE'
      ).length;

      let latestMarkedAt: Date | null = null;
      s.attendance.forEach((a) => {
        if (!latestMarkedAt || a.marked_at > latestMarkedAt) {
          latestMarkedAt = a.marked_at;
        }
      });

      const markedAtText = latestMarkedAt
        ? (latestMarkedAt as Date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : 'Attendance Pending';

      const sessionDateText = s.start_time.toLocaleDateString([], {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });

      const coachName = s.coach
        ? `${s.coach.first_name} ${s.coach.last_name}`.trim()
        : 'Unassigned';

      pastSessionsList.push({
        id: s.id,
        locationName: s.location?.name || 'Unknown Location',
        coachName,
        markedAtText,
        attendedCount,
        totalPlayers: Math.max(locationTotalPlayers, s.attendance.length),
        sessionDateText,
      });
    }
  } catch (e) {
    console.error('Past sessions query failed:', e);
  }

  return (
    <div className="bg-slate-100 flex justify-center min-h-screen font-sans text-slate-900">
      <div className="w-full max-w-[448px] bg-slate-50 min-h-screen pb-24 relative shadow-2xl shadow-slate-200 flex flex-col overflow-x-hidden">
        <TopAppBar userName={adminName} initials={adminInitials} signOut={signOut} />

        <main className="flex-1 p-4 space-y-6">
          <PastSessionsListView sessions={pastSessionsList} />
        </main>

        <BottomNavBar currentTab="home" />
      </div>
    </div>
  );
}
