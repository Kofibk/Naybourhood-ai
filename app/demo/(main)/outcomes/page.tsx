'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DEMO_BUYER_STATS } from '@/lib/demo-data'
import { BarChart3, TrendingUp, CheckCircle, XCircle, Target } from 'lucide-react'

export default function DemoOutcomesPage() {
  const stats = DEMO_BUYER_STATS

  const completed = stats.completed
  const reserved = stats.reserved
  const notProceeding = stats.not_proceeding
  const totalResolved = completed + reserved + notProceeding
  const successRate = totalResolved > 0 ? Math.round(((completed + reserved) / totalResolved) * 100) : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-emerald-400" />
          Outcome Tracking
        </h1>
        <p className="text-sm text-white/50 mt-1">
          Track completions, fall-throughs, and scoring accuracy to prove ROI
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-[#111111] border-white/10">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span className="text-sm text-white/50">Completed</span>
            </div>
            <p className="text-3xl font-bold text-green-400">{completed}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#111111] border-white/10">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-5 w-5 text-emerald-400" />
              <span className="text-sm text-white/50">Reserved</span>
            </div>
            <p className="text-3xl font-bold text-emerald-400">{reserved}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#111111] border-white/10">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="h-5 w-5 text-red-400" />
              <span className="text-sm text-white/50">Not Proceeding</span>
            </div>
            <p className="text-3xl font-bold text-red-400">{notProceeding}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#111111] border-white/10">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-blue-400" />
              <span className="text-sm text-white/50">Success Rate</span>
            </div>
            <p className="text-3xl font-bold text-blue-400">{successRate}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Outcome Funnel */}
      <Card className="bg-[#111111] border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Pipeline Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { label: 'Total Leads', value: stats.total_leads, pct: 100, color: 'bg-blue-500' },
              { label: 'Hot Leads', value: stats.hot_leads, pct: (stats.hot_leads / stats.total_leads) * 100, color: 'bg-orange-500' },
              { label: 'Viewing Booked', value: stats.viewing_booked, pct: (stats.viewing_booked / stats.total_leads) * 100, color: 'bg-purple-500' },
              { label: 'Negotiating', value: stats.negotiating, pct: (stats.negotiating / stats.total_leads) * 100, color: 'bg-amber-500' },
              { label: 'Reserved', value: stats.reserved, pct: (stats.reserved / stats.total_leads) * 100, color: 'bg-emerald-500' },
              { label: 'Completed', value: stats.completed, pct: (stats.completed / stats.total_leads) * 100, color: 'bg-green-500' },
            ].map((stage) => (
              <div key={stage.label} className="flex items-center gap-4">
                <span className="text-sm text-white/60 w-32 text-right">{stage.label}</span>
                <div className="flex-1 h-8 bg-white/5 rounded-lg overflow-hidden relative">
                  <div className={`h-full ${stage.color} rounded-lg transition-all duration-500`} style={{ width: `${Math.max(stage.pct, 2)}%` }} />
                  <span className="absolute inset-0 flex items-center px-3 text-xs font-medium text-white">
                    {stage.value.toLocaleString()} ({stage.pct.toFixed(1)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Scoring Accuracy */}
      <Card className="bg-[#111111] border-white/10">
        <CardHeader>
          <CardTitle className="text-white">AI Scoring Accuracy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-emerald-400">87%</p>
              <p className="text-sm text-white/50 mt-1">Hot leads that converted</p>
              <p className="text-xs text-white/30 mt-0.5">Leads scored 80+ that reached Reserved/Completed</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-blue-400">94%</p>
              <p className="text-sm text-white/50 mt-1">Classification accuracy</p>
              <p className="text-xs text-white/30 mt-0.5">Correct lead classification vs actual outcome</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-amber-400">2.3x</p>
              <p className="text-sm text-white/50 mt-1">ROI on campaign spend</p>
              <p className="text-xs text-white/30 mt-0.5">Revenue from completed sales vs total marketing spend</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
