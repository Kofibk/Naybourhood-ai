'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { formatNumber } from '@/lib/utils'
import {
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Loader2,
  Target,
} from 'lucide-react'

interface OutcomeData {
  completions: number
  fallThroughs: number
  fallThroughRate: number
  avgScoreCompleted: number
  avgScoreFallThrough: number
  totalPipelineValue: number
  stageConversions: { stage: string; count: number; rate: number }[]
}

interface BuyerScoreRow {
  id: string
  final_score?: number
  ai_quality_score?: number
  budget_max?: number
  budget_min?: number
  status?: string
}

interface OutcomeSummaryProps {
  userType: string
  period?: 'month' | 'quarter' | 'all'
}

export function OutcomeSummary({ userType, period = 'month' }: OutcomeSummaryProps) {
  const { user } = useAuth()
  const [data, setData] = useState<OutcomeData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState(period)

  const fetchOutcomes = useCallback(async () => {
    if (!isSupabaseConfigured() || !user?.company_id) return

    setIsLoading(true)
    try {
      const supabase = createClient()

      // Determine date filter
      const now = new Date()
      let dateFilter: string | null = null
      if (selectedPeriod === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        dateFilter = monthAgo.toISOString()
      } else if (selectedPeriod === 'quarter') {
        const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        dateFilter = quarterAgo.toISOString()
      }

      // Fetch completed buyers
      let completedQuery = supabase
        .from('buyers')
        .select('id, final_score, ai_quality_score, budget_max, budget_min')
        .eq('company_id', user.company_id)
        .eq('status', 'Completed')

      if (dateFilter) {
        completedQuery = completedQuery.gte('status_last_modified', dateFilter)
      }

      const { data: completedRaw } = await completedQuery
      const completed = (completedRaw || []) as BuyerScoreRow[]

      // Fetch fall-throughs
      let fallThroughQuery = supabase
        .from('buyers')
        .select('id, final_score, ai_quality_score, budget_max, budget_min')
        .eq('company_id', user.company_id)
        .eq('status', 'Not Proceeding')

      if (dateFilter) {
        fallThroughQuery = fallThroughQuery.gte('status_last_modified', dateFilter)
      }

      const { data: fallThroughsRaw } = await fallThroughQuery
      const fallThroughs = (fallThroughsRaw || []) as BuyerScoreRow[]

      // Fetch all buyers for pipeline stages
      const { data: allBuyersRaw } = await supabase
        .from('buyers')
        .select('id, status, budget_max, budget_min')
        .eq('company_id', user.company_id)

      const allBuyers = (allBuyersRaw || []) as BuyerScoreRow[]

      const completionCount = completed.length
      const fallThroughCount = fallThroughs.length
      const total = completionCount + fallThroughCount

      const avgScoreCompleted = completionCount > 0
        ? Math.round(
            completed.reduce((sum: number, b) => sum + (b.final_score || b.ai_quality_score || 0), 0) / completionCount
          )
        : 0

      const avgScoreFallThrough = fallThroughCount > 0
        ? Math.round(
            fallThroughs.reduce((sum: number, b) => sum + (b.final_score || b.ai_quality_score || 0), 0) / fallThroughCount
          )
        : 0

      const totalPipelineValue = allBuyers.reduce(
        (sum: number, b) => sum + (b.budget_max || b.budget_min || 0),
        0
      )

      // Stage conversion data
      const stages = ['Contact Pending', 'Follow Up', 'Viewing Booked', 'Negotiating', 'Reserved', 'Exchanged', 'Completed']
      const stageCounts = stages.map((stage) => ({
        stage,
        count: allBuyers.filter((b) => b.status === stage).length,
      }))

      const stageConversions = stageCounts.map((sc, i) => ({
        ...sc,
        rate: i > 0 && stageCounts[i - 1].count > 0
          ? Math.round((sc.count / stageCounts[i - 1].count) * 100)
          : 100,
      }))

      setData({
        completions: completionCount,
        fallThroughs: fallThroughCount,
        fallThroughRate: total > 0 ? Math.round((fallThroughCount / total) * 100) : 0,
        avgScoreCompleted,
        avgScoreFallThrough,
        totalPipelineValue,
        stageConversions,
      })
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[Outcomes] Error:', err)
      }
    } finally {
      setIsLoading(false)
    }
  }, [user?.company_id, selectedPeriod])

  useEffect(() => {
    fetchOutcomes()
  }, [fetchOutcomes])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex items-center gap-2">
        {(['month', 'quarter', 'all'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setSelectedPeriod(p)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedPeriod === p
                ? 'bg-white/10 text-white'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            {p === 'month' ? 'This Month' : p === 'quarter' ? 'This Quarter' : 'All Time'}
          </button>
        ))}
      </div>

      {/* Outcome KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#111111] border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <p className="text-white/50 text-sm">Completions</p>
          <p className="text-white text-3xl font-bold mt-1">{data.completions}</p>
        </div>

        <div className="bg-[#111111] border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-400" />
            </div>
          </div>
          <p className="text-white/50 text-sm">Fall-Throughs</p>
          <p className="text-white text-3xl font-bold mt-1">{data.fallThroughs}</p>
        </div>

        <div className="bg-[#111111] border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <p className="text-white/50 text-sm">Fall-Through Rate</p>
          <p className="text-white text-3xl font-bold mt-1">{data.fallThroughRate}%</p>
        </div>

        <div className="bg-[#111111] border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <Target className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <p className="text-white/50 text-sm">Score Accuracy</p>
          <div className="mt-1">
            <p className="text-emerald-400 text-sm">
              Completed avg: <span className="font-bold">{data.avgScoreCompleted}</span>
            </p>
            <p className="text-red-400 text-sm">
              Fall-through avg: <span className="font-bold">{data.avgScoreFallThrough}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Conversion Funnel */}
      <div className="bg-[#111111] border border-white/10 rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          Conversion Funnel
        </h3>

        <div className="space-y-2">
          {data.stageConversions.map((stage, index) => {
            const maxCount = Math.max(...data.stageConversions.map((s) => s.count), 1)
            const barWidth = (stage.count / maxCount) * 100

            return (
              <div key={stage.stage} className="flex items-center gap-3">
                <span className="text-xs text-white/50 w-32 text-right truncate">{stage.stage}</span>
                <div className="flex-1 bg-white/5 rounded-full h-6 relative overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary/60 to-primary/30 rounded-full transition-all duration-500"
                    style={{ width: `${barWidth}%` }}
                  />
                  <span className="absolute inset-0 flex items-center px-3 text-xs text-white font-medium">
                    {stage.count}
                  </span>
                </div>
                {index > 0 && (
                  <span className={`text-xs font-medium w-12 ${
                    stage.rate >= 50 ? 'text-emerald-400' : stage.rate >= 25 ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {stage.rate}%
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
