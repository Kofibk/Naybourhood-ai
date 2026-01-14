// User roles: super_admin and admin are internal Naybourhood team
// developer, agent, broker are client users from partner companies
export type UserRole = 'super_admin' | 'admin' | 'developer' | 'agent' | 'broker'

// Internal team roles (Naybourhood staff)
export const INTERNAL_ROLES: UserRole[] = ['super_admin', 'admin']

// Client roles (partner companies)
export const CLIENT_ROLES: UserRole[] = ['developer', 'agent', 'broker']

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  company?: string      // Company name (display)
  company_id?: string   // Company UUID for data filtering
  avatarUrl?: string
  is_internal?: boolean // True for Naybourhood team members
}

export interface Buyer {
  id: string
  lead_id?: number  // Supabase integer ID
  first_name?: string
  last_name?: string
  full_name?: string
  email?: string
  phone?: string
  country?: string
  linkedin?: string
  company_website?: string
  // Budget fields
  budget?: string
  budget_range?: string  // Supabase field name
  budget_min?: number
  budget_max?: number
  // Property preferences
  bedrooms?: number
  preferred_bedrooms?: number  // Supabase field name
  location?: string
  preferred_location?: string  // Supabase field name
  area?: string
  preferred_communication?: string
  // Timeline & Purpose
  timeline?: string
  timeline_to_purchase?: string  // Supabase field name
  purpose?: string
  purchase_purpose?: string  // Supabase field name (enum)
  ready_in_28_days?: boolean
  ready_within_28_days?: boolean  // Supabase field name
  intent?: string
  // Scoring
  score?: number  // Legacy score field
  quality_score?: number
  intent_score?: number
  budget_match?: boolean
  bedroom_match?: boolean
  buyer_summary?: string
  // Source & Campaign
  source?: string
  source_platform?: string  // Supabase field name
  campaign?: string
  source_campaign?: string  // Supabase field name
  source_creative?: string
  channel?: string
  campaign_id?: string
  // Development
  development_id?: string
  development_name?: string
  // Status
  status?: string
  enquiry_type?: string
  days_in_status?: number
  status_last_modified?: string
  contact_sla_met?: boolean
  // Financial qualification
  payment_method?: string
  proof_of_funds?: boolean
  mortgage_status?: string
  uk_broker?: string  // ConnectionStatus: 'yes' | 'introduced' | 'no' | 'unknown'
  uk_solicitor?: string  // ConnectionStatus: 'yes' | 'introduced' | 'no' | 'unknown'
  notes?: string
  // Assignment
  assigned_to?: string
  assigned_user?: string
  assigned_user_name?: string
  assigned_caller?: string  // Supabase field name
  assigned_at?: string
  company_id?: string
  // AI fields
  ai_quality_score?: number
  ai_intent_score?: number
  ai_confidence?: number
  ai_summary?: string
  ai_next_action?: string
  ai_risk_flags?: string[]
  ai_recommendations?: string[]
  ai_classification?: string
  ai_priority?: string
  ai_scored_at?: string
  // Engagement & Viewing
  viewing_intent_confirmed?: boolean
  viewing_booked?: boolean
  viewing_date?: string
  viewing_end_time?: string
  viewing_confirmation?: string
  replied?: boolean
  stop_comms?: boolean
  stop_agent_communication?: boolean  // Supabase field name
  broker_connected?: boolean
  connect_to_broker?: boolean  // Supabase field name
  // Follow-up
  next_follow_up?: string
  followup_date?: string  // Supabase field name
  followup_start?: string
  last_followup_attempt?: string
  first_agent_call?: string
  last_email_sent?: string
  // Communication history
  last_wa_message?: string
  wa_nurture_reply_status?: string
  transcript?: string
  agent_transcript?: string  // Supabase field name
  transcription?: string
  call_summary?: string
  // Timestamps
  date_added?: string
  created_at?: string
  updated_at?: string
  last_contact?: string
}

export interface AppUser {
  id: string
  name: string
  email: string
  role: UserRole
  company?: string
  company_id?: string
  avatar_url?: string
  status?: 'active' | 'inactive' | 'pending'
  email_confirmed?: boolean
  last_active?: string
  created_at?: string
  invited_at?: string
  is_internal?: boolean  // True for Naybourhood team members
  phone?: string
  job_title?: string
  bio?: string
}

export interface Campaign {
  id: string
  name: string
  client?: string
  development?: string
  company_id?: string
  platform?: string
  status?: string
  spend?: number
  amount_spent?: number
  leads?: number
  lead_count?: number
  cpl?: number
  cost_per_lead?: number
  impressions?: number
  clicks?: number
  ctr?: number
  start_date?: string
  end_date?: string
  created_at?: string
  updated_at?: string
  // AI fields
  ai_performance_summary?: string
  ai_recommendations?: string[]
  ai_health_score?: number
  ai_analyzed_at?: string
}

export interface Development {
  id: string
  name: string
  location?: string
  address?: string
  developer?: string
  status?: string
  units?: number
  total_units?: number
  available_units?: number
  price_from?: string
  price_to?: string
  completion_date?: string
  description?: string
  image_url?: string
  features?: string[]
  total_leads?: number
  ad_spend?: number
  // PDF and document attachments
  brochure_url?: string
  floor_plan_url?: string
  price_list_url?: string
  attachments?: Array<{ name: string; url: string; type?: string }>
  created_at?: string
  updated_at?: string
}

export interface Company {
  id: string
  name?: string
  type?: string
  website?: string
  // Contact fields (Supabase uses contact_phone, frontend uses phone)
  contact_name?: string
  contact_email?: string
  contact_phone?: string
  phone?: string // Alias for contact_phone
  status?: string
  ad_spend?: number
  total_leads?: number
  campaign_count?: number
  // Billing fields
  subscription_status?: 'active' | 'trialing' | 'past_due' | 'cancelled' | 'none'
  subscription_tier?: 'starter' | 'access' | 'growth' | 'enterprise'
  tier?: string // Alias for subscription_tier
  subscription_price?: number
  billing_cycle?: 'monthly' | 'annual'
  next_billing_date?: string
  stripe_customer_id?: string
  stripe_subscription_id?: string
  created_at?: string
  updated_at?: string
}

export interface Invoice {
  id: string
  company_id: string
  company_name?: string
  amount: number
  status: 'paid' | 'pending' | 'overdue' | 'failed'
  invoice_date: string
  due_date?: string
  paid_date?: string
  stripe_invoice_id?: string
  description?: string
  created_at?: string
}

export interface Conversation {
  id: string
  buyer_id?: string
  user_id?: string
  status?: string
  last_message_at?: string
  message_count?: number
  created_at?: string
}

export interface Message {
  id: string
  conversation_id?: string
  sender_type?: 'user' | 'buyer'
  content?: string
  sent_via?: 'whatsapp' | 'email'
  delivered?: boolean
  read?: boolean
  created_at?: string
}

// UserProfile matches the Supabase 'user_profiles' table exactly
// IMPORTANT: Use these field names when querying Supabase
export interface UserProfile {
  id: string
  email?: string
  first_name?: string      // NOT full_name
  last_name?: string       // NOT full_name
  user_type?: UserRole     // NOT role
  company_id?: string
  company_name?: string    // Legacy text field
  avatar_url?: string
  onboarding_completed?: boolean
  last_active?: string
  created_at?: string
  updated_at?: string
}

// Legacy Profile interface - DEPRECATED, use UserProfile instead
// Kept for backwards compatibility
export interface Profile {
  id: string
  email?: string
  full_name?: string  // DEPRECATED: use first_name + last_name
  role?: string       // DEPRECATED: use user_type
  company_id?: string
  avatar_url?: string
  last_active?: string
  created_at?: string
}

export interface DashboardMetrics {
  totalLeads: number
  hotLeads: number
  avgScore: number
  totalSpend: number
  avgCPL: number
  totalCampaigns: number
  activeCampaigns: number
  totalCompanies?: number
  qualifiedRate?: number
}

export interface FinanceLead {
  id: string
  full_name?: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  finance_type?: string
  loan_amount?: number
  loan_amount_display?: string
  required_by_date?: string
  message?: string
  status?: string
  notes?: string
  assigned_agent?: string
  company_id?: string      // Broker company assignment
  date_added?: string
  created_at?: string
  updated_at?: string
}

// AI Types
export interface AILeadScore {
  quality: number      // 0-100: How good is this lead?
  intent: number       // 0-100: How likely to buy?
  confidence: number   // 0-1: How sure is the AI?
}

export interface AIRecommendation {
  id: string
  page_type: 'dashboard' | 'campaign' | 'campaign_detail' | 'buyer' | 'analysis'
  related_buyer_id?: string
  related_campaign_id?: string
  related_development_id?: string
  title: string
  description?: string
  action_type?: 'call' | 'email' | 'book_viewing' | 'follow_up' | 'escalate' | 'archive'
  action_url?: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  dismissed: boolean
  completed: boolean
  completed_at?: string
  created_at: string
  expires_at?: string
}

export interface AIInsight {
  id: string
  insight_type: 'pipeline' | 'campaign' | 'performance' | 'alert' | 'trend'
  title: string
  description?: string
  metric_value?: string
  metric_change?: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  dismissed: boolean
  created_at: string
}

export interface AIBuyerSummary {
  summary: string
  quality_score: number
  intent_score: number
  confidence: number
  next_action: string
  risk_flags: string[]
  recommendations: string[]
}

export interface AICampaignAnalysis {
  summary: string
  health_score: number
  recommendations: string[]
  prediction: {
    currentTrajectory: { leads: number; viewings: number; reservations: number }
    withRecommendations: { leads: number; viewings: number; reservations: number }
  }
}

export interface AIDashboardInsights {
  insights: Array<{
    type: 'critical' | 'warning' | 'positive' | 'info'
    title: string
    description: string
    action?: string
  }>
  recommendedActions: Array<{
    priority: number
    title: string
    description: string
    actionType: 'call' | 'email' | 'view_list' | 'book_viewing'
    leadId?: string
    leadIds?: string[]
  }>
}

export interface AIAnalysis {
  pipelineHealth: {
    score: number
    summary: string
  }
  sourcePerformance: Array<{
    source: string
    hotLeadPercent: number
    recommendation: string
  }>
  bottlenecks: Array<{
    stage: string
    currentRate: number
    benchmark: number
    recommendation: string
  }>
  predictions: {
    viewings: number
    reservations: number
    pipelineValue: string
    atRiskLeads: number
  }
  topRecommendations: string[]
}

// Lead Display Types (for buyers_view)
// Simple classification for UI display (maps from detailed AI classifications)
export type LeadClassification = 'Hot' | 'Warm' | 'Low'

// Detailed AI classifications from scoring system
export type AIClassification =
  | 'Hot'
  | 'Warm-Qualified'
  | 'Warm-Engaged'
  | 'Nurture-Premium'
  | 'Nurture-Standard'
  | 'Cold'
  | 'Disqualified'
  | 'Spam'

// Map AI classification to simple display classification
export function getDisplayClassification(aiClassification?: AIClassification | string): LeadClassification {
  if (!aiClassification) return 'Low'
  switch (aiClassification) {
    case 'Hot':
      return 'Hot'
    case 'Warm-Qualified':
    case 'Warm-Engaged':
    case 'Nurture-Premium':
      return 'Warm'
    default:
      return 'Low'
  }
}

export type LeadStatus =
  | 'Contact Pending'
  | 'Follow Up'
  | 'Viewing Booked'
  | 'Negotiating'
  | 'Reserved'
  | 'Exchanged'
  | 'Completed'
  | 'Not Proceeding'
  | 'Disqualified'  // Includes: duplicate, fake, can't verify, agent - hidden from counts

export type PaymentMethod = 'Cash' | 'Mortgage'

// Broker/Solicitor connection status
export type ConnectionStatus =
  | 'yes'           // Already has one
  | 'introduced'    // Introduction made by us
  | 'no'            // Doesn't have one
  | 'unknown'       // Not yet determined (default)

export type NextActionType = 'call' | 'email' | 'whatsapp' | 'book_viewing' | 'confirm' | 'follow_up' | 're_engage'

export interface Lead {
  id: string
  // Basic Info
  fullName: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  country?: string

  // Scoring
  qualityScore: number
  intentScore: number
  classification: LeadClassification
  aiConfidence?: number

  // Budget & Preferences
  budgetRange?: string
  budgetMin?: number
  budgetMax?: number
  paymentMethod?: PaymentMethod
  bedrooms?: number
  location?: string
  purpose?: 'Investment' | 'Residence' | 'Both'
  timeline?: string
  readyIn28Days?: boolean

  // Matching
  budgetMatch?: boolean
  bedroomMatch?: boolean

  // Status & Assignment
  status: LeadStatus
  assignedCaller?: string
  assignedCallerId?: string
  daysInStatus?: number
  slaMet?: boolean

  // Development & Source
  developmentName?: string
  developmentId?: string
  source?: string
  campaign?: string
  campaignId?: string

  // Financial Readiness
  proofOfFunds?: boolean
  mortgageStatus?: string
  ukBroker?: ConnectionStatus
  ukSolicitor?: ConnectionStatus
  brokerConnected?: boolean

  // Viewing
  viewingIntentConfirmed?: boolean
  viewingBooked?: boolean
  viewingDate?: string

  // Communication
  lastWaMessage?: string
  transcript?: string
  callSummary?: string
  replied?: boolean
  stopComms?: boolean
  nextFollowUp?: string

  // AI Summary
  aiSummary?: string
  aiNextAction?: string
  aiRiskFlags?: string[]
  aiRecommendations?: string[]

  // Timestamps
  createdAt?: string
  updatedAt?: string
  lastContactAt?: string
}

export interface LeadFilters {
  classification?: LeadClassification
  status?: LeadStatus
  paymentMethod?: PaymentMethod
  assignedCaller?: string
  developmentName?: string
  country?: string
  search?: string
  minScore?: number
  maxScore?: number
}

export interface LeadPagination {
  page: number
  pageSize: number
  total: number
}

export interface PipelineStats {
  contactPending: number
  followUp: number
  viewingBooked: number
  negotiating: number
  reserved: number
  exchanged: number
  completed: number
  notProceeding: number
  disqualified: number  // Includes: duplicates, fakes, unverifiable - hidden from counts
}

export interface PriorityAction {
  id: string
  leadId: string
  leadName: string
  score: number
  actionType: NextActionType
  description: string
  urgency: 'now' | 'today' | 'soon'
}
