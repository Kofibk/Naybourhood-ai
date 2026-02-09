'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import type { OutcomeAnalyticsData, FunnelStage, FallThroughByStage, FallThroughReasonStat, AvgDaysPerStage } from '@/types/transactions'
import { TRANSACTION_STAGES, STAGE_LABELS, FALL_THROUGH_LABELS } from '@/types/transactions'
import type { FallThroughReason, TransactionStage } from '@/types/transactions'

const STALE_TIME = 5 * 60 * 1000
const GC_TIME = 30 * 60 * 1000

const STAGE_COLORS: Record<string, string> = {
  enquiry: '#3b82f6',
  viewing: '#a855f7',
  offer: '#f59e0b',
  reservation: '#f97316',
  exchange: '#10b981',
  completion: '#16a34a',
}

interface StageCountRow {
  current_stage: string
  count: number
}

interface FallReasonRow {
  fall_through_reason: string
  count: number
}

interface FallStageRow {
  fall_through_stage: string
  count: number
}

async function fetchOutcomeAnalytics(): Promise<OutcomeAnalyticsData> {
  if (!isSupabaseConfigured()) {
    return getEmptyAnalytics()
  }

  const supabase = createClient()
  if (!supabase) return getEmptyAnalytics()

  // Run all queries in parallel for performance
  const [stageCountsRes, fallReasonsRes, fallStagesRes, totalRes] = await Promise.all([
    // 1. Count by current_stage (for funnel)
    supabase.rpc('get_transaction_stage_counts').select('current_stage, count'),

    // 2. Fall-through reasons grouped
    supabase.rpc('get_fall_through_reasons').select('fall_through_reason, count'),

    // 3. Fall-through by stage
    supabase.rpc('get_fall_through_by_stage').select('fall_through_stage, count'),

    // 4. Total count
    supabase
      .from('buyer_transactions')
      .select('id', { count: 'exact', head: true }),
  ])

  // If table doesn't exist, return empty analytics
  const tableNotFound = totalRes.error?.code === '42P01' ||
    totalRes.error?.message?.includes('does not exist') ||
    totalRes.error?.message?.includes('relation')

  if (tableNotFound) {
    console.warn('[useOutcomeAnalytics] Table not found, returning empty')
    return getEmptyAnalytics()
  }

  // If RPC functions don't exist, fall back to direct queries
  const useFallback = stageCountsRes.error?.message?.includes('function') ||
    stageCountsRes.error?.code === '42883' ||
    stageCountsRes.error

  if (useFallback) {
    return fetchOutcomeAnalyticsFallback()
  }

  const stageCounts: StageCountRow[] = (stageCountsRes.data as StageCountRow[]) || []
  const fallReasons: FallReasonRow[] = (fallReasonsRes.data as FallReasonRow[]) || []
  const fallStages: FallStageRow[] = (fallStagesRes.data as FallStageRow[]) || []
  const totalTransactions = totalRes.count || 0

  return buildAnalytics(stageCounts, fallReasons, fallStages, totalTransactions)
}

// Fallback: use direct queries when RPC functions are not available
async function fetchOutcomeAnalyticsFallback(): Promise<OutcomeAnalyticsData> {
  const supabase = createClient()
  if (!supabase) return getEmptyAnalytics()

  // Fetch all transactions with minimal columns for aggregation
  const { data: transactions, error } = await supabase
    .from('buyer_transactions')
    .select('current_stage, fall_through_reason, fall_through_stage, stage_history, created_at')
    .range(0, 999)

  if (error) {
    // Table may not exist yet — return empty analytics gracefully
    if (
      error.code === '42P01' ||
      error.message?.includes('does not exist') ||
      error.message?.includes('relation')
    ) {
      console.warn('[useOutcomeAnalytics] Table not found, returning empty')
      return getEmptyAnalytics()
    }
    console.error('[useOutcomeAnalytics] Fetch error:', error.message)
    return getEmptyAnalytics()
  }

  if (!transactions || transactions.length === 0) {
    return getEmptyAnalytics()
  }

  // Aggregate stage counts
  const stageCountMap = new Map<string, number>()
  const fallReasonMap = new Map<string, number>()
  const fallStageMap = new Map<string, number>()

  for (const t of transactions) {
    stageCountMap.set(t.current_stage, (stageCountMap.get(t.current_stage) || 0) + 1)

    if (t.current_stage === 'fallen_through') {
      if (t.fall_through_reason) {
        fallReasonMap.set(t.fall_through_reason, (fallReasonMap.get(t.fall_through_reason) || 0) + 1)
      }
      if (t.fall_through_stage) {
        fallStageMap.set(t.fall_through_stage, (fallStageMap.get(t.fall_through_stage) || 0) + 1)
      }
    }
  }

  const stageCounts: StageCountRow[] = Array.from(stageCountMap.entries()).map(
    ([current_stage, count]) => ({ current_stage, count })
  )
  const fallReasons: FallReasonRow[] = Array.from(fallReasonMap.entries()).map(
    ([fall_through_reason, count]) => ({ fall_through_reason, count })
  )
  const fallStages: FallStageRow[] = Array.from(fallStageMap.entries()).map(
    ([fall_through_stage, count]) => ({ fall_through_stage, count })
  )

  // Calculate avg days per stage from stage_history
  const avgDaysPerStage = calculateAvgDaysPerStage(transactions)

  const analytics = buildAnalytics(stageCounts, fallReasons, fallStages, transactions.length)
  analytics.avgDaysPerStage = avgDaysPerStage

  return analytics
}

function calculateAvgDaysPerStage(
  transactions: { stage_history: unknown }[]
): AvgDaysPerStage[] {
  const stageDurations = new Map<string, number[]>()

  for (const t of transactions) {
    const history = Array.isArray(t.stage_history) ? t.stage_history : []
    for (let i = 0; i < history.length - 1; i++) {
      const current = history[i]
      const next = history[i + 1]
      if (current?.timestamp && next?.timestamp && current?.stage) {
        const days =
          (new Date(next.timestamp).getTime() - new Date(current.timestamp).getTime()) /
          (1000 * 60 * 60 * 24)
        if (days >= 0 && days < 365) {
          const existing = stageDurations.get(current.stage) || []
          existing.push(days)
          stageDurations.set(current.stage, existing)
        }
      }
    }
  }

  return TRANSACTION_STAGES.map((stage) => {
    const durations = stageDurations.get(stage) || []
    const avg = durations.length > 0
      ? Math.round((durations.reduce((a, b) => a + b, 0) / durations.length) * 10) / 10
      : 0
    return { stage: STAGE_LABELS[stage], avg_days: avg }
  })
}

function buildAnalytics(
  stageCounts: StageCountRow[],
  fallReasons: FallReasonRow[],
  fallStages: FallStageRow[],
  totalTransactions: number
): OutcomeAnalyticsData {
  // Funnel: cumulative count of transactions that reached each stage
  const stageMap = new Map(stageCounts.map((s) => [s.current_stage, s.count]))
  const completionCount = stageMap.get('completion') || 0
  const fallenThroughCount = stageMap.get('fallen_through') || 0

  // Build cumulative funnel
  const funnel: FunnelStage[] = []
  let cumulativeFromEnd = 0

  for (let i = TRANSACTION_STAGES.length - 1; i >= 0; i--) {
    const stage = TRANSACTION_STAGES[i]
    cumulativeFromEnd += stageMap.get(stage) || 0
    funnel.unshift({
      stage: STAGE_LABELS[stage],
      count: cumulativeFromEnd + fallenThroughCount,
      color: STAGE_COLORS[stage],
    })
  }

  // Fall-through by stage
  const fallThroughByStage: FallThroughByStage[] = TRANSACTION_STAGES.map((stage) => {
    const fallCount = fallStages.find((f) => f.fall_through_stage === stage)?.count || 0
    const reachedCount = funnel.find((f) => f.stage === STAGE_LABELS[stage])?.count || 0
    return {
      stage: STAGE_LABELS[stage],
      count: fallCount,
      rate: reachedCount > 0 ? Math.round((fallCount / reachedCount) * 100) : 0,
    }
  })

  // Top fall-through reasons
  const totalFallThrough = fallReasons.reduce((sum, r) => sum + r.count, 0)
  const topFallThroughReasons: FallThroughReasonStat[] = fallReasons
    .sort((a, b) => b.count - a.count)
    .map((r) => ({
      reason: r.fall_through_reason,
      label: FALL_THROUGH_LABELS[r.fall_through_reason as FallThroughReason] || r.fall_through_reason,
      count: r.count,
      percentage: totalFallThrough > 0 ? Math.round((r.count / totalFallThrough) * 100) : 0,
    }))

  return {
    funnel,
    fallThroughByStage,
    avgDaysPerStage: [],
    topFallThroughReasons,
    totalTransactions,
    completionRate: totalTransactions > 0 ? Math.round((completionCount / totalTransactions) * 100) : 0,
    fallThroughRate: totalTransactions > 0 ? Math.round((fallenThroughCount / totalTransactions) * 100) : 0,
  }
}

function getEmptyAnalytics(): OutcomeAnalyticsData {
  return {
    funnel: TRANSACTION_STAGES.map((stage) => ({
      stage: STAGE_LABELS[stage],
      count: 0,
      color: STAGE_COLORS[stage],
    })),
    fallThroughByStage: [],
    avgDaysPerStage: [],
    topFallThroughReasons: [],
    totalTransactions: 0,
    completionRate: 0,
    fallThroughRate: 0,
  }
}

export function useOutcomeAnalytics() {
  const {
    data: analytics,
    isLoading,
    error,
  } = useQuery<OutcomeAnalyticsData, Error>({
    queryKey: ['outcome-analytics'],
    queryFn: fetchOutcomeAnalytics,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    retry: false,
  })

  return {
    analytics: analytics || getEmptyAnalytics(),
    isLoading,
    error: error?.message ?? null,
  }
}
