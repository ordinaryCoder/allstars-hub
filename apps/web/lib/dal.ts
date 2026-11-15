import { redirect } from 'next/navigation';
import { createClient } from './server';
import { prisma } from '@packages/database';
import { parseJwtPayload } from '@/lib/auth-utils';

type Role = string | string[];

/**
 * Verifies identity server-side via Supabase `getSession()` and validates user roles
 * and account status from JWT custom claims or database records.
 */
export async function requireRole(userIdOrRole: string | Role, requiredRole?: Role) {
  let userId: string | undefined;
  let targetRole: Role;

  if (requiredRole !== undefined) {
    userId = userIdOrRole as string;
    targetRole = requiredRole;
  } else {
    targetRole = userIdOrRole as Role;
  }

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session || !session.user) {
    redirect('/login');
  }

  if (userId && session.user.id !== userId) {
    redirect('/login');
  }

  const payload = parseJwtPayload(session.access_token) || {};

  // Verify account status: PENDING accounts must wait for admin approval
  let userStatus = typeof payload.status === 'string' ? payload.status : undefined;
  if (!userStatus) {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { status: true },
    });
    userStatus = dbUser?.status;
  }

  if (userStatus === 'PENDING') {
    redirect(`/pending?email=${encodeURIComponent(session.user.email || '')}`);
  }

  if (userStatus && userStatus !== 'ACTIVE') {
    redirect('/unauthorized');
  }

  // Extract roles exclusively from verified sources: custom claims (Postgres auth hook) or app_metadata.
  // Note: user_metadata is client-supplied and MUST NOT be used for role authorization.
  const rawRoles: unknown[] = [
    ...(Array.isArray(payload.roles) ? payload.roles : payload.roles ? [payload.roles] : []),
    ...(Array.isArray(payload.role) ? payload.role : payload.role ? [payload.role] : []),
    ...(typeof payload.app_metadata === 'object' && payload.app_metadata && payload.app_metadata !== null && 'role' in payload.app_metadata ? [(payload.app_metadata as Record<string, unknown>).role] : []),
    ...(typeof payload.app_metadata === 'object' && payload.app_metadata && payload.app_metadata !== null && 'roles' in payload.app_metadata && Array.isArray((payload.app_metadata as Record<string, unknown>).roles) ? (payload.app_metadata as Record<string, unknown>).roles as unknown[] : [])
  ];

  const userRoles = new Set(rawRoles.filter(Boolean).map(r => String(r).toLowerCase()));

  // Fallback to database user_academy_roles if token claims do not contain roles
  if (userRoles.size === 0) {
    const dbRoles = await prisma.userAcademyRole.findMany({
      where: { user_id: session.user.id },
      select: { permissions: true },
    });
    for (const r of dbRoles) {
      if (Array.isArray(r.permissions)) {
        r.permissions.forEach(p => userRoles.add(String(p).toLowerCase()));
      } else if (r.permissions) {
        userRoles.add(String(r.permissions).toLowerCase());
      }
    }
  }

  const required = (Array.isArray(targetRole) ? targetRole : [targetRole]).map(r => String(r).toLowerCase());
  const hasRole = required.some(req => userRoles.has(req));

  if (!hasRole) {
    redirect('/unauthorized');
  }

  return session.user;
}
