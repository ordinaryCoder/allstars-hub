import { createClient } from '../../lib/server';
import { redirect } from 'next/navigation';
import { requireRole } from '../../lib/dal';
import { ACADEMY_NAME } from '@/lib/constant';
import { TodaySessions } from './_components/TodaySessions';
import { prisma } from '@packages/database';
import { PerformanceTrack } from './_components/PerformanceTrack';
import { signOut } from '@/app/(auth)/_actions/auth';
import { TopAppBar } from '@/components/layout/TopAppBar';
import { CoachBottomNav } from '@/components/layout/CoachBottomNav';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  // TODO: cleanup logic
  if (error || !user) {
    redirect('/login');
  }

  await requireRole(user.id, 'coach');

  const userName = user.email?.split('@')[0] || 'Coach';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const coachLocations = await prisma.coachLocation.findMany({
    where: { user_id: user.id },
    select: { location_id: true },
  });
  const coachLocationIds = coachLocations.map((cl) => cl.location_id);

  const todaySessions = await prisma.session.findMany({
    where: {
      start_time: {
        gte: today,
        lt: tomorrow,
      },
      OR: [
        { coach_id: user.id },
        { created_by: user.id },
        {
          coach_id: null,
          location_id: { in: coachLocationIds },
        },
      ],
    },
    include: {
      location: true,
      attendance: { select: { id: true } },
    },
    orderBy: { start_time: 'asc' },
  });
  
  const now = new Date();
  const futureSessionsCount = todaySessions.filter(
    (s) => new Date(s.start_time) > now && s.attendance.length === 0
  ).length;

  return (
    <>
      <div className="bg-slate-50 text-slate-900 antialiased min-h-screen font-sans">
        <div className="max-w-[448px] mx-auto min-h-screen bg-slate-50 flex flex-col relative pb-24">
          <TopAppBar userName={userName} signOut={signOut} />
          
          <main className="flex-1 px-4 py-6 flex flex-col gap-6">
            <CreateSessionCard futureSessionsCount={futureSessionsCount} />
            <TodaySessions sessions={todaySessions} />
          </main>

          <CoachBottomNav currentTab="home" />
        </div>
      </div>
    </>
  );
}

// --- Components ---

function CreateSessionCard({ futureSessionsCount }: { futureSessionsCount: number }) {
  return (
    <section className="grid grid-cols-2 gap-3">
      <div className="col-span-2 bg-slate-900 rounded-2xl p-5 shadow-md flex flex-col justify-between min-h-[100px] relative overflow-hidden group">
        {futureSessionsCount > 0 && (
          <div className="relative z-10 mb-3">
            <p className="text-sm text-slate-400">
              {futureSessionsCount} session{futureSessionsCount !== 1 ? 's' : ''} scheduled for today
            </p>
          </div>
        )}
        <a href="/coach/new-session" className="relative z-10 w-full bg-white text-slate-900 text-sm font-medium py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform hover:bg-slate-50">
          <span className="material-symbols-outlined text-[20px]">add_circle</span>
          Mark Attendance
        </a>
        <div className="absolute -right-8 -bottom-8 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
          <span className="material-symbols-outlined text-[140px]" style={{ fontVariationSettings: "'FILL' 1" }}>sports_soccer</span>
        </div>
      </div>
    </section>
  );
}