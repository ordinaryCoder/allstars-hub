import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest, type MiddlewareConfig } from 'next/server'

export async function proxy(request: NextRequest): Promise<NextResponse> {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
      setAll(
        cookiesToSet: { name: string; value: string; options?: CookieOptions }[], 
        headers?: Record<string, string>
      ) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
          if (headers) {
            Object.entries(headers).forEach(([key, value]) =>
              supabaseResponse.headers.set(key, value as string)
            )
          }
        },
      },
    }
  )

  const pathname = request.nextUrl.pathname;
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup');
  const isStaticPublicAsset =
    pathname.startsWith('/contactus') ||
    pathname.startsWith('/pending') ||
    pathname.startsWith('/confirm-email') ||
    pathname.startsWith('/manifest') ||
    pathname.startsWith('/icons') ||
    pathname.startsWith('/sw.js') ||
    pathname.startsWith('/~offline');

  // Fast path for non-auth public pages & assets
  if (isStaticPublicAsset) {
    return supabaseResponse;
  }

  const hasAuthCookie = request.cookies.getAll().some((c) => c.name.startsWith('sb-'));

  // If an already logged-in user visits /login or /signup, redirect them to dashboard (via /)
  if (isAuthPage) {
    if (hasAuthCookie) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const url = request.nextUrl.clone();
        url.pathname = '/';
        return NextResponse.redirect(url);
      }
    }
    return supabaseResponse;
  }

  // Refresh session if expired and validate user identity on protected routes
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    const redirectResponse = NextResponse.redirect(url);

    // IMPORTANT: Copy cookies over so the session isn't lost
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    return redirectResponse;
  }

  return supabaseResponse;
}

export const config: MiddlewareConfig = {
  matcher: [
    /*
     * Match all request paths except for static files, API, PWA assets, and icons
     */
    '/((?!_next/static|_next/image|favicon.ico|api|auth|sw.js|manifest|icons|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}