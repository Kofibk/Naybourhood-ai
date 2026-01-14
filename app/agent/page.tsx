'use client'

import { useState, useEffect } from 'react'
import { UserDashboard } from '@/components/UserDashboard'
import { useAuth } from '@/contexts/AuthContext'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'

export default function AgentDashboard() {
  const { user, isLoading } = useAuth()
  const [companyId, setCompanyId] = useState<string | undefined>(user?.company_id)

  // Fetch company_id from user_profiles if not in auth context
  useEffect(() => {
    const fetchCompanyId = async () => {
      if (user?.company_id) {
        setCompanyId(user.company_id)
        return
      }

      if (user?.id && isSupabaseConfigured()) {
        const supabase = createClient()
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('company_id')
          .eq('id', user.id)
          .single()

        if (profile?.company_id) {
          setCompanyId(profile.company_id)
        }
      }
    }

    if (user?.id) {
      fetchCompanyId()
    }
  }, [user?.id, user?.company_id])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  const userName = user?.name?.split(' ')[0] || 'Agent'

  return <UserDashboard userType="agent" userName={userName} companyId={companyId} />
}
