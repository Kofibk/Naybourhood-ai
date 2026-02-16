'use client'

import { useMemo } from 'react'
import { useFinanceLeads } from '@/hooks/useFinanceLeads'
import { useAuth } from '@/contexts/AuthContext'
import { ConversationsView, ConversationsEmptyCompany } from '@/components/ConversationsView'

export default function BrokerConversationsPage() {
  const { financeLeads, isLoading } = useFinanceLeads()
  const { user, isLoading: authLoading } = useAuth()
  const companyId = user?.company_id

  // Filter borrowers by company_id
  const myBorrowers = useMemo(() => {
    if (!companyId) return financeLeads // Already filtered server-side by RLS
    return financeLeads.filter(lead => lead.company_id === companyId)
  }, [financeLeads, companyId])

  // Show loading state while auth initializes
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  // Show message if not assigned to company (only after auth is loaded)
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
