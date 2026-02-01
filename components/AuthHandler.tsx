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

  useEffect(() => {
    const handleAuth = async () => {
      // Log full URL for debugging
      console.log('[AuthHandler] 🔍 Checking URL for auth tokens:', {
        fullUrl: window.location.href,
        pathname: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash ? `${window.location.hash.substring(0, 50)}...` : '(none)',
        hasHash: !!window.location.hash && window.location.hash.length > 1,
      })
      
      // Check for hash fragment (e.g., #access_token=...)
      const hash = window.location.hash
      if (!hash || hash.length < 2) {
        console.log('[AuthHandler] No hash fragment found, skipping')
        return
      }

      // Parse hash params
      const hashParams = new URLSearchParams(hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      const type = hashParams.get('type')
      const errorCode = hashParams.get('error_code')
      const errorDescription = hashParams.get('error_description')
      
      console.log('[AuthHandler] 🔑 Hash params parsed:', {
        hasAccessToken: !!accessToken,
        accessTokenPreview: accessToken?.substring(0, 20),
        hasRefreshToken: !!refreshToken,
        type,
        errorCode,
        errorDescription,
      })
      
      // Handle errors in hash
      if (errorCode || errorDescription) {
        console.error('[AuthHandler] ❌ Error in hash fragment:', { errorCode, errorDescription })
        router.push(`/login?error=${encodeURIComponent(errorDescription || 'Authentication failed')}&error_type=${errorCode}`)
        return
      }

      if (accessToken) {
        setIsProcessing(true)
        console.log('[AuthHandler] ✅ Found access token in hash, type:', type)

        try {
          const supabase = createClient()

          console.log('[AuthHandler] 🔄 Setting session from tokens...')
          
          // Set the session from the tokens
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          })

          console.log('[AuthHandler] Session set result:', {
            hasUser: !!data?.user,
            hasSession: !!data?.session,
            userId: data?.user?.id,
            userEmail: data?.user?.email,
            errorMessage: error?.message,
            errorCode: error?.code,
          })

          if (error) {
            console.error('[AuthHandler] ❌ Session error:', {
              message: error.message,
              code: error.code,
              status: error.status,
            })
            router.push('/login?error=' + encodeURIComponent(error.message))
            return
          }

          if (data.user) {
            // Clear the hash from URL
            window.history.replaceState(null, '', window.location.pathname)

            // Handle password recovery - redirect to reset password page
            if (type === 'recovery') {
              console.log('[AuthHandler] Recovery flow, redirecting to reset password')
              router.push('/reset-password')
              return
            }

            // Check onboarding status and get user profile
            const { data: userProfile } = await supabase
              .from('user_profiles')
              .select('onboarding_completed, user_type, first_name, last_name, company_id')
              .eq('id', data.user.id)
              .single()

            // If onboarding not complete, redirect there
            if (!userProfile?.onboarding_completed) {
              console.log('[AuthHandler] Onboarding not complete, redirecting')
              router.push('/onboarding')
              return
            }

            // Build name from first_name + last_name
            const firstName = userProfile?.first_name || ''
            const lastName = userProfile?.last_name || ''
            const fullName = `${firstName} ${lastName}`.trim() || data.user.user_metadata?.full_name || data.user.email?.split('@')[0]
            const role = userProfile?.user_type || data.user.user_metadata?.role || 'developer'

            // Store user info in localStorage
            localStorage.setItem('naybourhood_user', JSON.stringify({
              id: data.user.id,
              email: data.user.email,
              name: fullName,
              role: role,
              company_id: userProfile?.company_id,
            }))

            // Redirect based on role
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
            }

            console.log('[AuthHandler] Redirecting to:', redirectPath)
            router.push(redirectPath)
          }
        } catch (err) {
          console.error('[AuthHandler] Error:', err)
          router.push('/login?error=Authentication failed')
        }
      }
    }

    handleAuth()
  }, [router])

  if (isProcessing) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Signing you in...</p>
        </div>
      </div>
    )
  }

  return null
}
