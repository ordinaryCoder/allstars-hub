import { prisma } from '../../../../../packages/database';
import { QuickActions } from './QuickActions';

export async function HomeTab() {
  const activeUsers = await prisma.user.findMany({
    where: { status: 'ACTIVE' },
    include: { academy_roles: true },
  });

  const totalPlayers = activeUsers.filter((user: any) => {
    const perms = user.academy_roles?.[0]?.permissions;
    if (!perms) return false;
    const permStr = Array.isArray(perms) ? perms.join(',').toLowerCase() : String(perms).toLowerCase();
    return permStr.includes('parent') || permStr.includes('player');
  }).length;

  return (
    <>
      {/* KPI Cards Grid */}
      <section className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 flex flex-col items-center text-center">
          <span className="text-xs font-semibold text-slate-500 mb-1">Total Players</span>
          <span className="text-3xl font-bold text-slate-900">{totalPlayers}</span>
          <div className="flex items-center gap-1 text-emerald-500 mt-1">
            <span className="material-symbols-outlined text-[12px]">trending_up</span>
            <span className="text-[10px] font-bold">+5.2%</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 flex flex-col items-center text-center">
          <span className="text-xs font-semibold text-slate-500 mb-1">Today's Att.</span>
          <span className="text-3xl font-bold text-slate-900">94%</span>
          <div className="flex items-center gap-1 text-emerald-500 mt-1">
            <span className="material-symbols-outlined text-[12px]">check_circle</span>
            <span className="text-[10px] font-bold">Optimal</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 flex flex-col items-center text-center">
          <span className="text-xs font-semibold text-slate-500 mb-1">Active</span>
          <span className="text-3xl font-bold text-slate-900">8</span>
          <div className="flex items-center gap-1 text-amber-500 mt-1">
            <span className="material-symbols-outlined text-[12px]">bolt</span>
            <span className="text-[10px] font-bold">Live now</span>
          </div>
        </div>
      </section>

      {/* Analytics Section: Weekly Attendance */}
      <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-slate-900">Weekly Attendance Trend</h2>
          <span className="material-symbols-outlined text-slate-400">more_horiz</span>
        </div>
        <div className="relative h-44 px-2">
          {/* Grid Lines */}
          <div className="absolute inset-0 flex flex-col justify-between py-2 border-b border-slate-100">
            <div className="w-full border-t border-slate-50"></div>
            <div className="w-full border-t border-slate-50"></div>
            <div className="w-full border-t border-slate-50"></div>
            <div className="w-full border-t border-slate-50"></div>
          </div>
          {/* Goal Line */}
          <div className="absolute bottom-[75%] left-0 w-full border-t border-dashed border-emerald-500/40 z-10">
            <span className="absolute -top-4 right-0 text-[8px] font-bold text-emerald-500/60 uppercase">Goal</span>
          </div>
          {/* Bars Container */}
          <div className="relative z-20 flex items-end justify-between h-full pt-4">
            <div className="flex flex-col items-center gap-2 w-full">
              <div className="w-3 bg-slate-100 rounded-full h-32 relative overflow-hidden">
                <div className="absolute bottom-0 left-0 w-full bg-slate-900 h-24 rounded-full"></div>
              </div>
              <span className="text-[10px] font-bold text-slate-400">M</span>
            </div>
            <div className="flex flex-col items-center gap-2 w-full">
              <div className="w-3 bg-slate-100 rounded-full h-32 relative overflow-hidden">
                <div className="absolute bottom-0 left-0 w-full bg-slate-900 h-28 rounded-full"></div>
              </div>
              <span className="text-[10px] font-bold text-slate-400">T</span>
            </div>
            <div className="flex flex-col items-center gap-2 w-full">
              <div className="w-3 bg-slate-100 rounded-full h-32 relative overflow-hidden">
                <div className="absolute bottom-0 left-0 w-full bg-slate-900 h-20 rounded-full"></div>
              </div>
              <span className="text-[10px] font-bold text-slate-400">W</span>
            </div>
            <div className="flex flex-col items-center gap-2 w-full">
              <div className="w-3 bg-slate-100 rounded-full h-32 relative overflow-hidden">
                <div className="absolute bottom-0 left-0 w-full bg-slate-900 h-30 rounded-full"></div>
              </div>
              <span className="text-[10px] font-bold text-slate-400">T</span>
            </div>
            <div className="flex flex-col items-center gap-2 w-full">
              <div className="w-3 bg-slate-100 rounded-full h-32 relative overflow-hidden">
                <div className="absolute bottom-0 left-0 w-full bg-slate-900 h-26 rounded-full"></div>
              </div>
              <span className="text-[10px] font-bold text-slate-400">F</span>
            </div>
            <div className="flex flex-col items-center gap-2 w-full">
              <div className="w-3 bg-slate-100 rounded-full h-32 relative overflow-hidden">
                <div className="absolute bottom-0 left-0 w-full bg-slate-400 h-14 rounded-full"></div>
              </div>
              <span className="text-[10px] font-bold text-slate-400">S</span>
            </div>
            <div className="flex flex-col items-center gap-2 w-full">
              <div className="w-3 bg-slate-100 rounded-full h-32 relative overflow-hidden">
                <div className="absolute bottom-0 left-0 w-full bg-slate-400 h-10 rounded-full"></div>
              </div>
              <span className="text-[10px] font-bold text-slate-400">S</span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions Integration */}
      <QuickActions />

      {/* Recent Activity / Featured Card */}
      <section className="bg-slate-900 rounded-2xl p-5 shadow-md relative overflow-hidden min-h-[160px] flex flex-col justify-end">
        <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
          <span className="material-symbols-outlined !text-[120px] text-white">sports_handball</span>
        </div>
        <div className="relative z-10">
          <p className="text-xs text-slate-400 font-medium">Coming Up Next</p>
          <h3 className="text-lg font-bold text-white mb-2">Advanced Basketball Workshop</h3>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-slate-400">schedule</span>
            <span className="text-xs font-medium text-slate-300">16:30 PM - Court 2</span>
          </div>
        </div>
      </section>
    </>
  )
}