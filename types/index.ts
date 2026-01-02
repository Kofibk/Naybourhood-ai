export type UserRole = 'admin' | 'developer' | 'agent' | 'broker'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  company?: string
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
}

export interface Campaign {
  id: string
  name: string
  client?: string
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
}

export interface Company {
  id: string
  name?: string
  type?: string
  website?: string
  tier?: string
  contact_name?: string
  contact_email?: string
  phone?: string
  status?: string
  total_spend?: number
  total_leads?: number
  campaign_count?: number
  created_at?: string
  updated_at?: string
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
