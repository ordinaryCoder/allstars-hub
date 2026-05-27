import { NextResponse } from 'next/server'
import { createClient } from '@/lib/server'
import { getTargetRouteForUser } from '@/app/(auth)/login/action'


// Callback route for handling OAuth redirects (Google).
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.user) {
      const targetRoute = await getTargetRouteForUser(data.user.id)
      return NextResponse.redirect(`${origin}${targetRoute}`)
    }
  }

  // Return to login if error
  return NextResponse.redirect(`${origin}/login?error=Authentication failed`)
}