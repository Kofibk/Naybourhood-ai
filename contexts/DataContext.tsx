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

        // DEVELOPMENTS - don't order by name as column might not exist
        supabase.from('developments').select('*'),

        // FINANCE LEADS
        supabase.from('finance_leads').select('*').order('created_at', { ascending: false }),

        // PROFILES/USERS
        supabase.from('profiles').select('*').order('full_name', { ascending: true }),
      ])

      // Process BUYERS
      if (Array.isArray(buyersResult) && buyersResult.length > 0) {
        console.log('[DataContext] First buyer columns:', Object.keys(buyersResult[0]))

        // Map column names - combine first_name + last_name into full_name
        const mappedBuyers = buyersResult.map((b: any) => {
          const firstName = b.first_name || b['First Name'] || b['first name'] || ''
          const lastName = b.last_name || b['Last Name'] || b['last name'] || ''
          const combinedName = `${firstName} ${lastName}`.trim()

          return {
            id: b.id,
            full_name: b.full_name || b['Lead Name'] || b['lead name'] || combinedName || b.name || 'Unknown',
            first_name: firstName,
            last_name: lastName,
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
        }})
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
        if (developmentsResult.data.length > 0) {
          console.log('[DataContext] First development columns:', Object.keys(developmentsResult.data[0]))
        }
        // Map column names (supports both Supabase schema names and imported CSV names)
        const mappedDevelopments = developmentsResult.data.map((d: any) => ({
          id: d.id,
          name: d.name || d['Development Name'] || d['development_name'] || 'Unnamed',
          location: d.location || d['Location'] || d['area'],
          address: d.address || d['Address'],
          developer: d.developer || d['Developer'] || d['developer_name'],
          status: d.status || d['Status'] || 'Active',
          units: d.units || d['Units'] || d['total_units'] || 0,
          total_units: d.total_units || d['Total Units'] || d['units'] || 0,
          available_units: d.available_units || d['Available Units'] || 0,
          price_from: d.price_from || d['Price From'] || d['min_price'],
          price_to: d.price_to || d['Price To'] || d['max_price'],
          completion_date: d.completion_date || d['Completion Date'],
          description: d.description || d['Description'],
          image_url: d.image_url || d['Image URL'] || d['image'],
          total_leads: d.total_leads || d['Total Leads'] || 0,
          total_spend: d.total_spend || d['Total Spend'] || 0,
          created_at: d.created_at,
          updated_at: d.updated_at,
          ...d,
        }))
        setDevelopments(mappedDevelopments)
      } else if (developmentsResult.error) {
        // Table might not exist yet - not critical
        console.log('[DataContext] Developments table error:', developmentsResult.error.message)
      }

      // Process FINANCE LEADS
      if (!financeLeadsResult.error && financeLeadsResult.data) {
        console.log('[DataContext] Finance Leads loaded:', financeLeadsResult.data.length)
        if (financeLeadsResult.data.length > 0) {
          console.log('[DataContext] First finance lead columns:', Object.keys(financeLeadsResult.data[0]))
        }
        // Map column names - combine first_name + last_name into full_name
        const mappedFinanceLeads = financeLeadsResult.data.map((f: any) => {
          // Build full name from first_name + last_name if full_name doesn't exist
          const firstName = f.first_name || f['First Name'] || f['first name'] || ''
          const lastName = f.last_name || f['Last Name'] || f['last name'] || ''
          const combinedName = `${firstName} ${lastName}`.trim()

          return {
            id: f.id,
            full_name: f.full_name || f['Full Name'] || combinedName || f['Name'] || f.name || 'Unknown',
            first_name: firstName,
            last_name: lastName,
            email: f.email || f['Email'],
            phone: f.phone || f['Phone'] || f['Phone Number'],
            required_by_date: f.required_by_date || f['Required By Date'] || f['required_by'],
            message: f.message || f['Message'],
            status: f.status || f['Status'] || 'Contact Pending',
            notes: f.notes || f['Notes'],
            created_at: f.created_at || f['Created At'] || f['Date Added'],
            updated_at: f.updated_at,
            ...f,
          }
        })
        setFinanceLeads(mappedFinanceLeads)
      } else if (financeLeadsResult.error) {
        // Table might not exist yet - not critical
        console.log('[DataContext] Finance Leads table error:', financeLeadsResult.error.message)
      }

      // Process USERS - no demo data, only real users from Supabase
      if (!usersResult.error && usersResult.data) {
        const mappedUsers = usersResult.data.map((p: any) => ({
          id: p.id,
          name: p.full_name || p.email || 'Unknown',
          email: p.email || '',
          role: p.role || 'agent',
          company_id: p.company_id,
          company: p.company_id,
          avatar_url: p.avatar_url,
          status: (p.status || 'active') as 'active' | 'inactive',
          last_active: p.last_active,
          created_at: p.created_at,
        }))
        console.log('[DataContext] Users loaded:', mappedUsers.length)
        setUsers(mappedUsers)
      } else if (usersResult.error) {
        console.log('[DataContext] Users/profiles table error:', usersResult.error.message)
        setUsers([])
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
