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
      // Check for hash fragment (e.g., #access_token=...)
      const hash = window.location.hash
      if (!hash || hash.length < 2) return

      // Parse hash params
      const hashParams = new URLSearchParams(hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      const type = hashParams.get('type')

      if (accessToken) {
        setIsProcessing(true)
        console.log('[AuthHandler] Found access token in hash, type:', type)

        try {
          const supabase = createClient()

          // Set the session from the tokens
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          })

          if (error) {
            console.error('[AuthHandler] Session error:', error)
            router.push('/login?error=' + encodeURIComponent(error.message))
            return
          }

          if (data.user) {
            // Clear the hash from URL
            window.history.replaceState(null, '', window.location.pathname)

            // Check onboarding status first
            const { data: userProfile } = await supabase
              .from('user_profiles')
              .select('onboarding_completed, user_type')
              .eq('id', data.user.id)
              .single()

            // If onboarding not complete, redirect there
            if (!userProfile?.onboarding_completed) {
              console.log('[AuthHandler] Onboarding not complete, redirecting')
              router.push('/onboarding')
              return
            }

            // Fetch user profile to get role
            const { data: profile } = await supabase
              .from('profiles')
              .select('role, full_name, company_id')
              .eq('id', data.user.id)
              .single()

            const role = profile?.role || userProfile?.user_type || data.user.user_metadata?.role || 'developer'
            const name = profile?.full_name || data.user.user_metadata?.full_name || data.user.email?.split('@')[0]

            // Store user info in localStorage
            localStorage.setItem('naybourhood_user', JSON.stringify({
              id: data.user.id,
              email: data.user.email,
              name: name,
              role: role,
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
