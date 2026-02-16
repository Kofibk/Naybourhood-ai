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

  // Handle Supabase auth errors at any path - redirect to auth callback
  if (searchParams.has('error_code') || searchParams.has('error_description')) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/callback'
    return NextResponse.redirect(url)
  }

  // Handle PKCE code - redirect to auth callback
  if (searchParams.has('code') && !pathname.startsWith('/auth/callback')) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/callback'
    return NextResponse.redirect(url)
  }

  // Handle token_hash (from admin-generated magic links, invites, etc.)
  if (searchParams.has('token_hash') && !pathname.startsWith('/auth/callback')) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/callback'
    return NextResponse.redirect(url)
  }

  // Check if route is public
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))

  // Skip auth check for public routes
  if (isPublicRoute) {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return await updateSession(request)
    }
    return NextResponse.next()
  }

  // API routes: refresh session cookies but don't redirect (routes check auth internally)
  if (pathname.startsWith('/api')) {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return await updateSession(request)
    }
    return NextResponse.next()
  }

  // Check if route is protected
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route))

  // Allow protected routes when Supabase is not configured (demo/local mode)
  if (isProtectedRoute && (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
    return NextResponse.next()
  }

  if (isProtectedRoute && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: {
          flowType: 'implicit',
          detectSessionInUrl: true,
        },
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

    // Get user profile for permission checks
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('permission_role, company_id, is_internal_team, company:companies(enabled_features)')
      .eq('id', session.user.id)
      .single()

    // Internal team has full access
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

    for (const [feature, routes] of Object.entries(FEATURE_ROUTE_MAP)) {
      if (routes.some(route => pathname.startsWith(route))) {
        if (!enabledFeatures.includes(feature)) {
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
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
