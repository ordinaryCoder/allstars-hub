'use server'

import { createClient } from '@/lib/server'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return redirect('/login?error=Could not authenticate user')
  }

  redirect('/') // Go to Coach Home Dashboard
}

export async function loginWithGoogle() {
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