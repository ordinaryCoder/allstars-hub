'use server';

import { createClient } from '../../../lib/server';
import { redirect } from 'next/navigation';
import type { UserRole, RedirectPath, LoginState, JWTPayload } from '../types';

function parseJWTPayload(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = Buffer.from(base64, 'base64').toString('utf-8');
    return JSON.parse(jsonPayload) as JWTPayload;
  } catch {
    return null;
  }
}

export async function login(
  _prevState: LoginState | undefined,
  formData: FormData
): Promise<LoginState | undefined> {
  const supabase = await createClient();

  const email = formData.get('email')?.toString().trim() ?? '';
  const password = formData.get('password')?.toString() ?? '';

  if (!email || !password) {
    return { error: 'Please enter both email and password' };
  }

  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (authError?.message === 'Email not confirmed') {
    redirect(`/confirm-email?email=${encodeURIComponent(email)}`);
  }

  if (authError || !authData.session) {
    return { error: 'Invalid username or password' };
  }

  // Custom claims injected by the hook are stored in the JWT payload, not the user object
  const jwt = authData.session.access_token;
  const payload = parseJWTPayload(jwt);

  const status = payload?.status;
  const roles = payload?.roles;

  if (!status || status === 'PENDING') {
    return redirect(
      `/pending?email=${encodeURIComponent(authData.user.email ?? '')}`
    );
  }

  if (status !== 'ACTIVE') {
    await supabase.auth.signOut();
    return redirect(
      `/unauthorized?email=${encodeURIComponent(authData.user.email ?? '')}`
    );
  }

  const cleanRoles: UserRole[] = Array.isArray(roles)
    ? roles.filter(
        (role): role is UserRole =>
          typeof role === 'string' &&
          ['coach', 'admin', 'player', 'parent'].includes(role)
      )
    : [];

  let targetRoute: RedirectPath = `/unauthorized?email=${encodeURIComponent(
    authData.user.email ?? ''
  )}`;
  if (cleanRoles.includes('coach')) targetRoute = '/coach';
  else if (cleanRoles.includes('admin')) targetRoute = '/admin';
  else if (
    cleanRoles.includes('player') ||
    cleanRoles.includes('parent')
  ) {
    targetRoute = '/player';
  }

  return redirect(targetRoute);
}