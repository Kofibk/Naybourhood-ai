'use client'

import { getDashboardStats, DEMO_PROPERTY, ALL_ENQUIRERS, DEMO_CONVERSATIONS } from '@/lib/gcpdemo'
import {
  Building2,
  Users,
  TrendingUp,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  FileSignature,
  Eye,
} from 'lucide-react'
import Link from 'next/link'

function KpiCard({ icon: Icon, label, value, sub, color = 'emerald' }: {
  icon: React.ElementType
  label: string
  value: string | number
  sub?: string
  color?: 'emerald' | 'amber' | 'red' | 'blue'
}) {
  const colors = {
    emerald: 'bg-emerald-500/10 text-emerald-400',
    amber: 'bg-amber-500/10 text-amber-400',
    red: 'bg-red-500/10 text-red-400',
    blue: 'bg-blue-500/10 text-blue-400',
  }
  return (
    <div className="bg-[#111111] border border-white/10 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 ${colors[color].split(' ')[0]} rounded-xl flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${colors[color].split(' ')[1]}`} />
        </div>
      </div>
      <p className="text-white/50 text-sm">{label}</p>
      <p className="text-white text-3xl font-bold mt-1">{value}</p>
      {sub && <p className="text-white/40 text-xs mt-1">{sub}</p>}
    </div>
  )
}

function PipelineBar({ label, count, total, color }: {
  label: string
  count: number
  total: number
  color: string
}) {
  const pct = total > 0 ? (count / total) * 100 : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-white/60 w-36 truncate">{label}</span>
      <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium text-white/80 w-8 text-right">{count}</span>
    </div>
  )
}

export default function GcpDashboardPage() {
  const stats = getDashboardStats()
  const recentActivity = ALL_ENQUIRERS
    .sort((a, b) => a.daysInPipeline - b.daysInPipeline)
    .slice(0, 6)

  return (
    <div className="space-y-6">
      {/* Section Label */}
      <div className="inline-flex items-center gap-3">
        <span className="w-2 h-2 rounded-full bg-[#34D399]" />
        <span className="text-xs font-medium tracking-[0.15em] uppercase text-white/70">
          PROPERTY OVERVIEW
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Building2} label="Total Units" value={stats.totalUnits} sub={`${stats.availableUnits} available · ${stats.occupancyRate}% occupancy`} />
        <KpiCard icon={Users} label="Active Enquirers" value={stats.activeEnquirers} sub={`${stats.totalEnquirers} total · Avg score ${stats.avgScore}`} />
        <KpiCard icon={MessageSquare} label="AI Conversations" value={stats.totalConversations} sub={`${stats.conversationsCompleted} completed · ${stats.conversationsFlagged} flagged`} color="blue" />
        <KpiCard icon={FileSignature} label="Tenancies Signed" value={stats.pipeline['Tenancy Signed']} sub={`${stats.pipeline['Verified']} verified and ready`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Funnel */}
        <div className="lg:col-span-2 bg-[#111111] border border-white/10 rounded-2xl p-5">
          <div className="inline-flex items-center gap-3 mb-5">
            <span className="w-2 h-2 rounded-full bg-[#34D399]" />
            <span className="text-xs font-medium tracking-[0.15em] uppercase text-white/70">
              LETTINGS PIPELINE
            </span>
          </div>
          <div className="space-y-3">
            <PipelineBar label="Scored" count={stats.pipeline['Scored']} total={stats.totalEnquirers} color="bg-blue-500" />
            <PipelineBar label="Viewing Booked" count={stats.pipeline['Viewing Booked']} total={stats.totalEnquirers} color="bg-cyan-500" />
            <PipelineBar label="Viewing Complete" count={stats.pipeline['Viewing Complete']} total={stats.totalEnquirers} color="bg-teal-500" />
            <PipelineBar label="Verification In Progress" count={stats.pipeline['Verification In Progress']} total={stats.totalEnquirers} color="bg-amber-500" />
            <PipelineBar label="Verified" count={stats.pipeline['Verified']} total={stats.totalEnquirers} color="bg-emerald-500" />
            <PipelineBar label="Tenancy Signed" count={stats.pipeline['Tenancy Signed']} total={stats.totalEnquirers} color="bg-emerald-400" />
            <PipelineBar label="Flagged" count={stats.pipeline['Flagged']} total={stats.totalEnquirers} color="bg-red-500" />
            <PipelineBar label="Fell Through" count={stats.pipeline['Fell Through']} total={stats.totalEnquirers} color="bg-gray-500" />
            <PipelineBar label="Archived" count={stats.pipeline['Archived']} total={stats.totalEnquirers} color="bg-gray-700" />
          </div>
        </div>

        {/* Risk Breakdown + Quick Stats */}
        <div className="space-y-4">
          <div className="bg-[#111111] border border-white/10 rounded-2xl p-5">
            <div className="inline-flex items-center gap-3 mb-4">
              <span className="w-2 h-2 rounded-full bg-[#34D399]" />
              <span className="text-xs font-medium tracking-[0.15em] uppercase text-white/70">
                RISK BREAKDOWN
              </span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-white/70">Low Risk</span>
                </div>
                <span className="text-sm font-medium text-emerald-400">{stats.lowRisk}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span className="text-sm text-white/70">Medium Risk</span>
                </div>
                <span className="text-sm font-medium text-amber-400">{stats.mediumRisk}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-sm text-white/70">High Risk</span>
                </div>
                <span className="text-sm font-medium text-red-400">{stats.highRisk}</span>
              </div>
            </div>
          </div>

          <div className="bg-[#111111] border border-white/10 rounded-2xl p-5">
            <div className="inline-flex items-center gap-3 mb-4">
              <span className="w-2 h-2 rounded-full bg-[#34D399]" />
              <span className="text-xs font-medium tracking-[0.15em] uppercase text-white/70">
                QUICK METRICS
              </span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60">Avg Days in Pipeline</span>
                <span className="text-sm font-medium text-white">{stats.avgDaysInPipeline}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60">Avg Rent (PCM)</span>
                <span className="text-sm font-medium text-white">£{DEMO_PROPERTY.avgRent.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60">Occupancy Rate</span>
                <span className="text-sm font-medium text-emerald-400">{DEMO_PROPERTY.occupancyRate}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-[#111111] border border-white/10 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="inline-flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[#34D399]" />
            <span className="text-xs font-medium tracking-[0.15em] uppercase text-white/70">
              RECENT ACTIVITY
            </span>
          </div>
          <Link href="/gcpdemo/enquirers" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
            View All Enquirers →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-2 text-xs font-medium text-white/40 uppercase tracking-wider">Name</th>
                <th className="text-left py-2 text-xs font-medium text-white/40 uppercase tracking-wider">Employer</th>
                <th className="text-left py-2 text-xs font-medium text-white/40 uppercase tracking-wider">Score</th>
                <th className="text-left py-2 text-xs font-medium text-white/40 uppercase tracking-wider">Status</th>
                <th className="text-left py-2 text-xs font-medium text-white/40 uppercase tracking-wider">Risk</th>
                <th className="text-left py-2 text-xs font-medium text-white/40 uppercase tracking-wider">Days</th>
              </tr>
            </thead>
            <tbody>
              {recentActivity.map((e) => (
                <tr key={e.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 text-white font-medium">{e.fullName}</td>
                  <td className="py-3 text-white/60">{e.employer}</td>
                  <td className="py-3">
                    <span className={`font-semibold ${e.aiScore >= 70 ? 'text-emerald-400' : e.aiScore >= 45 ? 'text-amber-400' : 'text-gray-400'}`}>
                      {e.aiScore}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      e.pipelineStatus === 'Verified' || e.pipelineStatus === 'Tenancy Signed' ? 'bg-emerald-500/20 text-emerald-400' :
                      e.pipelineStatus === 'Flagged' ? 'bg-red-500/20 text-red-400' :
                      e.pipelineStatus === 'Archived' || e.pipelineStatus === 'Fell Through' ? 'bg-gray-500/20 text-gray-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {e.pipelineStatus}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className={`text-xs ${e.riskLevel === 'Low' ? 'text-emerald-400' : e.riskLevel === 'Medium' ? 'text-amber-400' : 'text-red-400'}`}>
                      {e.riskLevel}
                    </span>
                  </td>
                  <td className="py-3 text-white/50">{e.daysInPipeline}d</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
