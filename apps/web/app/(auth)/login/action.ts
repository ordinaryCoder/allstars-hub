'use server'

import { createClient } from '../../../lib/server'
import { redirect } from 'next/navigation'

// 1. Define your valid roles and paths as strict TypeScript types
type UserRole = 'coach' | 'admin' | 'player' | 'parent';
type RedirectPath = '/coach' | '/admin' | '/dashboard' | '/unauthorized' | '/player' | '/parent' | null;

export async function getTargetRouteForUser(userId: string): Promise<RedirectPath> {
  const supabase = await createClient()

  const { data: rolesData } = await supabase
    .from('user_academy_roles')
    .select('permissions')
    .eq('user_id', userId)

  const roles = rolesData?.map(r => r.permissions) || []
  // 3. Flatten and filter down to a strictly typed string array
  const cleanRoles: UserRole[] = Array.isArray(roles)
  ? (roles.flat().filter((role): role is UserRole => typeof role === 'string'))
  : [];

  if (cleanRoles.includes("coach")) {
    return '/coach' // Handles Coach only OR Admin+Coach
  } else if (cleanRoles.includes('admin')) {
    return '/admin' // Handles Admin only
  }
  else if (cleanRoles.includes('player') || cleanRoles.includes('parent')) {
    return '/player' // Handles Player/Parent
  }

  return '/unauthorized' // Default for unauthorized-user with no/invalid roles
}

export async function loginWithGoogle(): Promise<void> {
  const supabase = await createClient()

  // Requires callback route to exchange token
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback`,
    },
  })

  if (error) {
    return redirect('/login?error=Google login failed')
  }

  if (data.url) {
    redirect(data.url)
  }
}

export async function login(formData: FormData): Promise<void> {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (authError || !authData.user) {
    return redirect('/login?error=Could not authenticate user')
  }

  const targetRoute = await getTargetRouteForUser(authData.user.id)

  redirect(targetRoute || `/unauthorized?email=${encodeURIComponent(authData.user.email!)}`) // Fallback for type safety
}