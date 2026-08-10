import { TopAppBar } from '@/components/layout/TopAppBar';
import { NextCoachingSession } from './_components/NextCoachingSession';
import { AttendanceStats } from './_components/AttendanceStats';
import { CalendarWidget } from './_components/CalendarWidget';
import { BottomNav } from '@/components/layout/BottomNav';
import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/dal';
import { prisma } from '@packages/database';
import { signOut } from '@/app/(auth)/_actions/auth';

export default async function PlayerPage() {
  const user = await requireRole(['player', 'parent']);

  // Fetch player data along with their attendance
  const player = await prisma.player.findFirst({
    where: {
      OR: [
        { user_id: user.id },
        { parents: { some: { parent_user_id: user.id } } }
      ]
    },
    include: {
      attendance: {
        include: { session: true }
      }
    }
  });

  const userName = player ? `${player.first_name} ${player.last_name}` : user.email?.split('@')[0] || 'Player';
  const initials = userName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

  // Attendance Health computations
  let attended = 0;
  let missed = 0;
  let late = 0;
  const total = player?.attendance.length || 0;

  const attendanceMap: Record<number, string> = {};
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  if (player?.attendance) {
    player.attendance.forEach((att: any) => {
      if (att.status === 'PRESENT') attended++;
      else if (att.status === 'ABSENT') missed++;
      else if (att.status === 'LATE') late++;

      const date = new Date(att.session.start_time);
      if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
        attendanceMap[date.getDate()] = att.status;
      }
    });
  }

  const attendanceStats = {
    percentage: total > 0 ? Math.round(((attended + late) / total) * 100) : 0,
    attended: attended + late,
    missed,
    total
  };

  const monthName = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  const nextSession = player ? await prisma.session.findFirst({
    where: {
      start_time: { gt: new Date() },
      attendance: { none: {} },
      location_id: player.location_id,
      batches: {
        some: {
          batch: {
            players: {
              some: { player_id: player.id }
            }
          }
        }
      }
    },
    orderBy: { start_time: 'asc' },
    include: {
      location: true,
      coach: true,
      batches: { include: { batch: true } }
    }
  }) : null;



  return (
    <>
      <div className="bg-slate-100 flex justify-center min-h-screen font-sans text-slate-900 antialiased">
        <div className="w-full max-w-[448px] bg-slate-50 min-h-screen pb-24 relative shadow-2xl shadow-slate-200 flex flex-col overflow-x-hidden">
          <TopAppBar userName={userName} initials={initials} signOut={signOut} />
          
          <main className="flex-1 px-4 py-6 flex flex-col gap-6">
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
