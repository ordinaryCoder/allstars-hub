import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/dal';
import { prisma } from '@packages/database';
import { TopAppBar } from '@/components/layout/TopAppBar';
import { BottomNavBar } from '@/app/admin/_components/BottomNavBar';
import { signOut } from '@/app/(auth)/_actions/auth';
import { getPendingUserSignupDetails } from '@/app/admin/_actions/action';

export default async function AdminPendingUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const adminUser = await requireRole('admin');
  const { id } = await params;

  const [dbUser, details] = await Promise.all([
    prisma.user.findUnique({
      where: { id: adminUser.id },
      select: { first_name: true, last_name: true },
    }),
    getPendingUserSignupDetails(id).catch(() => null),
  ]);

  if (!details || !details.user) {
    notFound();
  }

  const { user } = details;

  const adminName = dbUser
    ? `${dbUser.first_name} ${dbUser.last_name}`.trim()
    : adminUser.email || 'Admin';

  const adminInitials = dbUser
    ? `${dbUser.first_name?.[0] || ''}${dbUser.last_name?.[0] || ''}`.toUpperCase() || 'A'
    : (adminUser.email?.[0] || 'A').toUpperCase();

  const userInitials = details.firstName && details.lastName
    ? `${details.firstName[0]}${details.lastName[0]}`.toUpperCase()
    : (user.first_name?.[0] || 'U').toUpperCase();

  const registeredAtText = user.created_at
    ? new Date(user.created_at).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Unknown';

  const isParentRole = details.role === 'parent';

  return (
    <div className="bg-slate-100 flex justify-center min-h-screen font-sans text-slate-900 antialiased">
      <div className="w-full max-w-[448px] bg-slate-50 min-h-screen pb-28 relative shadow-2xl shadow-slate-200 flex flex-col overflow-x-hidden">
        <TopAppBar userName={adminName} initials={adminInitials} signOut={signOut} />

        <main className="flex-1 p-4 space-y-4">
          {/* Back Navigation Bar */}
          <div className="flex items-center justify-between">
            <Link
              href="/admin?tab=users"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>Back to Users</span>
            </Link>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              Pending Approval
            </span>
          </div>

          {/* Pending User Header Card */}
          <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold text-xl uppercase shadow-sm shrink-0">
              {userInitials}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-slate-900 truncate">
                {isParentRole && details.guardianName
                  ? details.guardianName
                  : `${details.firstName} ${details.lastName}`.trim() || user.email}
              </h2>
              <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                <span className="material-symbols-outlined text-[15px] text-slate-400">mail</span>
                <span className="truncate">{user.email}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                <span className="material-symbols-outlined text-[15px] text-slate-400">badge</span>
                <span className="capitalize">{details.role} Signup</span>
              </div>
            </div>
          </section>

          {/* Prospective Player Details (from Signup Form Metadata) */}
          <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-3.5">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              Prospective Player Details
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 font-medium block">Player Name</span>
                <span className="text-slate-800 font-semibold mt-0.5 block">
                  {details.firstName} {details.lastName}
                </span>
              </div>

              <div>
                <span className="text-slate-400 font-medium block">Role</span>
                <span className="text-slate-800 font-semibold mt-0.5 block capitalize">
                  {details.role}
                </span>
              </div>

              <div>
                <span className="text-slate-400 font-medium block">Mobile Number</span>
                <span className="text-slate-800 font-semibold mt-0.5 block">
                  {details.mobileNumber ? `+91 ${details.mobileNumber}` : 'Not Provided'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 font-medium block">Date of Birth</span>
                <span className="text-slate-800 font-semibold mt-0.5 block">
                  {details.dob || 'Not Provided'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 font-medium block">Target Location</span>
                <span className="text-slate-800 font-semibold mt-0.5 block">
                  {details.locationName || 'Not Set'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 font-medium block">Signed Up On</span>
                <span className="text-slate-800 font-semibold mt-0.5 block">
                  {registeredAtText}
                </span>
              </div>
            </div>

            {isParentRole && details.guardianName && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-400 font-medium block text-xs">Parent / Guardian Name</span>
                <span className="text-slate-800 font-semibold text-xs mt-0.5 block">
                  {details.guardianName}
                </span>
              </div>
            )}
          </section>

          {/* Status & Review Notice */}
          <section className="bg-amber-50/60 border border-amber-200 rounded-2xl p-5 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
              <span className="material-symbols-outlined text-[18px] text-amber-600">info</span>
              <span>Pending Admin Review</span>
            </div>
            <p className="text-xs text-amber-900/80 leading-relaxed">
              This user has verified their email address and is awaiting your review. To approve this signup and check for duplicate roster records, return to the Users Board and click <strong>&quot;Review / Approve&quot;</strong>.
            </p>
            <div className="pt-2">
              <Link
                href="/admin?tab=users"
                className="w-full h-11 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span>Go to Pending Review on Users Board</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>
          </section>
        </main>

        <BottomNavBar currentTab="users" />
      </div>
    </div>
  );
}
