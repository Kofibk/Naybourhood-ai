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
  // Borrower operations
  updateFinanceLead: (id: string, data: Partial<FinanceLead>) => Promise<FinanceLead | null>
}

const DataContext = createContext<DataContextType | undefined>(undefined)

// Cache key for sessionStorage
const CACHE_KEY = 'naybourhood_data_cache'
const CACHE_TTL = 5 * 60 * 1000  // 5 minutes

interface CachedData {
  leads: Buyer[]
  campaigns: Campaign[]
  companies: Company[]
  developments: Development[]
  financeLeads: FinanceLead[]
  users: AppUser[]
  timestamp: number
}

// Load cached data from sessionStorage
const loadFromCache = (): CachedData | null => {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY)
    if (cached) {
      const data = JSON.parse(cached) as CachedData
      // Check if cache is still valid (within TTL)
      if (Date.now() - data.timestamp < CACHE_TTL) {
        console.log('[DataContext] Loading from cache')
        return data
      }
    }
  } catch (e) {
    console.warn('[DataContext] Failed to load cache:', e)
  }
  return null
}

// Save data to sessionStorage cache
const saveToCache = (data: Omit<CachedData, 'timestamp'>) => {
  try {
    const cacheData: CachedData = { ...data, timestamp: Date.now() }
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(cacheData))
    console.log('[DataContext] Saved to cache')
  } catch (e) {
    console.warn('[DataContext] Failed to save cache:', e)
  }
}

export function DataProvider({ children }: { children: ReactNode }) {
  // Try to load from cache immediately for faster initial render
  const cachedData = loadFromCache()

  const [leads, setLeads] = useState<Buyer[]>(cachedData?.leads || [])
  const [campaigns, setCampaigns] = useState<Campaign[]>(cachedData?.campaigns || [])
  const [companies, setCompanies] = useState<Company[]>(cachedData?.companies || [])
  const [developments, setDevelopments] = useState<Development[]>(cachedData?.developments || [])
  const [financeLeads, setFinanceLeads] = useState<FinanceLead[]>(cachedData?.financeLeads || [])
  const [users, setUsers] = useState<AppUser[]>(cachedData?.users || [])
  const [isLoading, setIsLoading] = useState(!cachedData)  // Not loading if we have cache
  const [error, setError] = useState<string | null>(null)

  const isConfigured = isSupabaseConfigured()

  const refreshData = useCallback(async () => {
    if (!isConfigured) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)
    const errors: string[] = []

    try {
      const supabase = createClient()

      if (!supabase) {
        console.warn('[DataContext] Supabase client not available')
        setIsLoading(false)
        return
      }

      // Fetch all data in PARALLEL with larger batch sizes for speed
      const [buyersResult, campaignsResult, companiesResult, developmentsResult, financeLeadsResult, usersResult] = await Promise.all([
        // BUYERS - fetch all columns (safer) with larger batch size
        (async () => {
          let allBuyers: any[] = []
          let from = 0
          const batchSize = 2000  // Larger batch = fewer round trips
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

        // CAMPAIGNS - fetch all columns with larger batch size
        (async () => {
          let allCampaigns: any[] = []
          let from = 0
          const batchSize = 2000
          let hasMore = true

          while (hasMore) {
            const { data, error } = await supabase
              .from('campaigns')
              .select('*')
              .range(from, from + batchSize - 1)

            if (error) {
              console.error('[DataContext] Campaigns batch error:', error.message)
              return { error: null, data: [] }
            }
            if (data && data.length > 0) {
              allCampaigns = [...allCampaigns, ...data]
              from += batchSize
              hasMore = data.length === batchSize
            } else {
              hasMore = false
            }
          }
          console.log(`[DataContext] Fetched ${allCampaigns.length} campaign records`)
          return { error: null, data: allCampaigns }
        })(),

        // COMPANIES - typically small dataset
        supabase.from('companies').select('*').order('name', { ascending: true }),

        // DEVELOPMENTS - join company data
        supabase.from('developments').select('*, company:companies(*)'),

        // BORROWERS (finance/mortgage leads)
        supabase.from('borrowers').select('*').order('created_at', { ascending: false }),

        // USER PROFILES
        supabase.from('user_profiles').select('*').order('first_name', { ascending: true }),
      ])

      // Track processed data for caching
      let processedLeads: Buyer[] = []
      let processedCampaigns: Campaign[] = []
      let processedCompanies: Company[] = []
      let processedDevelopments: Development[] = []
      let processedFinanceLeads: FinanceLead[] = []
      let processedUsers: AppUser[] = []

      // Process BUYERS
      console.log(`[DataContext] Raw buyers fetched: ${buyersResult?.length || 0}`)
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
          campaign: b.campaign || b.source_campaign || b['Source Campaign'] || b['source campaign'],
          campaign_id: b.campaign_id,
          source_campaign: b.source_campaign || b['Source Campaign'] || b['source campaign'],
          development_id: b.development_id,
          development_name: b.development_name || b.development || b['Development'] || b['development'],
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
        setLeads(mappedBuyers)
        processedLeads = mappedBuyers
        console.log(`[DataContext] Processed buyers: ${mappedBuyers.length}`)
      }

      // Process CAMPAIGNS - aggregate ad-level data into campaign-level insights
      if (!campaignsResult.error && campaignsResult.data) {
        // Parse values as numbers in case they're stored as strings
        const parseNumber = (val: any): number => {
          if (val === null || val === undefined) return 0
          if (typeof val === 'number') return val
          if (typeof val === 'string') {
            const cleaned = val.replace(/[£$€,\s]/g, '')
            const parsed = parseFloat(cleaned)
            return isNaN(parsed) ? 0 : parsed
          }
          return 0
        }

        // Aggregate ad-level data by campaign_name for insights
        // Each row in Supabase is at ad-level, we aggregate to campaign-level
        const campaignAggregates = new Map<string, {
          id: string
          name: string
          company_id?: string
          development_id?: string
          platform: string
          status: string
          totalSpend: number
          totalLeads: number
          totalImpressions: number
          totalClicks: number
          totalReach: number
          adCount: number
          dates: string[]
          adSets: Set<string>
          ads: any[]
        }>()

        // First pass: aggregate all ad-level data by campaign name
        for (const c of campaignsResult.data) {
          const campaignName = c.campaign_name || c.name || 'Unnamed Campaign'
          const existing = campaignAggregates.get(campaignName)

          const spend = parseNumber(c.total_spent ?? c.spend ?? 0)
          const leads = parseNumber(c.number_of_leads ?? c.leads ?? 0)
          const impressions = parseNumber(c.impressions ?? 0)
          const clicks = parseNumber(c.link_clicks ?? c.clicks ?? 0)
          const reach = parseNumber(c.reach ?? 0)

          if (existing) {
            existing.totalSpend += spend
            existing.totalLeads += leads
            existing.totalImpressions += impressions
            existing.totalClicks += clicks
            existing.totalReach += reach
            existing.adCount += 1
            if (c.date) existing.dates.push(c.date)
            if (c.ad_set_name) existing.adSets.add(c.ad_set_name)
            // Keep reference to individual ads for drill-down
            existing.ads.push({
              id: c.id,
              ad_name: c.ad_name,
              ad_set_name: c.ad_set_name,
              spend,
              leads,
              impressions,
              clicks,
              date: c.date,
              status: c.delivery_status,
            })
          } else {
            campaignAggregates.set(campaignName, {
              id: c.id, // Use first ad's ID as campaign ID
              name: campaignName,
              company_id: c.company_id ?? undefined,
              development_id: c.development_id ?? undefined,
              platform: c.platform || 'Meta',
              status: c.delivery_status || c.status || 'active',
              totalSpend: spend,
              totalLeads: leads,
              totalImpressions: impressions,
              totalClicks: clicks,
              totalReach: reach,
              adCount: 1,
              dates: c.date ? [c.date] : [],
              adSets: new Set(c.ad_set_name ? [c.ad_set_name] : []),
              ads: [{
                id: c.id,
                ad_name: c.ad_name,
                ad_set_name: c.ad_set_name,
                spend,
                leads,
                impressions,
                clicks,
                date: c.date,
                status: c.delivery_status,
              }],
            })
          }
        }

        // Convert aggregates to campaign objects
        const aggregatedCampaigns = Array.from(campaignAggregates.values()).map(agg => {
          const cpl = agg.totalLeads > 0 ? agg.totalSpend / agg.totalLeads : 0
          const ctr = agg.totalImpressions > 0 ? (agg.totalClicks / agg.totalImpressions) * 100 : 0
          const cpc = agg.totalClicks > 0 ? agg.totalSpend / agg.totalClicks : 0
          const cpm = agg.totalImpressions > 0 ? (agg.totalSpend / agg.totalImpressions) * 1000 : 0

          // Sort dates to get date range
          const sortedDates = agg.dates.sort()
          const startDate = sortedDates[0]
          const endDate = sortedDates[sortedDates.length - 1]

          return {
            id: agg.id,
            name: agg.name,
            campaign_name: agg.name,
            company_id: agg.company_id,
            development_id: agg.development_id,
            platform: agg.platform,
            status: agg.status,
            // Aggregated metrics
            spend: Math.round(agg.totalSpend * 100) / 100,
            leads: agg.totalLeads,
            cpl: Math.round(cpl * 100) / 100,
            impressions: agg.totalImpressions,
            clicks: agg.totalClicks,
            ctr: Math.round(ctr * 100) / 100,
            reach: agg.totalReach,
            cpc: Math.round(cpc * 100) / 100,
            cpm: Math.round(cpm * 100) / 100,
            // Meta information
            ad_count: agg.adCount,
            ad_set_count: agg.adSets.size,
            start_date: startDate,
            end_date: endDate,
            created_at: startDate,
            // Keep ads for drill-down if needed
            ads: agg.ads,
          }
        })

        // Sort by spend (highest first) for insights
        aggregatedCampaigns.sort((a, b) => b.spend - a.spend)

        setCampaigns(aggregatedCampaigns)
        processedCampaigns = aggregatedCampaigns
        console.log(`[DataContext] Campaigns aggregated: ${campaignsResult.data.length} ads → ${aggregatedCampaigns.length} campaigns`)
      }

      // Process COMPANIES
      if (!companiesResult.error && companiesResult.data) {
        const mappedCompanies = companiesResult.data.map((c: any) => ({
          ...c,
          phone: c.contact_phone,
          tier: c.subscription_tier,
        }))
        setCompanies(mappedCompanies)
        processedCompanies = mappedCompanies
      } else if (companiesResult.error) {
        errors.push(`Companies: ${companiesResult.error.message}`)
      }

      // Process DEVELOPMENTS
      if (!developmentsResult.error && developmentsResult.data) {
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
        processedDevelopments = mappedDevelopments
      }
      // If developments table doesn't exist yet, silently continue

      // Process BORROWERS
      if (!financeLeadsResult.error && financeLeadsResult.data) {
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
        processedFinanceLeads = mappedFinanceLeads
        console.log(`[DataContext] Processed borrowers: ${mappedFinanceLeads.length}`)
      }
      // If borrowers table doesn't exist yet, silently continue

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

        // Build full name from first_name + last_name (user_profiles schema)
        const firstName = p.first_name || ''
        const lastName = p.last_name || ''
        const fullName = `${firstName} ${lastName}`.trim() || p.full_name || p.email || 'Unknown'

        return {
          id: p.id,
          name: fullName,
          email: p.email || '',
          role: p.user_type || p.role || 'developer',
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
        setUsers(mappedUsers)
        processedUsers = mappedUsers
        usersLoaded = true
      }

      // If direct query failed or returned empty, try API fallback (for Quick Access users)
      if (!usersLoaded) {
        try {
          const response = await fetch('/api/users/invite?demo=true')
          if (response.ok) {
            const data = await response.json()
            if (data.users && data.users.length > 0) {
              const mappedUsers = data.users.map(mapProfileToUser)
              setUsers(mappedUsers)
              processedUsers = mappedUsers
              usersLoaded = true
            }
          }
        } catch {
          // API fallback failed, continue with empty users
        }
      }

      if (!usersLoaded) {
        setUsers([])
      }

      if (errors.length > 0) {
        setError(errors.join('; '))
      }

      // Save to cache for faster subsequent loads
      saveToCache({
        leads: processedLeads,
        campaigns: processedCampaigns,
        companies: processedCompanies,
        developments: processedDevelopments,
        financeLeads: processedFinanceLeads,
        users: processedUsers,
      })
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

      // Exclude computed/joined fields that don't exist in Supabase
      const excludeColumns = ['id', 'created_at', 'company', 'developmentData', 'cpl', 'updated_at']

      // Map app field names to Supabase column names
      const fieldMapping: Record<string, string> = {
        name: 'campaign_name',
        spend: 'total_spent',
        leads: 'number_of_leads',
        status: 'delivery_status',
      }

      const cleanData: Record<string, any> = {}
      for (const [key, value] of Object.entries(data)) {
        if (!excludeColumns.includes(key) && value !== undefined) {
          // Use mapped field name if it exists, otherwise use original
          const dbFieldName = fieldMapping[key] || key
          cleanData[dbFieldName] = value
        }
      }

      const { data: updatedData, error } = await supabase
        .from('campaigns')
        .update(cleanData)
        .eq('id', id)
        .select('*, company:companies(*), developmentData:developments(*)')
        .single()

      if (error) {
        console.error('[DataContext] Update campaign error:', error)
        toast.error('Failed to update campaign', { description: error.message })
        return null
      }

      // Map the returned data back to app field names
      const mappedData = {
        ...updatedData,
        name: updatedData.campaign_name ?? updatedData.name,
        spend: updatedData.total_spent ?? updatedData.spend ?? 0,
        leads: updatedData.number_of_leads ?? updatedData.leads ?? 0,
        status: updatedData.delivery_status ?? updatedData.status,
      }

      setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, ...mappedData } : c)))
      toast.success('Campaign updated')
      return mappedData
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
        fetch('/api/ai/score-buyer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ buyerId: newData.id }),
        })
          .then(async (res) => {
            if (res.ok) {
              const scoreResult = await res.json()
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
          .catch(() => {
            // Auto-score failed silently - not critical
          })
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

      // Map app field names to Supabase column names
      const fieldMapping: Record<string, string> = {
        name: 'campaign_name',
        spend: 'total_spent',
        leads: 'number_of_leads',
        status: 'delivery_status',
      }

      // Exclude computed fields that don't exist in Supabase
      const excludeColumns = ['cpl', 'created_at', 'updated_at', 'company', 'developmentData']

      const cleanData: Record<string, any> = {}
      for (const [key, value] of Object.entries(data)) {
        if (!excludeColumns.includes(key) && value !== undefined) {
          const dbFieldName = fieldMapping[key] || key
          cleanData[dbFieldName] = value
        }
      }

      // Generate ID if not provided (Supabase expects text id)
      if (!cleanData.id) {
        cleanData.id = crypto.randomUUID()
      }

      // Set date if not provided
      if (!cleanData.date) {
        cleanData.date = new Date().toISOString().split('T')[0]
      }

      const { data: newData, error } = await supabase
        .from('campaigns')
        .insert(cleanData)
        .select('*, company:companies(*), developmentData:developments(*)')
        .single()

      if (error) {
        console.error('[DataContext] Create campaign error:', error)
        toast.error('Failed to create campaign', { description: error.message })
        return null
      }

      // Map returned data back to app field names
      const mappedData = {
        ...newData,
        name: newData.campaign_name ?? newData.name,
        spend: newData.total_spent ?? newData.spend ?? 0,
        leads: newData.number_of_leads ?? newData.leads ?? 0,
        status: newData.delivery_status ?? newData.status,
        created_at: newData.date,
      }

      setCampaigns((prev) => [mappedData, ...prev])
      toast.success('Campaign created')
      return mappedData
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

  // Update a borrower
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

      const { data: updatedData, error } = await supabase
        .from('borrowers')
        .update(cleanData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('[DataContext] Update borrower error:', error)
        return null
      }

      setFinanceLeads((prev) => prev.map((f) => (f.id === id ? { ...f, ...updatedData } : f)))
      return updatedData
    } catch (e) {
      console.error('[DataContext] Update borrower failed:', e)
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
        // Borrower operations
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
