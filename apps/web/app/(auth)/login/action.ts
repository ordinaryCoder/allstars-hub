'use server'

import { createClient } from '../../../lib/server'
import { redirect } from 'next/navigation'

type UserRole = 'coach' | 'admin' | 'player' | 'parent';
type RedirectPath = '/coach' | '/admin' | '/dashboard' | '/unauthorized' | '/player' | '/parent' | '/pending' | null;


// Todo: remove google signup/login 
// export async function loginWithGoogle(): Promise<void> {
//   const supabase = await createClient()

//   // Requires callback route to exchange token
//   const { data, error } = await supabase.auth.signInWithOAuth({
//     provider: 'google',
//     options: {
//       redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback`,
//     },
//   })

//   if (error) {
//     return redirect('/login?error=Google login failed')
//   }

//   if (data.url) {
//     redirect(data.url)
//   }
// }

export async function login(prevState: any, formData: FormData): Promise<{ error: string } | void> {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (authError || !authData.session) {
    return { error: 'Invalid username or password' }
  }

  // Custom claims injected by the hook are stored in the JWT payload, not the user object
  const jwt = authData.session.access_token;
  const payload = JSON.parse(Buffer.from(jwt.split('.')[1], 'base64').toString('utf-8'));

  const status = payload.status;
  const roles = payload.roles || [];

  if (!status || status === 'PENDING') {
    // await supabase.auth.signOut()
    return redirect(`/pending?email=${encodeURIComponent(authData.user.email ?? '')}`)
  }

  if (status !== 'ACTIVE') {
    await supabase.auth.signOut()
    return redirect(`/unauthorized?email=${encodeURIComponent(authData.user.email ?? '')}`)
  }

  const cleanRoles: UserRole[] = Array.isArray(roles)
    ? (roles.filter((role): role is UserRole => typeof role === 'string'))
    : [];

  let targetRoute: RedirectPath = '/unauthorized';
  if (cleanRoles.includes('coach')) targetRoute = '/coach';
  else if (cleanRoles.includes('admin')) targetRoute = '/admin';
  else if (cleanRoles.includes('player') || cleanRoles.includes('parent')) targetRoute = '/player';

  redirect(targetRoute)
}