import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const error_code = searchParams.get('error_code')
  const error_description = searchParams.get('error_description')

  // Handle Supabase error redirects (e.g., expired links)
  if (error_code || error_description) {
    const errorMessage = error_description || 'Authentication link has expired or is invalid'
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorMessage)}&error_type=link_expired`)
  }

  const supabase = await createClient()

  // Use admin client for profile queries to bypass RLS
  // This is critical for invited users who don't have established permissions yet
  let adminClient: ReturnType<typeof createAdminClient> | null = null
  try {
    adminClient = createAdminClient()
  } catch (e) {
    console.log('[Auth Callback] Admin client not available, using regular client')
  }

  let authResult: { user: any } | null = null
  let authError: any = null

  // Handle PKCE code exchange (magic link from signInWithOtp)
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    authResult = data
    authError = error

    // Check for PKCE-specific errors
    if (error && (
      error.message?.includes('PKCE') ||
      error.message?.includes('code verifier') ||
      error.code === 'pkce_verification_failed'
    )) {
      const pkceError = 'This login link was opened in a different browser. Please request a new link using the same browser, or use password login instead.'
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(pkceError)}&error_type=pkce`)
    }
  }
  // Handle token_hash (invite emails, password recovery, etc.)
  else if (token_hash && type) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as 'invite' | 'email' | 'recovery' | 'magiclink',
    })
    authResult = data
    authError = error
  }

  if (!authError && authResult?.user) {
    const email = authResult.user.email?.toLowerCase() || ''
    const userMetadata = authResult.user.user_metadata || {}

    // Handle password recovery - redirect to reset password page
    if (type === 'recovery') {
      return NextResponse.redirect(`${origin}/reset-password`)
    }

    // Check existing profiles FIRST to determine if user was invited
    // Use admin client to bypass RLS - critical for first-time invited users
    const dbClient = adminClient || supabase

    const { data: userProfile } = await dbClient
      .from('user_profiles')
      .select('onboarding_completed, user_type')
      .eq('id', authResult.user.id)
      .single()

    const { data: profile } = await dbClient
      .from('profiles')
      .select('role, full_name, company_id, status, is_internal')
      .eq('id', authResult.user.id)
      .single()

    // Detect if user was invited - check BOTH metadata AND profiles table
    // Key insight: Invited users have a profiles entry BEFORE they have a user_profiles entry
    // Regular signups only get profiles AFTER completing onboarding
    const wasInvited = !!(
      userMetadata.role ||
      userMetadata.is_internal === true ||
      userMetadata.company_id ||
      profile?.is_internal === true ||  // Check profiles table - set by invite API
      (profile && !userProfile)  // Has profiles but no user_profiles = definitely invited
    )

    // Invited user needs password setup if:
    // 1. type === 'invite' (explicit), OR
    // 2. They were invited AND no user_profiles entry yet (first login)
    const needsPasswordSetup = wasInvited && (
      type === 'invite' ||
      !userProfile  // No user_profiles entry = first time logging in
    )

    if (needsPasswordSetup) {
      // Use profile data as fallback when metadata is missing
      const fullName = userMetadata.full_name || profile?.full_name || email.split('@')[0]
      const userRole = userMetadata.role || profile?.role || 'developer'
      const isInternal = userMetadata.is_internal === true || profile?.is_internal === true
      const companyId = userMetadata.company_id || profile?.company_id || null

      // Create user_profiles entry NOW (before redirect) so they don't get stuck in loop
      if (!userProfile) {
        await dbClient
          .from('user_profiles')
          .upsert({
            id: authResult.user.id,
            email: email,
            first_name: fullName.split(' ')[0] || '',
            last_name: fullName.split(' ').slice(1).join(' ') || '',
            user_type: userRole,
            onboarding_completed: true,  // Skip onboarding for invited users
            is_internal: isInternal,
          })
      }

      // Also create profiles entry if it doesn't exist
      if (!profile) {
        await dbClient
          .from('profiles')
          .upsert({
            id: authResult.user.id,
            email: email,
            full_name: fullName,
            role: userRole,
            company_id: companyId,
            is_internal: isInternal,
          })
      }

      // Determine redirect path based on role
      let redirectPath = '/developer'
      switch (userRole) {
        case 'super_admin':
        case 'admin':
          redirectPath = '/admin'
          break
        case 'agent':
          redirectPath = '/agent'
          break
        case 'broker':
          redirectPath = '/broker'
          break
        case 'developer':
        default:
          redirectPath = '/developer'
          break
      }

      const setPasswordUrl = new URL(`${origin}/set-password`)
      setPasswordUrl.searchParams.set('name', fullName.split(' ')[0] || '')
      setPasswordUrl.searchParams.set('redirect', redirectPath)
      return NextResponse.redirect(setPasswordUrl.toString())
    }

    // If user hasn't completed onboarding AND was NOT invited, redirect to onboarding
    if (!userProfile?.onboarding_completed && !wasInvited) {
      // Store basic auth info in URL params for client-side
      const onboardingUrl = new URL(`${origin}/onboarding`)
      onboardingUrl.searchParams.set('auth', 'success')
      onboardingUrl.searchParams.set('userId', authResult.user.id)
      onboardingUrl.searchParams.set('email', email)
      return NextResponse.redirect(onboardingUrl.toString())
    }

    // For invited users who haven't set up their user_profiles entry yet, create it now
    if (wasInvited && !userProfile) {
      // Create user_profiles entry with onboarding marked complete
      await dbClient
        .from('user_profiles')
        .upsert({
          id: authResult.user.id,
          email: email,
          first_name: userMetadata.full_name?.split(' ')[0] || '',
          last_name: userMetadata.full_name?.split(' ').slice(1).join(' ') || '',
          user_type: userMetadata.role || 'developer',
          onboarding_completed: true,  // Skip onboarding for invited users
          is_internal: userMetadata.is_internal || false,
        })
    }

    // Use database role if available, otherwise check user metadata or user_type from onboarding
    let role = profile?.role || userProfile?.user_type || authResult.user.user_metadata?.role || 'developer'

    // If this is an invite and profile doesn't exist, create it from user metadata
    if (!profile && authResult.user.user_metadata) {
      const metadata = authResult.user.user_metadata
      const { error: profileError } = await dbClient
        .from('profiles')
        .upsert({
          id: authResult.user.id,
          email: email,
          full_name: metadata.full_name || email.split('@')[0],
          role: metadata.role || 'developer',
          company_id: metadata.company_id || null,
          is_internal: metadata.is_internal || false,
        })

      if (!profileError) {
        role = metadata.role || 'developer'
      }
    }

    // Determine redirect path based on role
    let redirectPath = '/developer'
    switch (role) {
      case 'super_admin':
      case 'admin':
        redirectPath = '/admin'
        break
      case 'agent':
        redirectPath = '/agent'
        break
      case 'broker':
        redirectPath = '/broker'
        break
      case 'developer':
      default:
        redirectPath = '/developer'
        break
    }

    // Redirect with role info in URL so client can store in localStorage
    const redirectUrl = new URL(`${origin}${redirectPath}`)
    redirectUrl.searchParams.set('auth', 'success')
    redirectUrl.searchParams.set('userId', authResult.user.id)
    redirectUrl.searchParams.set('email', email)
    redirectUrl.searchParams.set('name', profile?.full_name || authResult.user.user_metadata?.full_name || email.split('@')[0])
    redirectUrl.searchParams.set('role', role)

    return NextResponse.redirect(redirectUrl.toString())
  }

  // Return the user to an error page with instructions
  const errorMessage = authError?.message || 'Could not authenticate user'
  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorMessage)}`)
}
