import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/dal';
import { prisma } from '@packages/database';
import { TopAppBar } from '@/components/layout/TopAppBar';
import { BottomNavBar } from '@/app/admin/_components/BottomNavBar';
import { signOut } from '@/app/(auth)/_actions/auth';
import { getPlayerDetailAdmin, getFilterOptionsAdmin } from '@/app/admin/_actions/action';
import { EditPlayerForm } from './EditPlayerForm';

export default async function AdminPlayerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const adminUser = await requireRole('admin');
  const { id } = await params;

  const [dbUser, result, { locations }] = await Promise.all([
    prisma.user.findUnique({
      where: { id: adminUser.id },
      select: { first_name: true, last_name: true },
    }),
    getPlayerDetailAdmin(id),
    getFilterOptionsAdmin(),
  ]);

  if (!result || !result.player) {
    notFound();
  }

  const { player } = result;

  const adminName = dbUser
    ? `${dbUser.first_name} ${dbUser.last_name}`.trim()
    : adminUser.email || 'Admin';

  const adminInitials = dbUser
    ? `${dbUser.first_name?.[0] || ''}${dbUser.last_name?.[0] || ''}`.toUpperCase() || 'A'
    : (adminUser.email?.[0] || 'A').toUpperCase();

  return (
    <div className="bg-slate-100 flex justify-center min-h-screen font-sans text-slate-900 antialiased">
      <div className="w-full max-w-[448px] bg-slate-50 min-h-screen pb-28 relative shadow-2xl shadow-slate-200 flex flex-col overflow-x-hidden">
        <TopAppBar
          title="Player Details"
          backHref="/admin?tab=users"
          userName={adminName}
          initials={adminInitials}
          signOut={signOut}
        />

        <main className="flex-1 p-4 space-y-4">
          {/* Status Badge */}
          <div className="flex items-center justify-end">
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                player.is_active
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-100 text-slate-500 border border-slate-200'
              }`}
            >
              {player.is_active ? 'Active Roster' : 'Inactive Player'}
            </span>
          </div>

          {/* Editable Player Details — top */}
          <EditPlayerForm
            playerId={player.id}
            locations={locations}
            initial={{
              firstName: player.first_name,
              lastName: player.last_name,
              mobileNumber: player.mobile_number,
              email: player.email ?? '',
              dob: player.dob ? player.dob.toISOString().split('T')[0] : '',
              locationId: player.location?.id ?? '',
            }}
          />

          {/* Account Linkage Section */}
          <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              Account Linkage &amp; Guardians
            </h3>

            {player.linked_user && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">person</span>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-900 block">
                      {player.linked_user.first_name} {player.linked_user.last_name}
                    </span>
                    <span className="text-[11px] text-slate-500 block">Self-Login Account</span>
                  </div>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {player.linked_user.status}
                </span>
              </div>
            )}

            {player.parents.length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Parent / Guardian Accounts
                </span>
                {player.parents.map((p) => (
                  <div
                    key={p.id}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[18px]">family_restroom</span>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-900 block">
                          {p.first_name} {p.last_name}
                        </span>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          {p.mobile_number && <span>+91 {p.mobile_number}</span>}
                          {p.email && <span>• {p.email}</span>}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {!player.linked_user && player.parents.length === 0 && (
              <div className="text-center py-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                <span className="material-symbols-outlined text-slate-400 text-[24px]">person_off</span>
                <p className="text-xs text-slate-500 mt-1">No login credentials linked yet.</p>
                <p className="text-[11px] text-slate-400">Player was created directly onto the roster by admin.</p>
              </div>
            )}
          </section>
        </main>

        <BottomNavBar currentTab="users" />
      </div>
    </div>
  );
}
