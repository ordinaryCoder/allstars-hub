import { createClient } from '../../lib/server';
import { redirect } from 'next/navigation';
import { requireRole } from '../../lib/dal';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  // TODO: cleanup logic
  if (error || !user) {
    redirect('/login');
  }

  await requireRole(user.id, 'coach');
  // if (!userRole) {
  //   redirect('/onboarding'); // No role = need setup
  // }

  // const perms = userRole.permissions as string[];

  // Routing logic based on permissions
  // if (perms.includes('admin')) {
  //   redirect('/admin');
  // }

  // if (perms.includes('coach')) {
  //   redirect('/coach');
  // }

  // if (!user) {
  //   redirect('/login');
  // }

  // Default fallback
  // redirect('/login');

  async function signOut() {
    'use server';
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/login');
  }

  const userName = user.email?.split('@')[0] || 'Coach';

  
  return (
    <div className="bg-slate-50 text-slate-900 antialiased min-h-screen font-sans">
      <div className="max-w-[448px] mx-auto min-h-screen bg-slate-50 flex flex-col relative pb-24">
        <TopAppBar userName={userName} onSignOut={signOut} />
        
        <main className="flex-1 px-4 py-6 flex flex-col gap-6">
          <QuickStats />
          <TodaySessions />
          <PerformanceTrack />
        </main>

        <BottomNavBar />
      </div>
    </div>
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
          <span className="text-[10px] text-slate-500 font-bold tracking-wider uppercase">Elite Academy</span>
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

function QuickStats() {
  return (
    <section className="grid grid-cols-2 gap-3">
      <div className="col-span-2 bg-slate-900 rounded-2xl p-5 shadow-md flex flex-col justify-between min-h-[160px] relative overflow-hidden group">
        <div className="relative z-10">
          <h1 className="text-xl font-bold text-white mb-1">Ready for practice?</h1>
          <p className="text-sm text-slate-400">3 sessions scheduled for today</p>
        </div>
        <button className="relative z-10 w-full bg-white text-slate-900 text-sm font-medium py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform hover:bg-slate-50">
          <span className="material-symbols-outlined text-[20px]">add_circle</span>
          New Session
        </button>
        <div className="absolute -right-8 -bottom-8 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
          <span className="material-symbols-outlined text-[140px]" style={{ fontVariationSettings: "'FILL' 1" }}>sports_soccer</span>
        </div>
      </div>
    </section>
  );
}

function TodaySessions() {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex justify-between items-center px-1">
        <h2 className="text-lg font-bold text-slate-900">Today's Sessions</h2>
        <button className="text-slate-500 text-xs font-semibold tracking-wider hover:text-slate-700 transition-colors uppercase">View Schedule</button>
      </div>
      <div className="flex flex-col gap-3">
        {/* Session Item 1: Active */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3">
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <h3 className="text-lg font-bold text-slate-900">Advanced Soccer Drills</h3>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center gap-1 text-slate-500">
                  <span className="material-symbols-outlined text-[16px]">schedule</span>
                  <span className="text-sm font-normal">4:00 PM</span>
                </div>
                <div className="flex items-center gap-1 text-slate-500">
                  <span className="material-symbols-outlined text-[16px]">location_on</span>
                  <span className="text-sm font-normal">Field A</span>
                </div>
              </div>
            </div>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[11px] font-bold rounded-full border border-emerald-100">
              ACTIVE
            </span>
          </div>
          <div className="h-[1px] bg-slate-50 w-full"></div>
          <div className="flex justify-between items-center">
            <div className="flex -space-x-2">
              <img className="w-7 h-7 rounded-full border-2 border-white object-cover bg-slate-200" alt="Player 1" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDiHoFp8eAIJgZhwMfaC8m-O6MLFwnYMRNxj1i_HdqEU9WpYUkWAVYpyg4oM9XwJ7AUYdREUsjJBm5oxW6GYHtnZL746ztTjGAVbyankiZnRz1yV9mpjSB_tbXvLCRviJJV-p8fp_lRGrSNnE7WuesDpEBQMmurkV9y6maa7H8R7Qgze9lcvJ8OYHKzQ_cS1E8-BKDRWFJEzgLdoTlL6ppbqsAAnl7oAZdrRbbjugetg0XrKiDqk1rSZUv1f1skgiUpLYg-SaFE4MwL" />
              <img className="w-7 h-7 rounded-full border-2 border-white object-cover bg-slate-200" alt="Player 2" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBkEM-rOQalqXYd-yAvk8blaX7gEm9bHVTdjbUQumVpPHuruf_mkpKhwa-PZEA5Twp8EvJvDkaL8MHwGpf9mGolLR_xLoscBGkjdzgOBQs7SZAdh3zDCK6Fia9VcvN3bKultXEp7qgOm4I0YST0S4Rkpu_tECLBElVfsOi6Kr6X7F-rQxHE3575XnNkJ-lbQiMFu2Zz7X1kfpoWRlaFSUSWP-xFL_ZbiOZ1xgbteOfTXMJ7T4SpC7wXLQ_aOTBNPFWfazTniLImLmDF" />
              <img className="w-7 h-7 rounded-full border-2 border-white object-cover bg-slate-200" alt="Player 3" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBC-9EuIKPPuAQJkIp4iH-UcISETG5ZU5_o54sFkneo4zb8KCQ014iYTFuDZFzdlAXKPP93ulbAVQLwtd1LTQFoPB7nST0gbFvx823ciTyp3ALF5ZXhqabduG7u_S03Jl7ctkh8rnQ9tYDoBZsdSPNMlrrDY_Gd1xQ7FBWP1eZowW7I4TIypZTlYvUxDAu4SPjh6Y9InTnsM8a8CdY24v07aDKEADw4wF670V1Haxvr7dbj9IPbRzwzf-BYTk4BgUwtyADwRH0TBikr" />
              <div className="w-7 h-7 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                +12
              </div>
            </div>
            <button className="bg-slate-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-slate-800 active:scale-95 transition-all">
              Resume
            </button>
          </div>
        </div>

        {/* Session Item 2: Completed */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 opacity-80">
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <h3 className="text-lg font-bold text-slate-500">Junior Basketball Basics</h3>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center gap-1 text-slate-400">
                  <span className="material-symbols-outlined text-[16px]">schedule</span>
                  <span className="text-sm font-normal">5:30 PM</span>
                </div>
                <div className="flex items-center gap-1 text-slate-400">
                  <span className="material-symbols-outlined text-[16px]">location_on</span>
                  <span className="text-sm font-normal">Gym 2</span>
                </div>
              </div>
            </div>
            <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[11px] font-bold rounded-full border border-slate-200">
              COMPLETED
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function PerformanceTrack() {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-bold text-slate-900 px-1">Performance Track</h2>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-2">
          <span className="material-symbols-outlined text-slate-400" style={{ fontVariationSettings: "'FILL' 1" }}>trending_up</span>
          <span className="text-[24px] font-bold text-slate-900">92%</span>
          <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase">Avg. Attendance</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-2">
          <span className="material-symbols-outlined text-slate-400" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
          <span className="text-[24px] font-bold text-slate-900">48</span>
          <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase">Active Players</span>
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