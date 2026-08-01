import { prisma } from '@packages/database';
import { QuickActions } from './QuickActions';
import { WeeklyAttendanceChart } from './WeeklyAttendanceChart';

interface NextCoachingSessionItem {
  id: string;
  start_time: Date;
  location?: { name: string } | null;
}

function getAttendanceMetric(percentage: number) {
  if (percentage >= 90) return { label: 'Optimal', icon: 'check_circle', color: 'text-emerald-500' };
  if (percentage >= 75) return { label: 'Satisfactory', icon: 'thumb_up', color: 'text-blue-500' };
  if (percentage >= 50) return { label: 'Needs Improvement', icon: 'warning', color: 'text-amber-500' };
  return { label: 'Critical', icon: 'error', color: 'text-rose-500' };
}

function UpcomingSessionCard({ title, time, locationName }: { title: string, time: string, locationName: string }) {
  return (
    <section className="bg-slate-900 rounded-2xl p-5 shadow-md relative overflow-hidden min-h-[160px] flex flex-col justify-end">
      <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
        <span className="material-symbols-outlined !text-[120px] text-white">sports_handball</span>
      </div>
      <div className="relative z-10">
        <p className="text-xs text-slate-400 font-medium">Coming Up Next</p>
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-slate-400">schedule</span>
          <span className="text-xs font-medium text-slate-300">{time} - {locationName}</span>
        </div>
      </div>
    </section>
  );
}

export async function HomeTab() {
  // Direct SQL COUNT query on active players table
  let totalPlayers = await prisma.player.count({
    where: { is_active: true },
  });

  if (totalPlayers === 0) {
    // Fallback: Lightweight select for active user roles
    const activeUsers = await prisma.user.findMany({
      where: { status: 'ACTIVE' },
      select: { academy_roles: { select: { permissions: true } } },
    });

    totalPlayers = activeUsers.filter((user) => {
      const perms = user.academy_roles?.[0]?.permissions;
      if (!perms) return false;
      const permStr = Array.isArray(perms) ? perms.join(',').toLowerCase() : String(perms).toLowerCase();
      return permStr.includes('parent') || permStr.includes('player');
    }).length;
  }

  // Calculate attendance trend
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  let thisMonthAttendance = 0;
  let lastMonthAttendance = 0;

  try {
    thisMonthAttendance = await prisma.attendance.count({ where: { marked_at: { gte: startOfThisMonth } } });
    lastMonthAttendance = await prisma.attendance.count({ where: { marked_at: { gte: startOfLastMonth, lt: startOfThisMonth } } });
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

  // Get boundaries for the current week (Monday - Sunday)
  const dayOfWeek = now.getDay() || 7;
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - dayOfWeek + 1);
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  let weeklyAttendances: { marked_at: Date; session: { location_id: string } }[] = [];
  try {
    weeklyAttendances = await prisma.attendance.findMany({
      where: { marked_at: { gte: startOfWeek, lte: endOfWeek } },
      select: {
        marked_at: true,
        session: { select: { location_id: true } }
      }
    });
  } catch (e) {
    console.error("Weekly attendance fetch failed", e);
  }

  // Today's attendance metrics (location & SQL aggregate based)
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  let expectedPlayersCount = 0;
  let attendedPlayersCount = 0;

  try {
    const todaysSessions = await prisma.session.findMany({
      where: { start_time: { gte: startOfToday, lte: endOfToday } },
      select: {
        location_id: true,
        _count: { select: { attendance: true } }
      }
    });

    const sessionLocationIds = Array.from(new Set(todaysSessions.map(s => s.location_id).filter(Boolean)));
    if (sessionLocationIds.length > 0) {
      expectedPlayersCount = await prisma.player.count({
        where: { location_id: { in: sessionLocationIds }, is_active: true }
      });
    }

    todaysSessions.forEach(session => {
      attendedPlayersCount += session._count.attendance;
    });
  } catch (e) {
    console.error("Today's attendance fetch failed", e);
  }

  const todaysAttendancePercent = expectedPlayersCount > 0
    ? Math.round((attendedPlayersCount / expectedPlayersCount) * 100)
    : 0;
  const todaysMetric = getAttendanceMetric(todaysAttendancePercent);

  // Active players in live sessions (location based)
  let activeSessionsPlayersCount = 0;
  try {
    const activeSessions = await prisma.session.findMany({
      where: {
        start_time: { lte: now },
        end_time: { gte: now }
      },
      select: {
        location_id: true,
        _count: { select: { attendance: true } }
      }
    });

    const activeLocationIds = Array.from(new Set(activeSessions.map(s => s.location_id).filter(Boolean)));
    if (activeLocationIds.length > 0) {
      activeSessionsPlayersCount = await prisma.player.count({
        where: { location_id: { in: activeLocationIds }, is_active: true }
      });
    }
  } catch (e) {
    console.error("Active sessions fetch failed", e);
  }

  // Upcoming sessions
  let nextCoachingSessions: NextCoachingSessionItem[] = [];
  try {
    const futureSessions = await prisma.session.findMany({
      where: { start_time: { gt: now } },
      orderBy: { start_time: 'asc' },
      take: 10,
      select: {
        id: true,
        start_time: true,
        location: { select: { name: true } }
      }
    });

    if (futureSessions.length > 0) {
      const firstSessionTime = futureSessions[0].start_time;
      const targetYear = firstSessionTime.getFullYear();
      const targetMonth = firstSessionTime.getMonth();
      const targetDate = firstSessionTime.getDate();
      const targetHour = firstSessionTime.getHours();

      nextCoachingSessions = futureSessions.filter((s) => s.start_time.getFullYear() === targetYear && s.start_time.getMonth() === targetMonth && s.start_time.getDate() === targetDate && s.start_time.getHours() === targetHour);
    }
  } catch (e) {
    console.error("Upcoming sessions fetch failed", e);
  }

  return (
    <>
      {/* KPI Cards Grid */}
      <section className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 flex flex-col items-center text-center">
          <span className="text-xs font-semibold text-slate-500 mb-1">Total Players</span>
          <span className="text-3xl font-bold text-slate-900">{totalPlayers}</span>
          <div className={`flex items-center justify-center gap-1 mt-1 ${trendColor}`}>
            <span className="material-symbols-outlined text-[12px]">{trendIcon}</span>
            <span className="text-[10px] font-bold">{trendSign}{trendPercent.toFixed(1)}%</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 flex flex-col items-center text-center">
          <span className="text-xs font-semibold text-slate-500 mb-1">Today's Att.</span>
          <span className="text-3xl font-bold text-slate-900">{todaysAttendancePercent}%</span>
          <div className={`flex items-center justify-center gap-1 mt-1 ${todaysMetric.color}`}>
            <span className="material-symbols-outlined text-[12px]">{todaysMetric.icon}</span>
            <span className="text-[10px] font-bold">{todaysMetric.label}</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 flex flex-col items-center text-center">
          <span className="text-xs font-semibold text-slate-500 mb-1">Active</span>
          <span className="text-3xl font-bold text-slate-900">{activeSessionsPlayersCount}</span>
          <div className="flex items-center justify-center gap-1 text-amber-500 mt-1">
            <span className="material-symbols-outlined text-[12px]">bolt</span>
            <span className="text-[10px] font-bold">Playing</span>
          </div>
        </div>
      </section>

      <WeeklyAttendanceChart
        locations={locations}
        weeklyAttendances={weeklyAttendances}
        totalPlayers={totalPlayers}
      />

      {/* Quick Actions Integration */}
      <QuickActions locations={locations} />

      {/* Recent Activity / Featured Card */}
      <div className="flex flex-col gap-3">
        {nextCoachingSessions.length > 0 ? (
          nextCoachingSessions.map((session) => {
            const title = session.location?.name ? `${session.location.name} Session` : 'Training Session';
            const time = session.start_time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const locationName = session.location?.name || 'Unknown Location';
            return (
              <UpcomingSessionCard key={session.id} title={title} time={time} locationName={locationName} />
            );
          })
        ) : (
          <section className="bg-slate-900 rounded-2xl p-5 shadow-md relative overflow-hidden min-h-[160px] flex flex-col justify-center items-center text-center">
            <span className="material-symbols-outlined text-[48px] text-slate-700 mb-2">event_available</span>
            <h3 className="text-sm font-bold text-slate-400">No upcoming sessions</h3>
          </section>
        )}
      </div>
    </>
  )
}