import { createClient } from '@/lib/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next');

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const email = user?.email ?? '';

      // If a specific redirect was requested, honour it
      if (next) {
        return NextResponse.redirect(new URL(next, origin));
      }

      // Default: after email confirmation, go to pending approval
      return NextResponse.redirect(
        new URL(`/pending?email=${encodeURIComponent(email)}`, origin)
      );
    }
  }

  // On error or missing code, fall back to login
  return NextResponse.redirect(
    new URL('/login?error=auth_callback_error', origin)
  );
}
