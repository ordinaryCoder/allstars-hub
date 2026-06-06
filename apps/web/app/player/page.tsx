import { TopAppBar } from './TopAppBar';
import { NextSession } from './NextSession';
import { SessionGoals } from './SessionGoals';
import { AttendanceHealth } from './AttendanceHealth';
import { CalendarWidget } from './CalendarWidget';
import { BottomNav } from './BottomNav';
import { createClient } from '../../lib/server';
import { redirect } from 'next/navigation';
import { requireRole } from '../../lib/dal';
import { prisma } from '../../../../packages/database';

export default async function PlayerPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  await requireRole(user.id, 'player');

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
      if (att.status === 'Present') attended++;
      else if (att.status === 'Absent') missed++;
      else if (att.status === 'Late') late++;

      const date = new Date(att.session.start_time);
      if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
        attendanceMap[date.getDate()] = att.status;
      }
    });
  }

  const attendanceHealth = {
    percentage: total > 0 ? Math.round(((attended + late) / total) * 100) : 0,
    attended: attended + late,
    missed,
    total
  };

  const monthName = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  async function signOut() {
    'use server';
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/login');
  }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      <style dangerouslySetInnerHTML={{ __html: `
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
      `}} />
      <div className="bg-slate-100 flex justify-center min-h-screen font-sans text-slate-900 antialiased">
        <div className="w-full max-w-[448px] bg-slate-50 min-h-screen pb-24 relative shadow-2xl shadow-slate-200 flex flex-col overflow-x-hidden">
          <TopAppBar userName={userName} initials={initials} signOut={signOut} />
          
          <main className="flex-1 px-4 py-6 flex flex-col gap-6">
            <NextSession />
            <SessionGoals />
            <AttendanceHealth stats={attendanceHealth} />
            <CalendarWidget monthName={monthName} attendanceMap={attendanceMap} />
          </main>

          <BottomNav />
        </div>
      </div>
    </>
  );
}
