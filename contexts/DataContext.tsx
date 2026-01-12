'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { toast } from 'sonner'
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
  // Lead operations
  updateLead: (id: string, data: Partial<Buyer>) => Promise<Buyer | null>
  createLead: (data: Partial<Buyer>) => Promise<Buyer | null>
  deleteLead: (id: string) => Promise<boolean>
  assignLead: (leadId: string, userId: string) => Promise<boolean>
  // Campaign operations
  updateCampaign: (id: string, data: Partial<Campaign>) => Promise<Campaign | null>
  createCampaign: (data: Partial<Campaign>) => Promise<Campaign | null>
  deleteCampaign: (id: string) => Promise<boolean>
  // Company operations
  createCompany: (data: Partial<Company>) => Promise<Company | null>
  updateCompany: (id: string, data: Partial<Company>) => Promise<Company | null>
  deleteCompany: (id: string) => Promise<boolean>
  // Development operations
  createDevelopment: (data: Partial<Development>) => Promise<Development | null>
  updateDevelopment: (id: string, data: Partial<Development>) => Promise<Development | null>
  deleteDevelopment: (id: string) => Promise<boolean>
  // Finance Lead operations
  updateFinanceLead: (id: string, data: Partial<FinanceLead>) => Promise<FinanceLead | null>
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

      if (!supabase) {
        console.warn('[DataContext] Supabase client not available')
        setIsLoading(false)
        return
      }

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

        // DEVELOPMENTS - join company data
        supabase.from('developments').select('*, company:companies(*)'),

        // FINANCE LEADS
        supabase.from('finance_leads').select('*').order('created_at', { ascending: false }),

        // PROFILES/USERS
        supabase.from('profiles').select('*').order('full_name', { ascending: true }),
      ])

      // Process BUYERS
      if (Array.isArray(buyersResult) && buyersResult.length > 0) {
        console.log('[DataContext] ========== BUYERS DEBUG ==========')
        console.log('[DataContext] Total buyers fetched:', buyersResult.length)
        console.log('[DataContext] First buyer RAW:', JSON.stringify(buyersResult[0], null, 2))
        console.log('[DataContext] All column names:', Object.keys(buyersResult[0]))
        // Debug score fields specifically
        const firstBuyer = buyersResult[0]
        console.log('[DataContext] Score fields in raw data:', {
          quality_score: firstBuyer.quality_score,
          'Quality Score': firstBuyer['Quality Score'],
          ai_quality_score: firstBuyer.ai_quality_score,
          intent_score: firstBuyer.intent_score,
          'Intent Score': firstBuyer['Intent Score'],
          ai_intent_score: firstBuyer.ai_intent_score,
          ai_confidence: firstBuyer.ai_confidence,
        })
      } else if (Array.isArray(buyersResult) && buyersResult.length === 0) {
        console.warn('[DataContext] ⚠️ BUYERS: Empty result - this could be:')
        console.warn('  1. No data in Supabase buyers table')
        console.warn('  2. RLS blocking access (user not authenticated with Supabase)')
        console.warn('  3. Quick Access test users bypass Supabase auth - use real login for data')
      }

      if (Array.isArray(buyersResult) && buyersResult.length > 0) {

        // Map column names - combine first_name + last_name into full_name
        const mappedBuyers = buyersResult.map((b: any) => {
          const firstName = b.first_name || b['First Name'] || b['first name'] || ''
          const lastName = b.last_name || b['Last Name'] || b['last name'] || ''
          const combinedName = `${firstName} ${lastName}`.trim()

          return {
            ...b,  // Spread first so explicit mappings override
            id: b.id,
            full_name: b.full_name || b['Lead Name'] || b['lead name'] || combinedName || b.name || 'Unknown',
            first_name: firstName,
            last_name: lastName,
          email: b.email || b['Email'],
          phone: b.phone || b['phone number'] || b['Phone Number'],
          budget: b.budget || b.budget_range || b['budget range'] || b['Budget Range'],
          budget_range: b.budget_range || b['budget range'] || b['Budget Range'],
          budget_min: b.budget_min,
          budget_max: b.budget_max,
          bedrooms: b.bedrooms || b.preferred_bedrooms || b['preferred bedrooms'] || b['Preferred Bedrooms'],
          preferred_bedrooms: b.preferred_bedrooms || b['preferred bedrooms'] || b['Preferred Bedrooms'],
          location: b.location || b['preferred location'] || b['Preferred Location'],
          area: b.area || b['preferred location'] || b['Preferred Location'],
          country: b.country || b['Country'],
          timeline: b.timeline || b['timeline to purchase'] || b['Timeline to Purchase'],
          source: b.source || b['source platform'] || b['Source Platform'],
          campaign: b.campaign || b['development'] || b['Development'],
          campaign_id: b.campaign_id,
          company_id: b.company_id,
          status: b.status || b['Status'] || 'New',
          // Scores - check both standard and AI-generated columns
          // Don't default to 0 - null means unscored, 0 means actually scored as 0
          quality_score: b.quality_score ?? b.ai_quality_score ?? b['Quality Score'] ?? b['quality score'] ?? null,
          intent_score: b.intent_score ?? b.ai_intent_score ?? b['Intent Score'] ?? b['intent score'] ?? null,
          ai_quality_score: b.ai_quality_score ?? b.quality_score ?? null,
          ai_intent_score: b.ai_intent_score ?? b.intent_score ?? null,
          ai_confidence: b.ai_confidence ?? b.confidence ?? null,
          ai_summary: b.ai_summary,
          ai_next_action: b.ai_next_action,
          ai_risk_flags: b.ai_risk_flags,
          ai_recommendations: b.ai_recommendations,
          ai_classification: b.ai_classification,
          ai_priority: b.ai_priority,
          ai_scored_at: b.ai_scored_at,
          payment_method: b.payment_method || b['cash or mortgage'] || b['Cash or Mortgage'],
          mortgage_status: b.mortgage_status || b['manual update'] || b['Manual Update'],
          proof_of_funds: b.proof_of_funds,
          uk_broker: b.uk_broker,
          uk_solicitor: b.uk_solicitor,
          date_added: b.date_added || b['date added'] || b['Date Added'],
          created_at: b.date_added || b.created_at || b['date added'] || b['Date Added'],
          updated_at: b.updated_at,
          notes: b.notes,
          assigned_to: b.assigned_to,
          assigned_user_name: b.assigned_user_name,
          assigned_at: b.assigned_at,
          // Additional engagement fields
          purpose: b.purpose || b['Purpose'] || b['purchase_purpose'],
          ready_in_28_days: b.ready_in_28_days ?? b['Ready in 28 Days'] ?? b.ready_in_28days,
          viewing_intent_confirmed: b.viewing_intent_confirmed ?? b['Viewing Intent'] ?? b.viewing_intent,
          viewing_booked: b.viewing_booked ?? b['Viewing Booked'],
          viewing_date: b.viewing_date || b['Viewing Date'],
          replied: b.replied ?? b['Replied'] ?? b.has_replied,
          stop_comms: b.stop_comms ?? b['Stop Comms'] ?? b.opt_out,
          next_follow_up: b.next_follow_up || b['Next Follow Up'] || b.follow_up_date,
          broker_connected: b.broker_connected ?? b['Broker Connected'],
          // Communication history
          last_wa_message: b.last_wa_message || b['Last WA Message'] || b.last_whatsapp_message,
          transcript: b.transcript || b['Transcript'],
          call_summary: b.call_summary || b['Call Summary'],
        }})
        console.log('[DataContext] First MAPPED buyer:', JSON.stringify(mappedBuyers[0], null, 2))
        console.log('[DataContext] ====================================')
        console.log('[DataContext] Buyers loaded:', mappedBuyers.length)
        setLeads(mappedBuyers)
      } else {
        console.log('[DataContext] No buyers found or empty result')
      }

      // Process CAMPAIGNS
      if (!campaignsResult.error && campaignsResult.data) {
        console.log('[DataContext] Campaigns loaded:', campaignsResult.data.length)
        if (campaignsResult.data.length > 0) {
          console.log('[DataContext] First campaign columns:', Object.keys(campaignsResult.data[0]))
          // Debug: Show raw values for spend/leads columns
          const first = campaignsResult.data[0]
          console.log('[DataContext] First campaign raw values:', {
            // Spend columns (check 'total spend' with space first)
            'total spend': first['total spend'],
            total_spend: first.total_spend,
            'Total Spend': first['Total Spend'],
            spend: first.spend,
            ad_spend: first.ad_spend,
            amount_spent: first.amount_spent,
            // Lead columns
            'total leads': first['total leads'],
            total_leads: first.total_leads,
            'Total Leads': first['Total Leads'],
            leads: first.leads,
            lead_count: first.lead_count,
          })
          console.log('[DataContext] First campaign full object:', first)
        }
        // Map column names - prioritise total_spend and total_leads (confirmed Supabase columns)
        // Use ?? (nullish coalescing) so 0 values don't fall through
        // Check various naming patterns for compatibility
        // Parse values as numbers in case they're stored as strings
        const parseNumber = (val: any): number => {
          if (typeof val === 'number') return val
          if (typeof val === 'string') {
            // Remove currency symbols, commas, and spaces
            const cleaned = val.replace(/[£$€,\s]/g, '')
            const parsed = parseFloat(cleaned)
            return isNaN(parsed) ? 0 : parsed
          }
          return 0
        }

        const mappedCampaigns = campaignsResult.data.map((c: any) => {
          const spendVal = c['total spend'] ?? c.total_spend ?? c['Total Spend'] ?? c.TotalSpend ?? c.spend ?? c.ad_spend ?? c.amount_spent
          const leadsVal = c['total leads'] ?? c.total_leads ?? c['Total Leads'] ?? c.TotalLeads ?? c.leads ?? c.lead_count
          const cplVal = c.cpl ?? c.cost_per_lead ?? c.CPL

          return {
            ...c,
            spend: parseNumber(spendVal),
            leads: parseNumber(leadsVal),
            cpl: parseNumber(cplVal),
          }
        })
        console.log('[DataContext] First mapped campaign:', {
          spend: mappedCampaigns[0]?.spend,
          leads: mappedCampaigns[0]?.leads,
        })
        setCampaigns(mappedCampaigns)
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
          ad_spend: d.ad_spend || d['Ad Spend'] || d['total_spend'] || d['Total Spend'] || 0,
          // PDF and document attachments
          brochure_url: d.brochure_url || d['Brochure URL'] || d['brochure'],
          floor_plan_url: d.floor_plan_url || d['Floor Plan URL'] || d['floor_plan'],
          price_list_url: d.price_list_url || d['Price List URL'] || d['price_list'],
          attachments: d.attachments || d['Attachments'] || [],
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
            finance_type: f.finance_type || f['Finance Type'],
            loan_amount: f.loan_amount || f['Loan Amount'] || 0,
            loan_amount_display: f.loan_amount_display || f['Loan Amount Display'],
            required_by_date: f.required_by_date || f['Required By Date'] || f['required_by'],
            message: f.message || f['Message'],
            status: f.status || f['Status'] || 'Contact Pending',
            notes: f.notes || f['Notes'],
            assigned_agent: f.assigned_agent || f['Assigned Agent'],
            date_added: f.date_added || f['Date Added'],
            created_at: f.created_at || f['Created At'],
            updated_at: f.updated_at,
            ...f,
          }
        })
        setFinanceLeads(mappedFinanceLeads)
      } else if (financeLeadsResult.error) {
        // Table might not exist yet - not critical
        console.log('[DataContext] Finance Leads table error:', financeLeadsResult.error.message)
      }

      // Process USERS - try direct query first, then API fallback for Quick Access users
      const mapProfileToUser = (p: any): AppUser => {
        // Determine user status based on last_active
        let status: 'active' | 'inactive' | 'pending' = 'pending'
        const emailConfirmed = p.email_confirmed ?? (p.last_active ? true : false)

        if (p.last_active) {
          const lastActiveDate = new Date(p.last_active)
          const thirtyDaysAgo = new Date()
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
          status = lastActiveDate > thirtyDaysAgo ? 'active' : 'inactive'
        } else if (p.status === 'active') {
          status = 'active'
        }

        return {
          id: p.id,
          name: p.full_name || p.email || 'Unknown',
          email: p.email || '',
          role: p.role || 'agent',
          company_id: p.company_id,
          company: p.company_id,
          avatar_url: p.avatar_url,
          status,
          email_confirmed: emailConfirmed,
          last_active: p.last_active,
          created_at: p.created_at,
          invited_at: p.created_at,
        }
      }

      let usersLoaded = false
      if (!usersResult.error && usersResult.data && usersResult.data.length > 0) {
        const mappedUsers = usersResult.data.map(mapProfileToUser)
        console.log('[DataContext] Users loaded from direct query:', mappedUsers.length)
        setUsers(mappedUsers)
        usersLoaded = true
      }

      // If direct query failed or returned empty, try API fallback (for Quick Access users)
      if (!usersLoaded) {
        console.log('[DataContext] Trying API fallback for users...')
        try {
          const response = await fetch('/api/users/invite?demo=true')
          if (response.ok) {
            const data = await response.json()
            if (data.users && data.users.length > 0) {
              const mappedUsers = data.users.map(mapProfileToUser)
              console.log('[DataContext] Users loaded from API:', mappedUsers.length)
              setUsers(mappedUsers)
              usersLoaded = true
            }
          }
        } catch (apiError) {
          console.log('[DataContext] API fallback failed:', apiError)
        }
      }

      if (!usersLoaded) {
        console.log('[DataContext] No users found from any source')
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

      // Exclude computed/mapped fields that don't exist in database
      const excludeColumns = ['id', 'created_at']

      const cleanData: Record<string, any> = {}
      for (const [key, value] of Object.entries(data)) {
        if (!excludeColumns.includes(key) && value !== undefined) {
          cleanData[key] = value
        }
      }

      // Add updated timestamp
      cleanData.updated_at = new Date().toISOString()

      console.log('[DataContext] Updating lead with:', cleanData)

      const { data: updatedData, error } = await supabase
        .from('buyers')
        .update(cleanData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('[DataContext] Update lead error:', error)
        toast.error('Failed to update lead', { description: error.message })
        return null
      }

      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...updatedData } : l)))
      toast.success('Lead updated')
      return updatedData
    } catch (e) {
      console.error('[DataContext] Update lead failed:', e)
      toast.error('Failed to update lead')
      return null
    }
  }, [])

  // Update a campaign
  const updateCampaign = useCallback(async (id: string, data: Partial<Campaign>): Promise<Campaign | null> => {
    try {
      const supabase = createClient()

      // Exclude computed/mapped fields (spend, leads, cpl are mapped from total spend, total leads)
      const excludeColumns = ['id', 'created_at', 'spend', 'leads', 'cpl']

      const cleanData: Record<string, any> = {}
      for (const [key, value] of Object.entries(data)) {
        if (!excludeColumns.includes(key) && value !== undefined) {
          cleanData[key] = value
        }
      }

      // Add updated timestamp
      cleanData.updated_at = new Date().toISOString()

      console.log('[DataContext] Updating campaign with:', cleanData)

      const { data: updatedData, error } = await supabase
        .from('campaigns')
        .update(cleanData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('[DataContext] Update campaign error:', error)
        toast.error('Failed to update campaign', { description: error.message })
        return null
      }

      setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, ...updatedData } : c)))
      toast.success('Campaign updated')
      return updatedData
    } catch (e) {
      console.error('[DataContext] Update campaign failed:', e)
      toast.error('Failed to update campaign')
      return null
    }
  }, [])

  // Create a new lead with auto-scoring
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
        toast.error('Failed to create lead', { description: error.message })
        return null
      }

      setLeads((prev) => [newData, ...prev])
      toast.success('Lead created')

      // Auto-score the new lead in the background
      if (newData?.id) {
        console.log('[DataContext] Auto-scoring new lead:', newData.id)
        fetch('/api/ai/score-buyer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ buyerId: newData.id }),
        })
          .then(async (res) => {
            if (res.ok) {
              const scoreResult = await res.json()
              console.log('[DataContext] Lead auto-scored:', scoreResult)
              // Update the lead in state with scores
              setLeads((prev) =>
                prev.map((l) =>
                  l.id === newData.id
                    ? {
                        ...l,
                        ai_quality_score: scoreResult.quality_score,
                        ai_intent_score: scoreResult.intent_score,
                        ai_confidence: scoreResult.confidence,
                        ai_classification: scoreResult.classification,
                        ai_priority: scoreResult.priority,
                        ai_summary: scoreResult.summary,
                        ai_next_action: scoreResult.next_action,
                        ai_scored_at: new Date().toISOString(),
                      }
                    : l
                )
              )
              toast.success('Lead scored', { description: `Classification: ${scoreResult.classification}` })
            }
          })
          .catch((err) => console.error('[DataContext] Auto-score failed:', err))
      }

      return newData
    } catch (e) {
      console.error('[DataContext] Create lead failed:', e)
      toast.error('Failed to create lead')
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
        toast.error('Failed to delete lead', { description: error.message })
        return false
      }

      setLeads((prev) => prev.filter((l) => l.id !== id))
      toast.success('Lead deleted')
      return true
    } catch (e) {
      console.error('[DataContext] Delete lead failed:', e)
      toast.error('Failed to delete lead')
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

  // Create a campaign
  const createCampaign = useCallback(async (data: Partial<Campaign>): Promise<Campaign | null> => {
    try {
      const supabase = createClient()
      const { data: newData, error } = await supabase
        .from('campaigns')
        .insert(data)
        .select()
        .single()

      if (error) {
        console.error('[DataContext] Create campaign error:', error)
        toast.error('Failed to create campaign', { description: error.message })
        return null
      }

      setCampaigns((prev) => [newData, ...prev])
      toast.success('Campaign created')
      return newData
    } catch (e) {
      console.error('[DataContext] Create campaign failed:', e)
      toast.error('Failed to create campaign')
      return null
    }
  }, [])

  // Delete a campaign
  const deleteCampaign = useCallback(async (id: string): Promise<boolean> => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('[DataContext] Delete campaign error:', error)
        toast.error('Failed to delete campaign', { description: error.message })
        return false
      }

      setCampaigns((prev) => prev.filter((c) => c.id !== id))
      toast.success('Campaign deleted')
      return true
    } catch (e) {
      console.error('[DataContext] Delete campaign failed:', e)
      toast.error('Failed to delete campaign')
      return false
    }
  }, [])

  // Create a company
  const createCompany = useCallback(async (data: Partial<Company>): Promise<Company | null> => {
    try {
      const supabase = createClient()
      const { data: newData, error } = await supabase
        .from('companies')
        .insert(data)
        .select()
        .single()

      if (error) {
        console.error('[DataContext] Create company error:', error)
        return null
      }

      setCompanies((prev) => [newData, ...prev])
      return newData
    } catch (e) {
      console.error('[DataContext] Create company failed:', e)
      return null
    }
  }, [])

  // Update a company
  const updateCompany = useCallback(async (id: string, data: Partial<Company>): Promise<Company | null> => {
    try {
      const supabase = createClient()

      // Exclude computed/mapped fields (phone, tier are mapped)
      const excludeColumns = ['id', 'created_at', 'phone', 'tier']

      const cleanData: Record<string, any> = {}
      for (const [key, value] of Object.entries(data)) {
        if (!excludeColumns.includes(key) && value !== undefined) {
          cleanData[key] = value
        }
      }

      // Add updated timestamp
      cleanData.updated_at = new Date().toISOString()

      console.log('[DataContext] Updating company with:', cleanData)

      const { data: updatedData, error } = await supabase
        .from('companies')
        .update(cleanData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('[DataContext] Update company error:', error)
        return null
      }

      setCompanies((prev) => prev.map((c) => (c.id === id ? { ...c, ...updatedData } : c)))
      return updatedData
    } catch (e) {
      console.error('[DataContext] Update company failed:', e)
      return null
    }
  }, [])

  // Delete a company
  const deleteCompany = useCallback(async (id: string): Promise<boolean> => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('[DataContext] Delete company error:', error)
        return false
      }

      setCompanies((prev) => prev.filter((c) => c.id !== id))
      return true
    } catch (e) {
      console.error('[DataContext] Delete company failed:', e)
      return false
    }
  }, [])

  // Create a development
  const createDevelopment = useCallback(async (data: Partial<Development>): Promise<Development | null> => {
    try {
      const supabase = createClient()
      const { data: newData, error } = await supabase
        .from('developments')
        .insert(data)
        .select('*, company:companies(*)')
        .single()

      if (error) {
        console.error('[DataContext] Create development error:', error)
        return null
      }

      setDevelopments((prev) => [newData, ...prev])
      return newData
    } catch (e) {
      console.error('[DataContext] Create development failed:', e)
      return null
    }
  }, [])

  // Update a development
  const updateDevelopment = useCallback(async (id: string, data: Partial<Development>): Promise<Development | null> => {
    try {
      const supabase = createClient()

      // Exclude computed/mapped fields
      const excludeColumns = ['id', 'created_at']

      const cleanData: Record<string, any> = {}
      for (const [key, value] of Object.entries(data)) {
        if (!excludeColumns.includes(key) && value !== undefined) {
          cleanData[key] = value
        }
      }

      // Add updated timestamp
      cleanData.updated_at = new Date().toISOString()

      console.log('[DataContext] Updating development with:', cleanData)

      const { data: updatedData, error } = await supabase
        .from('developments')
        .update(cleanData)
        .eq('id', id)
        .select('*, company:companies(*)')
        .single()

      if (error) {
        console.error('[DataContext] Update development error:', error)
        return null
      }

      setDevelopments((prev) => prev.map((d) => (d.id === id ? { ...d, ...updatedData } : d)))
      return updatedData
    } catch (e) {
      console.error('[DataContext] Update development failed:', e)
      return null
    }
  }, [])

  // Delete a development
  const deleteDevelopment = useCallback(async (id: string): Promise<boolean> => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('developments')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('[DataContext] Delete development error:', error)
        return false
      }

      setDevelopments((prev) => prev.filter((d) => d.id !== id))
      return true
    } catch (e) {
      console.error('[DataContext] Delete development failed:', e)
      return false
    }
  }, [])

  // Update a finance lead
  const updateFinanceLead = useCallback(async (id: string, data: Partial<FinanceLead>): Promise<FinanceLead | null> => {
    try {
      const supabase = createClient()

      // Exclude computed/mapped fields
      const excludeColumns = ['id', 'created_at']

      const cleanData: Record<string, any> = {}
      for (const [key, value] of Object.entries(data)) {
        if (!excludeColumns.includes(key) && value !== undefined) {
          cleanData[key] = value
        }
      }

      // Add updated timestamp
      cleanData.updated_at = new Date().toISOString()

      console.log('[DataContext] Updating finance lead with:', cleanData)

      const { data: updatedData, error } = await supabase
        .from('finance_leads')
        .update(cleanData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('[DataContext] Update finance lead error:', error)
        return null
      }

      setFinanceLeads((prev) => prev.map((f) => (f.id === id ? { ...f, ...updatedData } : f)))
      return updatedData
    } catch (e) {
      console.error('[DataContext] Update finance lead failed:', e)
      return null
    }
  }, [])

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
        // Lead operations
        updateLead,
        createLead,
        deleteLead,
        assignLead,
        // Campaign operations
        updateCampaign,
        createCampaign,
        deleteCampaign,
        // Company operations
        createCompany,
        updateCompany,
        deleteCompany,
        // Development operations
        createDevelopment,
        updateDevelopment,
        deleteDevelopment,
        // Finance Lead operations
        updateFinanceLead,
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
