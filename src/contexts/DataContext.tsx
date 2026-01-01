import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  demoLeads, demoCampaigns, demoCompanies, demoUsers,
  Lead, Campaign, Company, User
} from '@/lib/demoData';
import {
  fetchBuyers,
  fetchCampaigns as supabaseFetchCampaigns,
  fetchCompanies as supabaseFetchCompanies,
  fetchProfiles,
  createBuyer,
  updateBuyer,
  deleteBuyer as supabaseDeleteBuyer,
  updateCampaign as supabaseUpdateCampaign,
  isSupabaseConfigured,
  subscribeToBuyers,
  Buyer,
  Campaign as SupabaseCampaign,
  Company as SupabaseCompany,
  Profile,
} from '@/lib/supabase';

interface DataContextType {
  leads: Lead[];
  campaigns: Campaign[];
  companies: Company[];
  users: User[];
  isLoading: boolean;
  isAirtable: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  addLead: (lead: Partial<Lead>) => Promise<void>;
  updateLead: (id: string, data: Partial<Lead>) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  addCampaign: (campaign: Campaign) => void;
  updateCampaign: (id: string, data: Partial<Campaign>) => Promise<void>;
  addCompany: (company: Company) => void;
  updateCompany: (id: string, data: Partial<Company>) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Transform Supabase buyer to app Lead format
function buyerToLead(buyer: Buyer): Lead {
  return {
    id: buyer.id,
    name: buyer.full_name || `${buyer.first_name || ''} ${buyer.last_name || ''}`.trim() || 'Unknown',
    email: buyer.email || '',
    phone: buyer.phone || '',
    budget: buyer.budget || `£${buyer.budget_min || 0}-${buyer.budget_max || 0}`,
    timeline: buyer.timeline || '',
    source: buyer.source || '',
    campaign: buyer.campaign || '',
    status: buyer.status || 'New',
    qualityScore: buyer.quality_score || 50,
    intentScore: buyer.intent_score || 50,
    createdAt: buyer.created_at || new Date().toISOString(),
    lastContact: buyer.last_contact,
    notes: buyer.notes,
  };
}

// Transform Supabase campaign to app Campaign format
function supabaseCampaignToApp(c: SupabaseCampaign): Campaign {
  return {
    id: c.id,
    name: c.name || '',
    client: c.client || '',
    platform: c.platform || 'Meta Ads',
    status: (c.status?.toLowerCase() || 'active') as 'active' | 'paused' | 'completed',
    spend: c.spend || c.amount_spent || 0,
    leads: c.leads || c.lead_count || 0,
    cpl: c.cpl || c.cost_per_lead || 0,
    impressions: c.impressions || 0,
    clicks: c.clicks || 0,
    ctr: c.ctr || 0,
    startDate: c.start_date || c.created_at || '',
    endDate: c.end_date,
  };
}

// Transform Supabase company to app Company format
function supabaseCompanyToApp(c: SupabaseCompany): Company {
  return {
    id: c.id,
    name: c.name || '',
    type: (c.type || 'developer') as 'developer' | 'agent' | 'broker',
    contactName: c.contact_name || '',
    contactEmail: c.contact_email || '',
    phone: c.phone || '',
    campaigns: c.campaign_count || 0,
    totalSpend: c.total_spend || 0,
    totalLeads: c.total_leads || 0,
    status: (c.status || 'active') as 'active' | 'inactive',
    joinedDate: c.created_at || '',
  };
}

// Transform Supabase profile to app User format
function profileToUser(p: Profile): User {
  return {
    id: p.id,
    name: p.full_name || '',
    email: p.email || '',
    role: (p.role || 'developer') as 'admin' | 'developer' | 'agent' | 'broker',
    company: p.company_id,
    lastActive: p.last_active || p.created_at || '',
    status: 'active' as 'active' | 'inactive',
  };
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isSupabase = isSupabaseConfigured();

  // Fetch all data from Supabase or use demo data
  const refreshData = async () => {
    setIsLoading(true);
    setError(null);

    if (!isSupabase) {
      console.log('Supabase not configured, using demo data');
      setLeads(demoLeads);
      setCampaigns(demoCampaigns);
      setCompanies(demoCompanies);
      setUsers(demoUsers);
      setIsLoading(false);
      return;
    }

    try {
      console.log('Fetching data from Supabase...');
      
      const [
        supabaseBuyers,
        supabaseCampaigns,
        supabaseCompanies,
        supabaseProfiles,
      ] = await Promise.all([
        fetchBuyers(),
        supabaseFetchCampaigns(),
        supabaseFetchCompanies(),
        fetchProfiles(),
      ]);

      // Transform and set data
      setLeads(supabaseBuyers.length > 0 ? supabaseBuyers.map(buyerToLead) : demoLeads);
      setCampaigns(supabaseCampaigns.length > 0 ? supabaseCampaigns.map(supabaseCampaignToApp) : demoCampaigns);
      setCompanies(supabaseCompanies.length > 0 ? supabaseCompanies.map(supabaseCompanyToApp) : demoCompanies);
      setUsers(supabaseProfiles.length > 0 ? supabaseProfiles.map(profileToUser) : demoUsers);
      
      console.log('Supabase data loaded:', {
        buyers: supabaseBuyers.length,
        campaigns: supabaseCampaigns.length,
        companies: supabaseCompanies.length,
        profiles: supabaseProfiles.length,
      });
    } catch (err) {
      console.error('Error fetching Supabase data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      // Fall back to demo data on error
      setLeads(demoLeads);
      setCampaigns(demoCampaigns);
      setCompanies(demoCompanies);
      setUsers(demoUsers);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data fetch and real-time subscription
  useEffect(() => {
    refreshData();
    
    // Set up real-time subscription if Supabase is configured
    if (isSupabase) {
      const subscription = subscribeToBuyers((payload) => {
        console.log('Real-time update:', payload);
        if (payload.eventType === 'INSERT') {
          setLeads(prev => [buyerToLead(payload.new as Buyer), ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setLeads(prev => prev.map(l => 
            l.id === payload.new.id ? buyerToLead(payload.new as Buyer) : l
          ));
        } else if (payload.eventType === 'DELETE') {
          setLeads(prev => prev.filter(l => l.id !== payload.old.id));
        }
      });
      
      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  // Lead operations
  const addLead = async (leadData: Partial<Lead>) => {
    if (isSupabase) {
      // Transform to Supabase buyer format
      const buyerData: Partial<Buyer> = {
        full_name: leadData.name,
        email: leadData.email,
        phone: leadData.phone,
        budget: leadData.budget,
        timeline: leadData.timeline,
        source: leadData.source,
        campaign: leadData.campaign,
        status: leadData.status,
        quality_score: leadData.qualityScore,
        intent_score: leadData.intentScore,
        notes: leadData.notes,
      };
      const newBuyer = await createBuyer(buyerData);
      if (newBuyer) {
        setLeads(prev => [buyerToLead(newBuyer), ...prev]);
      }
    } else {
      const newLead: Lead = {
        id: `L${Date.now()}`,
        name: leadData.name || '',
        email: leadData.email || '',
        phone: leadData.phone || '',
        budget: leadData.budget || '',
        timeline: leadData.timeline || '',
        source: leadData.source || '',
        campaign: leadData.campaign || '',
        status: leadData.status || 'New',
        qualityScore: leadData.qualityScore || 50,
        intentScore: leadData.intentScore || 50,
        createdAt: new Date().toISOString().split('T')[0],
        ...leadData,
      } as Lead;
      setLeads(prev => [newLead, ...prev]);
    }
  };

  const updateLeadFn = async (id: string, data: Partial<Lead>) => {
    if (isSupabase) {
      const buyerUpdates: Partial<Buyer> = {
        full_name: data.name,
        email: data.email,
        phone: data.phone,
        budget: data.budget,
        timeline: data.timeline,
        source: data.source,
        campaign: data.campaign,
        status: data.status,
        quality_score: data.qualityScore,
        intent_score: data.intentScore,
        notes: data.notes,
        last_contact: data.lastContact,
      };
      await updateBuyer(id, buyerUpdates);
    }
    setLeads(prev => prev.map(l => l.id === id ? { ...l, ...data } : l));
  };

  const deleteLead = async (id: string) => {
    if (isSupabase) {
      await supabaseDeleteBuyer(id);
    }
    setLeads(prev => prev.filter(l => l.id !== id));
  };

  // Campaign operations
  const addCampaign = (campaign: Campaign) => {
    setCampaigns(prev => [campaign, ...prev]);
  };

  const updateCampaignFn = async (id: string, data: Partial<Campaign>) => {
    if (isSupabase) {
      const campaignUpdates: Partial<SupabaseCampaign> = {
        name: data.name,
        client: data.client,
        platform: data.platform,
        status: data.status,
        spend: data.spend,
        leads: data.leads,
        cpl: data.cpl,
        impressions: data.impressions,
        clicks: data.clicks,
        ctr: data.ctr,
        start_date: data.startDate,
        end_date: data.endDate,
      };
      await supabaseUpdateCampaign(id, campaignUpdates);
    }
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  };

  // Company operations
  const addCompany = (company: Company) => {
    setCompanies(prev => [company, ...prev]);
  };

  const updateCompany = (id: string, data: Partial<Company>) => {
    setCompanies(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  };

  return (
    <DataContext.Provider value={{
      leads, 
      campaigns, 
      companies, 
      users,
      isLoading,
      isAirtable: isSupabase,
      error,
      refreshData,
      addLead, 
      updateLead: updateLeadFn, 
      deleteLead,
      addCampaign, 
      updateCampaign: updateCampaignFn,
      addCompany, 
      updateCompany,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
