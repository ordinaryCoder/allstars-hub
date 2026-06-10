import { createClient } from '../../lib/server';
import { redirect } from 'next/navigation';
import { requireRole } from '../../lib/dal';
import { ACADEMY_NAME } from '@/lib/constant';
import { TodaySessions } from './TodaySessions';
import { prisma } from '../../../../packages/database';
import { PerformanceTrack } from './PerformanceTrack';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  // TODO: cleanup logic
  if (error || !user) {
    redirect('/login');
  }

  await requireRole(user.id, 'coach');

  async function signOut() {
    'use server';
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/login');
  }

  const userName = user.email?.split('@')[0] || 'Coach';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todaySessions = await prisma.session.findMany({
    where: {
      created_by: user.id,
      start_time: {
        gte: today,
        lt: tomorrow,
      },
    },
    include: {
      location: true,
      batches: { include: { batch: true } },
    },
    orderBy: { start_time: 'asc' },
  });
  
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const pastSessions = await prisma.session.findMany({
    where: {
      created_by: user.id,
      start_time: { gte: thirtyDaysAgo, lt: today },
    },
    include: {
      batches: { include: { batch: { include: { players: true } } } },
      attendance: true,
    },
  });

  let weeklyExpected = 0, weeklyAttended = 0;
  let monthlyExpected = 0, monthlyAttended = 0;
  const weeklyPlayers = new Set();
  const monthlyPlayers = new Set();

  pastSessions.forEach(session => {
    const isWeekly = session.start_time >= sevenDaysAgo;
    const uniqueSessionPlayers = new Set();
    
    session.batches.forEach(sb => {
      sb.batch?.players?.forEach(pb => {
        uniqueSessionPlayers.add(pb.player_id);
        monthlyPlayers.add(pb.player_id);
        if (isWeekly) weeklyPlayers.add(pb.player_id);
      });
    });

    const expectedForSession = uniqueSessionPlayers.size;
    const attendedForSession = session.attendance.length;

    monthlyExpected += expectedForSession;
    monthlyAttended += attendedForSession;

    if (isWeekly) {
      weeklyExpected += expectedForSession;
      weeklyAttended += attendedForSession;
    }
  });

  const performanceData = {
    weeklyAvgAttendance: weeklyExpected > 0 ? Math.round((weeklyAttended / weeklyExpected) * 100) : 0,
    monthlyAvgAttendance: monthlyExpected > 0 ? Math.round((monthlyAttended / monthlyExpected) * 100) : 0,
    weeklyActivePlayers: weeklyPlayers.size,
    monthlyActivePlayers: monthlyPlayers.size,
  };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      <style dangerouslySetInnerHTML={{ __html: `
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
      `}} />
      <div className="bg-slate-50 text-slate-900 antialiased min-h-screen font-sans">
        <div className="max-w-[448px] mx-auto min-h-screen bg-slate-50 flex flex-col relative pb-24">
          <TopAppBar userName={userName} onSignOut={signOut} />
          
          <main className="flex-1 px-4 py-6 flex flex-col gap-6">
            <CreateSessionCard sessionCount={todaySessions.length} />
            <TodaySessions sessions={todaySessions} />
            <PerformanceTrack data={performanceData} />
          </main>

          <BottomNavBar />
        </div>
      </div>
    </>
  );
}

// --- Components ---
function TopAppBar({ userName, onSignOut }: { userName: string, onSignOut: () => void }) {
  return ( 
    <header className="flex justify-between items-center w-full px-4 h-16 sticky top-0 z-50 bg-white shadow-sm border-b border-slate-200">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 border border-slate-200">
          <img 
            className="w-full h-full object-cover" 
            alt="Coach portrait" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAF_ijyJv_7kOvUm_2mE7dVIU5VzYjmYlfCnFj4wJ0wFi9OrXCGW96OWMJGISSnd3LqLy-m3a-WV2c78GfOJS9r3kR5q8M1EF8xnzHAD55ijit7B1E2gyJj_ID6QOQKXpnTbp-jgqZ8p7unZr2Ir0VXiLyNs48uDNFwOhfe91qXUg_qcCbIZ7tFNrpPVkeiekhnWP9c63hvQMO0pp2cPdUmV9Vs3xGuScsV4NKmapUG6DXehItJKloVpXNqVR9vHIdoteqF6XilE5zz"
          />
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-base text-slate-900 capitalize">{userName}</span>
          <span className="text-[10px] text-slate-500 font-bold tracking-wider uppercase">{ACADEMY_NAME}</span>
        </div>
      </div>
      <form action={onSignOut}>
        <button type="submit" className="bg-slate-100 p-2 rounded-full text-slate-900 active:scale-95 transition-transform duration-150 hover:bg-slate-200 flex items-center justify-center">
          <span className="material-symbols-outlined">logout</span>
        </button>
      </form>
    </header>
  );
}

function CreateSessionCard({ sessionCount }: { sessionCount: number }) {
  return (
    <section className="grid grid-cols-2 gap-3">
      <div className="col-span-2 bg-slate-900 rounded-2xl p-5 shadow-md flex flex-col justify-between min-h-[120px] relative overflow-hidden group">
        <div className="relative z-10">
          <p className="text-sm text-slate-400">{sessionCount} session{sessionCount !== 1 ? 's' : ''} scheduled for today</p>
        </div>
        <a href="/coach/new-session" className="relative z-10 w-full bg-white text-slate-900 text-sm font-medium py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform hover:bg-slate-50">
          <span className="material-symbols-outlined text-[20px]">add_circle</span>
          New Session
        </a>
        <div className="absolute -right-8 -bottom-8 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
          <span className="material-symbols-outlined text-[140px]" style={{ fontVariationSettings: "'FILL' 1" }}>sports_soccer</span>
        </div>
      </div>
    </section>
  );
}

function BottomNavBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-[448px] mx-auto w-full z-50 flex justify-around items-center h-20 px-2 pb-2 bg-white border-t border-slate-200 shadow-[0_-1px_3px_0_rgba(0,0,0,0.05)]" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <a className="flex flex-col items-center justify-center text-slate-900 bg-slate-100 rounded-2xl px-4 py-1 transition-opacity active:opacity-80" href="#">
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
        <span className="text-[11px] font-medium mt-1">Home</span>
      </a>
      <a className="flex flex-col items-center justify-center text-slate-500 hover:bg-slate-50 rounded-2xl px-4 py-1 transition-opacity active:opacity-80" href="#">
        <span className="material-symbols-outlined">group</span>
        <span className="text-[11px] font-medium mt-1">Players</span>
      </a>
      <a className="flex flex-col items-center justify-center text-slate-500 hover:bg-slate-50 rounded-2xl px-4 py-1 transition-opacity active:opacity-80" href="#">
        <span className="material-symbols-outlined">person</span>
        <span className="text-[11px] font-medium mt-1">Profile</span>
      </a>
    </nav>
  );
}