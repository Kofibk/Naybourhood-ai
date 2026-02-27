'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { DEMO_RECENT_LEADS, DEMO_BUYER_STATS } from '@/lib/demo-data'
import { GitBranch, Flame } from 'lucide-react'

const PIPELINE_STAGES = [
  { key: 'Contact Pending', label: 'Contact Pending', color: 'border-blue-500/50', headerBg: 'bg-blue-500/10', count: 147 },
  { key: 'Follow Up', label: 'Follow Up', color: 'border-yellow-500/50', headerBg: 'bg-yellow-500/10', count: 203 },
  { key: 'Viewing Booked', label: 'Viewing Booked', color: 'border-purple-500/50', headerBg: 'bg-purple-500/10', count: 89 },
  { key: 'Negotiating', label: 'Negotiating', color: 'border-emerald-500/50', headerBg: 'bg-emerald-500/10', count: 37 },
  { key: 'Reserved', label: 'Reserved', color: 'border-green-500/50', headerBg: 'bg-green-500/10', count: 18 },
  { key: 'Completed', label: 'Completed', color: 'border-green-600/50', headerBg: 'bg-green-600/10', count: 12 },
]

function getScoreColor(score: number) {
  if (score >= 80) return 'text-emerald-400'
  if (score >= 60) return 'text-amber-400'
  return 'text-red-400'
}

export default function DemoPipelinePage() {
  const leadsByStage = useMemo(() => {
    const grouped: Record<string, typeof DEMO_RECENT_LEADS> = {}
    for (const stage of PIPELINE_STAGES) {
      grouped[stage.key] = DEMO_RECENT_LEADS.filter(l => l.status === stage.key)
    }
    return grouped
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <GitBranch className="w-6 h-6 text-emerald-400" />
          Buyer Pipeline
        </h1>
        <p className="text-sm text-white/50 mt-1">
          Drag and drop buyers between stages to update their status
        </p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {PIPELINE_STAGES.map((stage) => {
          const leads = leadsByStage[stage.key] || []
          return (
            <div key={stage.key} className={`flex-shrink-0 w-[280px] bg-[#111111] border ${stage.color} rounded-xl overflow-hidden`}>
              {/* Stage header */}
              <div className={`${stage.headerBg} px-4 py-3 border-b border-white/10`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">{stage.label}</h3>
                  <span className="text-xs text-white/50 bg-white/10 px-2 py-0.5 rounded-full">{stage.count}</span>
                </div>
              </div>

              {/* Cards */}
              <div className="p-3 space-y-2 min-h-[200px] max-h-[500px] overflow-y-auto">
                {leads.map((lead) => (
                  <Link
                    key={lead.id}
                    href={`/demo/buyers/${lead.id}`}
                    className="block bg-[#0A0A0A] border border-white/10 rounded-lg p-3 hover:border-white/20 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        {(lead.ai_quality_score || 0) >= 85 && <Flame className="h-3 w-3 text-orange-400" />}
                        <p className="text-sm font-medium text-white truncate">{lead.full_name}</p>
                      </div>
                      <span className={`text-xs font-bold ${getScoreColor(lead.ai_quality_score || 0)}`}>
                        {lead.ai_quality_score}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/40 truncate">{lead.development_name}</p>
                    <p className="text-[11px] text-white/30 mt-0.5">{lead.budget_range}</p>
                  </Link>
                ))}
                {leads.length === 0 && (
                  <div className="text-center py-8 text-white/20 text-xs">
                    No buyers in this stage
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
