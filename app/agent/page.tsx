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
      console.log('[Agent Page] 🔄 Initializing dashboard...')
      console.log('[Agent Page] User from context:', user ? { id: user.id, role: user.role } : null)
      
      let currentUser = user
      if (!currentUser) {
        console.log('[Agent Page] No user from context, checking localStorage...')
        try {
          const stored = localStorage.getItem('naybourhood_user')
          if (stored) {
            currentUser = JSON.parse(stored)
            console.log('[Agent Page] ✅ User loaded from localStorage:', { id: currentUser?.id, role: currentUser?.role })
          } else {
            console.log('[Agent Page] ❌ No user in localStorage')
          }
        } catch (err) {
          console.error('[Agent Page] ❌ Error parsing localStorage:', err)
        }
      }

      if (!currentUser?.id) {
        console.log('[Agent Page] ❌ No valid user ID, setting isReady = true (will show no user state)')
        setIsReady(true)
        return
      }

      console.log('[Agent Page] Setting user name:', currentUser.name)
      setUserName(currentUser.name?.split(' ')[0] || 'Agent')

      if (currentUser.company_id) {
        console.log('[Agent Page] ✅ Company ID found in user object:', currentUser.company_id)
        setCompanyId(currentUser.company_id)
        console.log('[Agent Page] ✅ isReady = true')
        setIsReady(true)
        return
      }

      console.log('[Agent Page] No company_id in user object, fetching from database...')
      if (isSupabaseConfigured()) {
        const supabase = createClient()
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('company_id')
          .eq('id', currentUser.id)
          .single()

        if (error) {
          console.error('[Agent Page] ❌ Error fetching profile:', error)
        } else if (profile?.company_id) {
          console.log('[Agent Page] ✅ Company ID fetched from database:', profile.company_id)
          setCompanyId(profile.company_id)
        } else {
          console.log('[Agent Page] ⚠️ No company_id in database profile')
        }
      } else {
        console.log('[Agent Page] ⚠️ Supabase not configured')
      }

      console.log('[Agent Page] ✅ isReady = true')
      setIsReady(true)
    }

    initializeDashboard()
  }, [user])

  if (!isReady) {
    console.log('[Agent Page] 🔄 Rendering loading state - isReady:', isReady)
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  console.log('[Agent Page] ✅ Rendering dashboard - userName:', userName, 'companyId:', companyId)
  return <UserDashboard userType="agent" userName={userName} companyId={companyId} />
}
