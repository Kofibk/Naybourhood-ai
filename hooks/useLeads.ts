'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Buyer } from '@/types'

// Explicit columns for buyers table - no select('*')
const BUYERS_COLUMNS = [
  'id', 'full_name', 'first_name', 'last_name', 'email', 'phone', 'country',
  'status', 'quality_score', 'ai_quality_score', 'intent_score', 'ai_intent_score',
  'ai_confidence', 'ai_summary', 'ai_next_action', 'ai_risk_flags',
  'ai_recommendations', 'ai_classification', 'ai_priority', 'ai_scored_at',
  'budget', 'budget_range', 'budget_min', 'budget_max',
  'bedrooms', 'preferred_bedrooms', 'location', 'area', 'timeline',
  'source', 'source_campaign', 'campaign_id',
  'development_id', 'development_name', 'company_id',
  'payment_method', 'mortgage_status', 'proof_of_funds',
  'uk_broker', 'uk_solicitor',
  'assigned_to', 'assigned_user_name', 'assigned_at',
  'purpose', 'ready_in_28_days',
  'viewing_intent_confirmed', 'viewing_booked', 'viewing_date',
  'replied', 'stop_comms', 'next_follow_up', 'broker_connected',
  'last_wa_message', 'transcript', 'call_summary',
  'notes', 'date_added', 'created_at', 'updated_at',
].join(', ')

export interface UseLeadsOptions {
  page?: number
  limit?: number
  companyId?: string
  status?: string
  assignedTo?: string
  search?: string
}

// Map raw Supabase buyer row to normalized Buyer type
function mapBuyerRow(b: Record<string, unknown>): Buyer {
  const raw = b as Record<string, any>
  const firstName = raw.first_name || ''
  const lastName = raw.last_name || ''
  const combinedName = `${firstName} ${lastName}`.trim()

  return {
    ...raw,
    id: raw.id,
    full_name: raw.full_name || combinedName || 'Unknown',
    first_name: firstName,
    last_name: lastName,
    email: raw.email,
    phone: raw.phone,
    budget: raw.budget || raw.budget_range,
    budget_range: raw.budget_range,
    budget_min: raw.budget_min,
    budget_max: raw.budget_max,
    bedrooms: raw.bedrooms || raw.preferred_bedrooms,
    preferred_bedrooms: raw.preferred_bedrooms,
    location: raw.location,
    area: raw.area,
    country: raw.country,
    timeline: raw.timeline,
    source: raw.source,
    campaign: raw.source_campaign,
    campaign_id: raw.campaign_id,
    source_campaign: raw.source_campaign,
    development_id: raw.development_id,
    development_name: raw.development_name,
    company_id: raw.company_id,
    status: raw.status || 'New',
    quality_score: raw.quality_score ?? raw.ai_quality_score ?? null,
    intent_score: raw.intent_score ?? raw.ai_intent_score ?? null,
    ai_quality_score: raw.ai_quality_score ?? raw.quality_score ?? null,
    ai_intent_score: raw.ai_intent_score ?? raw.intent_score ?? null,
    ai_confidence: raw.ai_confidence ?? null,
    ai_summary: raw.ai_summary,
    ai_next_action: raw.ai_next_action,
    ai_risk_flags: raw.ai_risk_flags,
    ai_recommendations: raw.ai_recommendations,
    ai_classification: raw.ai_classification,
    ai_priority: raw.ai_priority,
    ai_scored_at: raw.ai_scored_at,
    payment_method: raw.payment_method,
    mortgage_status: raw.mortgage_status,
    proof_of_funds: raw.proof_of_funds,
    uk_broker: raw.uk_broker,
    uk_solicitor: raw.uk_solicitor,
    date_added: raw.date_added || raw.created_at,
    created_at: raw.date_added || raw.created_at,
    updated_at: raw.updated_at,
    notes: raw.notes,
    assigned_to: raw.assigned_to,
    assigned_user_name: raw.assigned_user_name,
    assigned_at: raw.assigned_at,
    purpose: raw.purpose,
    ready_in_28_days: raw.ready_in_28_days,
    viewing_intent_confirmed: raw.viewing_intent_confirmed,
    viewing_booked: raw.viewing_booked,
    viewing_date: raw.viewing_date,
    replied: raw.replied,
    stop_comms: raw.stop_comms,
    next_follow_up: raw.next_follow_up,
    broker_connected: raw.broker_connected,
    last_wa_message: raw.last_wa_message,
    transcript: raw.transcript,
    call_summary: raw.call_summary,
  }
}

// Fetch buyers with pagination and filters - max 50 rows per request
async function fetchLeads(
  options: UseLeadsOptions
): Promise<{ data: Buyer[]; totalCount: number }> {
  if (!isSupabaseConfigured()) return { data: [], totalCount: 0 }

  const supabase = createClient()
  if (!supabase) return { data: [], totalCount: 0 }

  const { page = 0, limit = 50, companyId, status, assignedTo, search } = options
  const from = page * limit
  const to = from + limit - 1

  let query = supabase
    .from('buyers')
    .select(BUYERS_COLUMNS, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (companyId) {
    query = query.eq('company_id', companyId)
  }
  if (status) {
    query = query.eq('status', status)
  }
  if (assignedTo) {
    query = query.eq('assigned_to', assignedTo)
  }
  if (search) {
    query = query.or(
      `full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
    )
  }

  const { data, count, error } = await query

  if (error) {
    console.error('[useLeads] Fetch error:', error.message)
    throw new Error(`Failed to fetch leads: ${error.message}`)
  }

  return {
    data: (data || []).map(mapBuyerRow),
    totalCount: count ?? 0,
  }
}

export function useLeads(options: UseLeadsOptions = {}) {
  const queryClient = useQueryClient()

  const {
    data: result,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['leads', options],
    queryFn: () => fetchLeads(options),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })

  const leads = result?.data ?? []
  const totalCount = result?.totalCount ?? 0

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
        .select(BUYERS_COLUMNS)
        .single()

      if (error) throw error
      return { id, updatedData }
    },
    onSuccess: ({ id, updatedData }) => {
      const mapped = mapBuyerRow(updatedData)
      // Update all cached lead queries that might contain this lead
      queryClient.setQueriesData<{ data: Buyer[]; totalCount: number }>(
        { queryKey: ['leads'] },
        (old) => {
          if (!old) return old
          return {
            ...old,
            data: old.data.map((l) => (l.id === id ? mapped : l)),
          }
        }
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
        .select(BUYERS_COLUMNS)
        .single()

      if (error) throw error
      return newData
    },
    onSuccess: (newData) => {
      // Invalidate all lead queries to refresh counts and pages
      queryClient.invalidateQueries({ queryKey: ['leads'] })
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
              queryClient.invalidateQueries({ queryKey: ['leads'] })
              toast.success('Lead scored', {
                description: `Classification: ${scoreResult.classification}`,
              })
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
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
    totalCount,
    isLoading,
    error: error?.message ?? null,
    refreshLeads: refetch,
    updateLead,
    createLead,
    deleteLead,
    assignLead,
  }
}
