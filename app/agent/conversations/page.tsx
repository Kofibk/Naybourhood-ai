'use client'

import { useMemo } from 'react'
import { useData } from '@/contexts/DataContext'
import { useAuth } from '@/contexts/AuthContext'
import { ConversationsView, ConversationsEmptyCompany } from '@/components/ConversationsView'

export default function AgentConversationsPage() {
  const { leads, isLoading } = useData()
  const { user } = useAuth()

  // Filter leads by company_id
  const myLeads = useMemo(() => {
    if (!user?.company_id) return []
    return leads.filter(lead => lead.company_id === user.company_id)
  }, [leads, user?.company_id])

  // Show message if not assigned to company
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
      basePath="/agent"
      title="Conversations"
      subtitle="Manage buyer communications"
      emptyMessage="No conversations with buyers yet"
    />
  )
}
