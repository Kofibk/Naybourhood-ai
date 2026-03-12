'use client'

import { useState, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { SB_DEMO_RECENT_LEADS, SB_DEMO_BUYER_STATS } from '@/lib/demo-data-smartbricks'
import { Search, Flame, Users, Eye, Target, ArrowUpDown, ChevronRight, X } from 'lucide-react'

const statusColors: Record<string, string> = {
  'Viewing Booked': 'text-purple-400 bg-purple-400/10',
  'Follow Up': 'text-yellow-400 bg-yellow-400/10',
  'Contact Pending': 'text-blue-400 bg-blue-400/10',
  'Negotiating': 'text-emerald-400 bg-emerald-400/10',
  'Reserved': 'text-green-400 bg-green-400/10',
}

function getScoreColor(score: number) {
  if (score >= 55) return 'text-emerald-400'
  if (score >= 35) return 'text-amber-400'
  return 'text-red-400'
}

export default function SBDemoBuyersPage() {
  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState('all')
  const [sortDesc, setSortDesc] = useState(true)

  // Column filters
  const [devFilter, setDevFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')

  const developments = useMemo(() => {
    return Array.from(new Set(SB_DEMO_RECENT_LEADS.map(l => l.development_name).filter(Boolean))).sort()
  }, [])

  const statuses = useMemo(() => {
    return Array.from(new Set(SB_DEMO_RECENT_LEADS.map(l => l.status).filter(Boolean))).sort()
  }, [])

  const sources = useMemo(() => {
    return Array.from(new Set(SB_DEMO_RECENT_LEADS.map(l => l.source_platform).filter(Boolean))).sort()
  }, [])

  const filtered = useMemo(() => {
    let leads = SB_DEMO_RECENT_LEADS.filter((lead) => {
      const matchesSearch = !search ||
        lead.full_name.toLowerCase().includes(search.toLowerCase()) ||
        lead.email.toLowerCase().includes(search.toLowerCase()) ||
        lead.development_name?.toLowerCase().includes(search.toLowerCase())
      const matchesClass = classFilter === 'all' ||
        lead.ai_classification?.toLowerCase().includes(classFilter.toLowerCase())
      const matchesDev = devFilter === 'all' || lead.development_name === devFilter
      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter
      const matchesSource = sourceFilter === 'all' || lead.source_platform === sourceFilter
      return matchesSearch && matchesClass && matchesDev && matchesStatus && matchesSource
    })
    leads.sort((a, b) => sortDesc
      ? (b.ai_quality_score || 0) - (a.ai_quality_score || 0)
      : (a.ai_quality_score || 0) - (b.ai_quality_score || 0))
    return leads
  }, [search, classFilter, sortDesc, devFilter, statusFilter, sourceFilter])

  const hasActiveFilters = devFilter !== 'all' || statusFilter !== 'all' || sourceFilter !== 'all'

  const stats = SB_DEMO_BUYER_STATS

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Buyers</h2>
        <p className="text-sm text-white/50">
          {stats.total_leads} total leads · {stats.hot_leads} hot leads
        </p>
      </div>

      {/* Funnel Stats */}
      <div className="grid grid-cols-3 md:grid-cols-7 gap-3">
        {[
          { label: 'Total', value: stats.total_leads, icon: Users, color: 'text-white' },
          { label: 'Hot', value: stats.hot_leads, icon: Flame, color: 'text-orange-400' },
          { label: 'Viewings', value: stats.viewing_booked, icon: Eye, color: 'text-purple-400' },
          { label: 'Negotiating', value: stats.negotiating, icon: Target, color: 'text-blue-400' },
          { label: 'Reserved', value: stats.reserved, icon: Target, color: 'text-emerald-400' },
          { label: 'Completed', value: stats.completed, icon: Target, color: 'text-green-400' },
          { label: 'Conv. Rate', value: `${((stats.completed / stats.total_leads) * 100).toFixed(1)}%`, icon: Target, color: 'text-emerald-400' },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#111111] border border-white/10 rounded-lg p-3 text-center">
            <p className={`text-lg font-bold ${stat.color}`}>{typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}</p>
            <p className="text-[10px] text-white/40 uppercase tracking-wider">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            placeholder="Search buyers..."
            className="pl-9 bg-[#111111] border-white/10 text-white placeholder:text-white/40"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {['all', 'hot', 'qualified'].map((c) => (
            <Button
              key={c}
              variant={classFilter === c ? 'default' : 'outline'}
              size="sm"
              onClick={() => setClassFilter(c)}
              className={classFilter !== c ? 'border-white/10 text-white/70 hover:bg-white/5' : ''}
            >
              {c === 'all' ? 'All' : c === 'hot' ? 'Hot Leads' : 'Qualified'}
            </Button>
          ))}
          <Button variant="outline" size="sm" onClick={() => setSortDesc(!sortDesc)} className="border-white/10 text-white/70 hover:bg-white/5">
            <ArrowUpDown className="h-3.5 w-3.5 mr-1" />
            Score
          </Button>
        </div>
      </div>

      {/* Column Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-white/40">Filter by:</span>
        <select
          value={devFilter}
          onChange={(e) => setDevFilter(e.target.value)}
          className="h-8 px-2 rounded-md border border-white/10 bg-[#111111] text-white text-xs"
        >
          <option value="all">All Developments</option>
          {developments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-8 px-2 rounded-md border border-white/10 bg-[#111111] text-white text-xs"
        >
          <option value="all">All Statuses</option>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="h-8 px-2 rounded-md border border-white/10 bg-[#111111] text-white text-xs"
        >
          <option value="all">All Sources</option>
          {sources.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setDevFilter('all'); setStatusFilter('all'); setSourceFilter('all') }}
            className="text-xs text-white/50 hover:text-white h-8 px-2"
          >
            <X className="h-3 w-3 mr-1" /> Clear filters
          </Button>
        )}
      </div>

      {/* Buyer Table */}
      <div className="bg-[#111111] border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-xs text-white/50 font-medium px-4 py-3">Name</th>
                <th className="text-left text-xs text-white/50 font-medium px-4 py-3">NB Score</th>
                <th className="text-left text-xs text-white/50 font-medium px-4 py-3">Classification</th>
                <th className="text-left text-xs text-white/50 font-medium px-4 py-3">Development</th>
                <th className="text-left text-xs text-white/50 font-medium px-4 py-3">Budget</th>
                <th className="text-left text-xs text-white/50 font-medium px-4 py-3">Status</th>
                <th className="text-left text-xs text-white/50 font-medium px-4 py-3">Source</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => (
                <tr key={lead.id} className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer group" onClick={() => window.location.href = `/sbricksdemo/buyers/${lead.id}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {(lead.ai_quality_score || 0) >= 85 && <Flame className="h-3.5 w-3.5 text-orange-400" />}
                      <div>
                        <p className="text-sm font-medium text-white">{lead.full_name}</p>
                        <p className="text-xs text-white/40">{lead.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-bold ${getScoreColor(lead.ai_quality_score || 0)}`}>
                      {lead.ai_quality_score}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={lead.ai_classification === 'Hot Lead' ? 'destructive' : 'secondary'} className="text-[10px]">
                      {lead.ai_classification}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-white/70">{lead.development_name}</td>
                  <td className="px-4 py-3 text-sm text-white/70">{lead.budget_range}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${statusColors[lead.status] || 'text-white/50 bg-white/5'}`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/50 capitalize">{lead.source_platform}</span>
                      <ChevronRight className="h-4 w-4 text-white/20 group-hover:text-white/50 transition-colors" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
