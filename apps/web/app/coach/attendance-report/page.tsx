import Link from 'next/link';
import { createClient } from '../../../lib/server';
import { prisma } from '../../../../../packages/database';
import { redirect } from 'next/navigation';
import { requireRole } from '../../../lib/dal';
import DateFilterDropdown from './_components/DateFilterDropdown';

export default async function AttendanceReportPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }
  await requireRole(user.id, 'coach');

  const params = await searchParams;
  const days = Number(params.days) || 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const sessions = await prisma.session.findMany({
    where: {
      coach_id: user.id,
      start_time: { gte: startDate },
    },
    include: {
      attendance: { where: { status: 'PRESENT' } },
      batches: { include: { batch: { include: { players: { select: { player_id: true } } } } } },
    },
  });

  const playerStats = new Map<string, { expected: number; attended: number }>();

  for (const session of sessions) {
    const expectedPlayerIds = new Set<string>();
    for (const sb of session.batches) {
      for (const pb of sb.batch.players) {
        expectedPlayerIds.add(pb.player_id);
      }
    }

    for (const playerId of expectedPlayerIds) {
      const stats = playerStats.get(playerId) || { expected: 0, attended: 0 };
      stats.expected++;
      playerStats.set(playerId, stats);
    }

    for (const attendance of session.attendance) {
      if (playerStats.has(attendance.player_id)) {
        playerStats.get(attendance.player_id)!.attended++;
      }
    }
  }

  const allStats = Array.from(playerStats.values());
  const totalAttended = allStats.reduce((sum, s) => sum + s.attended, 0);
  const totalExpected = allStats.reduce((sum, s) => sum + s.expected, 0);
  const avgAttendance = totalExpected > 0 ? Math.round((totalAttended / totalExpected) * 100) : 0;

  const perfectRecordPlayers = allStats.filter(s => s.expected > 0 && s.expected === s.attended).length;

  const lowAttendancePlayersData = Array.from(playerStats.entries())
    .map(([playerId, stats]) => {
      if (stats.expected === 0) return null;
      const percentage = (stats.attended / stats.expected) * 100;
      if (percentage < 80) { // Low attendance threshold: 80%
        return {
          playerId,
          attendancePercentage: Math.round(percentage),
          absences: stats.expected - stats.attended,
        };
      }
      return null;
    })
    .filter((p): p is NonNullable<typeof p> => p !== null)
    .sort((a, b) => a.attendancePercentage - b.attendancePercentage);

  const lowAttendancePlayerDetails = await prisma.player.findMany({
    where: { id: { in: lowAttendancePlayersData.map(p => p.playerId) } },
    select: {
      id: true,
      first_name: true,
      last_name: true,
      batches: { include: { batch: { select: { name: true } } } },
    },
  });
  const playerDetailsMap = new Map(lowAttendancePlayerDetails.map(p => [p.id, p]));

  const lowAttendancePlayers = lowAttendancePlayersData.map(p => {
    const details = playerDetailsMap.get(p.playerId);
    return {
      id: p.playerId,
      name: `${details?.first_name} ${details?.last_name}`,
      batch: details?.batches[0]?.batch.name || 'N/A',
      attendancePercentage: p.attendancePercentage,
      absences: p.absences,
    };
  });

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      <style dangerouslySetInnerHTML={{ __html: `
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
        body { font-family: 'Inter', sans-serif; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      <div className="bg-slate-50 text-slate-900 antialiased min-h-screen font-sans">
        <div className="max-w-[448px] mx-auto min-h-screen bg-slate-50 flex flex-col relative pb-8">

        {/* TopAppBar */}
        <header className="flex items-center justify-between px-4 h-16 w-full sticky top-0 z-50 bg-white border-b border-black/10 shadow-sm">
          <div className="flex items-center gap-4 w-full">
            <Link 
              href="/coach" 
              aria-label="Go back" 
              className="flex items-center justify-center w-11 h-11 -ml-2 rounded-full text-slate-900 active:opacity-70 transition-opacity duration-150"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>
            <h1 className="font-semibold text-lg tracking-tight text-slate-900">Attendance Report</h1>
          </div>
          <button className="flex items-center justify-center w-11 h-11 -mr-2 rounded-full text-slate-900 active:opacity-70 transition-opacity duration-150">
              <span className="material-symbols-outlined text-slate-900">ios_share</span>
            </button>
        </header>

        <main className="px-4 py-6 space-y-6">
          <section className="hide-scrollbar flex overflow-x-auto gap-2 -mx-4 px-4 pb-2">
            <DateFilterDropdown currentDays={days} />
          </section>

          <section className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
              <div>
                <p className="text-slate-500 text-sm mb-1">Avg Attendance</p>
                <h2 className="text-4xl font-bold text-green-500">{avgAttendance}%</h2>
              </div>
              <div className="mt-4 h-8 w-full flex items-end gap-1">
                <div className="flex-1 bg-green-100 h-2/3 rounded-t-sm"></div>
                <div className="flex-1 bg-green-100 h-3/4 rounded-t-sm"></div>
                <div className="flex-1 bg-green-200 h-1/2 rounded-t-sm"></div>
                <div className="flex-1 bg-green-300 h-2/3 rounded-t-sm"></div>
                <div className="flex-1 bg-green-500 h-full rounded-t-sm"></div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
              <div>
                <p className="text-slate-500 text-sm mb-1">Perfect Record</p>
                <h2 className="text-4xl font-bold text-slate-900">{perfectRecordPlayers} Players</h2>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Low Attendance Flags</h3>
              <span className="material-symbols-outlined text-red-500">warning</span>
            </div>
            <div className="space-y-3">
              {lowAttendancePlayers.length > 0 ? (
                lowAttendancePlayers.map(player => (
                  <div key={player.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img alt={player.name} className="w-10 h-10 rounded-full object-cover" src={`https://api.dicebear.com/8.x/initials/svg?seed=${player.name}`} />
                      <div>
                        <h4 className="font-medium">{player.name}</h4>
                        <p className="text-sm text-slate-500">{player.batch}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-red-500">{player.attendancePercentage}%</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{player.absences} Absences</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">No players with low attendance.</p>
              )}
            </div>
          </section>
        </main>
        </div>
      </div>
    </>
  );
}
