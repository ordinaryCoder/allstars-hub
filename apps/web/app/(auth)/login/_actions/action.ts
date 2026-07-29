'use server';

import { createClient } from '@/lib/server';
import { redirect } from 'next/navigation';
import type { UserRole, RedirectPath, LoginState, JWTPayload } from '@/types/auth';
import { parseJwtPayload, getRoleRedirectPath } from '@/lib/auth-utils';
import { prisma } from '@packages/database';

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

  if (authData?.session && authData?.user) {
    if (!authData.user.email_confirmed_at) {
      await supabase.auth.signOut();
      redirect(`/confirm-email?email=${encodeURIComponent(authData.user.email ?? email)}`);
    }

    // Custom claims injected by the hook are stored in the JWT payload, not the user object
    const jwt = authData.session.access_token;
    const payload = parseJwtPayload<JWTPayload>(jwt);

    const status = payload?.status || 'PENDING';
    const roles = payload?.roles || [];

    const targetRoute = getRoleRedirectPath(
      roles,
      status,
      authData.user.email ?? ''
    );

    if (status !== 'ACTIVE' && status !== 'PENDING') {
      await supabase.auth.signOut();
    }

    return redirect(targetRoute);
  }

  // If login failed, check if the account exists and is pending email confirmation
  try {
    const authUsers = await prisma.$queryRaw<{ email_confirmed_at: Date | null }[]>`
      SELECT email_confirmed_at FROM auth.users WHERE LOWER(email) = LOWER(${email}) LIMIT 1
    `;

    if (authUsers.length > 0 && authUsers[0].email_confirmed_at === null) {
      redirect(`/confirm-email?email=${encodeURIComponent(email)}`);
    }
  } catch (dbErr) {
    // Fallback if query fails
  }

  return { error: 'Invalid username or password' };
}