'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Campaign } from '@/types'

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

async function fetchCampaigns(): Promise<Campaign[]> {
  if (!isSupabaseConfigured()) return []

  const supabase = createClient()
  if (!supabase) return []

  // Fetch all with pagination (data is at ad-level)
  let allCampaigns: any[] = []
  let from = 0
  const batchSize = 1000
  let hasMore = true

  while (hasMore) {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .range(from, from + batchSize - 1)

    if (error) {
      console.error('[useCampaigns] Fetch error:', error.message)
      return []
    }
    if (data && data.length > 0) {
      allCampaigns = [...allCampaigns, ...data]
      from += batchSize
      hasMore = data.length === batchSize
    } else {
      hasMore = false
    }
  }

  // Aggregate ad-level data by campaign_name
  const campaignAggregates = new Map<string, {
    id: string; name: string; company_id?: string; development_id?: string
    platform: string; status: string; totalSpend: number; totalLeads: number
    totalImpressions: number; totalClicks: number; totalReach: number
    adCount: number; dates: string[]; adSets: Set<string>; ads: any[]
  }>()

  for (const c of allCampaigns) {
    const campaignName = c.campaign_name || c.name || 'Unnamed Campaign'
    const existing = campaignAggregates.get(campaignName)

    const spend = parseNumber(c.total_spent ?? c.spend ?? 0)
    const leads = parseNumber(c.number_of_leads ?? c.leads ?? 0)
    const impressions = parseNumber(c.impressions ?? 0)
    const clicks = parseNumber(c.link_clicks ?? c.clicks ?? 0)
    const reach = parseNumber(c.reach ?? 0)

    const adEntry = {
      id: c.id, ad_name: c.ad_name, ad_set_name: c.ad_set_name,
      spend, leads, impressions, clicks, date: c.date, status: c.delivery_status,
    }

    if (existing) {
      existing.totalSpend += spend
      existing.totalLeads += leads
      existing.totalImpressions += impressions
      existing.totalClicks += clicks
      existing.totalReach += reach
      existing.adCount += 1
      if (c.date) existing.dates.push(c.date)
      if (c.ad_set_name) existing.adSets.add(c.ad_set_name)
      existing.ads.push(adEntry)
    } else {
      campaignAggregates.set(campaignName, {
        id: c.id, name: campaignName,
        company_id: c.company_id ?? undefined,
        development_id: c.development_id ?? undefined,
        platform: c.platform || 'Meta',
        status: c.delivery_status || c.status || 'active',
        totalSpend: spend, totalLeads: leads, totalImpressions: impressions,
        totalClicks: clicks, totalReach: reach, adCount: 1,
        dates: c.date ? [c.date] : [],
        adSets: new Set(c.ad_set_name ? [c.ad_set_name] : []),
        ads: [adEntry],
      })
    }
  }

  const aggregated = Array.from(campaignAggregates.values()).map(agg => {
    const cpl = agg.totalLeads > 0 ? agg.totalSpend / agg.totalLeads : 0
    const ctr = agg.totalImpressions > 0 ? (agg.totalClicks / agg.totalImpressions) * 100 : 0
    const cpc = agg.totalClicks > 0 ? agg.totalSpend / agg.totalClicks : 0
    const cpm = agg.totalImpressions > 0 ? (agg.totalSpend / agg.totalImpressions) * 1000 : 0
    const sortedDates = agg.dates.sort()

    return {
      id: agg.id, name: agg.name, campaign_name: agg.name,
      company_id: agg.company_id, development_id: agg.development_id,
      platform: agg.platform, status: agg.status,
      spend: Math.round(agg.totalSpend * 100) / 100,
      leads: agg.totalLeads,
      cpl: Math.round(cpl * 100) / 100,
      impressions: agg.totalImpressions,
      clicks: agg.totalClicks,
      ctr: Math.round(ctr * 100) / 100,
      reach: agg.totalReach,
      cpc: Math.round(cpc * 100) / 100,
      cpm: Math.round(cpm * 100) / 100,
      ad_count: agg.adCount,
      ad_set_count: agg.adSets.size,
      start_date: sortedDates[0],
      end_date: sortedDates[sortedDates.length - 1],
      created_at: sortedDates[0],
      ads: agg.ads,
    }
  })

  aggregated.sort((a, b) => (b.spend ?? 0) - (a.spend ?? 0))
  return aggregated as Campaign[]
}

export function useCampaigns() {
  const queryClient = useQueryClient()

  const { data: campaigns = [], isLoading, error, refetch } = useQuery<Campaign[], Error>({
    queryKey: ['campaigns'],
    queryFn: fetchCampaigns,
  })

  const updateCampaignMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Campaign> }) => {
      const supabase = createClient()
      const excludeColumns = ['id', 'created_at', 'company', 'developmentData', 'cpl', 'updated_at']
      const fieldMapping: Record<string, string> = {
        name: 'campaign_name', spend: 'total_spent', leads: 'number_of_leads', status: 'delivery_status',
      }

      const cleanData: Record<string, any> = {}
      for (const [key, value] of Object.entries(data)) {
        if (!excludeColumns.includes(key) && value !== undefined) {
          cleanData[fieldMapping[key] || key] = value
        }
      }

      const { data: updatedData, error } = await supabase
        .from('campaigns')
        .update(cleanData)
        .eq('id', id)
        .select('*, company:companies(*), developmentData:developments(*)')
        .single()

      if (error) throw error

      return {
        id,
        updatedData: {
          ...updatedData,
          name: updatedData.campaign_name ?? updatedData.name,
          spend: updatedData.total_spent ?? updatedData.spend ?? 0,
          leads: updatedData.number_of_leads ?? updatedData.leads ?? 0,
          status: updatedData.delivery_status ?? updatedData.status,
        },
      }
    },
    onSuccess: ({ id, updatedData }) => {
      queryClient.setQueryData<Campaign[]>(['campaigns'], (old) =>
        old?.map((c) => (c.id === id ? { ...c, ...updatedData } : c)) ?? []
      )
      toast.success('Campaign updated')
    },
    onError: (error: any) => {
      console.error('[useCampaigns] Update error:', error)
      toast.error('Failed to update campaign', { description: error.message })
    },
  })

  const createCampaignMutation = useMutation({
    mutationFn: async (data: Partial<Campaign>) => {
      const supabase = createClient()
      const fieldMapping: Record<string, string> = {
        name: 'campaign_name', spend: 'total_spent', leads: 'number_of_leads', status: 'delivery_status',
      }
      const excludeColumns = ['cpl', 'created_at', 'updated_at', 'company', 'developmentData']

      const cleanData: Record<string, any> = {}
      for (const [key, value] of Object.entries(data)) {
        if (!excludeColumns.includes(key) && value !== undefined) {
          cleanData[fieldMapping[key] || key] = value
        }
      }
      if (!cleanData.id) cleanData.id = crypto.randomUUID()
      if (!cleanData.date) cleanData.date = new Date().toISOString().split('T')[0]

      const { data: newData, error } = await supabase
        .from('campaigns')
        .insert(cleanData)
        .select('*, company:companies(*), developmentData:developments(*)')
        .single()

      if (error) throw error

      return {
        ...newData,
        name: newData.campaign_name ?? newData.name,
        spend: newData.total_spent ?? newData.spend ?? 0,
        leads: newData.number_of_leads ?? newData.leads ?? 0,
        status: newData.delivery_status ?? newData.status,
        created_at: newData.date,
      }
    },
    onSuccess: (newData) => {
      queryClient.setQueryData<Campaign[]>(['campaigns'], (old) => [newData, ...(old ?? [])])
      toast.success('Campaign created')
    },
    onError: (error: any) => {
      console.error('[useCampaigns] Create error:', error)
      toast.error('Failed to create campaign', { description: error.message })
    },
  })

  const deleteCampaignMutation = useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      const { error } = await supabase.from('campaigns').delete().eq('id', id)
      if (error) throw error
      return id
    },
    onSuccess: (id) => {
      queryClient.setQueryData<Campaign[]>(['campaigns'], (old) => old?.filter((c) => c.id !== id) ?? [])
      toast.success('Campaign deleted')
    },
    onError: (error: any) => {
      console.error('[useCampaigns] Delete error:', error)
      toast.error('Failed to delete campaign', { description: error.message })
    },
  })

  const updateCampaign = async (id: string, data: Partial<Campaign>): Promise<Campaign | null> => {
    try { const r = await updateCampaignMutation.mutateAsync({ id, data }); return r.updatedData } catch { return null }
  }
  const createCampaign = async (data: Partial<Campaign>): Promise<Campaign | null> => {
    try { return await createCampaignMutation.mutateAsync(data) } catch { return null }
  }
  const deleteCampaign = async (id: string): Promise<boolean> => {
    try { await deleteCampaignMutation.mutateAsync(id); return true } catch { return false }
  }

  return { campaigns, isLoading, error: error?.message ?? null, refreshCampaigns: refetch, updateCampaign, createCampaign, deleteCampaign }
}
