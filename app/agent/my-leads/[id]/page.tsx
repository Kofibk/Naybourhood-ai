'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lead } from '@/types'
import { LeadDetail } from '@/components/leads'
import { fetchLeadById, updateLeadStatus } from '@/lib/queries/leads'

interface LeadDetailPageProps {
  params: { id: string }
}

export default function AgentLeadDetailPage({ params }: LeadDetailPageProps) {
  const router = useRouter()
  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadLead = async () => {
      setLoading(true)
      const data = await fetchLeadById(params.id)
      setLead(data)
      setLoading(false)
    }
    loadLead()
  }, [params.id])

  const handleBack = () => {
    router.push('/agent/my-leads')
  }

  const handleUpdate = async (updates: Partial<Lead>) => {
    if (!lead) return

    if (updates.status) {
      await updateLeadStatus(lead.id, updates.status)
    }

    // Refresh lead data
    const data = await fetchLeadById(params.id)
    setLead(data)
  }

  const handleRescore = async () => {
    if (!lead) return

    try {
      const response = await fetch('/api/ai/score-buyer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyerId: lead.id }),
      })

      if (response.ok) {
        // Refresh lead data
        const data = await fetchLeadById(params.id)
        setLead(data)
      }
    } catch (error) {
      console.error('Error rescoring lead:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading lead...</div>
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-muted-foreground mb-4">Lead not found</p>
        <button
          onClick={handleBack}
          className="text-primary hover:underline"
        >
          Back to my leads
        </button>
      </div>
    )
  }

  return (
    <LeadDetail
      lead={lead}
      onBack={handleBack}
      onUpdate={handleUpdate}
      onRescore={handleRescore}
      canEdit={true} // Agents can update status but not assignment
    />
  )
}
