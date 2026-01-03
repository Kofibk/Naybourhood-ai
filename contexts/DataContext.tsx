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

      // BUYERS: Fetch from Supabase (primary) - Airtable disabled for reliability
      const buyersFetch = async () => {
        if (isSupabase) {
          console.log('[DataContext] Fetching ALL buyers from Supabase...')
          const supabase = createClient()

          // Fetch ALL rows using pagination (Supabase defaults to 1000)
          let allBuyers: any[] = []
          let from = 0
          const batchSize = 1000
          let hasMore = true

          while (hasMore) {
            const { data, error } = await supabase
              .from('buyers')
              .select('*')
              .order('created_at', { ascending: false })
              .range(from, from + batchSize - 1)

            if (error) {
              console.error('[DataContext] Supabase buyers error:', error.message)
              errors.push(`Buyers: ${error.message}`)
              hasMore = false
            } else if (data && data.length > 0) {
              allBuyers = [...allBuyers, ...data]
              from += batchSize
              hasMore = data.length === batchSize
              console.log(`[DataContext] Fetched batch: ${data.length} buyers (total: ${allBuyers.length})`)
            } else {
              hasMore = false
            }
          }

          if (allBuyers.length > 0) {
            // Log first record to see actual column names
            console.log('[DataContext] First buyer columns:', Object.keys(allBuyers[0]))

            // Map Airtable CSV column names to frontend expected names
            const mappedBuyers = allBuyers.map((b: any) => ({
              id: b.id,
              // Name - try multiple column names
              full_name: b.full_name || b['Lead Name'] || b['lead name'] || b.name || 'Unknown',
              first_name: b.first_name || b['First Name'],
              last_name: b.last_name || b['Last Name'],
              // Contact
              email: b.email || b['Email'] || b['email'],
              phone: b.phone || b['phone number'] || b['Phone Number'] || b['Phone'],
              // Budget - from "budget range" column
              budget: b.budget || b['budget range'] || b['Budget Range'] || b['Budget'],
              budget_min: b.budget_min,
              budget_max: b.budget_max,
              // Property requirements
              bedrooms: b.bedrooms || b['preferred bedrooms'] || b['Preferred Bedrooms'],
              location: b.location || b['preferred location'] || b['Preferred Location'] || b.area,
              area: b.area || b['preferred location'] || b['Preferred Location'],
              timeline: b.timeline || b['timeline to purchase'] || b['Timeline to Purchase'],
              // Source tracking
              source: b.source || b['source platform'] || b['Source Platform'] || b['Source'],
              campaign: b.campaign || b['development'] || b['Development'] || b['Campaign'],
              // Status
              status: b.status || b['Status'] || 'New',
              quality_score: b.quality_score || b['Quality Score'] || 0,
              intent_score: b.intent_score || b['Intent Score'] || 0,
              // Financial
              payment_method: b.payment_method || b['cash or mortgage'] || b['Cash or Mortgage'],
              mortgage_status: b.mortgage_status || b['manual update'] || b['Manual Update'],
              proof_of_funds: b.proof_of_funds,
              uk_broker: b.uk_broker,
              uk_solicitor: b.uk_solicitor,
              // Dates
              created_at: b.created_at || b['date added'] || b['Date Added'],
              updated_at: b.updated_at,
              notes: b.notes || b['Notes'],
              // Pass through ALL other fields
              ...b,
            }))

            console.log('[DataContext] Total buyers fetched:', mappedBuyers.length)
            setLeads(mappedBuyers)
          } else {
            console.log('[DataContext] No buyers in Supabase')
          }
        } else if (isAirtable) {
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
        }
      }

      // CAMPAIGNS: Fetch from Supabase (primary)
      const campaignsFetch = async () => {
        if (isSupabase) {
          console.log('[DataContext] Fetching campaigns from Supabase...')
          const supabase = createClient()
          const { data, error } = await supabase
            .from('campaigns')
            .select('*')
            .order('created_at', { ascending: false })
          if (error) {
            console.error('[DataContext] Supabase campaigns error:', error.message)
            errors.push(`Campaigns: ${error.message}`)
          } else if (data && data.length > 0) {
            console.log('[DataContext] Fetched campaigns from Supabase:', data.length)
            setCampaigns(data)
          } else {
            console.log('[DataContext] No campaigns in Supabase')
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
