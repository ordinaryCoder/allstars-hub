import { redirect } from 'next/navigation';
import { createClient } from './server';
import { prisma } from '@packages/database';
import { parseJwtPayload } from '@/lib/auth-utils';

type Role = string | string[];

/**
 * Verifies identity server-side via Supabase `getSession()` and validates user roles
 * from the JWT access token custom claims without making additional DB or API network calls.
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

  // Extract roles from custom claims (Postgres auth hook), app_metadata, or user_metadata
  const rawRoles: unknown[] = [
    ...(Array.isArray(payload.roles) ? payload.roles : payload.roles ? [payload.roles] : []),
    ...(Array.isArray(payload.role) ? payload.role : payload.role ? [payload.role] : []),
    ...(typeof payload.user_metadata === 'object' && payload.user_metadata && payload.user_metadata !== null && 'role' in payload.user_metadata ? [(payload.user_metadata as Record<string, unknown>).role] : []),
    ...(typeof payload.app_metadata === 'object' && payload.app_metadata && payload.app_metadata !== null && 'role' in payload.app_metadata ? [(payload.app_metadata as Record<string, unknown>).role] : []),
    ...(typeof payload.app_metadata === 'object' && payload.app_metadata && payload.app_metadata !== null && 'roles' in payload.app_metadata && Array.isArray((payload.app_metadata as Record<string, unknown>).roles) ? (payload.app_metadata as Record<string, unknown>).roles as unknown[] : [])
  ];

  const userRoles = new Set(rawRoles.filter(Boolean).map(r => String(r).toLowerCase()));
  const required = (Array.isArray(targetRole) ? targetRole : [targetRole]).map(r => String(r).toLowerCase());

  const hasRole = required.some(req => userRoles.has(req));

  if (!hasRole) {
    redirect('/unauthorized');
  }

  return session.user;
}
