import { createClient } from '@/lib/supabase/server'
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

    // Handle password recovery - redirect to reset password page
    if (type === 'recovery') {
      return NextResponse.redirect(`${origin}/reset-password`)
    }

    // Update user status to 'active' when they accept invitation/complete auth
    // This changes the status from 'pending' (set during invite) to 'active'
    await supabase
      .from('user_profiles')
      .update({ membership_status: 'active' })
      .eq('id', authResult.user.id)

    // Check user_profiles table for onboarding status and role
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('onboarding_completed, user_type, first_name, last_name, company_id')
      .eq('id', authResult.user.id)
      .single()

    // If user hasn't completed onboarding, redirect to onboarding flow
    if (!userProfile?.onboarding_completed) {
      // Store basic auth info in URL params for client-side
      const onboardingUrl = new URL(`${origin}/onboarding`)
      onboardingUrl.searchParams.set('auth', 'success')
      onboardingUrl.searchParams.set('userId', authResult.user.id)
      onboardingUrl.searchParams.set('email', email)
      return NextResponse.redirect(onboardingUrl.toString())
    }

    // Get role from user_profiles (set during onboarding)
    const role = userProfile?.user_type || authResult.user.user_metadata?.role || 'developer'

    // Build full name from user_profiles
    const fullName = userProfile?.first_name
      ? `${userProfile.first_name} ${userProfile.last_name || ''}`.trim()
      : authResult.user.user_metadata?.full_name || email.split('@')[0]

    // Determine redirect path based on role
    let redirectPath = '/developer'
    switch (role) {
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
    redirectUrl.searchParams.set('name', fullName)
    redirectUrl.searchParams.set('role', role)
    if (userProfile?.company_id) {
      redirectUrl.searchParams.set('companyId', userProfile.company_id)
    }

    return NextResponse.redirect(redirectUrl.toString())
  }

  // Return the user to an error page with instructions
  const errorMessage = authError?.message || 'Could not authenticate user'
  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorMessage)}`)
}
