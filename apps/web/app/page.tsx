import { redirect } from 'next/navigation';
import { createClient } from '../lib/server';
import { prisma } from '../../../packages/database';

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

  if (dbUser.status === 'PENDING') {
    redirect(`/pending?email=${encodeURIComponent(dbUser.email)}`);
  }

  const perms = dbUser.academy_roles?.[0]?.permissions;
  const permStr = Array.isArray(perms) ? perms.join(',').toLowerCase() : String(perms || '').toLowerCase();

  if (permStr.includes('admin')) {
    redirect('/admin');
  } else if (permStr.includes('coach')) {
    redirect('/coach');
  } else {
    redirect('/player');
  }
}