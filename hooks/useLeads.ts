'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Buyer } from '@/types'

// Map raw Supabase buyer row to normalized Buyer type
function mapBuyerRow(b: any): Buyer {
  const firstName = b.first_name || b['First Name'] || b['first name'] || ''
  const lastName = b.last_name || b['Last Name'] || b['last name'] || ''
  const combinedName = `${firstName} ${lastName}`.trim()

  return {
    ...b,
    id: b.id,
    full_name: b.full_name || b['Lead Name'] || b['lead name'] || combinedName || b.name || 'Unknown',
    first_name: firstName,
    last_name: lastName,
    email: b.email || b['Email'],
    phone: b.phone || b['phone number'] || b['Phone Number'],
    budget: b.budget || b.budget_range || b['budget range'] || b['Budget Range'],
    budget_range: b.budget_range || b['budget range'] || b['Budget Range'],
    budget_min: b.budget_min,
    budget_max: b.budget_max,
    bedrooms: b.bedrooms || b.preferred_bedrooms || b['preferred bedrooms'] || b['Preferred Bedrooms'],
    preferred_bedrooms: b.preferred_bedrooms || b['preferred bedrooms'] || b['Preferred Bedrooms'],
    location: b.location || b['preferred location'] || b['Preferred Location'],
    area: b.area || b['preferred location'] || b['Preferred Location'],
    country: b.country || b['Country'],
    timeline: b.timeline || b['timeline to purchase'] || b['Timeline to Purchase'],
    source: b.source || b['source platform'] || b['Source Platform'],
    campaign: b.campaign || b.source_campaign || b['Source Campaign'] || b['source campaign'],
    campaign_id: b.campaign_id,
    source_campaign: b.source_campaign || b['Source Campaign'] || b['source campaign'],
    development_id: b.development_id,
    development_name: b.development_name || b.development || b['Development'] || b['development'],
    company_id: b.company_id,
    status: b.status || b['Status'] || 'New',
    // Scores - use ?? to preserve 0 values, null means unscored
    quality_score: b.quality_score ?? b.ai_quality_score ?? b['Quality Score'] ?? b['quality score'] ?? null,
    intent_score: b.intent_score ?? b.ai_intent_score ?? b['Intent Score'] ?? b['intent score'] ?? null,
    ai_quality_score: b.ai_quality_score ?? b.quality_score ?? null,
    ai_intent_score: b.ai_intent_score ?? b.intent_score ?? null,
    ai_confidence: b.ai_confidence ?? b.confidence ?? null,
    ai_summary: b.ai_summary,
    ai_next_action: b.ai_next_action,
    ai_risk_flags: b.ai_risk_flags,
    ai_recommendations: b.ai_recommendations,
    ai_classification: b.ai_classification,
    ai_priority: b.ai_priority,
    ai_scored_at: b.ai_scored_at,
    payment_method: b.payment_method || b['cash or mortgage'] || b['Cash or Mortgage'],
    mortgage_status: b.mortgage_status || b['manual update'] || b['Manual Update'],
    proof_of_funds: b.proof_of_funds,
    uk_broker: b.uk_broker,
    uk_solicitor: b.uk_solicitor,
    date_added: b.date_added || b['date added'] || b['Date Added'],
    created_at: b.date_added || b.created_at || b['date added'] || b['Date Added'],
    updated_at: b.updated_at,
    notes: b.notes,
    assigned_to: b.assigned_to,
    assigned_user_name: b.assigned_user_name,
    assigned_at: b.assigned_at,
    // Engagement fields
    purpose: b.purpose || b['Purpose'] || b['purchase_purpose'],
    ready_in_28_days: b.ready_in_28_days ?? b['Ready in 28 Days'] ?? b.ready_in_28days,
    viewing_intent_confirmed: b.viewing_intent_confirmed ?? b['Viewing Intent'] ?? b.viewing_intent,
    viewing_booked: b.viewing_booked ?? b['Viewing Booked'],
    viewing_date: b.viewing_date || b['Viewing Date'],
    replied: b.replied ?? b['Replied'] ?? b.has_replied,
    stop_comms: b.stop_comms ?? b['Stop Comms'] ?? b.opt_out,
    next_follow_up: b.next_follow_up || b['Next Follow Up'] || b.follow_up_date,
    broker_connected: b.broker_connected ?? b['Broker Connected'],
    // Communication history
    last_wa_message: b.last_wa_message || b['Last WA Message'] || b.last_whatsapp_message,
    transcript: b.transcript || b['Transcript'],
    call_summary: b.call_summary || b['Call Summary'],
  }
}

// Fetch all buyers with pagination (1000 per batch)
async function fetchLeads(): Promise<Buyer[]> {
  if (!isSupabaseConfigured()) return []

  const supabase = createClient()
  if (!supabase) return []

  let allBuyers: any[] = []
  let from = 0
  const batchSize = 1000
  let hasMore = true

  while (hasMore) {
    const { data, error } = await supabase
      .from('buyers')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, from + batchSize - 1)

    if (error) {
      console.error('[useLeads] Fetch error:', error.message)
      throw new Error(`Failed to fetch leads: ${error.message}`)
    }
    if (data && data.length > 0) {
      allBuyers = [...allBuyers, ...data]
      from += batchSize
      hasMore = data.length === batchSize
    } else {
      hasMore = false
    }
  }

  return allBuyers.map(mapBuyerRow)
}

export function useLeads() {
  const queryClient = useQueryClient()

  const {
    data: leads = [],
    isLoading,
    error,
    refetch,
  } = useQuery<Buyer[], Error>({
    queryKey: ['leads'],
    queryFn: fetchLeads,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  // Update a lead
  const updateLeadMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Buyer> }) => {
      if (!isSupabaseConfigured()) throw new Error('Supabase not configured')
      const supabase = createClient()
      if (!supabase) throw new Error('Failed to create Supabase client')

      const excludeColumns = ['id', 'created_at']
      const cleanData: Record<string, any> = {}
      for (const [key, value] of Object.entries(data)) {
        if (!excludeColumns.includes(key) && value !== undefined) {
          cleanData[key] = value
        }
      }
      cleanData.updated_at = new Date().toISOString()

      const { data: updatedData, error } = await supabase
        .from('buyers')
        .update(cleanData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return { id, updatedData }
    },
    onSuccess: ({ id, updatedData }) => {
      // Update cache with properly mapped data
      const mapped = mapBuyerRow(updatedData)
      queryClient.setQueryData<Buyer[]>(['leads'], (old) =>
        old?.map((l) => (l.id === id ? mapped : l)) ?? []
      )
      toast.success('Lead updated')
    },
    onError: (error: any) => {
      console.error('[useLeads] Update error:', error)
      toast.error('Failed to update lead', { description: error.message })
    },
  })

  // Create a lead with auto-scoring
  const createLeadMutation = useMutation({
    mutationFn: async (data: Partial<Buyer>) => {
      if (!isSupabaseConfigured()) throw new Error('Supabase not configured')
      const supabase = createClient()
      if (!supabase) throw new Error('Failed to create Supabase client')

      const { data: newData, error } = await supabase
        .from('buyers')
        .insert(data)
        .select()
        .single()

      if (error) throw error
      return newData
    },
    onSuccess: (newData) => {
      const mapped = mapBuyerRow(newData)
      queryClient.setQueryData<Buyer[]>(['leads'], (old) =>
        [mapped, ...(old ?? [])]
      )
      toast.success('Lead created')

      // Auto-score in background
      if (newData?.id) {
        fetch('/api/ai/score-buyer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ buyerId: newData.id }),
        })
          .then(async (res) => {
            if (res.ok) {
              const scoreResult = await res.json()
              queryClient.setQueryData<Buyer[]>(['leads'], (old) =>
                old?.map((l) =>
                  l.id === newData.id
                    ? {
                        ...l,
                        ai_quality_score: scoreResult.quality_score,
                        ai_intent_score: scoreResult.intent_score,
                        ai_confidence: scoreResult.confidence,
                        ai_classification: scoreResult.classification,
                        ai_priority: scoreResult.priority,
                        ai_summary: scoreResult.summary,
                        ai_next_action: scoreResult.next_action,
                        ai_scored_at: new Date().toISOString(),
                      }
                    : l
                ) ?? []
              )
              toast.success('Lead scored', { description: `Classification: ${scoreResult.classification}` })
            }
          })
          .catch(() => {
            // Auto-score failed silently - not critical
          })
      }
    },
    onError: (error: any) => {
      console.error('[useLeads] Create error:', error)
      toast.error('Failed to create lead', { description: error.message })
    },
  })

  // Delete a lead
  const deleteLeadMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!isSupabaseConfigured()) throw new Error('Supabase not configured')
      const supabase = createClient()
      if (!supabase) throw new Error('Failed to create Supabase client')

      const { error } = await supabase
        .from('buyers')
        .delete()
        .eq('id', id)

      if (error) throw error
      return id
    },
    onSuccess: (id) => {
      queryClient.setQueryData<Buyer[]>(['leads'], (old) =>
        old?.filter((l) => l.id !== id) ?? []
      )
      toast.success('Lead deleted')
    },
    onError: (error: any) => {
      console.error('[useLeads] Delete error:', error)
      toast.error('Failed to delete lead', { description: error.message })
    },
  })

  // Convenience wrappers matching DataContext API
  const updateLead = async (id: string, data: Partial<Buyer>): Promise<Buyer | null> => {
    try {
      const result = await updateLeadMutation.mutateAsync({ id, data })
      return result.updatedData
    } catch {
      return null
    }
  }

  const createLead = async (data: Partial<Buyer>): Promise<Buyer | null> => {
    try {
      return await createLeadMutation.mutateAsync(data)
    } catch {
      return null
    }
  }

  const deleteLead = async (id: string): Promise<boolean> => {
    try {
      await deleteLeadMutation.mutateAsync(id)
      return true
    } catch {
      return false
    }
  }

  const assignLead = async (leadId: string, userId: string, userName?: string): Promise<boolean> => {
    const result = await updateLead(leadId, {
      assigned_to: userId,
      assigned_user_name: userName || 'Unknown',
      assigned_at: new Date().toISOString(),
    })
    return !!result
  }

  return {
    leads,
    isLoading,
    error: error?.message ?? null,
    refreshLeads: refetch,
    updateLead,
    createLead,
    deleteLead,
    assignLead,
  }
}
