export type UserRole = 'admin' | 'developer' | 'agent' | 'broker'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  company?: string      // Company name (display)
  company_id?: string   // Company UUID for data filtering
  avatarUrl?: string
}

export interface Buyer {
  id: string
  first_name?: string
  last_name?: string
  full_name?: string
  email?: string
  phone?: string
  budget?: string
  budget_min?: number
  budget_max?: number
  bedrooms?: number
  location?: string
  area?: string
  timeline?: string
  source?: string
  campaign?: string
  campaign_id?: string
  status?: string
  quality_score?: number
  intent_score?: number
  payment_method?: string
  proof_of_funds?: boolean
  mortgage_status?: string
  uk_broker?: boolean
  uk_solicitor?: boolean
  notes?: string
  created_at?: string
  updated_at?: string
  last_contact?: string
  // Assignment fields
  assigned_to?: string
  assigned_user?: string
  assigned_user_name?: string
  assigned_at?: string
  company_id?: string  // Company UUID for data filtering
  // AI fields
  ai_quality_score?: number
  ai_intent_score?: number
  ai_confidence?: number
  ai_summary?: string
  ai_next_action?: string
  ai_risk_flags?: string[]
  ai_scored_at?: string
}

export interface AppUser {
  id: string
  name: string
  email: string
  role: UserRole
  company?: string
  company_id?: string
  avatar_url?: string
  status?: 'active' | 'inactive'
  last_active?: string
  created_at?: string
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

export interface Profile {
  id: string
  email?: string
  full_name?: string
  role?: string
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
