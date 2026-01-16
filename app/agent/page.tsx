'use client'

import { useState, useEffect } from 'react'
import { UserDashboard } from '@/components/UserDashboard'
import { useAuth } from '@/contexts/AuthContext'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'

export default function AgentDashboard() {
  const { user } = useAuth()
  const [companyId, setCompanyId] = useState<string | undefined>(undefined)
  const [userName, setUserName] = useState<string>('Agent')
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

      setUserName(currentUser.name?.split(' ')[0] || 'Agent')

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
  }, [user])

  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return <UserDashboard userType="agent" userName={userName} companyId={companyId} />
}
