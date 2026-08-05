import { createClient } from '@/lib/server';
import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/dal';
import { prisma } from '@packages/database';
import { signOut } from '@/app/(auth)/_actions/auth';
import { CoachBottomNav } from '@/components/layout/CoachBottomNav';
import { ACADEMY_NAME } from '@/lib/constant';
import { ChangePasswordButton } from '@/components/ui/ChangePasswordButton';

export default async function CoachProfilePage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  await requireRole(user.id, 'coach');

  // Fetch coach user & locations from database
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      coachLocations: {
        include: {
          location: true,
        },
      },
      academy_roles: {
        include: {
          academy: true,
        },
      },
    },
  });

  const coachName = dbUser?.first_name && dbUser?.last_name
    ? `${dbUser.first_name} ${dbUser.last_name}`
    : user.email?.split('@')[0] || 'Coach';

  const initials = coachName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  // Fetch total sessions coached/created by this coach
  const totalSessions = await prisma.session.count({
    where: {
      OR: [
        { created_by: user.id },
        { coach_id: user.id },
      ],
    },
  });

  // Fetch count of active players across coach's assigned locations
  const activePlayersCount = await prisma.player.count({
    where: {
      is_active: true,
      location: {
        coachLocations: {
          some: { user_id: user.id },
        },
      },
    },
  });

  const assignedLocations = dbUser?.coachLocations.map((cl) => cl.location) || [];

  const joinedDate = dbUser?.created_at
    ? new Date(dbUser.created_at).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      })
    : null;

  return (
    <div className="bg-slate-50 text-slate-900 antialiased min-h-screen font-sans">
      <div className="max-w-[448px] mx-auto min-h-screen bg-slate-50 flex flex-col relative pb-24 shadow-sm border-x border-slate-200/50">
        {/* Header */}
        <header className="flex justify-between items-center w-full px-4 h-16 sticky top-0 z-50 bg-white shadow-sm border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-700 text-[24px]">account_circle</span>
            <h1 className="font-bold text-lg text-slate-900">Coach Profile</h1>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors active:scale-95 flex items-center justify-center"
              title="Sign Out"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </form>
        </header>

        {/* Content */}
        <main className="flex-1 px-4 py-6 flex flex-col gap-6">
          {/* Main Coach Card */}
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800" />

            <div className="w-20 h-20 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-2xl mb-3 shadow-md border-4 border-white">
              {initials}
            </div>

            <h2 className="text-xl font-bold text-slate-900 capitalize leading-tight">
              {coachName}
            </h2>

            <div className="flex items-center gap-2 mt-1">
              <span className="bg-indigo-50 text-indigo-700 font-bold text-[11px] px-2.5 py-0.5 rounded-full border border-indigo-100 uppercase tracking-wide">
                Coach
              </span>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {ACADEMY_NAME}
              </span>
            </div>
          </section>

          {/* Quick Stats Grid */}
          <section className="grid grid-cols-3 gap-3">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col items-center text-center">
              <span className="text-xl font-black text-slate-900">{assignedLocations.length}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                Locations
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col items-center text-center">
              <span className="text-xl font-black text-slate-900">{totalSessions}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                Sessions
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col items-center text-center">
              <span className="text-xl font-black text-slate-900">{activePlayersCount}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                Players
              </span>
            </div>
          </section>

          {/* Basic Profile Details Card */}
          <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2.5 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-slate-500">badge</span>
              Basic Details
            </h3>

            <div className="grid grid-cols-1 gap-3.5">
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] font-semibold text-slate-400">Full Name</span>
                <span className="text-sm font-medium text-slate-900 capitalize">{coachName}</span>
              </div>

              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] font-semibold text-slate-400">Email Address</span>
                <span className="text-sm font-medium text-slate-900">{dbUser?.email || user.email}</span>
              </div>

              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] font-semibold text-slate-400">Mobile Number</span>
                <span className="text-sm font-medium text-slate-900">
                  {dbUser?.mobile_number || 'Not provided'}
                </span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] font-semibold text-slate-400">Account Status</span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md inline-block w-fit">
                    {dbUser?.status || 'ACTIVE'}
                  </span>
                </div>

                {joinedDate && (
                  <div className="flex flex-col gap-0.5 text-right">
                    <span className="text-[11px] font-semibold text-slate-400">Member Since</span>
                    <span className="text-xs font-semibold text-slate-700">{joinedDate}</span>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Assigned Locations Card */}
          <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2.5 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-slate-500">location_on</span>
              Assigned Locations ({assignedLocations.length})
            </h3>

            {assignedLocations.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No assigned locations found.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {assignedLocations.map((loc) => (
                  <div
                    key={loc.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                        <span className="material-symbols-outlined text-[18px]">domain</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-900">{loc.name}</span>
                        {loc.address && (
                          <span className="text-[11px] text-slate-500">{loc.address}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Change Password */}
          <section className="space-y-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider px-1 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-slate-500">security</span>
              Account Security
            </h3>
            <ChangePasswordButton />
          </section>

          {/* Sign Out Action */}
          <section className="pt-2">
            <form action={signOut}>
              <button
                type="submit"
                className="w-full bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600 border border-slate-200 hover:border-red-200 font-semibold py-3 rounded-xl transition-colors active:scale-95 flex items-center justify-center gap-2 text-sm"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                Sign Out
              </button>
            </form>
          </section>
        </main>

        <CoachBottomNav currentTab="profile" />
      </div>
    </div>
  );
}
