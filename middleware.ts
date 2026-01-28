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

  // Handle Supabase auth errors at any path - redirect to login with error
  if (searchParams.has('error_code') || searchParams.has('error_description')) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/callback'
    return NextResponse.redirect(url)
  }

  // Handle Supabase auth at root - redirect to /auth/callback
  // This catches both PKCE codes and token_hash from invite emails
  if (pathname === '/') {
    // Handle PKCE code
    if (searchParams.has('code')) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/callback'
      return NextResponse.redirect(url)
    }

    // Handle token_hash (from invite emails)
    if (searchParams.has('token_hash') && searchParams.has('type')) {
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

    if (sessionError || !session) {
      // No session - redirect to login
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }

    // Fast path: check if internal team by email BEFORE any DB query
    const userEmail = session.user.email?.toLowerCase() || ''
    const isInternalByEmail =
      userEmail.endsWith(INTERNAL_TEAM_DOMAIN) ||
      MASTER_ADMIN_EMAILS.includes(userEmail as typeof MASTER_ADMIN_EMAILS[number])

    if (isInternalByEmail) {
      return response
    }

    // External users: query profile for feature-based access control
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('permission_role, company_id, is_internal_team, company:companies(enabled_features)')
      .eq('id', session.user.id)
      .single()

    // Check if marked as internal in DB
    if (profile?.is_internal_team) {
      return response
    }

    // Check feature-based access for the current route
    // Note: Supabase join can return array or object depending on relationship
    const companyData = profile?.company
    const company = Array.isArray(companyData) ? companyData[0] : companyData
    const enabledFeatures = (company as { enabled_features?: string[] } | null)?.enabled_features || ['leads', 'campaigns', 'developments', 'conversations']

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
