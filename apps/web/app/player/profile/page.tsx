import { TopAppBar } from '@/components/layout/TopAppBar';
import { BottomNav } from '@/components/layout/BottomNav';
import { requireRole } from '@/lib/dal';
import { getUserProfileDataCached } from '@/lib/cached-queries';
import { signOut } from '@/app/(auth)/_actions/auth';
import { ChangePasswordButton } from '@/components/ui/ChangePasswordButton';

export default async function PlayerProfilePage() {
  const user = await requireRole(['player', 'parent']);

  const { dbUser, player } = await getUserProfileDataCached(user.id);

  const userName = player ? `${player.first_name} ${player.last_name}` : dbUser?.first_name ? `${dbUser.first_name} ${dbUser.last_name}` : 'Player';
  const initials = userName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();



  return (
    <>
      <div className="bg-slate-100 flex justify-center min-h-screen font-sans text-slate-900 antialiased">
        <div className="w-full max-w-[448px] bg-slate-50 min-h-screen pb-24 relative shadow-2xl shadow-slate-200 flex flex-col overflow-x-hidden">
          <TopAppBar userName={userName} initials={initials} signOut={signOut} />
          
          <main className="flex-1 px-4 py-6 flex flex-col gap-6">
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 mb-4 overflow-hidden border-4 border-slate-50 shadow-inner">
                <span className="material-symbols-outlined text-[48px]">person</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900">{userName}</h2>
              <p className="text-sm text-slate-500 mt-1">{player ? 'Player Account' : 'Parent Account'}</p>
            </section>

            <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-50 pb-2">Profile Information</h3>
              
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-400">Registered Email</span>
                <span className="text-sm font-medium text-slate-900">{dbUser?.email || user.email}</span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-400">Phone Number</span>
                <span className="text-sm font-medium text-slate-900">{dbUser?.mobile_number || 'Not Provided'}</span>
              </div>
            </section>

            {/* Account Security */}
            <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-50 pb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-slate-500">security</span>
                Account Security
              </h3>
              <ChangePasswordButton />
            </section>

            {/* Sign Out */}
            <section>
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

          <BottomNav currentTab="profile" />
        </div>
      </div>
    </>
  );
}