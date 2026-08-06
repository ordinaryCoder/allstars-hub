import { createClient } from '@/lib/server';
import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/dal';
import { prisma } from '@packages/database';
import { TopAppBar } from '@/components/layout/TopAppBar';
import { BottomNavBar } from '../_components/BottomNavBar';
import { signOut } from '@/app/(auth)/_actions/auth';
import { CreateSessionForm, type LocationItem, type CoachItem } from './_components/CreateSessionForm';

export default async function CreateSessionPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  await requireRole(user.id, 'admin');

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { first_name: true, last_name: true },
  });

  const adminName = dbUser
    ? `${dbUser.first_name} ${dbUser.last_name}`.trim()
    : user.email || 'Admin';

  const adminInitials = dbUser
    ? `${dbUser.first_name?.[0] || ''}${dbUser.last_name?.[0] || ''}`.toUpperCase() || 'A'
    : (user.email?.[0] || 'A').toUpperCase();

  // 1. Fetch active locations
  const rawLocations = await prisma.location.findMany({
    where: { academy: { is_active: true } },
    select: { id: true, name: true, address: true },
    orderBy: { name: 'asc' },
  });

  const locations: LocationItem[] = rawLocations.map((l) => ({
    id: l.id,
    name: l.name,
    address: l.address,
  }));

  // 2. Fetch active coaches in the academy
  const activeUsers = await prisma.user.findMany({
    where: { status: 'ACTIVE' },
    select: {
      id: true,
      first_name: true,
      last_name: true,
      email: true,
      academy_roles: { select: { permissions: true } },
      coachLocations: { select: { location: { select: { name: true } } } },
    },
    orderBy: { first_name: 'asc' },
  });

  const coaches: CoachItem[] = activeUsers
    .filter((u) => {
      const perms = u.academy_roles?.[0]?.permissions;
      if (!perms) return false;
      const permStr = Array.isArray(perms) ? perms.join(',').toLowerCase() : String(perms).toLowerCase();
      return permStr.includes('coach') || (!permStr.includes('player') && !permStr.includes('parent'));
    })
    .map((c) => ({
      id: c.id,
      name: `${c.first_name} ${c.last_name}`.trim(),
      email: c.email,
      assignedLocations: c.coachLocations.map((cl) => cl.location.name).join(', ') || 'Academy Coach',
    }));

  return (
    <div className="bg-slate-100 flex justify-center min-h-screen font-sans text-slate-900">
      <div className="w-full max-w-[448px] bg-slate-50 min-h-screen pb-24 relative shadow-2xl shadow-slate-200 flex flex-col overflow-x-hidden">
        <TopAppBar userName={adminName} initials={adminInitials} signOut={signOut} />

        <main className="flex-1 p-4 space-y-6">
          <CreateSessionForm locations={locations} coaches={coaches} />
        </main>

        <BottomNavBar currentTab="create-session" />
      </div>
    </div>
  );
}
