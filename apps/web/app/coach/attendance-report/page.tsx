import Link from 'next/link';
import { createClient } from '../../../lib/server';
import { prisma } from '@packages/database';
import { redirect } from 'next/navigation';
import { requireRole } from '../../../lib/dal';
import { CoachBottomNav } from '@/components/layout/CoachBottomNav';
import {
  AttendanceReportView,
  RecordedSessionItem,
  LowAttendancePlayerItem,
} from './_components/AttendanceReportView';
import { PerformanceData } from '../_components/PerformanceTrack';

export const revalidate = 30;

export default async function AttendanceReportPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }
  await requireRole(user.id, 'coach');

  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // 1. Fetch total active players in the coach's assigned locations
  const coachLocations = await prisma.coachLocation.findMany({
    where: { user_id: user.id },
    select: { location_id: true },
  });
  const locationIds = coachLocations.map((cl) => cl.location_id);

  const activeLocationPlayers = await prisma.player.findMany({
    where: {
      location_id: { in: locationIds },
      is_active: true,
    },
    select: { id: true },
  });

  const locationPlayerIdsSet = new Set(activeLocationPlayers.map((p) => p.id));
  const totalLocationPlayersCount = locationPlayerIdsSet.size;

  // 2. Fetch past performance sessions (last 30 days) for Weekly & Monthly Performance Track
  const pastPerformanceSessions = await prisma.session.findMany({
    where: {
      OR: [
        { coach_id: user.id },
        { created_by: user.id },
      ],
      start_time: { gte: thirtyDaysAgo },
    },
    include: {
      attendance: true,
    },
  });

  let weeklyMarked = 0;
  let weeklyPresent = 0;
  const weeklyAttendedPlayers = new Set<string>();

  let monthlyMarked = 0;
  let monthlyPresent = 0;
  const monthlyAttendedPlayers = new Set<string>();

  pastPerformanceSessions.forEach((session) => {
    const isWeekly = session.start_time >= sevenDaysAgo;

    session.attendance.forEach((att) => {
      monthlyMarked++;
      if (att.status === 'PRESENT' || att.status === 'LATE') {
        monthlyPresent++;
        if (locationPlayerIdsSet.has(att.player_id)) {
          monthlyAttendedPlayers.add(att.player_id);
        }
      }

      if (isWeekly) {
        weeklyMarked++;
        if (att.status === 'PRESENT' || att.status === 'LATE') {
          weeklyPresent++;
          if (locationPlayerIdsSet.has(att.player_id)) {
            weeklyAttendedPlayers.add(att.player_id);
          }
        }
      }
    });
  });

  const performanceData: PerformanceData = {
    weeklyAvgAttendance: weeklyMarked > 0 ? Math.round((weeklyPresent / weeklyMarked) * 100) : 0,
    monthlyAvgAttendance: monthlyMarked > 0 ? Math.round((monthlyPresent / monthlyMarked) * 100) : 0,
    weeklyActivePlayers: weeklyAttendedPlayers.size,
    monthlyActivePlayers: monthlyAttendedPlayers.size,
    totalLocationPlayers: totalLocationPlayersCount,
  };

  // 3. Fetch all recorded sessions for the coach (no batch query for Phase 1)
  const sessions = await prisma.session.findMany({
    where: {
      OR: [
        { coach_id: user.id },
        { created_by: user.id },
      ],
    },
    include: {
      location: true,
      attendance: {
        include: {
          player: true,
        },
      },
    },
    orderBy: { start_time: 'desc' },
    take: 100,
  });

  const recordedSessions: RecordedSessionItem[] = sessions.map((session) => {
    const dateStr = new Date(session.start_time).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const timeStr = new Date(session.start_time).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    const sessionPresent = session.attendance.filter(
      (a) => a.status === 'PRESENT' || a.status === 'LATE'
    ).length;
    const sessionTotal = session.attendance.length;
    const sessionRate = sessionTotal > 0 ? Math.round((sessionPresent / sessionTotal) * 100) : 0;
    const sessionTitle = session.location?.name ? `${session.location.name} Session` : 'General Session';

    return {
      id: session.id,
      locationName: session.location?.name || 'Assigned Location',
      dateStr,
      timeStr,
      sessionPresent,
      sessionTotal,
      sessionRate,
    };
  });

  // 4. Calculate low attendance players (< 80%)
  const playerStatsMap = new Map<
    string,
    { name: string; locationName: string; expected: number; attended: number }
  >();

  sessions.forEach((session) => {
    session.attendance.forEach((att) => {
      const playerId = att.player_id;
      const playerName = att.player ? `${att.player.first_name} ${att.player.last_name}` : 'Player';
      const locationName = session.location?.name || 'Assigned Location';

      const existing = playerStatsMap.get(playerId) || {
        name: playerName,
        locationName,
        expected: 0,
        attended: 0,
      };
      existing.expected += 1;
      if (att.status === 'PRESENT' || att.status === 'LATE') {
        existing.attended += 1;
      }
      playerStatsMap.set(playerId, existing);
    });
  });

  const lowAttendancePlayers: LowAttendancePlayerItem[] = Array.from(playerStatsMap.entries())
    .map(([id, data]) => {
      const percentage = data.expected > 0 ? Math.round((data.attended / data.expected) * 100) : 0;
      return {
        id,
        name: data.name,
        locationName: data.locationName,
        attendancePercentage: percentage,
        absences: data.expected - data.attended,
      };
    })
    .filter((p) => p.attendancePercentage < 80 && p.absences > 0)
    .sort((a, b) => a.attendancePercentage - b.attendancePercentage);

  return (
    <div className="bg-slate-50 text-slate-900 antialiased min-h-screen font-sans">
      <div className="max-w-[448px] mx-auto min-h-screen bg-slate-50 flex flex-col relative pb-24 shadow-sm border-x border-slate-200/50">

        {/* TopAppBar */}
        <header className="flex items-center justify-between px-4 h-16 w-full sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <Link 
              href="/coach" 
              aria-label="Go back" 
              className="flex items-center justify-center w-9 h-9 rounded-full text-slate-900 hover:bg-slate-100 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[22px]">arrow_back</span>
            </Link>
            <h1 className="font-bold text-lg tracking-tight text-slate-900">Attendance Report</h1>
          </div>
        </header>

        <main className="px-4 py-6 flex-1">
          <AttendanceReportView
            performanceData={performanceData}
            recordedSessions={recordedSessions}
            lowAttendancePlayers={lowAttendancePlayers}
          />
        </main>

        <CoachBottomNav currentTab="reports" />
      </div>
    </div>
  );
}
