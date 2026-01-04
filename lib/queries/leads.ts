import { createClient } from '@/lib/supabase/client'
import { Lead, LeadFilters, LeadClassification, PipelineStats, PriorityAction } from '@/types'

// Transform raw Supabase data to Lead interface
export function transformBuyerToLead(buyer: Record<string, unknown>): Lead {
  const qualityScore = (buyer.quality_score as number) || (buyer.ai_quality_score as number) || 0
  const intentScore = (buyer.intent_score as number) || (buyer.ai_intent_score as number) || 0

  // Determine classification based on quality score
  let classification: LeadClassification = 'Low'
  if (qualityScore >= 70) classification = 'Hot'
  else if (qualityScore >= 45) classification = 'Warm'

  // Map status
  const rawStatus = (buyer.status as string) || 'Contact Pending'
  const statusMap: Record<string, string> = {
    'New': 'Contact Pending',
    'Contacted': 'Follow Up',
    'Qualified': 'Follow Up',
    'Viewing Booked': 'Viewing Booked',
    'Viewing Completed': 'Negotiating',
    'Offer Made': 'Negotiating',
    'Negotiating': 'Negotiating',
    'Reserved': 'Reserved',
    'Exchanged': 'Exchanged',
    'Completed': 'Completed',
    'Not Proceeding': 'Not Proceeding',
    'Duplicate': 'Duplicate',
    'Follow Up': 'Follow Up',
    'Contact Pending': 'Contact Pending',
  }
  const status = (statusMap[rawStatus] || rawStatus) as Lead['status']

  // Calculate days in status
  const updatedAt = buyer.updated_at as string
  const daysInStatus = updatedAt
    ? Math.floor((Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  // SLA: Hot leads should be contacted within 2 hours, others within 24 hours
  const slaMet = classification === 'Hot' ? daysInStatus === 0 : daysInStatus <= 1

  return {
    id: buyer.id as string,
    fullName: (buyer.full_name as string) || `${buyer.first_name || ''} ${buyer.last_name || ''}`.trim() || 'Unknown',
    firstName: buyer.first_name as string,
    lastName: buyer.last_name as string,
    email: buyer.email as string,
    phone: buyer.phone as string,
    country: buyer.country as string,

    qualityScore,
    intentScore,
    classification,
    aiConfidence: buyer.ai_confidence as number,

    budgetRange: buyer.budget as string,
    budgetMin: buyer.budget_min as number,
    budgetMax: buyer.budget_max as number,
    paymentMethod: (buyer.payment_method as string)?.toLowerCase() === 'cash' ? 'Cash' : 'Mortgage',
    bedrooms: buyer.bedrooms as number,
    location: buyer.location as string || buyer.area as string,
    purpose: buyer.purpose as Lead['purpose'],
    timeline: buyer.timeline as string,
    readyIn28Days: buyer.ready_in_28_days as boolean,

    budgetMatch: buyer.budget_match as boolean,
    bedroomMatch: buyer.bedroom_match as boolean,

    status,
    assignedCaller: buyer.assigned_user_name as string || buyer.assigned_user as string,
    assignedCallerId: buyer.assigned_to as string,
    daysInStatus,
    slaMet,

    developmentName: buyer.development_name as string || buyer.development as string,
    developmentId: buyer.development_id as string,
    source: buyer.source as string,
    campaign: buyer.campaign as string,
    campaignId: buyer.campaign_id as string,

    proofOfFunds: buyer.proof_of_funds as boolean,
    mortgageStatus: buyer.mortgage_status as string,
    ukBroker: buyer.uk_broker as boolean,
    ukSolicitor: buyer.uk_solicitor as boolean,
    brokerConnected: buyer.broker_connected as boolean,

    viewingIntentConfirmed: buyer.viewing_intent_confirmed as boolean,
    viewingBooked: buyer.viewing_booked as boolean || status === 'Viewing Booked',
    viewingDate: buyer.viewing_date as string,

    lastWaMessage: buyer.last_wa_message as string,
    transcript: buyer.transcript as string,
    callSummary: buyer.call_summary as string,
    replied: buyer.replied as boolean,
    stopComms: buyer.stop_comms as boolean,
    nextFollowUp: buyer.next_follow_up as string,

    aiSummary: buyer.ai_summary as string,
    aiNextAction: buyer.ai_next_action as string,
    aiRiskFlags: buyer.ai_risk_flags as string[],
    aiRecommendations: buyer.ai_recommendations as string[],

    createdAt: buyer.created_at as string,
    updatedAt: buyer.updated_at as string,
    lastContactAt: buyer.last_contact as string,
  }
}

// Fetch all leads with optional filters
export async function fetchLeads(
  filters?: LeadFilters,
  pagination?: { page: number; pageSize: number },
  sortBy: string = 'qualityScore',
  sortAsc: boolean = false
): Promise<{ leads: Lead[]; total: number }> {
  const supabase = createClient()

  // Map sort field to database column
  const sortColumnMap: Record<string, string> = {
    qualityScore: 'quality_score',
    intentScore: 'intent_score',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    fullName: 'full_name',
    status: 'status',
  }
  const sortColumn = sortColumnMap[sortBy] || 'quality_score'

  let query = supabase
    .from('buyers')
    .select('*', { count: 'exact' })

  // Apply filters
  if (filters?.classification) {
    if (filters.classification === 'Hot') {
      query = query.gte('quality_score', 70)
    } else if (filters.classification === 'Warm') {
      query = query.gte('quality_score', 45).lt('quality_score', 70)
    } else {
      query = query.lt('quality_score', 45)
    }
  }

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  if (filters?.paymentMethod) {
    query = query.ilike('payment_method', filters.paymentMethod)
  }

  if (filters?.assignedCaller) {
    query = query.or(`assigned_user_name.eq.${filters.assignedCaller},assigned_user.eq.${filters.assignedCaller}`)
  }

  if (filters?.developmentName) {
    query = query.or(`development_name.ilike.%${filters.developmentName}%,development.ilike.%${filters.developmentName}%`)
  }

  if (filters?.country) {
    query = query.ilike('country', `%${filters.country}%`)
  }

  if (filters?.search) {
    query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`)
  }

  if (filters?.minScore !== undefined) {
    query = query.gte('quality_score', filters.minScore)
  }

  if (filters?.maxScore !== undefined) {
    query = query.lte('quality_score', filters.maxScore)
  }

  // Apply sorting
  query = query.order(sortColumn, { ascending: sortAsc })

  // Apply pagination
  if (pagination) {
    const { page, pageSize } = pagination
    query = query.range(page * pageSize, (page + 1) * pageSize - 1)
  }

  const { data, count, error } = await query

  if (error) {
    console.error('Error fetching leads:', error)
    return { leads: [], total: 0 }
  }

  const leads = (data || []).map(transformBuyerToLead)
  return { leads, total: count || 0 }
}

// Fetch a single lead by ID
export async function fetchLeadById(id: string): Promise<Lead | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('buyers')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching lead:', error)
    return null
  }

  return transformBuyerToLead(data)
}

// Fetch hot leads (quality score >= 70)
export async function fetchHotLeads(limit: number = 10): Promise<Lead[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('buyers')
    .select('*')
    .gte('quality_score', 70)
    .order('quality_score', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching hot leads:', error)
    return []
  }

  return (data || []).map(transformBuyerToLead)
}

// Fetch leads assigned to a specific user
export async function fetchMyLeads(userName: string): Promise<Lead[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('buyers')
    .select('*')
    .or(`assigned_user_name.eq.${userName},assigned_user.eq.${userName}`)
    .order('quality_score', { ascending: false })

  if (error) {
    console.error('Error fetching my leads:', error)
    return []
  }

  return (data || []).map(transformBuyerToLead)
}

// Get pipeline stats
export async function fetchPipelineStats(): Promise<PipelineStats> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('buyers')
    .select('status')

  if (error) {
    console.error('Error fetching pipeline stats:', error)
    return {
      contactPending: 0,
      followUp: 0,
      viewingBooked: 0,
      negotiating: 0,
      reserved: 0,
      exchanged: 0,
      completed: 0,
      notProceeding: 0,
      duplicate: 0,
    }
  }

  const stats: PipelineStats = {
    contactPending: 0,
    followUp: 0,
    viewingBooked: 0,
    negotiating: 0,
    reserved: 0,
    exchanged: 0,
    completed: 0,
    notProceeding: 0,
    duplicate: 0,
  }

  const statusMap: Record<string, keyof PipelineStats> = {
    'New': 'contactPending',
    'Contact Pending': 'contactPending',
    'Contacted': 'followUp',
    'Follow Up': 'followUp',
    'Qualified': 'followUp',
    'Viewing Booked': 'viewingBooked',
    'Viewing Completed': 'negotiating',
    'Offer Made': 'negotiating',
    'Negotiating': 'negotiating',
    'Reserved': 'reserved',
    'Exchanged': 'exchanged',
    'Completed': 'completed',
    'Not Proceeding': 'notProceeding',
    'Duplicate': 'duplicate',
  }

  for (const row of data || []) {
    const key = statusMap[row.status] || 'contactPending'
    stats[key]++
  }

  return stats
}

// Get stale leads (stuck in status for too long)
export async function fetchStaleLeads(daysThreshold: number = 5): Promise<Lead[]> {
  const supabase = createClient()
  const thresholdDate = new Date()
  thresholdDate.setDate(thresholdDate.getDate() - daysThreshold)

  const { data, error } = await supabase
    .from('buyers')
    .select('*')
    .in('status', ['Follow Up', 'Contacted', 'Qualified'])
    .lt('updated_at', thresholdDate.toISOString())
    .order('updated_at', { ascending: true })

  if (error) {
    console.error('Error fetching stale leads:', error)
    return []
  }

  return (data || []).map(transformBuyerToLead)
}

// Generate priority actions for a user
export async function fetchPriorityActions(userName?: string, limit: number = 5): Promise<PriorityAction[]> {
  const leads = userName ? await fetchMyLeads(userName) : (await fetchHotLeads(20))

  const actions: PriorityAction[] = []

  for (const lead of leads.slice(0, limit)) {
    let actionType: PriorityAction['actionType'] = 'call'
    let description = ''
    let urgency: PriorityAction['urgency'] = 'today'

    if (lead.status === 'Contact Pending') {
      actionType = 'call'
      description = 'Initial contact required'
      urgency = lead.classification === 'Hot' ? 'now' : 'today'
    } else if (lead.status === 'Follow Up') {
      if (lead.daysInStatus && lead.daysInStatus > 3) {
        actionType = 're_engage'
        description = `No response in ${lead.daysInStatus} days`
        urgency = 'today'
      } else {
        actionType = 'email'
        description = 'Follow up on previous contact'
        urgency = 'today'
      }
    } else if (lead.status === 'Viewing Booked') {
      actionType = 'confirm'
      description = lead.viewingDate ? `Confirm viewing on ${lead.viewingDate}` : 'Confirm viewing details'
      urgency = 'now'
    } else if (lead.viewingIntentConfirmed && !lead.viewingBooked) {
      actionType = 'book_viewing'
      description = 'Ready to book viewing'
      urgency = 'now'
    }

    actions.push({
      id: `action-${lead.id}`,
      leadId: lead.id,
      leadName: lead.fullName,
      score: lead.qualityScore,
      actionType,
      description,
      urgency,
    })
  }

  // Sort by urgency (now > today > soon) and score
  const urgencyOrder = { now: 0, today: 1, soon: 2 }
  actions.sort((a, b) => {
    const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency]
    if (urgencyDiff !== 0) return urgencyDiff
    return b.score - a.score
  })

  return actions.slice(0, limit)
}

// Update lead status
export async function updateLeadStatus(id: string, status: string): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase
    .from('buyers')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('Error updating lead status:', error)
    return false
  }

  return true
}

// Assign lead to user
export async function assignLead(id: string, userId: string, userName: string): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase
    .from('buyers')
    .update({
      assigned_to: userId,
      assigned_user_name: userName,
      assigned_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    console.error('Error assigning lead:', error)
    return false
  }

  return true
}

// Bulk update leads
export async function bulkUpdateLeads(
  ids: string[],
  updates: Partial<{ status: string; assigned_to: string; assigned_user_name: string }>
): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase
    .from('buyers')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .in('id', ids)

  if (error) {
    console.error('Error bulk updating leads:', error)
    return false
  }

  return true
}
