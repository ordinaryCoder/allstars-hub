import { redirect } from 'next/navigation';
import { createClient } from './server';

type Role = string | string[];

/**
 * Decodes the payload section of a JWT without a library.
 * Used because custom claims (injected by the Postgres auth hook)
 * are only available in the raw access_token, not on session.user.
 */
function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const base64 = token.split('.')[1];
    return JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'));
  } catch {
    throw new Error('Malformed JWT: unable to decode payload');
  }
}

export async function requireRole(userId: string, requiredRole: Role): Promise<void> {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session || session.user.id !== userId) {
    redirect('/login');
  }

  const payload = decodeJwtPayload(session.access_token);
  const roles = (payload.roles as string[]) || [];
  const required = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

  if (!required.some(role => roles.includes(role))) {
    redirect('/unauthorized');
  }
}
