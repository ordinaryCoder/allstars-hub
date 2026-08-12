import { Suspense } from 'react';
import Link from 'next/link';
import { prisma } from '@packages/database';
import { getActiveLocationsCached, getActivePlayerCountsCached } from '@/lib/cached-queries';
import { QuickActions } from './QuickActions';
import { WeeklyAttendanceChart } from './WeeklyAttendanceChart';
import { PastSessionCard } from './PastSessionCard';
import { UpcomingSessionCard } from './UpcomingSessionCard';
import { KpiCardsGrid } from './KpiCardsGrid';
import {
  KpiCardsSkeleton,
  WeeklyChartSkeleton,
  QuickActionsSkeleton,
  SessionCardSkeleton,
} from './skeletons/HomeSkeletons';

export function HomeTab() {
  return (
    <>
      <Suspense fallback={<KpiCardsSkeleton />}>
        <KpiCardsSection />
      </Suspense>

      <Suspense fallback={<WeeklyChartSkeleton />}>
        <WeeklyAttendanceSection />
      </Suspense>

      <Suspense fallback={<QuickActionsSkeleton />}>
        <QuickActionsSection />
      </Suspense>

      <Suspense fallback={<SessionCardSkeleton />}>
        <PastSessionSection />
      </Suspense>

      <Suspense fallback={<SessionCardSkeleton />}>
        <UpcomingSessionsSection />
      </Suspense>
    </>
  );
}

async function KpiCardsSection() {
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [
    totalPlayersRes,
    thisMonthAttendanceRes,
    lastMonthAttendanceRes,
    locationPlayerCountsRes,
    monthlySessionsRes,
    activePlayersCountRes,
  ] = await Promise.allSettled([
    prisma.player.count({ where: { is_active: true } }),
    prisma.attendance.count({
      where: {
        marked_at: { gte: startOfThisMonth },
        status: { in: ['PRESENT', 'LATE'] },
      },
    }),
    prisma.attendance.count({
      where: {
        marked_at: { gte: startOfLastMonth, lt: startOfThisMonth },
        status: { in: ['PRESENT', 'LATE'] },
      },
    }),
    getActivePlayerCountsCached(),
    prisma.session.findMany({
      where: { start_time: { gte: startOfThisMonth, lte: now } },
      select: {
        id: true,
        location_id: true,
        _count: { select: { attendance: true } },
        attendance: {
          where: { status: { in: ['PRESENT', 'LATE'] } },
          select: { id: true },
        },
      },
    }),
    prisma.player.count({
      where: {
        is_active: true,
        attendance: { some: { status: { in: ['PRESENT', 'LATE'] } } },
      },
    }),
  ]);

  let totalPlayers = totalPlayersRes.status === 'fulfilled' ? totalPlayersRes.value : 0;

  if (totalPlayers === 0) {
    try {
      totalPlayers = await prisma.user.count({
        where: {
          status: 'ACTIVE',
          academy_roles: {
            some: {
              OR: [
                { permissions: { array_contains: 'player' } },
                { permissions: { array_contains: 'parent' } },
              ],
            },
          },
        },
      });
    } catch (e) {
      console.error('User fallback count failed', e);
    }
  }

  const thisMonthAttendance = thisMonthAttendanceRes.status === 'fulfilled' ? thisMonthAttendanceRes.value : 0;
  const lastMonthAttendance = lastMonthAttendanceRes.status === 'fulfilled' ? lastMonthAttendanceRes.value : 0;

  let trendPercent = 0;
  if (lastMonthAttendance > 0) {
    trendPercent = ((thisMonthAttendance - lastMonthAttendance) / lastMonthAttendance) * 100;
  } else if (thisMonthAttendance > 0) {
    trendPercent = 100;
  }

  const locationPlayerCounts = locationPlayerCountsRes.status === 'fulfilled' ? locationPlayerCountsRes.value : {};

  const monthlySessions = monthlySessionsRes.status === 'fulfilled' ? monthlySessionsRes.value : [];
  let monthlyAttendancePercent = 0;
  if (monthlySessions.length > 0) {
    let totalPercentSum = 0;
    let evaluatedSessions = 0;

    for (const sess of monthlySessions) {
      const totalMarked = sess._count.attendance;
      if (totalMarked > 0) {
        const attended = sess.attendance.length;
        const locationPlayers = sess.location_id ? locationPlayerCounts[sess.location_id] || 0 : 0;
        const denominator = Math.max(locationPlayers, totalMarked);
        if (denominator > 0) {
          totalPercentSum += Math.round((attended / denominator) * 100);
          evaluatedSessions++;
        }
      }
    }

    if (evaluatedSessions > 0) {
      monthlyAttendancePercent = Math.round(totalPercentSum / evaluatedSessions);
    }
  }

  function getAttendanceMetric(percentage: number) {
    if (percentage >= 90) return { label: 'Optimal', icon: 'check_circle', color: 'text-emerald-500' };
    if (percentage >= 75) return { label: 'Satisfactory', icon: 'thumb_up', color: 'text-blue-500' };
    if (percentage >= 50) return { label: 'Needs Improvement', icon: 'warning', color: 'text-amber-500' };
    return { label: 'Critical', icon: 'error', color: 'text-rose-500' };
  }

  const monthlyMetric = getAttendanceMetric(monthlyAttendancePercent);
  const activePlayersCount = activePlayersCountRes.status === 'fulfilled' ? activePlayersCountRes.value : 0;

  return (
    <KpiCardsGrid
      totalPlayers={totalPlayers}
      trendPercent={trendPercent}
      monthlyAttendancePercent={monthlyAttendancePercent}
      monthlyMetric={monthlyMetric}
      activePlayersCount={activePlayersCount}
    />
  );
}

async function WeeklyAttendanceSection() {
  const now = new Date();
  const dayOfWeek = now.getDay() || 7;
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - dayOfWeek + 1);
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const [locations, locationPlayerCounts, weeklyAttendances, totalPlayers] = await Promise.all([
    getActiveLocationsCached(),
    getActivePlayerCountsCached(),
    prisma.attendance.findMany({
      where: {
        marked_at: { gte: startOfWeek, lte: endOfWeek },
        status: { in: ['PRESENT', 'LATE'] },
      },
      select: {
        player_id: true,
        marked_at: true,
        session: { select: { location_id: true } },
      },
    }),
    prisma.player.count({ where: { is_active: true } }),
  ]);

  return (
    <WeeklyAttendanceChart
      locations={locations}
      locationPlayerCounts={locationPlayerCounts}
      weeklyAttendances={weeklyAttendances}
      totalPlayers={totalPlayers}
    />
  );
}

async function QuickActionsSection() {
  const locations = await getActiveLocationsCached();
  return <QuickActions locations={locations} />;
}

async function PastSessionSection() {
  const now = new Date();
  const [pastCount, pastSession, locationPlayerCounts] = await Promise.all([
    prisma.session.count({
      where: {
        OR: [{ start_time: { lte: now } }, { attendance: { some: {} } }],
      },
    }),
    prisma.session.findFirst({
      where: {
        OR: [{ start_time: { lte: now } }, { attendance: { some: {} } }],
      },
      orderBy: { start_time: 'desc' },
      select: {
        id: true,
        start_time: true,
        location: { select: { id: true, name: true } },
        coach: { select: { first_name: true, last_name: true } },
        attendance: { select: { id: true, status: true, marked_at: true } },
      },
    }),
    getActivePlayerCountsCached(),
  ]);

  const hasMorePastSessions = pastCount >= 2;

  let latestPastSessionData: {
    locationName: string;
    coachName: string;
    markedAtText: string;
    attendedCount: number;
    totalPlayers: number;
    sessionDateText: string;
  } | null = null;

  if (pastSession) {
    const locationTotalPlayers = pastSession.location?.id
      ? (locationPlayerCounts[pastSession.location.id] || 0)
      : 0;

    const attendedCount = pastSession.attendance.filter(
      (a) => a.status === 'PRESENT' || a.status === 'LATE'
    ).length;

    let latestMarkedAt: Date | null = null;
    pastSession.attendance.forEach((a) => {
      if (!latestMarkedAt || a.marked_at > latestMarkedAt) {
        latestMarkedAt = a.marked_at;
      }
    });

    const markedAtText = latestMarkedAt
      ? (latestMarkedAt as Date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : 'Attendance Pending';

    const sessionDateText = pastSession.start_time.toLocaleDateString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

    const coachName = pastSession.coach
      ? `${pastSession.coach.first_name} ${pastSession.coach.last_name}`.trim()
      : 'Unassigned';

    latestPastSessionData = {
      locationName: pastSession.location?.name || 'Unknown Location',
      coachName,
      markedAtText,
      attendedCount,
      totalPlayers: Math.max(locationTotalPlayers, pastSession.attendance.length),
      sessionDateText,
    };
  }

  return (
    <section className="space-y-3">
      <div className="flex justify-between items-center px-1">
        <h2 className="text-lg font-bold text-slate-900">Past Session</h2>
        {hasMorePastSessions && (
          <Link
            href="/admin/sessions/past"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            View All
          </Link>
        )}
      </div>
      {latestPastSessionData ? (
        <PastSessionCard
          locationName={latestPastSessionData.locationName}
          coachName={latestPastSessionData.coachName}
          markedAtText={latestPastSessionData.markedAtText}
          attendedCount={latestPastSessionData.attendedCount}
          totalPlayers={latestPastSessionData.totalPlayers}
          sessionDateText={latestPastSessionData.sessionDateText}
        />
      ) : (
        <div className="bg-white rounded-2xl p-5 border border-slate-100 text-center text-slate-500 text-xs font-medium">
          No past sessions conducted yet.
        </div>
      )}
    </section>
  );
}

async function UpcomingSessionsSection() {
  const now = new Date();
  const [futureCount, firstFutureSession, locationPlayerCounts] = await Promise.all([
    prisma.session.count({
      where: { start_time: { gt: now }, attendance: { none: {} } },
    }),
    prisma.session.findFirst({
      where: { start_time: { gt: now }, attendance: { none: {} } },
      orderBy: { start_time: 'asc' },
      select: {
        id: true,
        start_time: true,
        location: { select: { id: true, name: true } },
        coach: { select: { first_name: true, last_name: true } },
      },
    }),
    getActivePlayerCountsCached(),
  ]);

  const hasMoreUpcomingSessions = futureCount >= 2;
  let nextCoachingSessionsData: {
    id: string;
    locationName: string;
    coachName: string;
    scheduledAtText: string;
    totalPlayers: number;
    sessionDateText: string;
  }[] = [];

  if (firstFutureSession) {
    const locationTotalPlayers = firstFutureSession.location?.id
      ? (locationPlayerCounts[firstFutureSession.location.id] || 0)
      : 0;

    const scheduledAtText = firstFutureSession.start_time.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const sessionDateText = firstFutureSession.start_time.toLocaleDateString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

    const coachName = firstFutureSession.coach
      ? `${firstFutureSession.coach.first_name} ${firstFutureSession.coach.last_name}`.trim()
      : 'Unassigned';

    nextCoachingSessionsData.push({
      id: firstFutureSession.id,
      locationName: firstFutureSession.location?.name || 'Unknown Location',
      coachName,
      scheduledAtText,
      totalPlayers: locationTotalPlayers,
      sessionDateText,
    });
  }

  return (
    <section className="space-y-3">
      <div className="flex justify-between items-center px-1">
        <h2 className="text-lg font-bold text-slate-900">Upcoming Sessions</h2>
        {hasMoreUpcomingSessions && (
          <Link
            href="/admin/sessions/upcoming"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            View All
          </Link>
        )}
      </div>
      {nextCoachingSessionsData.length > 0 ? (
        nextCoachingSessionsData.map((session) => (
          <UpcomingSessionCard
            key={session.id}
            locationName={session.locationName}
            coachName={session.coachName}
            scheduledAtText={session.scheduledAtText}
            totalPlayers={session.totalPlayers}
            sessionDateText={session.sessionDateText}
          />
        ))
      ) : (
        <section className="bg-slate-900 rounded-2xl p-5 shadow-md relative overflow-hidden min-h-[140px] flex flex-col justify-center items-center text-center">
          <span className="material-symbols-outlined text-[40px] text-slate-700 mb-1">
            event_available
          </span>
          <h3 className="text-xs font-bold text-slate-400">No upcoming sessions scheduled</h3>
        </section>
      )}
    </section>
  );
}