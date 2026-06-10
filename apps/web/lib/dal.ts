import { redirect } from 'next/navigation';
import { createClient } from './server';

export async function requireRole(userId: string, requiredRole: string | string[]): Promise<void> {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  // Use the cached JWT to verify identity and roles instead of querying the DB
  if (!session || session.user.id !== userId) {
    redirect('/login');
  }

  // Decode the JWT to access custom claims injected by the Postgres hook
  const jwtPayload = JSON.parse(Buffer.from(session.access_token.split('.')[1], 'base64').toString('utf-8'));
  const roles = jwtPayload.roles || [];
  const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

  if (!requiredRoles.some(role => roles.includes(role))) {
    redirect('/unauthorized');
  }
}
