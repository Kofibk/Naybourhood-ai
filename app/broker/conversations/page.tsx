'use client'

import { useMemo, useState, useEffect } from 'react'
import { useFinanceLeads } from '@/hooks/useFinanceLeads'
import { useAuth } from '@/contexts/AuthContext'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { ConversationsView, ConversationsEmptyCompany } from '@/components/ConversationsView'

export default function BrokerConversationsPage() {
  const { financeLeads, isLoading } = useFinanceLeads()
  const { user } = useAuth()
  const [companyId, setCompanyId] = useState<string | undefined>(undefined)
  const [isReady, setIsReady] = useState(false)

  // Fetch company_id from localStorage or user_profiles
  useEffect(() => {
    const initializeCompany = async () => {
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

    initializeCompany()
  }, [user])

  // Filter borrowers by company_id
  const myBorrowers = useMemo(() => {
    if (!companyId) return []
    return financeLeads.filter(lead => lead.company_id === companyId)
  }, [financeLeads, companyId])

  // Show loading state
  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  // Show message if not assigned to company
  if (!companyId) {
    return (
      <ConversationsEmptyCompany
        title="Conversations"
        subtitle="Manage borrower communications"
      />
    )
  }

  return (
    <ConversationsView
      borrowers={myBorrowers}
      source="borrowers"
      isLoading={isLoading}
      basePath="/broker"
      title="Conversations"
      subtitle="Manage borrower communications"
      emptyMessage="No conversations with borrowers yet"
    />
  )
}
