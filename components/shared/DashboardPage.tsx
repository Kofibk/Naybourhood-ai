'use client'

import { useState, useEffect } from 'react'
import { UserDashboard } from '@/components/UserDashboard'
import { WelcomeOnboarding } from '@/components/onboarding/WelcomeOnboarding'
import { LoadingState } from '@/components/ui/loading-state'
import { useAuth } from '@/contexts/AuthContext'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'

type UserType = 'developer' | 'agent' | 'broker'

const defaultNames: Record<UserType, string> = {
  developer: 'Developer',
  agent: 'Agent',
  broker: 'Broker',
}

interface DashboardPageProps {
  userType: UserType
}

export function DashboardPage({ userType }: DashboardPageProps) {
  const { user } = useAuth()
  const [companyId, setCompanyId] = useState<string | undefined>(undefined)
  const [userName, setUserName] = useState<string>(defaultNames[userType])
  const [isReady, setIsReady] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [hasDevelopments, setHasDevelopments] = useState(false)
  const [onboardingChecked, setOnboardingChecked] = useState(false)

  useEffect(() => {
    const initializeDashboard = async () => {
      let currentUser = user
      if (!currentUser) {
        try {
          const stored = localStorage.getItem('naybourhood_user')
          if (stored) {
            currentUser = JSON.parse(stored)
          }
        } catch { /* ignore */ }
      }

      if (!currentUser?.id) {
        setIsReady(true)
        setOnboardingChecked(true)
        return
      }

      setUserName(currentUser.name?.split(' ')[0] || defaultNames[userType])

      let resolvedCompanyId = currentUser.company_id

      if (!resolvedCompanyId && isSupabaseConfigured()) {
        const supabase = createClient()
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('company_id')
          .eq('id', currentUser.id)
          .single()

        if (profile?.company_id) {
          resolvedCompanyId = profile.company_id
        }
      }

      if (resolvedCompanyId) {
        setCompanyId(resolvedCompanyId)

        // Check if user skipped onboarding this session
        const skipped = sessionStorage.getItem('naybourhood_skip_onboarding')
        if (!skipped && isSupabaseConfigured()) {
          try {
            const supabase = createClient()
            const { count: buyerCount } = await supabase
              .from('buyers')
              .select('id', { count: 'exact', head: true })
              .eq('company_id', resolvedCompanyId)

            const { count: devCount } = await supabase
              .from('developments')
              .select('id', { count: 'exact', head: true })
              .eq('company_id', resolvedCompanyId)

            const hasDevs = (devCount ?? 0) > 0
            setHasDevelopments(hasDevs)

            if ((buyerCount ?? 0) === 0 && !hasDevs) {
              setShowOnboarding(true)
            }
          } catch (err) {
            console.error('Error checking onboarding status:', err)
          }
        }
      }

      setIsReady(true)
      setOnboardingChecked(true)
    }

    initializeDashboard()
  }, [user, userType])

  if (!isReady || !onboardingChecked) {
    return <LoadingState text="Loading dashboard..." className="h-64" />
  }

  if (showOnboarding && companyId) {
    return (
      <WelcomeOnboarding
        companyId={companyId}
        userName={userName}
        userType={userType}
        initialHasDevelopments={hasDevelopments}
        initialHasBuyers={false}
      />
    )
  }

  return <UserDashboard userType={userType} userName={userName} companyId={companyId} />
}
