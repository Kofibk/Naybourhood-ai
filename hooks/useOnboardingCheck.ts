'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface OnboardingCheckResult {
  isLoading: boolean
  isOnboardingComplete: boolean
}

export function useOnboardingCheck(): OnboardingCheckResult {
  const [isLoading, setIsLoading] = useState(true)
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkOnboardingStatus()
  }, [])

  const checkOnboardingStatus = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setIsLoading(false)
        return
      }

      // Check user_profiles table for onboarding status
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single()

      if (error) {
        // If no profile exists, redirect to onboarding
        console.log('[Onboarding Check] No profile found, redirecting to onboarding')
        router.push('/onboarding')
        return
      }

      if (!profile?.onboarding_completed) {
        console.log('[Onboarding Check] Onboarding not complete, redirecting')
        router.push('/onboarding')
        return
      }

      setIsOnboardingComplete(true)
      setIsLoading(false)
    } catch (err) {
      console.error('[Onboarding Check] Error:', err)
      setIsLoading(false)
    }
  }

  return { isLoading, isOnboardingComplete }
}
