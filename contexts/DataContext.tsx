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
            console.log('[DataContext] Raw Airtable response:', airtableLeads?.length, 'records')
            if (airtableLeads?.[0]) {
              console.log('[DataContext] FIRST RECORD KEYS:', Object.keys(airtableLeads[0]))
              console.log('[DataContext] FIRST RECORD DATA:', JSON.stringify(airtableLeads[0], null, 2))
            }

            if (airtableLeads && airtableLeads.length > 0) {
              // SIMPLIFIED: Just pass through raw data with basic normalization
              const mappedLeads: Buyer[] = airtableLeads.map((lead: any) => ({
                id: lead.id,
                // Try common name fields
                full_name: lead['Lead Name'] || lead['lead_name'] || lead['Name'] || lead['name'] || lead['Full Name'] || 'Unknown',
                email: lead['email'] || lead['Email'] || lead['EMAIL'],
                phone: lead['phone number'] || lead['Phone Number'] || lead['phone'] || lead['Phone'],
                budget: lead['budget range'] || lead['Budget Range'] || lead['budget'] || lead['Budget'],
                status: lead['status'] || lead['Status'] || 'New',
                source: lead['source platform'] || lead['Source Platform'] || lead['source'] || lead['Source'],
                // Pass through ALL raw fields
                ...lead,
              }))
              console.log('[DataContext] Mapped leads sample:', mappedLeads[0])
              setLeads(mappedLeads)
            } else {
              console.log('[DataContext] No buyers found')
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
            // Map Supabase data with derived fields for frontend compatibility
            const mappedLeads: Buyer[] = data.map((lead: any) => {
              // Derive first_name/last_name from full_name if not present
              let firstName = lead.first_name
              let lastName = lead.last_name
              if (!firstName && lead.full_name) {
                const nameParts = lead.full_name.split(' ')
                firstName = nameParts[0] || null
                lastName = nameParts.slice(1).join(' ') || null
              }
              return {
                ...lead,
                first_name: firstName,
                last_name: lastName,
                // Ensure area is populated from location if missing
                area: lead.area || lead.location,
              }
            })
            console.log('[DataContext] Fetched buyers from Supabase:', mappedLeads.length)
            setLeads(mappedLeads)
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
            // Map Supabase columns to frontend expected fields
            const mappedCampaigns: Campaign[] = data.map((c: any) => ({
              ...c,
              // Alias fields for frontend compatibility
              amount_spent: c.spend,
              lead_count: c.leads,
              cost_per_lead: c.cpl,
            }))
            console.log('[DataContext] Fetched campaigns from Supabase:', mappedCampaigns.length)
            setCampaigns(mappedCampaigns)
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
            // Map Supabase columns to frontend expected fields
            const mappedCompanies: Company[] = data.map((c: any) => ({
              ...c,
              // Alias fields for frontend compatibility
              phone: c.contact_phone,
              tier: c.subscription_tier,
            }))
            console.log('[DataContext] Fetched companies:', mappedCompanies.length)
            setCompanies(mappedCompanies)
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
