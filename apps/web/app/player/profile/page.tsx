import { TopAppBar } from '../TopAppBar';
import { BottomNav } from '../BottomNav';
import { createClient } from '../../../lib/server';
import { redirect } from 'next/navigation';
import { requireRole } from '../../../lib/dal';
import { prisma } from '../../../../../packages/database';

export default async function PlayerProfilePage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  await requireRole(user.id, ['player', 'parent']);

  // Fetch db user and linked player records
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  const player = await prisma.player.findFirst({
    where: {
      OR: [
        { user_id: user.id },
        { parents: { some: { parent_user_id: user.id } } }
      ]
    },
    include: {
      parents: {
        include: { parent: true }
      }
    }
  });

  const userName = player ? `${player.first_name} ${player.last_name}` : dbUser?.first_name ? `${dbUser.first_name} ${dbUser.last_name}` : 'Player';
  const initials = userName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

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
          </main>

          <BottomNav currentTab="profile" />
        </div>
      </div>
    </>
  );
}