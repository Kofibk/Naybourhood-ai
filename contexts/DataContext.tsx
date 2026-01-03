'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import type { Buyer, Campaign, Company, Development, AppUser, FinanceLead } from '@/types'

interface DataContextType {
  leads: Buyer[]
  campaigns: Campaign[]
  companies: Company[]
  developments: Development[]
  financeLeads: FinanceLead[]
  users: AppUser[]
  isLoading: boolean
  error: string | null
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
  const [financeLeads, setFinanceLeads] = useState<FinanceLead[]>([])
  const [users, setUsers] = useState<AppUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isConfigured = isSupabaseConfigured()

  console.log('[DataContext] Supabase configured:', isConfigured)

  const refreshData = useCallback(async () => {
    if (!isConfigured) {
      console.log('[DataContext] Supabase not configured')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)
    const errors: string[] = []
    const startTime = Date.now()

    console.log('[DataContext] Starting data fetch from Supabase...')

    try {
      const supabase = createClient()

      // Fetch all data in PARALLEL
      const [buyersResult, campaignsResult, companiesResult, developmentsResult, financeLeadsResult, usersResult] = await Promise.all([
        // BUYERS - fetch all with pagination
        (async () => {
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
              console.error('[DataContext] Buyers error:', error.message)
              errors.push(`Buyers: ${error.message}`)
              return []
            }
            if (data && data.length > 0) {
              allBuyers = [...allBuyers, ...data]
              from += batchSize
              hasMore = data.length === batchSize
            } else {
              hasMore = false
            }
          }
          return allBuyers
        })(),

        // CAMPAIGNS
        supabase.from('campaigns').select('*').order('created_at', { ascending: false }),

        // COMPANIES
        supabase.from('companies').select('*').order('name', { ascending: true }),

        // DEVELOPMENTS
        supabase.from('developments').select('*').order('name', { ascending: true }),

        // FINANCE LEADS
        supabase.from('finance_leads').select('*').order('created_at', { ascending: false }),

        // PROFILES/USERS
        supabase.from('profiles').select('*').order('full_name', { ascending: true }),
      ])

      // Process BUYERS
      if (Array.isArray(buyersResult) && buyersResult.length > 0) {
        console.log('[DataContext] First buyer columns:', Object.keys(buyersResult[0]))

        // Map column names (supports both Supabase schema names and Airtable CSV imports)
        const mappedBuyers = buyersResult.map((b: any) => ({
          id: b.id,
          full_name: b.full_name || b['Lead Name'] || b['lead name'] || b.name || 'Unknown',
          first_name: b.first_name || b['First Name'],
          last_name: b.last_name || b['Last Name'],
          email: b.email || b['Email'],
          phone: b.phone || b['phone number'] || b['Phone Number'],
          budget: b.budget || b['budget range'] || b['Budget Range'],
          budget_min: b.budget_min,
          budget_max: b.budget_max,
          bedrooms: b.bedrooms || b['preferred bedrooms'] || b['Preferred Bedrooms'],
          location: b.location || b['preferred location'] || b['Preferred Location'],
          area: b.area || b['preferred location'] || b['Preferred Location'],
          timeline: b.timeline || b['timeline to purchase'] || b['Timeline to Purchase'],
          source: b.source || b['source platform'] || b['Source Platform'],
          campaign: b.campaign || b['development'] || b['Development'],
          status: b.status || b['Status'] || 'New',
          quality_score: b.quality_score || b['Quality Score'] || 0,
          intent_score: b.intent_score || b['Intent Score'] || 0,
          payment_method: b.payment_method || b['cash or mortgage'] || b['Cash or Mortgage'],
          mortgage_status: b.mortgage_status || b['manual update'] || b['Manual Update'],
          proof_of_funds: b.proof_of_funds,
          uk_broker: b.uk_broker,
          uk_solicitor: b.uk_solicitor,
          created_at: b.created_at || b['date added'] || b['Date Added'],
          updated_at: b.updated_at,
          notes: b.notes,
          assigned_to: b.assigned_to,
          assigned_user_name: b.assigned_user_name,
          assigned_at: b.assigned_at,
          ...b,
        }))
        console.log('[DataContext] Buyers loaded:', mappedBuyers.length)
        setLeads(mappedBuyers)
      } else {
        console.log('[DataContext] No buyers found')
      }

      // Process CAMPAIGNS
      if (!campaignsResult.error && campaignsResult.data) {
        console.log('[DataContext] Campaigns loaded:', campaignsResult.data.length)
        setCampaigns(campaignsResult.data)
      } else if (campaignsResult.error) {
        errors.push(`Campaigns: ${campaignsResult.error.message}`)
      }

      // Process COMPANIES
      if (!companiesResult.error && companiesResult.data) {
        const mappedCompanies = companiesResult.data.map((c: any) => ({
          ...c,
          phone: c.contact_phone,
          tier: c.subscription_tier,
        }))
        console.log('[DataContext] Companies loaded:', mappedCompanies.length)
        setCompanies(mappedCompanies)
      } else if (companiesResult.error) {
        errors.push(`Companies: ${companiesResult.error.message}`)
      }

      // Process DEVELOPMENTS
      if (!developmentsResult.error && developmentsResult.data) {
        console.log('[DataContext] Developments loaded:', developmentsResult.data.length)
        setDevelopments(developmentsResult.data)
      } else if (developmentsResult.error) {
        // Table might not exist yet - not critical
        console.log('[DataContext] Developments table not found (optional)')
      }

      // Process FINANCE LEADS
      if (!financeLeadsResult.error && financeLeadsResult.data) {
        console.log('[DataContext] Finance Leads loaded:', financeLeadsResult.data.length)
        setFinanceLeads(financeLeadsResult.data)
      } else if (financeLeadsResult.error) {
        // Table might not exist yet - not critical
        console.log('[DataContext] Finance Leads table not found (optional)')
      }

      // Process USERS
      const demoUsers: AppUser[] = [
        { id: 'user-1', name: 'Sarah Johnson', email: 'sarah@naybourhood.ai', role: 'admin', status: 'active' },
        { id: 'user-2', name: 'James Wilson', email: 'james@naybourhood.ai', role: 'agent', status: 'active' },
        { id: 'user-3', name: 'Emily Chen', email: 'emily@naybourhood.ai', role: 'agent', status: 'active' },
      ]

      if (!usersResult.error && usersResult.data && usersResult.data.length > 0) {
        const mappedUsers = usersResult.data.map((p: any) => ({
          id: p.id,
          name: p.full_name || p.email || 'Unknown',
          email: p.email || '',
          role: p.role || 'agent',
          company_id: p.company_id,
          avatar_url: p.avatar_url,
          status: 'active' as const,
        }))
        console.log('[DataContext] Users loaded:', mappedUsers.length)
        setUsers(mappedUsers)
      } else {
        setUsers(demoUsers)
      }

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
  }, [isConfigured])

  useEffect(() => {
    refreshData()
  }, [refreshData])

  // Update a lead
  const updateLead = useCallback(async (id: string, data: Partial<Buyer>): Promise<Buyer | null> => {
    try {
      const supabase = createClient()
      const { data: updatedData, error } = await supabase
        .from('buyers')
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('[DataContext] Update lead error:', error)
        return null
      }

      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...updatedData } : l)))
      return updatedData
    } catch (e) {
      console.error('[DataContext] Update lead failed:', e)
      return null
    }
  }, [])

  // Update a campaign
  const updateCampaign = useCallback(async (id: string, data: Partial<Campaign>): Promise<Campaign | null> => {
    try {
      const supabase = createClient()
      const { data: updatedData, error } = await supabase
        .from('campaigns')
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('[DataContext] Update campaign error:', error)
        return null
      }

      setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, ...updatedData } : c)))
      return updatedData
    } catch (e) {
      console.error('[DataContext] Update campaign failed:', e)
      return null
    }
  }, [])

  // Create a new lead
  const createLead = useCallback(async (data: Partial<Buyer>): Promise<Buyer | null> => {
    try {
      const supabase = createClient()
      const { data: newData, error } = await supabase
        .from('buyers')
        .insert(data)
        .select()
        .single()

      if (error) {
        console.error('[DataContext] Create lead error:', error)
        return null
      }

      setLeads((prev) => [newData, ...prev])
      return newData
    } catch (e) {
      console.error('[DataContext] Create lead failed:', e)
      return null
    }
  }, [])

  // Delete a lead
  const deleteLead = useCallback(async (id: string): Promise<boolean> => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('buyers')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('[DataContext] Delete lead error:', error)
        return false
      }

      setLeads((prev) => prev.filter((l) => l.id !== id))
      return true
    } catch (e) {
      console.error('[DataContext] Delete lead failed:', e)
      return false
    }
  }, [])

  // Assign a lead to a user
  const assignLead = useCallback(async (leadId: string, userId: string): Promise<boolean> => {
    const user = users.find((u) => u.id === userId)
    const result = await updateLead(leadId, {
      assigned_to: userId,
      assigned_user_name: user?.name || 'Unknown',
      assigned_at: new Date().toISOString(),
    })
    return !!result
  }, [updateLead, users])

  return (
    <DataContext.Provider
      value={{
        leads,
        campaigns,
        companies,
        developments,
        financeLeads,
        users,
        isLoading,
        error,
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
