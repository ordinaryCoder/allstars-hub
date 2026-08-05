import { redirect } from 'next/navigation';
import { createClient } from '../lib/server';
import { prisma } from '@packages/database';
import { getRoleRedirectPath } from '@/lib/auth-utils';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { academy_roles: true },
  });

  if (!dbUser) {
    redirect('/login');
  }

  const perms = dbUser.academy_roles?.[0]?.permissions;
  const targetRoute = getRoleRedirectPath(
    Array.isArray(perms) ? (perms as string[]) : String(perms || ''),
    dbUser.status,
    dbUser.email
  );

  redirect(targetRoute);
}