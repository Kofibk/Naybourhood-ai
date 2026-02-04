'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Buyer, Campaign, Company, Development, AppUser, FinanceLead } from '@/types'
import { perf } from '@/lib/performance'

// Cache keys for localStorage
const CACHE_KEYS = {
  leads: 'naybourhood_cache_leads',
  campaigns: 'naybourhood_cache_campaigns',
  companies: 'naybourhood_cache_companies',
  developments: 'naybourhood_cache_developments',
  financeLeads: 'naybourhood_cache_financeLeads',
  users: 'naybourhood_cache_users',
  timestamp: 'naybourhood_cache_timestamp',
}

// Cache expiry time (30 minutes)
const CACHE_EXPIRY_MS = 30 * 60 * 1000

interface DataContextType {
  leads: Buyer[]
  campaigns: Campaign[]
  companies: Company[]
  developments: Development[]
  financeLeads: FinanceLead[]
  users: AppUser[]
  isLoading: boolean
  isSyncing: boolean  // New: true when refreshing in background
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

// Helper to safely parse JSON from localStorage
function safeJsonParse<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key)
    if (!item) return fallback
    return JSON.parse(item) as T
  } catch {
    return fallback
  }
}

// Helper to safely save to localStorage
function safeJsonSave(key: string, data: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (e) {
    console.warn('[DataContext] Failed to save to cache:', e)
  }
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [leads, setLeads] = useState<Buyer[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [developments, setDevelopments] = useState<Development[]>([])
  const [financeLeads, setFinanceLeads] = useState<FinanceLead[]>([])
  const [users, setUsers] = useState<AppUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const cacheLoaded = useRef(false)
  const hasDataRef = useRef(false)  // Track if we have data (for closure safety)

  const isConfigured = isSupabaseConfigured()

  // Load data from cache instantly on mount
  useEffect(() => {
    if (cacheLoaded.current) return
    cacheLoaded.current = true

    const loadFromCache = () => {
      const timestamp = safeJsonParse<number>(CACHE_KEYS.timestamp, 0)
      const now = Date.now()

      // Check if cache exists and is not expired
      if (timestamp > 0 && (now - timestamp) < CACHE_EXPIRY_MS) {
        console.log('[DataContext] Loading from cache (instant load)')

        const cachedLeads = safeJsonParse<Buyer[]>(CACHE_KEYS.leads, [])
        const cachedCampaigns = safeJsonParse<Campaign[]>(CACHE_KEYS.campaigns, [])
        const cachedCompanies = safeJsonParse<Company[]>(CACHE_KEYS.companies, [])
        const cachedDevelopments = safeJsonParse<Development[]>(CACHE_KEYS.developments, [])
        const cachedFinanceLeads = safeJsonParse<FinanceLead[]>(CACHE_KEYS.financeLeads, [])
        const cachedUsers = safeJsonParse<AppUser[]>(CACHE_KEYS.users, [])

        // Set cached data instantly
        if (cachedLeads.length > 0) setLeads(cachedLeads)
        if (cachedCampaigns.length > 0) setCampaigns(cachedCampaigns)
        if (cachedCompanies.length > 0) setCompanies(cachedCompanies)
        if (cachedDevelopments.length > 0) setDevelopments(cachedDevelopments)
        if (cachedFinanceLeads.length > 0) setFinanceLeads(cachedFinanceLeads)
        if (cachedUsers.length > 0) setUsers(cachedUsers)

        // If we have cached data, don't show loading spinner
        // Include financeLeads for broker dashboards
        if (cachedLeads.length > 0 || cachedCampaigns.length > 0 || cachedFinanceLeads.length > 0) {
          setIsLoading(false)
          hasDataRef.current = true  // Mark that we have data loaded
          console.log(`[DataContext] Cache loaded: ${cachedLeads.length} leads, ${cachedCampaigns.length} campaigns, ${cachedFinanceLeads.length} borrowers`)
        }

        return true // Cache was loaded
      }

      return false // No valid cache
    }

    loadFromCache()
  }, [])

  // Save current data to cache
  const saveToCache = useCallback(() => {
    console.log('[DataContext] Saving to cache')
    safeJsonSave(CACHE_KEYS.leads, leads)
    safeJsonSave(CACHE_KEYS.campaigns, campaigns)
    safeJsonSave(CACHE_KEYS.companies, companies)
    safeJsonSave(CACHE_KEYS.developments, developments)
    safeJsonSave(CACHE_KEYS.financeLeads, financeLeads)
    safeJsonSave(CACHE_KEYS.users, users)
    safeJsonSave(CACHE_KEYS.timestamp, Date.now())
  }, [leads, campaigns, companies, developments, financeLeads, users])

  const refreshData = useCallback(async () => {
    if (!isConfigured) {
      setIsLoading(false)
      return
    }

    // If we already have data (from cache), show syncing indicator instead of full loading
    // Use ref to avoid stale closure values
    if (hasDataRef.current) {
      setIsSyncing(true)
    } else {
      setIsLoading(true)
    }
    setError(null)
    const errors: string[] = []

    // Start performance tracking
    perf.clear()
    perf.setContext('DataContext')
    perf.start('total_refresh')

    try {
      const supabase = createClient()

      if (!supabase) {
        console.warn('[DataContext] Supabase client not available')
        setIsLoading(false)
        return
      }

      perf.start('parallel_fetches')
      // Fetch all data in PARALLEL
      const [buyersResult, campaignsResult, companiesResult, developmentsResult, financeLeadsResult, usersResult] = await Promise.all([
        // BUYERS - fetch all with pagination
        (async () => {
          const fetchStart = performance.now()
          let allBuyers: any[] = []
          let from = 0
          const batchSize = 1000
          let hasMore = true
          let batchCount = 0

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
              batchCount++
            } else {
              hasMore = false
            }
          }
          console.log(`[PERF] [DataContext] 🟢 buyers: ${(performance.now() - fetchStart).toFixed(0)}ms (${allBuyers.length} items, ${batchCount} batches)`)
          return allBuyers
        })(),

        // CAMPAIGNS - fetch all with pagination (data is at ad-level, will aggregate by campaign)
        (async () => {
          const fetchStart = performance.now()
          let allCampaigns: any[] = []
          let from = 0
          const batchSize = 1000
          let hasMore = true
          let batchCount = 0

          while (hasMore) {
            // Simple query without joins - joins may fail if FK not set up
            const { data, error } = await supabase
              .from('campaigns')
              .select('*')
              .range(from, from + batchSize - 1)

            if (error) {
              console.error('[DataContext] Campaigns batch error:', error.message)
              // Don't fail completely - return empty array so other data still loads
              return { error: null, data: [] }
            }
            if (data && data.length > 0) {
              allCampaigns = [...allCampaigns, ...data]
              from += batchSize
              hasMore = data.length === batchSize
              batchCount++
            } else {
              hasMore = false
            }
          }
          console.log(`[PERF] [DataContext] 🟢 campaigns: ${(performance.now() - fetchStart).toFixed(0)}ms (${allCampaigns.length} items, ${batchCount} batches)`)
          return { error: null, data: allCampaigns }
        })(),

        // COMPANIES
        (async () => {
          const fetchStart = performance.now()
          const result = await supabase.from('companies').select('*').order('name', { ascending: true })
          console.log(`[PERF] [DataContext] 🟢 companies: ${(performance.now() - fetchStart).toFixed(0)}ms (${result.data?.length || 0} items)`)
          return result
        })(),

        // DEVELOPMENTS - join company data
        (async () => {
          const fetchStart = performance.now()
          const result = await supabase.from('developments').select('*, company:companies(*)')
          console.log(`[PERF] [DataContext] 🟢 developments: ${(performance.now() - fetchStart).toFixed(0)}ms (${result.data?.length || 0} items)`)
          return result
        })(),

        // BORROWERS (finance/mortgage leads)
        (async () => {
          const fetchStart = performance.now()
          const result = await supabase.from('borrowers').select('*').order('created_at', { ascending: false })
          console.log(`[PERF] [DataContext] 🟢 borrowers: ${(performance.now() - fetchStart).toFixed(0)}ms (${result.data?.length || 0} items)`)
          return result
        })(),

        // USER PROFILES
        (async () => {
          const fetchStart = performance.now()
          const result = await supabase.from('user_profiles').select('*').order('first_name', { ascending: true })
          console.log(`[PERF] [DataContext] 🟢 user_profiles: ${(performance.now() - fetchStart).toFixed(0)}ms (${result.data?.length || 0} items)`)
          return result
        })(),
      ])
      
      perf.end('parallel_fetches', { 
        buyers: Array.isArray(buyersResult) ? buyersResult.length : 0,
        campaigns: campaignsResult.data?.length || 0,
        companies: companiesResult.data?.length || 0,
        developments: developmentsResult.data?.length || 0,
        borrowers: financeLeadsResult.data?.length || 0,
        users: usersResult.data?.length || 0,
      })

      // Process BUYERS
      perf.start('process_buyers')
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
      }
      perf.end('process_buyers', { count: leads.length })

      // Process CAMPAIGNS - aggregate ad-level data into campaign-level insights
      perf.start('process_campaigns')
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
        console.log(`[DataContext] Campaigns aggregated: ${campaignsResult.data.length} ads → ${aggregatedCampaigns.length} campaigns`)
      }
      perf.end('process_campaigns')

      // Process COMPANIES
      if (!companiesResult.error && companiesResult.data) {
        const mappedCompanies = companiesResult.data.map((c: any) => ({
          ...c,
          phone: c.contact_phone,
          tier: c.subscription_tier,
        }))
        setCompanies(mappedCompanies)
      } else if (companiesResult.error) {
        errors.push(`Companies: ${companiesResult.error.message}`)
      }

      // Process DEVELOPMENTS
      if (!developmentsResult.error && developmentsResult.data) {
        // DEBUG: Log raw development data to understand missing units issue
        console.log('[DEBUG] [Developments] Raw data from Supabase:', developmentsResult.data.length, 'developments')
        console.log('[DEBUG] [Developments] Sample raw data (first 3):', developmentsResult.data.slice(0, 3).map((d: any) => ({
          id: d.id,
          name: d.name,
          total_units: d.total_units,
          units: d.units,
          available_units: d.available_units,
          'Total Units (alt)': d['Total Units'],
          'Units (alt)': d['Units'],
          'Available Units (alt)': d['Available Units'],
        })))
        
        // Check how many have unit data
        const withTotalUnits = developmentsResult.data.filter((d: any) => d.total_units !== null && d.total_units !== undefined).length
        const withUnits = developmentsResult.data.filter((d: any) => d.units !== null && d.units !== undefined).length
        const withAvailable = developmentsResult.data.filter((d: any) => d.available_units !== null && d.available_units !== undefined).length
        console.log('[DEBUG] [Developments] Unit data counts:', {
          total: developmentsResult.data.length,
          withTotalUnits,
          withUnits,
          withAvailable,
          missingAll: developmentsResult.data.filter((d: any) => !d.total_units && !d.units).length
        })
        
        // Map column names (supports both Supabase schema names and imported CSV names)
        // NOTE: Spread ...d FIRST so mapped values take precedence over null database values
        const mappedDevelopments = developmentsResult.data.map((d: any) => ({
          ...d, // Spread original data FIRST so explicit mappings override null values
          id: d.id,
          name: d.name || d['Development Name'] || d['development_name'] || 'Unnamed',
          location: d.location || d['Location'] || d['area'],
          address: d.address || d['Address'],
          developer: d.developer || d['Developer'] || d['developer_name'],
          status: d.status || d['Status'] || 'Active',
          // Use nullish coalescing (??) instead of || to preserve 0 values
          units: d.units ?? d['Units'] ?? d['total_units'] ?? null,
          total_units: d.total_units ?? d['Total Units'] ?? d['units'] ?? null,
          available_units: d.available_units ?? d['Available Units'] ?? null,
          price_from: d.price_from || d['Price From'] || d['min_price'],
          price_to: d.price_to || d['Price To'] || d['max_price'],
          completion_date: d.completion_date || d['Completion Date'],
          description: d.description || d['Description'],
          image_url: d.image_url || d['Image URL'] || d['image'],
          total_leads: d.total_leads ?? d['Total Leads'] ?? 0,
          ad_spend: d.ad_spend ?? d['Ad Spend'] ?? d['total_spend'] ?? d['Total Spend'] ?? 0,
          // PDF and document attachments
          brochure_url: d.brochure_url || d['Brochure URL'] || d['brochure'],
          floor_plan_url: d.floor_plan_url || d['Floor Plan URL'] || d['floor_plan'],
          price_list_url: d.price_list_url || d['Price List URL'] || d['price_list'],
          attachments: d.attachments || d['Attachments'] || [],
          created_at: d.created_at,
          updated_at: d.updated_at,
        }))
        
        // DEBUG: Log mapped data to verify transformations
        console.log('[DEBUG] [Developments] Mapped data (first 3):', mappedDevelopments.slice(0, 3).map((d: any) => ({
          id: d.id,
          name: d.name,
          total_units: d.total_units,
          units: d.units,
          available_units: d.available_units,
        })))
        
        setDevelopments(mappedDevelopments)
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
        } else if (p.membership_status === 'active') {
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
        // DEBUG: Log raw user profiles from database
        console.log('[DataContext] 📋 Raw user_profiles from DB:', usersResult.data.map((p: any) => ({
          id: p.id,
          email: p.email,
          membership_status: p.membership_status,
          onboarding_completed: p.onboarding_completed,
          last_active: p.last_active,
        })))
        
        const mappedUsers = usersResult.data.map(mapProfileToUser)
        
        // DEBUG: Log mapped users with computed status
        console.log('[DataContext] 👥 Mapped users with computed status:', mappedUsers.map((u: AppUser) => ({
          id: u.id,
          email: u.email,
          computedStatus: u.status,
        })))
        
        setUsers(mappedUsers)
        usersLoaded = true
      } else if (usersResult.error) {
        console.error('[DataContext] ❌ Error fetching user_profiles:', usersResult.error)
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
    } catch (err) {
      console.error('[DataContext] Error:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      perf.end('total_refresh')
      perf.report()
      setIsLoading(false)
      setIsSyncing(false)
      hasDataRef.current = true  // Mark that we have data after first successful fetch
    }
  // Note: We intentionally exclude leads/campaigns from deps to prevent infinite loops
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConfigured])

  // Save to cache whenever data changes (after initial load)
  useEffect(() => {
    // Only save to cache if we have data (not on initial empty state)
    if (leads.length > 0 || campaigns.length > 0) {
      saveToCache()
    }
  }, [leads, campaigns, companies, developments, financeLeads, users, saveToCache])

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
        isSyncing,
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
