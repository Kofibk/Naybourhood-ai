'use client'

import { useState } from 'react'
import { getDashboardStats, ALL_ENQUIRERS, getPipelineCounts } from '@/lib/gcpdemo'
import type { PipelineStatus, DemoEnquirer } from '@/lib/gcpdemo/types'
import { BarChart3, GitBranch, Timer, TrendingUp, ArrowRight } from 'lucide-react'

type Tab = 'funnel' | 'pipeline' | 'speed'

const PIPELINE_ORDER: PipelineStatus[] = [
  'Scored', 'Viewing Booked', 'Viewing Complete',
  'Verification In Progress', 'Verified', 'Tenancy Signed', 'Flagged',
]

function FunnelView() {
  const counts = getPipelineCounts()
  const stages = PIPELINE_ORDER.map(s => ({ name: s, count: counts[s] }))
  const max = Math.max(...stages.map(s => s.count), 1)

  return (
    <div className="space-y-6">
      <div className="inline-flex items-center gap-3">
        <span className="w-2 h-2 rounded-full bg-[#34D399]" />
        <span className="text-xs font-medium tracking-[0.15em] uppercase text-white/70">
          PROGRESSION FUNNEL — 7 STAGES
        </span>
      </div>
      <div className="space-y-3">
        {stages.map((stage, i) => {
          const pct = (stage.count / max) * 100
          const colors = [
            'bg-blue-500', 'bg-cyan-500', 'bg-teal-500', 'bg-amber-500',
            'bg-emerald-500', 'bg-emerald-400', 'bg-red-500',
          ]
          return (
            <div key={stage.name} className="flex items-center gap-4">
              <span className="text-xs text-white/60 w-48 text-right">{stage.name}</span>
              <div className="flex-1 h-8 bg-white/5 rounded-lg overflow-hidden relative">
                <div
                  className={`h-full rounded-lg ${colors[i]} transition-all duration-500`}
                  style={{ width: `${pct}%` }}
                />
                <span className="absolute inset-0 flex items-center px-3 text-xs font-medium text-white">
                  {stage.count}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Conversion Rates */}
      <div className="bg-[#111111] border border-white/10 rounded-xl p-5 mt-6">
        <p className="text-xs font-medium tracking-[0.15em] uppercase text-white/40 mb-4">Stage Conversion Rates</p>
        <div className="space-y-2">
          {stages.slice(0, -1).map((stage, i) => {
            const next = stages[i + 1]
            const rate = stage.count > 0 ? ((next.count / stage.count) * 100).toFixed(0) : '0'
            return (
              <div key={stage.name} className="flex items-center gap-2 text-xs">
                <span className="text-white/50 w-36 truncate">{stage.name}</span>
                <ArrowRight className="w-3 h-3 text-white/30" />
                <span className="text-white/50 w-36 truncate">{next.name}</span>
                <span className={`font-medium ml-auto ${
                  parseInt(rate) >= 60 ? 'text-emerald-400' :
                  parseInt(rate) >= 30 ? 'text-amber-400' : 'text-red-400'
                }`}>{rate}%</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function PipelineView() {
  const grouped: Record<PipelineStatus, DemoEnquirer[]> = {} as Record<PipelineStatus, DemoEnquirer[]>
  for (const status of PIPELINE_ORDER) {
    grouped[status] = ALL_ENQUIRERS.filter(e => e.pipelineStatus === status)
  }

  return (
    <div className="space-y-4">
      <div className="inline-flex items-center gap-3">
        <span className="w-2 h-2 rounded-full bg-[#34D399]" />
        <span className="text-xs font-medium tracking-[0.15em] uppercase text-white/70">
          ACTIVE PIPELINE
        </span>
      </div>
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {PIPELINE_ORDER.map(status => (
            <div key={status} className="w-64 flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-medium text-white/70">{status}</h4>
                <span className="text-xs text-white/40">{grouped[status].length}</span>
              </div>
              <div className="space-y-2">
                {grouped[status].map(e => (
                  <div key={e.id} className="bg-[#111111] border border-white/10 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-white font-medium truncate">{e.fullName}</span>
                      <span className={`text-xs font-bold ${
                        e.aiScore >= 70 ? 'text-emerald-400' :
                        e.aiScore >= 45 ? 'text-amber-400' : 'text-gray-400'
                      }`}>{e.aiScore}</span>
                    </div>
                    <p className="text-[10px] text-white/40 truncate">{e.employer} · {e.role}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-[10px] ${
                        e.riskLevel === 'Low' ? 'text-emerald-400' :
                        e.riskLevel === 'Medium' ? 'text-amber-400' : 'text-red-400'
                      }`}>{e.riskLevel}</span>
                      <span className="text-[10px] text-white/30">{e.daysInPipeline}d</span>
                    </div>
                  </div>
                ))}
                {grouped[status].length === 0 && (
                  <div className="text-xs text-white/20 text-center py-4">Empty</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SpeedView() {
  const stats = getDashboardStats()

  // Calculate avg days per stage
  const stageTimings: { stage: string; avgDays: number; count: number }[] = PIPELINE_ORDER.map(status => {
    const enquirers = ALL_ENQUIRERS.filter(e => e.pipelineStatus === status)
    const avg = enquirers.length > 0
      ? Math.round(enquirers.reduce((a, e) => a + e.daysInPipeline, 0) / enquirers.length)
      : 0
    return { stage: status, avgDays: avg, count: enquirers.length }
  })

  const signed = ALL_ENQUIRERS.filter(e => e.pipelineStatus === 'Tenancy Signed').length
  const total = ALL_ENQUIRERS.filter(e => e.pipelineStatus !== 'Archived').length

  return (
    <div className="space-y-6">
      <div className="inline-flex items-center gap-3">
        <span className="w-2 h-2 rounded-full bg-[#34D399]" />
        <span className="text-xs font-medium tracking-[0.15em] uppercase text-white/70">
          SPEED METRICS
        </span>
      </div>

      {/* Wins / Opportunities */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#111111] border border-white/10 rounded-xl p-5 text-center">
          <p className="text-3xl font-bold text-emerald-400">{signed}</p>
          <p className="text-xs text-white/50 mt-1">Tenancies Signed</p>
        </div>
        <div className="bg-[#111111] border border-white/10 rounded-xl p-5 text-center">
          <p className="text-3xl font-bold text-white">{total}</p>
          <p className="text-xs text-white/50 mt-1">Active Opportunities</p>
        </div>
        <div className="bg-[#111111] border border-white/10 rounded-xl p-5 text-center">
          <p className="text-3xl font-bold text-amber-400">{total > 0 ? ((signed / total) * 100).toFixed(1) : 0}%</p>
          <p className="text-xs text-white/50 mt-1">Conversion Rate</p>
        </div>
      </div>

      {/* Stage Timings */}
      <div className="bg-[#111111] border border-white/10 rounded-xl p-5">
        <p className="text-xs font-medium tracking-[0.15em] uppercase text-white/40 mb-4">Average Days Per Stage</p>
        <div className="space-y-3">
          {stageTimings.map(({ stage, avgDays, count }) => (
            <div key={stage} className="flex items-center gap-4">
              <span className="text-xs text-white/60 w-48">{stage}</span>
              <div className="flex-1 h-4 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${avgDays <= 7 ? 'bg-emerald-500' : avgDays <= 14 ? 'bg-amber-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min(100, (avgDays / 35) * 100)}%` }}
                />
              </div>
              <span className="text-xs text-white/60 w-16 text-right">{avgDays} days</span>
              <span className="text-xs text-white/30 w-8">({count})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Avg Pipeline Duration */}
      <div className="bg-[#111111] border border-white/10 rounded-xl p-5">
        <p className="text-xs font-medium tracking-[0.15em] uppercase text-white/40 mb-2">Overall Pipeline</p>
        <p className="text-2xl font-bold text-white">{stats.avgDaysInPipeline} days</p>
        <p className="text-xs text-white/40 mt-1">Average time from enquiry to current stage</p>
      </div>
    </div>
  )
}

export default function InsightsPage() {
  const [tab, setTab] = useState<Tab>('funnel')

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-1 bg-[#111111] border border-white/10 rounded-xl p-1 w-fit">
        {([
          { key: 'funnel' as Tab, label: 'Progression Funnel', icon: BarChart3 },
          { key: 'pipeline' as Tab, label: 'Active Pipeline', icon: GitBranch },
          { key: 'speed' as Tab, label: 'Speed Metrics', icon: Timer },
        ]).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === key
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'text-white/50 hover:text-white/70 hover:bg-white/5'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'funnel' && <FunnelView />}
      {tab === 'pipeline' && <PipelineView />}
      {tab === 'speed' && <SpeedView />}
    </div>
  )
}
