'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/**
 * Client-side auth handler that catches authentication tokens from URL hash
 * Supabase magic links and invites can redirect with #access_token=...
 * which can only be read client-side
 */
export function AuthHandler() {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingMessage, setProcessingMessage] = useState('Signing you in...')

  useEffect(() => {
    const handleAuth = async () => {
      // Get URL params for context (use window.location directly to avoid useSearchParams SSR issues)
      const urlParams = new URLSearchParams(window.location.search)
      const urlError = urlParams.get('error')
      const urlErrorType = urlParams.get('error_type')
      
      // Log full URL for debugging
      console.log('[AuthHandler] 🔍 Starting auth check:', {
        fullUrl: window.location.href,
        pathname: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash ? `${window.location.hash.substring(0, 100)}...` : '(none)',
        hashLength: window.location.hash?.length || 0,
        hasHash: !!window.location.hash && window.location.hash.length > 1,
        urlError,
        urlErrorType,
      })
      
      // Check for hash fragment (e.g., #access_token=...)
      const hash = window.location.hash
      if (!hash || hash.length < 2) {
        console.log('[AuthHandler] ℹ️ No hash fragment found, skipping auth handler')
        return
      }

      // Parse hash params
      const hashParams = new URLSearchParams(hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      const type = hashParams.get('type')
      const expiresAt = hashParams.get('expires_at')
      const expiresIn = hashParams.get('expires_in')
      const errorCode = hashParams.get('error_code')
      const errorDescription = hashParams.get('error_description')
      
      console.log('[AuthHandler] 🔑 Hash params parsed:', {
        hasAccessToken: !!accessToken,
        accessTokenLength: accessToken?.length,
        accessTokenPreview: accessToken?.substring(0, 30) + '...',
        hasRefreshToken: !!refreshToken,
        refreshTokenPreview: refreshToken?.substring(0, 10),
        type,
        expiresAt,
        expiresIn,
        errorCode,
        errorDescription,
        allHashKeys: Array.from(hashParams.keys()),
      })
      
      // Handle errors in hash
      if (errorCode || errorDescription) {
        console.error('[AuthHandler] ❌ Error in hash fragment:', { errorCode, errorDescription })
        // Clear hash and redirect with error
        window.history.replaceState(null, '', window.location.pathname)
        router.push(`/login?error=${encodeURIComponent(errorDescription || 'Authentication failed')}&error_type=${errorCode}`)
        return
      }

      if (accessToken) {
        // IMPORTANT: We have tokens in hash - this takes priority over any URL error param
        // The URL error might be from a previous redirect attempt that failed server-side
        // but we can still use the tokens client-side
        console.log('[AuthHandler] ✅ Found access token in hash!')
        console.log('[AuthHandler] 📝 Token type:', type)
        console.log('[AuthHandler] 📝 URL had error param?:', urlError ? 'Yes - ignoring it since we have valid tokens' : 'No')
        
        setIsProcessing(true)
        setProcessingMessage(type === 'invite' ? 'Accepting your invitation...' : 'Signing you in...')

        try {
          const supabase = createClient()

          // Skip getSession check - go directly to setSession with the tokens we have
          // This avoids potential hangs from getSession when there's no existing session
          console.log('[AuthHandler] 🔄 Setting session from hash tokens...')
          
          // Add timeout to prevent infinite loading
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Authentication timed out. Please try again.')), 15000)
          })
          
          // Set the session from the tokens with timeout
          const sessionPromise = supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          })
          
          const { data, error } = await Promise.race([sessionPromise, timeoutPromise]) as Awaited<typeof sessionPromise>

          console.log('[AuthHandler] 📋 setSession result:', {
            hasUser: !!data?.user,
            hasSession: !!data?.session,
            userId: data?.user?.id,
            userEmail: data?.user?.email,
            userMetadata: data?.user?.user_metadata,
            sessionExpiresAt: data?.session?.expires_at,
            errorMessage: error?.message,
            errorCode: error?.code,
            errorStatus: error?.status,
          })

          if (error) {
            console.error('[AuthHandler] ❌ setSession error:', {
              message: error.message,
              code: error.code,
              status: error.status,
              name: error.name,
              fullError: JSON.stringify(error),
            })
            // Clear hash and redirect with error
            window.history.replaceState(null, '', window.location.pathname)
            router.push('/login?error=' + encodeURIComponent(error.message))
            return
          }

          if (data.user) {
            console.log('[AuthHandler] ✅ User authenticated successfully!')
            console.log('[AuthHandler] 👤 User details:', {
              id: data.user.id,
              email: data.user.email,
              emailConfirmed: data.user.email_confirmed_at,
              createdAt: data.user.created_at,
              lastSignIn: data.user.last_sign_in_at,
              metadata: data.user.user_metadata,
              appMetadata: data.user.app_metadata,
            })
            
            // Clear the hash and any error params from URL
            window.history.replaceState(null, '', window.location.pathname)

            // Handle password recovery - redirect to reset password page
            if (type === 'recovery') {
              console.log('[AuthHandler] 🔒 Recovery flow detected, redirecting to reset password')
              router.push('/reset-password')
              return
            }

            setProcessingMessage('Loading your profile...')

            // For invite type, update membership status to active
            if (type === 'invite') {
              console.log('[AuthHandler] 📧 Invite flow - updating membership status to active')
              const { error: updateError } = await supabase
                .from('user_profiles')
                .update({ 
                  membership_status: 'active',
                })
                .eq('id', data.user.id)
              
              if (updateError) {
                console.error('[AuthHandler] ⚠️ Failed to update membership status:', updateError)
              } else {
                console.log('[AuthHandler] ✅ Membership status updated to active')
              }
            }

            // Check onboarding status and get user profile
            console.log('[AuthHandler] 📋 Fetching user profile...')
            const { data: userProfile, error: profileError } = await supabase
              .from('user_profiles')
              .select('onboarding_completed, user_type, first_name, last_name, company_id, is_internal_team, membership_status')
              .eq('id', data.user.id)
              .single()

            console.log('[AuthHandler] 📋 User profile result:', {
              hasProfile: !!userProfile,
              profileError: profileError?.message,
              profile: userProfile,
            })

            // Check if user is internal team (from profile or user metadata)
            const isInternalTeam = userProfile?.is_internal_team || data.user.user_metadata?.is_internal || false
            console.log('[AuthHandler] 👥 Internal team check:', {
              fromProfile: userProfile?.is_internal_team,
              fromMetadata: data.user.user_metadata?.is_internal,
              isInternalTeam,
            })

            // If no profile exists, create one from user metadata
            if (profileError || !userProfile) {
              console.log('[AuthHandler] ⚠️ No profile found, creating from user metadata...')
              const metadata = data.user.user_metadata || {}
              const { firstName, lastName } = parseFullName(metadata.full_name)
              const userIsInternal = metadata.is_internal || false
              
              const { error: createError } = await supabase
                .from('user_profiles')
                .upsert({
                  id: data.user.id,
                  email: data.user.email,
                  first_name: firstName,
                  last_name: lastName,
                  user_type: metadata.role || 'developer',
                  company_id: metadata.company_id || null,
                  is_internal_team: userIsInternal,
                  membership_status: 'active',
                  // Internal team members skip onboarding
                  onboarding_completed: userIsInternal,
                })
              
              if (createError) {
                console.error('[AuthHandler] ❌ Failed to create profile:', createError)
              } else {
                console.log('[AuthHandler] ✅ Profile created')
              }
              
              // Internal team members go to admin, others go to onboarding
              if (userIsInternal) {
                console.log('[AuthHandler] 👥 Internal team member - skipping onboarding, going to /admin')
                router.push('/admin')
              } else {
                console.log('[AuthHandler] ⏭️ Redirecting to onboarding')
                router.push('/onboarding')
              }
              return
            }

            // Internal team members should skip onboarding and go directly to admin
            if (isInternalTeam && !userProfile?.onboarding_completed) {
              console.log('[AuthHandler] 👥 Internal team member with incomplete onboarding - marking complete and redirecting to admin')
              
              // Update profile to mark onboarding complete for internal team
              const { error: updateOnboardingError } = await supabase
                .from('user_profiles')
                .update({ onboarding_completed: true })
                .eq('id', data.user.id)
              
              if (updateOnboardingError) {
                console.error('[AuthHandler] ⚠️ Failed to update onboarding status:', updateOnboardingError)
              }
              
              // Store user info and redirect to admin
              localStorage.setItem('naybourhood_user', JSON.stringify({
                id: data.user.id,
                email: data.user.email,
                name: `${userProfile?.first_name || ''} ${userProfile?.last_name || ''}`.trim() || data.user.email?.split('@')[0],
                role: userProfile?.user_type || 'admin',
                company_id: userProfile?.company_id,
                is_internal_team: true,
              }))
              
              router.push('/admin')
              return
            }

            // If onboarding not complete (for non-internal users), redirect there
            if (!userProfile?.onboarding_completed) {
              console.log('[AuthHandler] ⏭️ Onboarding not complete, redirecting to /onboarding')
              router.push('/onboarding')
              return
            }

            // Build name from first_name + last_name
            const firstName = userProfile?.first_name || ''
            const lastName = userProfile?.last_name || ''
            const fullName = `${firstName} ${lastName}`.trim() || data.user.user_metadata?.full_name || data.user.email?.split('@')[0]
            const role = userProfile?.user_type || data.user.user_metadata?.role || 'developer'

            console.log('[AuthHandler] 👤 Final user info:', {
              fullName,
              role,
              companyId: userProfile?.company_id,
              isInternalTeam: userProfile?.is_internal_team,
            })

            // Store user info in localStorage
            localStorage.setItem('naybourhood_user', JSON.stringify({
              id: data.user.id,
              email: data.user.email,
              name: fullName,
              role: role,
              company_id: userProfile?.company_id,
              is_internal_team: userProfile?.is_internal_team,
            }))

            // Redirect based on role
            let redirectPath = '/developer'
            switch (role) {
              case 'admin':
              case 'super_admin':
                redirectPath = '/admin'
                break
              case 'agent':
                redirectPath = '/agent'
                break
              case 'broker':
                redirectPath = '/broker'
                break
            }

            console.log('[AuthHandler] ✅ Auth complete! Redirecting to:', redirectPath)
            router.push(redirectPath)
          } else {
            console.error('[AuthHandler] ❌ No user returned after setSession')
            window.history.replaceState(null, '', window.location.pathname)
            router.push('/login?error=' + encodeURIComponent('Authentication failed - no user returned'))
          }
        } catch (err: any) {
          console.error('[AuthHandler] ❌ Unexpected error:', err)
          const errorMessage = err?.message || 'Authentication failed'
          console.error('[AuthHandler] 📋 Error details:', {
            message: errorMessage,
            name: err?.name,
            stack: err?.stack,
          })
          window.history.replaceState(null, '', window.location.pathname)
          setIsProcessing(false)
          router.push('/login?error=' + encodeURIComponent(errorMessage))
        }
      } else {
        console.log('[AuthHandler] ℹ️ Hash exists but no access_token found')
        console.log('[AuthHandler] 📋 Hash keys present:', Array.from(hashParams.keys()))
      }
    }

    handleAuth()
  }, [router])

  const handleRetry = () => {
    // Reload the page to retry the auth flow
    window.location.reload()
  }

  const handleCancel = () => {
    // Clear hash and go to login
    window.history.replaceState(null, '', '/login')
    setIsProcessing(false)
    router.push('/login')
  }

  if (isProcessing) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">{processingMessage}</p>
          <p className="text-xs text-muted-foreground/60 mt-2">Check browser console for detailed logs</p>
          <div className="mt-4 flex gap-2 justify-center">
            <button 
              onClick={handleRetry}
              className="text-xs text-primary hover:underline"
            >
              Taking too long? Retry
            </button>
            <span className="text-xs text-muted-foreground">|</span>
            <button 
              onClick={handleCancel}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}

// Helper function to parse full name
function parseFullName(fullName: string | null | undefined): {
  firstName: string
  lastName: string
} {
  if (!fullName) {
    return { firstName: '', lastName: '' }
  }

  const trimmed = fullName.trim()
  const parts = trimmed.split(/\s+/)

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' }
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  }
}
