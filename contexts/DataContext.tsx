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
    const startTime = Date.now()

    console.log('[DataContext] Starting PARALLEL data fetch...')

    try {
      // Create all fetch promises - run in PARALLEL for speed
      const fetchPromises: Promise<void>[] = []

      // BUYERS: Fetch from Airtable (primary) or Supabase (fallback)
      const buyersFetch = async () => {
        if (isAirtable) {
          console.log('[DataContext] Fetching buyers from Airtable...')
          try {
            const airtableLeads = await fetchAirtableLeads()
            if (airtableLeads && airtableLeads.length > 0) {
              // Flexible mapping - use first available value from multiple field name variations
              const mappedLeads: Buyer[] = airtableLeads.map((lead: any) => {
                const getValue = (...keys: string[]) => {
                  for (const key of keys) {
                    if (lead[key] !== undefined && lead[key] !== null) return lead[key]
                  }
                  return null
                }
                return {
                  id: lead.id,
                  full_name: getValue('name', 'full_name', 'Name', 'Full Name', 'fullName'),
                  first_name: getValue('first_name', 'firstName', 'First Name'),
                  last_name: getValue('last_name', 'lastName', 'Last Name'),
                  email: getValue('email', 'Email', 'EMAIL'),
                  phone: getValue('phone', 'Phone', 'PHONE', 'telephone'),
                  budget: getValue('budget', 'Budget', 'BUDGET'),
                  budget_min: getValue('budget_min', 'budgetMin', 'Budget Min'),
                  budget_max: getValue('budget_max', 'budgetMax', 'Budget Max'),
                  bedrooms: getValue('bedrooms', 'Bedrooms', 'BEDROOMS'),
                  location: getValue('location', 'Location', 'area', 'Area'),
                  area: getValue('area', 'Area', 'location', 'Location'),
                  timeline: getValue('timeline', 'Timeline', 'TIMELINE'),
                  source: getValue('source', 'Source', 'SOURCE'),
                  campaign: getValue('campaign', 'Campaign', 'CAMPAIGN'),
                  campaign_id: getValue('campaign_id', 'campaignId', 'Campaign ID'),
                  status: getValue('status', 'Status', 'STATUS') || 'new',
                  quality_score: getValue('qualityScore', 'quality_score', 'Quality Score', 'QualityScore'),
                  intent_score: getValue('intentScore', 'intent_score', 'Intent Score', 'IntentScore'),
                  payment_method: getValue('payment_method', 'paymentMethod', 'Payment Method'),
                  proof_of_funds: getValue('proof_of_funds', 'proofOfFunds', 'Proof of Funds'),
                  mortgage_status: getValue('mortgage_status', 'mortgageStatus', 'Mortgage Status'),
                  uk_broker: getValue('uk_broker', 'ukBroker', 'UK Broker'),
                  uk_solicitor: getValue('uk_solicitor', 'ukSolicitor', 'UK Solicitor'),
                  notes: getValue('notes', 'Notes', 'NOTES'),
                  created_at: getValue('createdAt', 'created_at', 'Created', 'created'),
                  updated_at: getValue('updatedAt', 'updated_at', 'Updated', 'updated'),
                  last_contact: getValue('lastContact', 'last_contact', 'Last Contact'),
                  // Spread any remaining fields for maximum compatibility
                  ...lead,
                }
              })
              console.log('[DataContext] Fetched buyers from Airtable:', mappedLeads.length)
              setLeads(mappedLeads)
            } else {
              console.log('[DataContext] No buyers in Airtable')
              errors.push('No buyers found in Airtable')
            }
          } catch (e) {
            console.error('[DataContext] Airtable buyers fetch failed:', e)
            errors.push(`Airtable Buyers: ${e instanceof Error ? e.message : 'Failed'}`)
          }
        } else if (isSupabase) {
          console.log('[DataContext] Fetching buyers from Supabase...')
          const supabase = createClient()
          const { data, error } = await supabase
            .from('buyers')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5000)
          if (error) {
            errors.push(`Supabase Buyers: ${error.message}`)
          } else if (data) {
            console.log('[DataContext] Fetched buyers from Supabase:', data.length)
            setLeads(data)
          }
        }
      }

      // CAMPAIGNS: Fetch from Airtable (primary) or Supabase (fallback)
      const campaignsFetch = async () => {
        if (isAirtable) {
          console.log('[DataContext] Fetching campaigns from Airtable...')
          try {
            const airtableCampaigns = await fetchAirtableCampaigns()
            if (airtableCampaigns && airtableCampaigns.length > 0) {
              const mappedCampaigns: Campaign[] = airtableCampaigns.map((camp: any) => {
                const getValue = (...keys: string[]) => {
                  for (const key of keys) {
                    if (camp[key] !== undefined && camp[key] !== null) return camp[key]
                  }
                  return null
                }
                const parseNum = (val: any) => {
                  if (typeof val === 'string') return parseFloat(val.replace(/[£$,]/g, '')) || 0
                  return Number(val) || 0
                }

                return {
                  id: camp.id,
                  name: getValue('name', 'Name', 'NAME', 'campaign_name', 'Campaign Name') || 'Unnamed',
                  client: getValue('client', 'Client', 'CLIENT'),
                  development: getValue('development', 'Development', 'development_name', 'Development Name'),
                  company_id: getValue('company_id', 'companyId', 'Company ID'),
                  platform: getValue('platform', 'Platform', 'PLATFORM'),
                  status: getValue('status', 'Status', 'STATUS') || 'unknown',
                  spend: parseNum(getValue('spend', 'Spend', 'amount_spent', 'Amount Spent', 'total_spend', 'Total Spend')),
                  amount_spent: parseNum(getValue('spend', 'Spend', 'amount_spent', 'Amount Spent')),
                  leads: parseNum(getValue('leads', 'Leads', 'lead_count', 'Lead Count', 'Leads Generated')),
                  lead_count: parseNum(getValue('leads', 'Leads', 'lead_count', 'Lead Count')),
                  cpl: parseNum(getValue('cpl', 'CPL', 'cost_per_lead', 'Cost Per Lead')),
                  cost_per_lead: parseNum(getValue('cpl', 'CPL', 'cost_per_lead', 'Cost Per Lead')),
                  impressions: parseNum(getValue('impressions', 'Impressions')),
                  clicks: parseNum(getValue('clicks', 'Clicks')),
                  ctr: parseNum(getValue('ctr', 'CTR')),
                  start_date: getValue('startDate', 'start_date', 'Start Date'),
                  end_date: getValue('endDate', 'end_date', 'End Date'),
                  created_at: getValue('createdAt', 'created_at', 'Created'),
                  updated_at: getValue('updatedAt', 'updated_at', 'Updated'),
                  ...camp,
                }
              })
              console.log('[DataContext] Fetched campaigns from Airtable:', mappedCampaigns.length)
              setCampaigns(mappedCampaigns)
            } else {
              console.log('[DataContext] No campaigns in Airtable')
              errors.push('No campaigns found in Airtable')
            }
          } catch (e) {
            console.error('[DataContext] Airtable campaigns fetch failed:', e)
            errors.push(`Airtable Campaigns: ${e instanceof Error ? e.message : 'Failed'}`)
          }
        } else if (isSupabase) {
          const supabase = createClient()
          const { data, error } = await supabase
            .from('campaigns')
            .select('*')
            .order('created_at', { ascending: false })
          if (error) {
            errors.push(`Supabase Campaigns: ${error.message}`)
          } else if (data) {
            setCampaigns(data)
          }
        }
      }

      // COMPANIES: Always from Supabase
      const companiesFetch = async () => {
        if (isSupabase) {
          const supabase = createClient()
          const { data, error } = await supabase
            .from('companies')
            .select('*')
            .order('name', { ascending: true })
          if (error) {
            errors.push(`Companies: ${error.message}`)
          } else if (data) {
            console.log('[DataContext] Fetched companies:', data.length)
            setCompanies(data)
          }
        }
      }

      // DEVELOPMENTS: Fetch from Airtable
      const developmentsFetch = async () => {
        if (isAirtable) {
          try {
            const airtableDevelopments = await fetchAirtableDevelopments()
            if (airtableDevelopments && airtableDevelopments.length > 0) {
              const mappedDevelopments: Development[] = airtableDevelopments.map((dev: any) => {
                const getValue = (...keys: string[]) => {
                  for (const key of keys) {
                    if (dev[key] !== undefined && dev[key] !== null) return dev[key]
                  }
                  return null
                }
                return {
                  id: dev.id,
                  name: getValue('name', 'Name', 'NAME') || 'Unknown Development',
                  location: getValue('location', 'Location', 'address', 'Address'),
                  developer: getValue('developer', 'Developer'),
                  status: getValue('status', 'Status') || 'Active',
                  units: getValue('units', 'Units', 'total_units', 'Total Units') || 0,
                  total_units: getValue('total_units', 'Total Units') || 0,
                  available_units: getValue('available_units', 'Available Units') || 0,
                  price_from: getValue('price_from', 'Price From'),
                  price_to: getValue('price_to', 'Price To'),
                  completion_date: getValue('completion_date', 'Completion Date'),
                  description: getValue('description', 'Description'),
                  image_url: getValue('image_url', 'Image URL'),
                  total_leads: getValue('total_leads', 'Total Leads') || 0,
                  total_spend: getValue('total_spend', 'Total Spend') || 0,
                  ...dev,
                }
              })
              console.log('[DataContext] Fetched developments:', mappedDevelopments.length)
              setDevelopments(mappedDevelopments)
            }
          } catch (e) {
            console.error('[DataContext] Developments fetch failed:', e)
          }
        }
      }

      // USERS: Fetch from Supabase profiles
      const usersFetch = async () => {
        const demoUsers: AppUser[] = [
          { id: 'user-1', name: 'Sarah Johnson', email: 'sarah@naybourhood.ai', role: 'admin', status: 'active' },
          { id: 'user-2', name: 'James Wilson', email: 'james@naybourhood.ai', role: 'agent', status: 'active' },
          { id: 'user-3', name: 'Emily Chen', email: 'emily@naybourhood.ai', role: 'agent', status: 'active' },
          { id: 'user-4', name: 'Michael Brown', email: 'michael@naybourhood.ai', role: 'broker', status: 'active' },
        ]
        if (isSupabase) {
          const supabase = createClient()
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('full_name', { ascending: true })
          if (error || !data || data.length === 0) {
            setUsers(demoUsers)
          } else {
            setUsers(data.map((p: any) => ({
              id: p.id,
              name: p.full_name || p.email || 'Unknown',
              email: p.email || '',
              role: p.role || 'agent',
              company: p.company,
              company_id: p.company_id,
              avatar_url: p.avatar_url,
              status: 'active',
            })))
          }
        } else {
          setUsers(demoUsers)
        }
      }

      // Run ALL fetches in PARALLEL
      fetchPromises.push(buyersFetch())
      fetchPromises.push(campaignsFetch())
      fetchPromises.push(companiesFetch())
      fetchPromises.push(developmentsFetch())
      fetchPromises.push(usersFetch())

      await Promise.all(fetchPromises)

      const elapsed = Date.now() - startTime
      console.log(`[DataContext] All data fetched in ${elapsed}ms`)

      if (errors.length > 0) {
        setError(errors.join('; '))
      }
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
