import { NextResponse } from 'next/server'
import { createClient } from '@/lib/server'

// Callback route for handling OAuth redirects (Google).
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/' // Default redirect to Coach Home

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return to login if error
  return NextResponse.redirect(`${origin}/login?error=auth-callback-failed`)
}