import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey);
}

// ============================================
// BUYERS (Leads)
// ============================================

export interface Buyer {
  id: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  budget?: string;
  budget_min?: number;
  budget_max?: number;
  bedrooms?: number;
  location?: string;
  area?: string;
  timeline?: string;
  source?: string;
  campaign?: string;
  campaign_id?: string;
  status?: string;
  quality_score?: number;
  intent_score?: number;
  payment_method?: string;
  proof_of_funds?: boolean;
  mortgage_status?: string;
  uk_broker?: boolean;
  uk_solicitor?: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  last_contact?: string;
}

export async function fetchBuyers(): Promise<Buyer[]> {
  if (!isSupabaseConfigured()) return [];
  
  const { data, error } = await supabase
    .from('buyers')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching buyers:', error);
    return [];
  }
  
  return data || [];
}

export async function fetchBuyerById(id: string): Promise<Buyer | null> {
  if (!isSupabaseConfigured()) return null;
  
  const { data, error } = await supabase
    .from('buyers')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('Error fetching buyer:', error);
    return null;
  }
  
  return data;
}

export async function createBuyer(buyer: Partial<Buyer>): Promise<Buyer | null> {
  if (!isSupabaseConfigured()) return null;
  
  const { data, error } = await supabase
    .from('buyers')
    .insert(buyer)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating buyer:', error);
    return null;
  }
  
  return data;
}

export async function updateBuyer(id: string, updates: Partial<Buyer>): Promise<Buyer | null> {
  if (!isSupabaseConfigured()) return null;
  
  const { data, error } = await supabase
    .from('buyers')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating buyer:', error);
    return null;
  }
  
  return data;
}

export async function deleteBuyer(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  
  const { error } = await supabase
    .from('buyers')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting buyer:', error);
    return false;
  }
  
  return true;
}

export async function fetchHotBuyers(minScore: number = 80): Promise<Buyer[]> {
  if (!isSupabaseConfigured()) return [];
  
  const { data, error } = await supabase
    .from('buyers')
    .select('*')
    .or(`quality_score.gte.${minScore},intent_score.gte.${minScore}`)
    .order('quality_score', { ascending: false });
  
  if (error) {
    console.error('Error fetching hot buyers:', error);
    return [];
  }
  
  return data || [];
}

// ============================================
// CAMPAIGNS
// ============================================

export interface Campaign {
  id: string;
  name?: string;
  client?: string;
  company_id?: string;
  platform?: string;
  status?: string;
  spend?: number;
  amount_spent?: number;
  leads?: number;
  lead_count?: number;
  cpl?: number;
  cost_per_lead?: number;
  impressions?: number;
  clicks?: number;
  ctr?: number;
  start_date?: string;
  end_date?: string;
  created_at?: string;
  updated_at?: string;
}

export async function fetchCampaigns(): Promise<Campaign[]> {
  if (!isSupabaseConfigured()) return [];
  
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching campaigns:', error);
    return [];
  }
  
  return data || [];
}

export async function fetchCampaignById(id: string): Promise<Campaign | null> {
  if (!isSupabaseConfigured()) return null;
  
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('Error fetching campaign:', error);
    return null;
  }
  
  return data;
}

export async function updateCampaign(id: string, updates: Partial<Campaign>): Promise<Campaign | null> {
  if (!isSupabaseConfigured()) return null;
  
  const { data, error } = await supabase
    .from('campaigns')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating campaign:', error);
    return null;
  }
  
  return data;
}

// ============================================
// COMPANIES
// ============================================

export interface Company {
  id: string;
  name?: string;
  type?: string;
  contact_name?: string;
  contact_email?: string;
  phone?: string;
  status?: string;
  total_spend?: number;
  total_leads?: number;
  campaign_count?: number;
  created_at?: string;
  updated_at?: string;
}

export async function fetchCompanies(): Promise<Company[]> {
  if (!isSupabaseConfigured()) return [];
  
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .order('name', { ascending: true });
  
  if (error) {
    console.error('Error fetching companies:', error);
    return [];
  }
  
  return data || [];
}

// ============================================
// CONVERSATIONS & MESSAGES
// ============================================

export interface Conversation {
  id: string;
  buyer_id?: string;
  user_id?: string;
  status?: string;
  last_message_at?: string;
  message_count?: number;
  created_at?: string;
}

export interface Message {
  id: string;
  conversation_id?: string;
  sender_type?: 'user' | 'buyer';
  content?: string;
  sent_via?: 'whatsapp' | 'email';
  delivered?: boolean;
  read?: boolean;
  created_at?: string;
}

export async function fetchConversations(): Promise<Conversation[]> {
  if (!isSupabaseConfigured()) return [];
  
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .order('last_message_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }
  
  return data || [];
}

export async function fetchMessages(conversationId: string): Promise<Message[]> {
  if (!isSupabaseConfigured()) return [];
  
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
  
  return data || [];
}

// ============================================
// PROFILES (Users)
// ============================================

export interface Profile {
  id: string;
  email?: string;
  full_name?: string;
  role?: string;
  company_id?: string;
  avatar_url?: string;
  last_active?: string;
  created_at?: string;
}

export async function fetchProfiles(): Promise<Profile[]> {
  if (!isSupabaseConfigured()) return [];
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name', { ascending: true });
  
  if (error) {
    console.error('Error fetching profiles:', error);
    return [];
  }
  
  return data || [];
}

export async function fetchCurrentProfile(): Promise<Profile | null> {
  if (!isSupabaseConfigured()) return null;
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  
  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
  
  return data;
}

// ============================================
// DASHBOARD METRICS
// ============================================

export async function fetchDashboardMetrics() {
  if (!isSupabaseConfigured()) return null;
  
  try {
    const [buyers, campaigns, companies] = await Promise.all([
      fetchBuyers(),
      fetchCampaigns(),
      fetchCompanies(),
    ]);
    
    const totalLeads = buyers.length;
    const hotLeads = buyers.filter(b => (b.quality_score || 0) >= 80 || (b.intent_score || 0) >= 80).length;
    const avgScore = buyers.length > 0
      ? Math.round(buyers.reduce((acc, b) => acc + (b.quality_score || 0), 0) / buyers.length)
      : 0;
    
    const activeCampaigns = campaigns.filter(c => c.status === 'active' || c.status === 'Active');
    const totalSpend = campaigns.reduce((acc, c) => acc + (c.spend || c.amount_spent || 0), 0);
    const totalCampaignLeads = campaigns.reduce((acc, c) => acc + (c.leads || c.lead_count || 0), 0);
    const avgCPL = totalCampaignLeads > 0 ? Math.round(totalSpend / totalCampaignLeads) : 0;
    
    return {
      totalLeads,
      hotLeads,
      avgScore,
      totalSpend,
      avgCPL,
      totalCampaigns: campaigns.length,
      activeCampaigns: activeCampaigns.length,
      totalCompanies: companies.length,
    };
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    return null;
  }
}

// ============================================
// REAL-TIME SUBSCRIPTIONS
// ============================================

export function subscribeToBuyers(callback: (payload: any) => void) {
  return supabase
    .channel('buyers-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'buyers' }, callback)
    .subscribe();
}

export function subscribeToMessages(conversationId: string, callback: (payload: any) => void) {
  return supabase
    .channel(`messages-${conversationId}`)
    .on('postgres_changes', { 
      event: 'INSERT', 
      schema: 'public', 
      table: 'messages',
      filter: `conversation_id=eq.${conversationId}`
    }, callback)
    .subscribe();
}
