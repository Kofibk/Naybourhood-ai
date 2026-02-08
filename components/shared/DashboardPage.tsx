'use client'

import { useState, useEffect } from 'react'
import { UserDashboard } from '@/components/UserDashboard'
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
        return
      }

      setUserName(currentUser.name?.split(' ')[0] || defaultNames[userType])

      if (currentUser.company_id) {
        setCompanyId(currentUser.company_id)
        setIsReady(true)
        return
      }

      if (isSupabaseConfigured()) {
        const supabase = createClient()
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('company_id')
          .eq('id', currentUser.id)
          .single()

        if (profile?.company_id) {
          setCompanyId(profile.company_id)
        }
      }

      setIsReady(true)
    }

    initializeDashboard()
  }, [user, userType])

  if (!isReady) {
    return <LoadingState text="Loading dashboard..." className="h-64" />
  }

  return <UserDashboard userType={userType} userName={userName} companyId={companyId} />
}
