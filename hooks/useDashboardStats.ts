'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface BuyerStats {
  total_leads: number
  hot_leads: number
  qualified: number
  needs_qualification: number
  nurture: number
  low_priority: number
  avg_score: number
  contact_pending: number
  in_progress: number
  qualified_status: number
  viewing_booked: number
  converted: number
  last_24h: number
  last_7d: number
  last_30d: number
}

interface BorrowerStats {
  total_leads: number
  contact_pending: number
  follow_up: number
  awaiting_docs: number
  completed: number
  not_proceeding: number
  total_loan_amount: number
  avg_loan_amount: number
  last_24h: number
  last_7d: number
  last_30d: number
}

interface CampaignStats {
  total_campaigns: number
  total_spend: number
  total_leads: number
  total_impressions: number
  total_clicks: number
  avg_cpl: number
  avg_ctr: number
}

interface RecentLead {
  id: string
  full_name: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  status?: string
  ai_quality_score?: number
  ai_classification?: string
  ai_summary?: string
  budget_range?: string
  finance_type?: string
  loan_amount?: number
  company_id?: string
  created_at?: string
  date_added?: string
}

interface TopCampaign {
  campaign_name: string
  development_name?: string
  spend: number
  leads: number
  cpl: number
  impressions: number
  clicks: number
  ctr: number
}

interface DashboardData {
  stats: {
    buyers?: BuyerStats
    campaigns?: CampaignStats
    borrowers?: BorrowerStats
  }
  recentLeads: RecentLead[]
  topCampaigns: TopCampaign[]
  loadTimeMs: number
}

const CACHE_KEY = 'naybourhood_dashboard_cache'
const CACHE_EXPIRY = 30 * 1000 // 30 seconds

export function useDashboardStats(
  userType: 'developer' | 'agent' | 'broker' | 'admin',
  companyId?: string,
  companyName?: string
) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fetchedRef = useRef(false)

  const fetchStats = useCallback(async (background = false) => {
    if (background) {
      setIsSyncing(true)
    } else {
      setIsLoading(true)
    }

    try {
      const params = new URLSearchParams()
      params.set('user_type', userType)
      if (companyId) params.set('company_id', companyId)
      if (companyName) params.set('company_name', companyName)

      const response = await fetch(`/api/dashboard/stats?${params.toString()}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`)
      }

      const result = await response.json()

      // Transform based on user type
      const dashboardData: DashboardData = {
        stats: userType === 'broker'
          ? { borrowers: result.stats }
          : { buyers: result.stats?.buyers, campaigns: result.stats?.campaigns },
        recentLeads: result.recentLeads || [],
        topCampaigns: result.topCampaigns || [],
        loadTimeMs: result.loadTimeMs || 0
      }

      setData(dashboardData)
      setError(null)

      // Cache the data
      try {
        localStorage.setItem(CACHE_KEY + '_' + userType, JSON.stringify({
          data: dashboardData,
          timestamp: Date.now()
        }))
      } catch { /* ignore cache errors */ }

      console.log(`[Dashboard] Loaded in ${result.loadTimeMs}ms`)

    } catch (err) {
      console.error('[Dashboard] Fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch')
    } finally {
      setIsLoading(false)
      setIsSyncing(false)
    }
  }, [userType, companyId, companyName])

  // Load from cache immediately, then fetch fresh data
  useEffect(() => {
    if (fetchedRef.current) return
    fetchedRef.current = true

    // Try to load from cache first
    try {
      const cached = localStorage.getItem(CACHE_KEY + '_' + userType)
      if (cached) {
        const { data: cachedData, timestamp } = JSON.parse(cached)
        const age = Date.now() - timestamp

        if (age < CACHE_EXPIRY && cachedData) {
          console.log('[Dashboard] Loaded from cache (instant)')
          setData(cachedData)
          setIsLoading(false)
          // Fetch fresh data in background
          fetchStats(true)
          return
        }
      }
    } catch { /* ignore cache errors */ }

    // No valid cache, fetch fresh
    fetchStats(false)
  }, [userType, fetchStats])

  const refresh = useCallback(() => {
    fetchStats(data ? true : false)
  }, [fetchStats, data])

  return {
    data,
    stats: data?.stats,
    recentLeads: data?.recentLeads || [],
    topCampaigns: data?.topCampaigns || [],
    isLoading,
    isSyncing,
    error,
    refresh,
    loadTimeMs: data?.loadTimeMs || 0
  }
}
