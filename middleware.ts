import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'
import {
  PROTECTED_ROUTES,
  PUBLIC_ROUTES,
  MASTER_ADMIN_EMAILS,
  INTERNAL_TEAM_DOMAIN,
} from '@/lib/auth/config'

// Feature to route mapping for access control
const FEATURE_ROUTE_MAP: Record<string, string[]> = {
  leads: ['/admin/leads', '/developer/buyers', '/agent/buyers'],
  campaigns: ['/admin/campaigns', '/developer/campaigns', '/agent/campaigns'],
  developments: ['/admin/developments', '/developer/developments'],
  conversations: ['/admin/conversations', '/developer/conversations', '/agent/conversations', '/broker/conversations'],
  analytics: ['/admin/analytics', '/developer/analytics'],
  reports: ['/admin/reports'],
  borrowers: ['/admin/borrowers', '/broker/borrowers'],
  ai_insights: ['/admin/ai-insights', '/developer/ai-insights'],
  billing: ['/admin/billing'],
  team_management: ['/admin/users', '/admin/team'],
  settings: ['/admin/settings', '/developer/settings', '/agent/settings', '/broker/settings'],
}

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl
  
  // Log all auth-related requests for debugging
  const hasAuthParams = searchParams.has('code') || searchParams.has('token_hash') || 
                        searchParams.has('error_code') || searchParams.has('error_description') ||
                        searchParams.has('access_token')
  
  if (hasAuthParams || pathname.includes('/auth/') || pathname === '/login') {
    const allCookies = request.cookies.getAll()
    const supabaseCookies = allCookies.filter(c => c.name.includes('supabase') || c.name.includes('sb-'))
    
    console.log('[Middleware] 🔐 Auth-related request:', {
      pathname,
      hasCode: searchParams.has('code'),
      codePreview: searchParams.get('code')?.substring(0, 10),
      hasTokenHash: searchParams.has('token_hash'),
      hasErrorCode: searchParams.has('error_code'),
      errorDescription: searchParams.get('error_description'),
      type: searchParams.get('type'),
      supabaseCookieCount: supabaseCookies.length,
      supabaseCookieNames: supabaseCookies.map(c => c.name),
      hasCodeVerifier: supabaseCookies.some(c => c.name.includes('code-verifier') || c.name.includes('code_verifier')),
      userAgent: request.headers.get('user-agent')?.substring(0, 50),
    })
  }

  // Handle Supabase auth errors at any path - redirect to login with error
  if (searchParams.has('error_code') || searchParams.has('error_description')) {
    console.log('[Middleware] ⚠️ Auth error detected, redirecting to /auth/callback')
    const url = request.nextUrl.clone()
    url.pathname = '/auth/callback'
    return NextResponse.redirect(url)
  }

  // Handle Supabase auth at root - redirect to /auth/callback
  // This catches both PKCE codes and token_hash from invite emails
  if (pathname === '/') {
    // Handle PKCE code
    if (searchParams.has('code')) {
      console.log('[Middleware] 📧 PKCE code detected at root, redirecting to /auth/callback')
      const url = request.nextUrl.clone()
      url.pathname = '/auth/callback'
      return NextResponse.redirect(url)
    }

    // Handle token_hash (from invite emails)
    if (searchParams.has('token_hash') && searchParams.has('type')) {
      console.log('[Middleware] 🔑 Token hash detected at root, redirecting to /auth/callback')
      const url = request.nextUrl.clone()
      url.pathname = '/auth/callback'
      return NextResponse.redirect(url)
    }
  }

  // Check if route is public
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))

  // Skip auth check for public routes
  if (isPublicRoute) {
    // Update Supabase session if configured
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return await updateSession(request)
    }
    return NextResponse.next()
  }

  // Check if route is protected
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route))

  if (isProtectedRoute && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    // Create Supabase client for middleware
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            response = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // Get session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    console.log('[Middleware] 🔒 Session check for protected route:', {
      pathname,
      hasSession: !!session,
      sessionError: sessionError?.message,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      sessionExpiresAt: session?.expires_at,
    })

    if (sessionError || !session) {
      console.log('[Middleware] ❌ No valid session, redirecting to login:', {
        pathname,
        error: sessionError?.message,
      })
      // No session - redirect to login
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }

    // Get user profile for permission checks
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('permission_role, company_id, is_internal_team, company:companies(enabled_features)')
      .eq('id', session.user.id)
      .single()

    // Internal team has full access (using centralized auth config)
    const userEmail = session.user.email?.toLowerCase() || ''
    const isInternalTeam = profile?.is_internal_team ||
      userEmail.endsWith(INTERNAL_TEAM_DOMAIN) ||
      MASTER_ADMIN_EMAILS.includes(userEmail as typeof MASTER_ADMIN_EMAILS[number])

    if (isInternalTeam) {
      return response
    }

    // Check feature-based access for the current route
    const company = profile?.company as unknown as { enabled_features: string[] } | null
    const enabledFeatures = company?.enabled_features || ['leads', 'campaigns', 'developments', 'conversations']

    // Find which feature this route belongs to
    for (const [feature, routes] of Object.entries(FEATURE_ROUTE_MAP)) {
      if (routes.some(route => pathname.startsWith(route))) {
        // Route belongs to this feature - check if company has it enabled
        if (!enabledFeatures.includes(feature)) {
          // Feature not enabled - redirect to dashboard with error
          const dashboardPath = pathname.startsWith('/admin') ? '/admin' :
            pathname.startsWith('/developer') ? '/developer' :
            pathname.startsWith('/agent') ? '/agent' :
            pathname.startsWith('/broker') ? '/broker' : '/login'

          const url = request.nextUrl.clone()
          url.pathname = dashboardPath
          url.searchParams.set('error', 'feature_not_enabled')
          url.searchParams.set('feature', feature)
          return NextResponse.redirect(url)
        }
        break
      }
    }

    return response
  }

  // Update Supabase session if configured
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return await updateSession(request)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
