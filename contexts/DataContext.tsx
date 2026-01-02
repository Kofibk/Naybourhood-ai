'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import {
  isAirtableConfigured,
  fetchLeads as fetchAirtableLeads,
  fetchCampaigns as fetchAirtableCampaigns,
  fetchDevelopments as fetchAirtableDevelopments,
  updateLead as updateAirtableLead,
  updateCampaign as updateAirtableCampaign,
  createLead as createAirtableLead,
  deleteLead as deleteAirtableLead,
} from '@/lib/airtable'
import type { Buyer, Campaign, Company, Development, AppUser } from '@/types'

interface DataContextType {
  leads: Buyer[]
  campaigns: Campaign[]
  companies: Company[]
  developments: Development[]
  users: AppUser[]
  isLoading: boolean
  error: string | null
  isSupabase: boolean
  isAirtable: boolean
  refreshData: () => Promise<void>
  updateLead: (id: string, data: Partial<Buyer>) => Promise<Buyer | null>
  updateCampaign: (id: string, data: Partial<Campaign>) => Promise<Campaign | null>
  createLead: (data: Partial<Buyer>) => Promise<Buyer | null>
  deleteLead: (id: string) => Promise<boolean>
  assignLead: (leadId: string, userId: string) => Promise<boolean>
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export function DataProvider({ children }: { children: ReactNode }) {
  const [leads, setLeads] = useState<Buyer[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [developments, setDevelopments] = useState<Development[]>([])
  const [users, setUsers] = useState<AppUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isSupabase = isSupabaseConfigured()
  const isAirtable = isAirtableConfigured()

  // Debug: Log configuration status on mount
  console.log('[DataContext] Configuration status:', { isSupabase, isAirtable })

  const refreshData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const errors: string[] = []

    try {
      // BUYERS: Fetch from Airtable (primary) or Supabase (fallback)
      if (isAirtable) {
        console.log('[DataContext] Fetching buyers from Airtable...')
        try {
          const airtableLeads = await fetchAirtableLeads()
          if (airtableLeads && airtableLeads.length > 0) {
            // Map Airtable fields to our Buyer type
            const mappedLeads: Buyer[] = airtableLeads.map((lead: any) => ({
              id: lead.id,
              full_name: lead.name || lead.full_name || lead.Name,
              first_name: lead.first_name || lead.firstName,
              last_name: lead.last_name || lead.lastName,
              email: lead.email || lead.Email,
              phone: lead.phone || lead.Phone,
              budget: lead.budget || lead.Budget,
              budget_min: lead.budget_min || lead.budgetMin,
              budget_max: lead.budget_max || lead.budgetMax,
              bedrooms: lead.bedrooms || lead.Bedrooms,
              location: lead.location || lead.Location || lead.area,
              area: lead.area || lead.Area,
              timeline: lead.timeline || lead.Timeline,
              source: lead.source || lead.Source,
              campaign: lead.campaign || lead.Campaign,
              campaign_id: lead.campaign_id || lead.campaignId,
              status: lead.status || lead.Status,
              quality_score: lead.qualityScore || lead.quality_score || lead['Quality Score'],
              intent_score: lead.intentScore || lead.intent_score || lead['Intent Score'],
              payment_method: lead.payment_method || lead.paymentMethod,
              proof_of_funds: lead.proof_of_funds || lead.proofOfFunds,
              mortgage_status: lead.mortgage_status || lead.mortgageStatus,
              uk_broker: lead.uk_broker || lead.ukBroker,
              uk_solicitor: lead.uk_solicitor || lead.ukSolicitor,
              notes: lead.notes || lead.Notes,
              created_at: lead.createdAt || lead.created_at || lead.Created,
              updated_at: lead.updatedAt || lead.updated_at,
              last_contact: lead.lastContact || lead.last_contact || lead['Last Contact'],
            }))
            console.log('[DataContext] Fetched buyers from Airtable:', mappedLeads.length)
            setLeads(mappedLeads)
          } else {
            console.log('[DataContext] No buyers in Airtable, trying Supabase...')
            errors.push('No buyers found in Airtable')
          }
        } catch (e) {
          console.error('[DataContext] Airtable buyers fetch failed:', e)
          errors.push(`Airtable Buyers: ${e instanceof Error ? e.message : 'Failed'}`)
        }
      } else if (isSupabase) {
        // Fallback to Supabase for buyers
        console.log('[DataContext] Fetching buyers from Supabase...')
        const supabase = createClient()
        try {
          const allBuyers: Buyer[] = []
          const pageSize = 1000
          let page = 0
          let hasMore = true

          while (hasMore) {
            const from = page * pageSize
            const to = from + pageSize - 1

            const { data: buyersData, error: buyersError } = await supabase
              .from('buyers')
              .select('*')
              .order('created_at', { ascending: false })
              .range(from, to)

            if (buyersError) {
              console.error('[DataContext] Supabase Buyers error:', buyersError.message)
              errors.push(`Supabase Buyers: ${buyersError.message}`)
              hasMore = false
            } else if (buyersData) {
              allBuyers.push(...buyersData)
              console.log(`[DataContext] Fetched buyers page ${page + 1}:`, buyersData.length)
              hasMore = buyersData.length === pageSize
              page++
            } else {
              hasMore = false
            }
          }

          console.log('[DataContext] Total buyers fetched from Supabase:', allBuyers.length)
          setLeads(allBuyers)
        } catch (e) {
          console.error('[DataContext] Supabase Buyers fetch failed:', e)
        }
      }

      // CAMPAIGNS: Fetch from Airtable (primary) or Supabase (fallback)
      if (isAirtable) {
        console.log('[DataContext] Fetching campaigns from Airtable...')
        try {
          const airtableCampaigns = await fetchAirtableCampaigns()
          if (airtableCampaigns && airtableCampaigns.length > 0) {
            // Map Airtable fields to our Campaign type - handle all possible field name variations
            const mappedCampaigns: Campaign[] = airtableCampaigns.map((camp: any) => {
              // Parse spend - try multiple field names and parse as number
              const spendValue = camp.spend || camp.Spend || camp.amount_spent ||
                camp['Amount Spent'] || camp.total_spend || camp['Total Spend'] || 0
              const parsedSpend = typeof spendValue === 'string'
                ? parseFloat(spendValue.replace(/[£$,]/g, '')) || 0
                : (Number(spendValue) || 0)

              // Parse leads count
              const leadsValue = camp.leads || camp.Leads || camp.lead_count ||
                camp['Lead Count'] || camp['Leads Generated'] || 0
              const parsedLeads = Number(leadsValue) || 0

              // Parse CPL
              const cplValue = camp.cpl || camp.CPL || camp.cost_per_lead || camp['Cost Per Lead'] || 0
              const parsedCPL = typeof cplValue === 'string'
                ? parseFloat(cplValue.replace(/[£$,]/g, '')) || 0
                : (Number(cplValue) || 0)

              // Get development name - try multiple field variations
              const developmentName = camp.development || camp.Development ||
                camp.development_name || camp['Development Name'] ||
                camp.client || camp.Client || null

              return {
                id: camp.id,
                name: camp.name || camp.Name || 'Unnamed Campaign',
                client: camp.client || camp.Client,
                development: developmentName,
                company_id: camp.company_id || camp.companyId,
                platform: camp.platform || camp.Platform,
                status: camp.status || camp.Status || 'unknown',
                spend: parsedSpend,
                amount_spent: parsedSpend,
                leads: parsedLeads,
                lead_count: parsedLeads,
                cpl: parsedCPL,
                cost_per_lead: parsedCPL,
                impressions: Number(camp.impressions || camp.Impressions) || 0,
                clicks: Number(camp.clicks || camp.Clicks) || 0,
                ctr: Number(camp.ctr || camp.CTR) || 0,
                start_date: camp.startDate || camp.start_date || camp['Start Date'],
                end_date: camp.endDate || camp.end_date || camp['End Date'],
                created_at: camp.createdAt || camp.created_at,
                updated_at: camp.updatedAt || camp.updated_at,
              }
            })

            // Log total spend for debugging
            const totalSpend = mappedCampaigns.reduce((sum, c) => sum + (c.spend || 0), 0)
            console.log('[DataContext] Fetched campaigns from Airtable:', mappedCampaigns.length)
            console.log('[DataContext] Total campaign spend:', totalSpend)
            console.log('[DataContext] First campaign data:', mappedCampaigns[0])

            setCampaigns(mappedCampaigns)
          } else {
            console.log('[DataContext] No campaigns in Airtable, trying Supabase...')
            errors.push('No campaigns found in Airtable')
          }
        } catch (e) {
          console.error('[DataContext] Airtable campaigns fetch failed:', e)
          errors.push(`Airtable Campaigns: ${e instanceof Error ? e.message : 'Failed'}`)
        }
      } else if (isSupabase) {
        // Fallback to Supabase for campaigns
        console.log('[DataContext] Fetching campaigns from Supabase...')
        const supabase = createClient()
        try {
          const { data: campaignsData, error: campaignsError } = await supabase
            .from('campaigns')
            .select('*')
            .order('created_at', { ascending: false })

          if (campaignsError) {
            console.error('[DataContext] Supabase Campaigns error:', campaignsError.message)
            errors.push(`Supabase Campaigns: ${campaignsError.message}`)
          } else if (campaignsData) {
            console.log('[DataContext] Fetched campaigns from Supabase:', campaignsData.length)
            setCampaigns(campaignsData)
          }
        } catch (e) {
          console.error('[DataContext] Supabase Campaigns fetch failed:', e)
        }
      }

      // COMPANIES: Always from Supabase
      if (isSupabase) {
        console.log('[DataContext] Fetching companies from Supabase...')
        const supabase = createClient()
        try {
          const { data: companiesData, error: companiesError } = await supabase
            .from('companies')
            .select('*')
            .order('name', { ascending: true })

          if (companiesError) {
            console.error('[DataContext] Companies error:', companiesError.message)
            errors.push(`Companies: ${companiesError.message}`)
          } else if (companiesData) {
            console.log('[DataContext] Fetched companies:', companiesData.length)
            setCompanies(companiesData)
          }
        } catch (e) {
          console.error('[DataContext] Companies fetch failed:', e)
        }
      }

      // DEVELOPMENTS: Fetch from Airtable
      if (isAirtable) {
        console.log('[DataContext] Fetching developments from Airtable...')
        try {
          const airtableDevelopments = await fetchAirtableDevelopments()
          if (airtableDevelopments && airtableDevelopments.length > 0) {
            const mappedDevelopments: Development[] = airtableDevelopments.map((dev: any) => ({
              id: dev.id,
              name: dev.name || dev.Name || 'Unknown Development',
              location: dev.location || dev.Location || dev.address || dev.Address,
              developer: dev.developer || dev.Developer,
              status: dev.status || dev.Status || 'Active',
              units: dev.units || dev.Units || dev.total_units || dev['Total Units'] || 0,
              total_units: dev.total_units || dev['Total Units'] || 0,
              available_units: dev.available_units || dev['Available Units'] || 0,
              price_from: dev.price_from || dev['Price From'],
              price_to: dev.price_to || dev['Price To'],
              completion_date: dev.completion_date || dev['Completion Date'],
              description: dev.description || dev.Description,
              image_url: dev.image_url || dev['Image URL'],
              total_leads: dev.total_leads || dev['Total Leads'] || 0,
              total_spend: dev.total_spend || dev['Total Spend'] || 0,
            }))
            console.log('[DataContext] Fetched developments from Airtable:', mappedDevelopments.length)
            setDevelopments(mappedDevelopments)
          } else {
            console.log('[DataContext] No developments in Airtable')
          }
        } catch (e) {
          console.error('[DataContext] Airtable developments fetch failed:', e)
        }
      }

      // USERS: Fetch from Supabase profiles or create demo users
      if (isSupabase) {
        console.log('[DataContext] Fetching users from Supabase...')
        const supabase = createClient()
        try {
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('*')
            .order('full_name', { ascending: true })

          if (profilesError) {
            console.error('[DataContext] Profiles error:', profilesError.message)
            // Use demo users if profiles table doesn't exist
            setUsers([
              { id: 'user-1', name: 'Sarah Johnson', email: 'sarah@naybourhood.ai', role: 'admin', status: 'active' },
              { id: 'user-2', name: 'James Wilson', email: 'james@naybourhood.ai', role: 'agent', status: 'active' },
              { id: 'user-3', name: 'Emily Chen', email: 'emily@naybourhood.ai', role: 'agent', status: 'active' },
              { id: 'user-4', name: 'Michael Brown', email: 'michael@naybourhood.ai', role: 'broker', status: 'active' },
            ])
          } else if (profilesData && profilesData.length > 0) {
            const mappedUsers: AppUser[] = profilesData.map((p: any) => ({
              id: p.id,
              name: p.full_name || p.email || 'Unknown',
              email: p.email || '',
              role: p.role || 'agent',
              company: p.company,
              company_id: p.company_id,
              avatar_url: p.avatar_url,
              status: 'active',
              last_active: p.last_active,
              created_at: p.created_at,
            }))
            console.log('[DataContext] Fetched users from Supabase:', mappedUsers.length)
            setUsers(mappedUsers)
          } else {
            // Use demo users if no profiles exist
            setUsers([
              { id: 'user-1', name: 'Sarah Johnson', email: 'sarah@naybourhood.ai', role: 'admin', status: 'active' },
              { id: 'user-2', name: 'James Wilson', email: 'james@naybourhood.ai', role: 'agent', status: 'active' },
              { id: 'user-3', name: 'Emily Chen', email: 'emily@naybourhood.ai', role: 'agent', status: 'active' },
              { id: 'user-4', name: 'Michael Brown', email: 'michael@naybourhood.ai', role: 'broker', status: 'active' },
            ])
          }
        } catch (e) {
          console.error('[DataContext] Users fetch failed:', e)
          // Use demo users on error
          setUsers([
            { id: 'user-1', name: 'Sarah Johnson', email: 'sarah@naybourhood.ai', role: 'admin', status: 'active' },
            { id: 'user-2', name: 'James Wilson', email: 'james@naybourhood.ai', role: 'agent', status: 'active' },
            { id: 'user-3', name: 'Emily Chen', email: 'emily@naybourhood.ai', role: 'agent', status: 'active' },
            { id: 'user-4', name: 'Michael Brown', email: 'michael@naybourhood.ai', role: 'broker', status: 'active' },
          ])
        }
      } else {
        // Demo users when no database is configured
        setUsers([
          { id: 'user-1', name: 'Sarah Johnson', email: 'sarah@naybourhood.ai', role: 'admin', status: 'active' },
          { id: 'user-2', name: 'James Wilson', email: 'james@naybourhood.ai', role: 'agent', status: 'active' },
          { id: 'user-3', name: 'Emily Chen', email: 'emily@naybourhood.ai', role: 'agent', status: 'active' },
          { id: 'user-4', name: 'Michael Brown', email: 'michael@naybourhood.ai', role: 'broker', status: 'active' },
        ])
      }

      if (errors.length > 0) {
        setError(errors.join('; '))
      }

      console.log('[DataContext] Data fetch complete')
    } catch (err) {
      console.error('[DataContext] Error:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setIsLoading(false)
    }
  }, [isSupabase, isAirtable])

  useEffect(() => {
    refreshData()
  }, [refreshData])

  // Update a lead in Airtable or Supabase
  const updateLead = useCallback(async (id: string, data: Partial<Buyer>): Promise<Buyer | null> => {
    try {
      if (isAirtable) {
        console.log('[DataContext] Updating lead in Airtable:', id, data)
        const result = await updateAirtableLead(id, data)
        if (result) {
          // Update local state
          setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...data } : l)))
          return result as Buyer
        }
      } else if (isSupabase) {
        console.log('[DataContext] Updating lead in Supabase:', id, data)
        const supabase = createClient()
        const { data: updatedData, error } = await supabase
          .from('buyers')
          .update(data)
          .eq('id', id)
          .select()
          .single()

        if (error) {
          console.error('[DataContext] Supabase update error:', error)
          return null
        }

        // Update local state
        setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...updatedData } : l)))
        return updatedData
      }
      return null
    } catch (e) {
      console.error('[DataContext] Update lead failed:', e)
      return null
    }
  }, [isAirtable, isSupabase])

  // Update a campaign in Airtable or Supabase
  const updateCampaign = useCallback(async (id: string, data: Partial<Campaign>): Promise<Campaign | null> => {
    try {
      if (isAirtable) {
        console.log('[DataContext] Updating campaign in Airtable:', id, data)
        const result = await updateAirtableCampaign(id, data)
        if (result) {
          // Update local state
          setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)))
          return result as Campaign
        }
      } else if (isSupabase) {
        console.log('[DataContext] Updating campaign in Supabase:', id, data)
        const supabase = createClient()
        const { data: updatedData, error } = await supabase
          .from('campaigns')
          .update(data)
          .eq('id', id)
          .select()
          .single()

        if (error) {
          console.error('[DataContext] Supabase campaign update error:', error)
          return null
        }

        // Update local state
        setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, ...updatedData } : c)))
        return updatedData
      }
      return null
    } catch (e) {
      console.error('[DataContext] Update campaign failed:', e)
      return null
    }
  }, [isAirtable, isSupabase])

  // Create a new lead
  const createLead = useCallback(async (data: Partial<Buyer>): Promise<Buyer | null> => {
    try {
      if (isAirtable) {
        console.log('[DataContext] Creating lead in Airtable:', data)
        const result = await createAirtableLead(data)
        if (result) {
          // Add to local state
          setLeads((prev) => [result as Buyer, ...prev])
          return result as Buyer
        }
      } else if (isSupabase) {
        console.log('[DataContext] Creating lead in Supabase:', data)
        const supabase = createClient()
        const { data: newData, error } = await supabase
          .from('buyers')
          .insert(data)
          .select()
          .single()

        if (error) {
          console.error('[DataContext] Supabase create error:', error)
          return null
        }

        // Add to local state
        setLeads((prev) => [newData, ...prev])
        return newData
      }
      return null
    } catch (e) {
      console.error('[DataContext] Create lead failed:', e)
      return null
    }
  }, [isAirtable, isSupabase])

  // Delete a lead
  const deleteLead = useCallback(async (id: string): Promise<boolean> => {
    try {
      if (isAirtable) {
        console.log('[DataContext] Deleting lead from Airtable:', id)
        await deleteAirtableLead(id)
        // Remove from local state
        setLeads((prev) => prev.filter((l) => l.id !== id))
        return true
      } else if (isSupabase) {
        console.log('[DataContext] Deleting lead from Supabase:', id)
        const supabase = createClient()
        const { error } = await supabase
          .from('buyers')
          .delete()
          .eq('id', id)

        if (error) {
          console.error('[DataContext] Supabase delete error:', error)
          return false
        }

        // Remove from local state
        setLeads((prev) => prev.filter((l) => l.id !== id))
        return true
      }
      return false
    } catch (e) {
      console.error('[DataContext] Delete lead failed:', e)
      return false
    }
  }, [isAirtable, isSupabase])

  // Assign a lead to a user
  const assignLead = useCallback(async (leadId: string, userId: string): Promise<boolean> => {
    try {
      const user = users.find((u) => u.id === userId)
      const assignmentData: Partial<Buyer> = {
        assigned_to: userId,
        assigned_user: userId,
        assigned_user_name: user?.name || 'Unknown',
        assigned_at: new Date().toISOString(),
      }

      const result = await updateLead(leadId, assignmentData)
      if (result) {
        console.log('[DataContext] Lead assigned successfully:', leadId, 'to', user?.name)
        return true
      }
      return false
    } catch (e) {
      console.error('[DataContext] Assign lead failed:', e)
      return false
    }
  }, [updateLead, users])

  return (
    <DataContext.Provider
      value={{
        leads,
        campaigns,
        companies,
        developments,
        users,
        isLoading,
        error,
        isSupabase,
        isAirtable,
        refreshData,
        updateLead,
        updateCampaign,
        createLead,
        deleteLead,
        assignLead,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}
