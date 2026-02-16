'use client'

import { useMemo } from 'react'
import { useLeads } from '@/hooks/useLeads'
import { useAuth } from '@/contexts/AuthContext'
import { ConversationsView, ConversationsEmptyCompany } from '@/components/ConversationsView'

export default function DeveloperConversationsPage() {
  const { leads, isLoading } = useLeads()
  const { user, isLoading: authLoading } = useAuth()

  // Filter leads by company_id
  const myLeads = useMemo(() => {
    if (!user?.company_id) return leads // Already filtered server-side by RLS
    return leads.filter(lead => lead.company_id === user.company_id)
  }, [leads, user?.company_id])

  // Show loading while auth initializes
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  // Show message if not assigned to company (only after auth loaded)
  if (!user?.company_id) {
    return (
      <ConversationsEmptyCompany
        title="Conversations"
        subtitle="Manage buyer communications"
      />
    )
  }

  return (
    <ConversationsView
      leads={myLeads}
      source="leads"
      isLoading={isLoading}
      basePath="/developer"
      title="Conversations"
      subtitle="Manage buyer communications"
      emptyMessage="No conversations with buyers yet"
    />
  )
}
