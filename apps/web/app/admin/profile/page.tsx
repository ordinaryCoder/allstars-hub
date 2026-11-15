import { TopAppBar } from '@/components/layout/TopAppBar';
import { BottomNavBar } from '@/app/admin/_components/BottomNavBar';
import { requireRole } from '@/lib/dal';
import { prisma } from '@packages/database';
import { signOut } from '@/app/(auth)/_actions/auth';
import { ChangePasswordButton } from '@/components/ui/ChangePasswordButton';

export default async function AdminProfilePage() {
  const user = await requireRole('admin');

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      first_name: true,
      last_name: true,
      email: true,
      mobile_number: true,
      created_at: true,
    },
  });

  const adminName = dbUser?.first_name && dbUser?.last_name
    ? `${dbUser.first_name} ${dbUser.last_name}`.trim()
    : user.email?.split('@')[0] || 'Admin';

  const initials = adminName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const joinedDate = dbUser?.created_at
    ? new Date(dbUser.created_at).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

  return (
    <div className="bg-slate-100 flex justify-center min-h-screen font-sans text-slate-900 antialiased">
      <div className="w-full max-w-[448px] bg-slate-50 min-h-screen pb-24 relative shadow-2xl shadow-slate-200 flex flex-col overflow-x-hidden">
        <TopAppBar
          title="Admin Profile"
          backHref="/admin"
          userName={adminName}
          initials={initials}
          signOut={signOut}
        />

        <main className="flex-1 px-4 py-6 flex flex-col gap-6">
          {/* Main Admin Card */}
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-2xl mb-3 shadow-inner">
              {initials}
            </div>
            <h2 className="text-xl font-bold text-slate-900">{adminName}</h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 mt-1.5">
              Administrator
            </span>
          </section>

          {/* Profile Details */}
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2 border-b border-slate-50 pb-2">
              Profile Information
            </h3>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-400">Registered Email</span>
              <span className="text-sm font-medium text-slate-900">{dbUser?.email || user.email}</span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-400">Phone Number</span>
              <span className="text-sm font-medium text-slate-900">
                {dbUser?.mobile_number ? `+91 ${dbUser.mobile_number}` : 'Not Provided'}
              </span>
            </div>

            {joinedDate && (
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-400">Account Created</span>
                <span className="text-sm font-medium text-slate-900">{joinedDate}</span>
              </div>
            )}
          </section>

          {/* Account Security */}
          <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-50 pb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-slate-500">security</span>
              Account Security
            </h3>
            <ChangePasswordButton />
          </section>
        </main>

        <BottomNavBar currentTab="home" />
      </div>
    </div>
  );
}
