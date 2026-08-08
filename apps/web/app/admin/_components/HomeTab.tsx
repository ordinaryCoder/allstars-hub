import { prisma } from '@packages/database';
import Link from 'next/link';
import { QuickActions } from './QuickActions';
import { WeeklyAttendanceChart } from './WeeklyAttendanceChart';
import { PastSessionCard } from './PastSessionCard';
import { UpcomingSessionCard } from './UpcomingSessionCard';
import { KpiCardsGrid } from './KpiCardsGrid';

export async function HomeTab() {
  // Total Players KPI: Count of all active registered players in the academy
  let totalPlayers = 0;
  try {
    totalPlayers = await prisma.player.count({
      where: { is_active: true },
    });
  } catch (e) {
    console.error("Player count query failed", e);
  }

  // Fallback to active parent/player users if player table count is 0
  if (totalPlayers === 0) {
    try {
      const allActiveUsers = await prisma.user.findMany({
        where: { status: 'ACTIVE' },
        select: {
          academy_roles: { select: { permissions: true } },
        },
      });

      totalPlayers = allActiveUsers.filter((user) => {
        const perms = user.academy_roles?.[0]?.permissions;
        if (!perms) return false;
        const permStr = Array.isArray(perms) ? perms.join(',').toLowerCase() : String(perms).toLowerCase();
        return permStr.includes('parent') || permStr.includes('player');
      }).length;
    } catch (e) {
      console.error("User fallback count failed", e);
    }
  }

  // Calculate attendance trend
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  let thisMonthAttendance = 0;
  let lastMonthAttendance = 0;

  try {
    thisMonthAttendance = await prisma.attendance.count({
      where: {
        marked_at: { gte: startOfThisMonth },
        status: { in: ['PRESENT', 'LATE'] },
      },
    });
    lastMonthAttendance = await prisma.attendance.count({
      where: {
        marked_at: { gte: startOfLastMonth, lt: startOfThisMonth },
        status: { in: ['PRESENT', 'LATE'] },
      },
    });
  } catch (error) {
    console.error("Attendance query failed:", error);
  }

  let trendPercent = 0;
  if (lastMonthAttendance > 0) {
    trendPercent = ((thisMonthAttendance - lastMonthAttendance) / lastMonthAttendance) * 100;
  } else if (thisMonthAttendance > 0) {
    trendPercent = 100;
  }

  const isUp = trendPercent > 0;
  const isDown = trendPercent < 0;
  const trendIcon = isUp ? 'trending_up' : isDown ? 'trending_down' : 'horizontal_rule';
  const trendColor = isUp ? 'text-emerald-500' : isDown ? 'text-rose-500' : 'text-slate-500';
  const trendSign = isUp ? '+' : '';

  // Fetch active locations
  const locations = await prisma.location.findMany({
    select: { id: true, name: true }
  });

  // Efficient single query to count active players per location
  const locationPlayerCounts: Record<string, number> = {};
  try {
    const activePlayersPerLocation = await prisma.player.groupBy({
      by: ['location_id'],
      where: { is_active: true },
      _count: { _all: true },
    });
    activePlayersPerLocation.forEach((group) => {
      if (group.location_id) {
        locationPlayerCounts[group.location_id] = group._count._all;
      }
    });
  } catch (e) {
    console.error("Location player counts fetch failed", e);
  }

  // Get boundaries for the current week (Monday - Sunday)
  const dayOfWeek = now.getDay() || 7;
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - dayOfWeek + 1);
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  let weeklyAttendances: { player_id: string; marked_at: Date; session: { location_id: string } }[] = [];
  try {
    weeklyAttendances = await prisma.attendance.findMany({
      where: {
        marked_at: { gte: startOfWeek, lte: endOfWeek },
        status: { in: ['PRESENT', 'LATE'] },
      },
      select: {
        player_id: true,
        marked_at: true,
        session: { select: { location_id: true } }
      }
    });
  } catch (e) {
    console.error("Weekly attendance fetch failed", e);
  }

  // Monthly attendance metrics (average attendance rate for sessions conducted this month)
  let monthlyAttendancePercent = 0;
  try {
    const monthlySessions = await prisma.session.findMany({
      where: {
        start_time: { gte: startOfThisMonth, lte: now },
      },
      select: {
        id: true,
        location_id: true,
        attendance: {
          select: { status: true },
        },
      },
    });

    if (monthlySessions.length > 0) {
      let totalPercentSum = 0;
      let evaluatedSessions = 0;

      for (const sess of monthlySessions) {
        if (sess.attendance.length > 0) {
          const attended = sess.attendance.filter(
            (a) => a.status === 'PRESENT' || a.status === 'LATE'
          ).length;
          let locationPlayers = 0;
          if (sess.location_id) {
            locationPlayers = locationPlayerCounts[sess.location_id] || 0;
          }
          const denominator = Math.max(locationPlayers, sess.attendance.length);
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
  } catch (e) {
    console.error("Monthly attendance fetch failed", e);
  }

  function getAttendanceMetric(percentage: number) {
    if (percentage >= 90) return { label: 'Optimal', icon: 'check_circle', color: 'text-emerald-500' };
    if (percentage >= 75) return { label: 'Satisfactory', icon: 'thumb_up', color: 'text-blue-500' };
    if (percentage >= 50) return { label: 'Needs Improvement', icon: 'warning', color: 'text-amber-500' };
    return { label: 'Critical', icon: 'error', color: 'text-rose-500' };
  }

  const monthlyMetric = getAttendanceMetric(monthlyAttendancePercent);

  // Active players KPI (count of active players who have attended 1+ sessions)
  let activePlayersCount = 0;
  try {
    activePlayersCount = await prisma.player.count({
      where: {
        is_active: true,
        attendance: {
          some: {
            status: { in: ['PRESENT', 'LATE'] },
          },
        },
      },
    });
  } catch (e) {
    console.error("Active players fetch failed", e);
  }

  // Upcoming session (fetches strictly the first future scheduled session for HomeTab)
  let nextCoachingSessionsData: {
    id: string;
    locationName: string;
    coachName: string;
    scheduledAtText: string;
    totalPlayers: number;
    sessionDateText: string;
  }[] = [];
  let hasMoreUpcomingSessions = false;

  try {
    const futureCount = await prisma.session.count({
      where: {
        start_time: { gt: now },
        attendance: { none: {} },
      },
    });
    hasMoreUpcomingSessions = futureCount >= 2;

    const firstFutureSession = await prisma.session.findFirst({
      where: {
        start_time: { gt: now },
        attendance: { none: {} },
      },
      orderBy: { start_time: 'asc' },
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
    });

    if (firstFutureSession) {
      let locationTotalPlayers = 0;
      if (firstFutureSession.location?.id) {
        locationTotalPlayers = await prisma.player.count({
          where: {
            location_id: firstFutureSession.location.id,
            is_active: true,
          },
        });
      }

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
  } catch (e) {
    console.error("Upcoming session fetch failed", e);
  }

  // Fetch latest past session conducted (strictly 1 record for HomeTab)
  let latestPastSessionData: {
    locationName: string;
    coachName: string;
    markedAtText: string;
    attendedCount: number;
    totalPlayers: number;
    sessionDateText: string;
  } | null = null;
  let hasMorePastSessions = false;

  try {
    const pastCount = await prisma.session.count({
      where: {
        OR: [
          { start_time: { lte: now } },
          { attendance: { some: {} } },
        ],
      },
    });
    hasMorePastSessions = pastCount >= 2;

    const pastSession = await prisma.session.findFirst({
      where: {
        OR: [
          { start_time: { lte: now } },
          { attendance: { some: {} } },
        ],
      },
      orderBy: { start_time: 'desc' },
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

    if (pastSession) {
      let locationTotalPlayers = 0;
      if (pastSession.location?.id) {
        locationTotalPlayers = await prisma.player.count({
          where: {
            location_id: pastSession.location.id,
            is_active: true,
          },
        });
      }

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
  } catch (e) {
    console.error("Latest past session fetch failed", e);
  }

  return (
    <>
      {/* KPI Cards Grid */}
      <KpiCardsGrid
        totalPlayers={totalPlayers}
        trendPercent={trendPercent}
        monthlyAttendancePercent={monthlyAttendancePercent}
        monthlyMetric={monthlyMetric}
        activePlayersCount={activePlayersCount}
      />

      <WeeklyAttendanceChart
        locations={locations}
        locationPlayerCounts={locationPlayerCounts}
        weeklyAttendances={weeklyAttendances}
        totalPlayers={totalPlayers}
      />

      {/* Quick Actions Integration */}
      <QuickActions locations={locations} />

      {/* Past Session Section */}
      <section className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-lg font-bold text-slate-900">Past Session</h2>
          {hasMorePastSessions && (
            <Link href="/admin/sessions/past" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
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

      {/* Upcoming Sessions Section */}
      <section className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-lg font-bold text-slate-900">Upcoming Sessions</h2>
          {hasMoreUpcomingSessions && (
            <Link href="/admin/sessions/upcoming" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
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
            <span className="material-symbols-outlined text-[40px] text-slate-700 mb-1">event_available</span>
            <h3 className="text-xs font-bold text-slate-400">No upcoming sessions scheduled</h3>
          </section>
        )}
      </section>
    </>
  )
}