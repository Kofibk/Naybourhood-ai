import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { isMasterAdmin, getDashboardPathForRole, buildDisplayName } from '@/lib/auth'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const error_code = searchParams.get('error_code')
  const error_description = searchParams.get('error_description')

  // Get all cookies for debugging
  const cookieStore = cookies()
  const allCookies = cookieStore.getAll()
  const supabaseCookies = allCookies.filter(c => c.name.includes('supabase') || c.name.includes('sb-'))
  
  console.log('[Auth Callback] 🔄 Processing auth callback:', { 
    hasCode: !!code, 
    codePreview: code ? `${code.substring(0, 10)}...` : null,
    hasTokenHash: !!token_hash, 
    tokenHashPreview: token_hash ? `${token_hash.substring(0, 10)}...` : null,
    type, 
    hasError: !!error_code,
    origin,
    fullUrl: request.url,
  })
  
  console.log('[Auth Callback] 🍪 Cookies present:', {
    totalCookies: allCookies.length,
    supabaseCookieNames: supabaseCookies.map(c => c.name),
    supabaseCookieCount: supabaseCookies.length,
    // Log if code verifier cookie exists (critical for PKCE)
    hasCodeVerifier: supabaseCookies.some(c => c.name.includes('code-verifier') || c.name.includes('code_verifier')),
  })

  // Handle Supabase error redirects (e.g., expired links)
  if (error_code || error_description) {
    console.error('[Auth Callback] ❌ Error from Supabase:', { error_code, error_description })
    const errorMessage = error_description || 'Authentication link has expired or is invalid'
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorMessage)}&error_type=link_expired`)
  }

  const supabase = await createClient()
  let authResult: { user: any } | null = null
  let authError: any = null

  // Handle PKCE code exchange (magic link from signInWithOtp)
  if (code) {
    console.log('[Auth Callback] 📧 Attempting PKCE code exchange for session')
    console.log('[Auth Callback] 📧 Code length:', code.length)
    
    const startTime = Date.now()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    const duration = Date.now() - startTime
    
    authResult = data
    authError = error

    console.log('[Auth Callback] PKCE exchange result:', { 
      hasUser: !!data?.user, 
      hasSession: !!data?.session,
      userId: data?.user?.id,
      userEmail: data?.user?.email,
      sessionExpiresAt: data?.session?.expires_at,
      durationMs: duration,
      errorMessage: error?.message,
      errorCode: error?.code,
      errorStatus: error?.status,
      errorName: error?.name,
    })

    // Check for PKCE-specific errors
    if (error) {
      const isPkceError = (
        error.message?.includes('PKCE') ||
        error.message?.includes('code verifier') ||
        error.message?.toLowerCase().includes('code_verifier') ||
        error.code === 'pkce_verification_failed' ||
        error.message?.includes('invalid flow state') ||
        error.message?.includes('flow state')
      )
      
      console.error('[Auth Callback] ❌ Code exchange failed:', {
        isPkceError,
        fullError: JSON.stringify(error, null, 2),
      })
      
      if (isPkceError) {
        console.error('[Auth Callback] ❌ PKCE verification failed - likely opened in different browser')
        console.error('[Auth Callback] 💡 PKCE requires the magic link to be opened in the SAME browser where it was requested')
        const pkceError = 'This login link was opened in a different browser. Please request a new link using the same browser, or use password login instead.'
        return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(pkceError)}&error_type=pkce`)
      }
    }
  }
  // Handle token_hash (invite emails, password recovery, etc.)
  else if (token_hash && type) {
    console.log('[Auth Callback] 🔑 Verifying OTP token, type:', type)
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as 'invite' | 'email' | 'recovery' | 'magiclink',
    })
    authResult = data
    authError = error

    console.log('[Auth Callback] OTP verification result:', { 
      hasUser: !!data?.user, 
      hasSession: !!data?.session,
      userId: data?.user?.id,
      type,
      error: error?.message 
    })
  }

  if (!authError && authResult?.user) {
    const email = authResult.user.email?.toLowerCase() || ''
    console.log('[Auth Callback] ✅ Auth successful for user:', { userId: authResult.user.id, email })

    // Handle password recovery - redirect to reset password page
    if (type === 'recovery') {
      console.log('[Auth Callback] 🔒 Password recovery flow')
      return NextResponse.redirect(`${origin}/reset-password`)
    }

    // Update user status to 'active' when they accept invitation/complete auth
    // This changes the status from 'pending' (set during invite) to 'active'
    console.log('[Auth Callback] 💾 Updating membership_status to active')
    await supabase
      .from('user_profiles')
      .update({ membership_status: 'active' })
      .eq('id', authResult.user.id)

    // Check user_profiles table for onboarding status and role
    console.log('[Auth Callback] 📋 Fetching user profile from database')
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('onboarding_completed, user_type, first_name, last_name, company_id')
      .eq('id', authResult.user.id)
      .single()

    console.log('[Auth Callback] Profile fetch result:', { 
      hasProfile: !!userProfile,
      onboarding_completed: userProfile?.onboarding_completed,
      user_type: userProfile?.user_type,
      company_id: userProfile?.company_id,
      error: profileError?.message 
    })

    // If user hasn't completed onboarding, redirect to onboarding flow
    if (!userProfile?.onboarding_completed) {
      console.log('[Auth Callback] ⏭️ Onboarding not complete, redirecting to onboarding')
      // Store basic auth info in URL params for client-side
      const onboardingUrl = new URL(`${origin}/onboarding`)
      onboardingUrl.searchParams.set('auth', 'success')
      onboardingUrl.searchParams.set('userId', authResult.user.id)
      onboardingUrl.searchParams.set('email', email)
      console.log('[Auth Callback] → Redirect URL:', onboardingUrl.toString())
      return NextResponse.redirect(onboardingUrl.toString())
    }

    // Get role from user_profiles (set during onboarding)
    let role = userProfile?.user_type || authResult.user.user_metadata?.role || 'developer'

    // Build full name from user_profiles (using centralized helper)
    const fullName = buildDisplayName(
      userProfile?.first_name,
      userProfile?.last_name,
      authResult.user.user_metadata?.full_name || email
    )

    // Master admin email override (using centralized auth config)
    if (isMasterAdmin(email)) {
      console.log('[Auth Callback] 👑 Master admin detected')
      role = 'admin'
    }

    // Determine redirect path based on role (using centralized helper)
    const redirectPath = getDashboardPathForRole(role)
    console.log('[Auth Callback] ✅ Onboarding complete, redirecting to dashboard:', { role, path: redirectPath })

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

    console.log('[Auth Callback] → Final redirect:', redirectUrl.toString())
    return NextResponse.redirect(redirectUrl.toString())
  }

  // Return the user to an error page with instructions
  console.error('[Auth Callback] ❌ Authentication failed:', authError?.message || 'Unknown error')
  const errorMessage = authError?.message || 'Could not authenticate user'
  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorMessage)}`)
}
