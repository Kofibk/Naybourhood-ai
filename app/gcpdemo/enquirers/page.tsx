'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ALL_ENQUIRERS } from '@/lib/gcpdemo'
import type { DemoEnquirer, PipelineStatus, RiskLevel } from '@/lib/gcpdemo/types'
import { Search, Filter, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

type ScoreBand = 'all' | '80+' | '60-79' | '40-59' | '<40'

function getScoreBand(score: number): ScoreBand {
  if (score >= 80) return '80+'
  if (score >= 60) return '60-79'
  if (score >= 40) return '40-59'
  return '<40'
}

export default function EnquirersPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<PipelineStatus | 'all'>('all')
  const [scoreBand, setScoreBand] = useState<ScoreBand>('all')
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'all'>('all')
  const [verificationFilter, setVerificationFilter] = useState<string>('all')
  const [sortField, setSortField] = useState<'aiScore' | 'fullName' | 'daysInPipeline'>('aiScore')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const statuses: PipelineStatus[] = [
    'Scored', 'Viewing Booked', 'Viewing Complete', 'Verification In Progress',
    'Verified', 'Tenancy Signed', 'Flagged', 'Fell Through', 'Archived',
  ]

  const filtered = useMemo(() => {
    let result = ALL_ENQUIRERS

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(e =>
        e.fullName.toLowerCase().includes(q) ||
        e.employer.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q)
      )
    }
    if (statusFilter !== 'all') {
      result = result.filter(e => e.pipelineStatus === statusFilter)
    }
    if (scoreBand !== 'all') {
      result = result.filter(e => getScoreBand(e.aiScore) === scoreBand)
    }
    if (riskFilter !== 'all') {
      result = result.filter(e => e.riskLevel === riskFilter)
    }
    if (verificationFilter !== 'all') {
      result = result.filter(e => e.verificationStatus === verificationFilter)
    }

    result = [...result].sort((a, b) => {
      const aVal = a[sortField]
      const bVal = b[sortField]
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number)
    })

    return result
  }, [search, statusFilter, scoreBand, riskFilter, verificationFilter, sortField, sortDir])

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  const hasFilters = statusFilter !== 'all' || scoreBand !== 'all' || riskFilter !== 'all' || verificationFilter !== 'all'

  return (
    <div className="space-y-4">
      {/* Search + Filters */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search by name, employer, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#111111] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/50"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as PipelineStatus | 'all')}
            className="bg-[#111111] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
          >
            <option value="all">All Statuses</option>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={scoreBand}
            onChange={(e) => setScoreBand(e.target.value as ScoreBand)}
            className="bg-[#111111] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
          >
            <option value="all">All Scores</option>
            <option value="80+">80+ (Priority)</option>
            <option value="60-79">60-79 (Qualified)</option>
            <option value="40-59">40-59 (Medium)</option>
            <option value="<40">&lt;40 (Low)</option>
          </select>
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value as RiskLevel | 'all')}
            className="bg-[#111111] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
          >
            <option value="all">All Risk</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
          <select
            value={verificationFilter}
            onChange={(e) => setVerificationFilter(e.target.value)}
            className="bg-[#111111] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
          >
            <option value="all">All Verification</option>
            <option value="Verified">Verified</option>
            <option value="Verifying">Verifying</option>
            <option value="Failed">Failed</option>
            <option value="Not Started">Not Started</option>
          </select>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setStatusFilter('all'); setScoreBand('all'); setRiskFilter('all'); setVerificationFilter('all') }}
              className="text-white/50 hover:text-white text-xs"
            >
              <X className="w-3 h-3 mr-1" /> Clear
            </Button>
          )}
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-white/40">{filtered.length} enquirer{filtered.length !== 1 ? 's' : ''}</p>

      {/* Table */}
      <div className="bg-[#111111] border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider cursor-pointer hover:text-white/60" onClick={() => handleSort('fullName')}>
                  Name {sortField === 'fullName' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Employer / Role</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider cursor-pointer hover:text-white/60" onClick={() => handleSort('aiScore')}>
                  Score {sortField === 'aiScore' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Risk</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Verification</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Unit</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider cursor-pointer hover:text-white/60" onClick={() => handleSort('daysInPipeline')}>
                  Days {sortField === 'daysInPipeline' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr
                  key={e.id}
                  onClick={() => router.push(`/gcpdemo/enquirers/${e.id}`)}
                  className="border-b border-white/5 hover:bg-white/[0.03] cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 text-white font-medium">{e.fullName}</td>
                  <td className="px-4 py-3">
                    <p className="text-white/70">{e.employer}</p>
                    <p className="text-xs text-white/40">{e.role}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-bold text-base ${
                      e.aiScore >= 70 ? 'text-emerald-400' :
                      e.aiScore >= 45 ? 'text-amber-400' : 'text-gray-400'
                    }`}>{e.aiScore}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      e.pipelineStatus === 'Verified' || e.pipelineStatus === 'Tenancy Signed' ? 'bg-emerald-500/20 text-emerald-400' :
                      e.pipelineStatus === 'Flagged' ? 'bg-red-500/20 text-red-400' :
                      e.pipelineStatus === 'Archived' || e.pipelineStatus === 'Fell Through' ? 'bg-gray-500/20 text-gray-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>{e.pipelineStatus}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs ${
                      e.riskLevel === 'Low' ? 'text-emerald-400' :
                      e.riskLevel === 'Medium' ? 'text-amber-400' : 'text-red-400'
                    }`}>{e.riskLevel}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs ${
                      e.verificationStatus === 'Verified' ? 'text-emerald-400' :
                      e.verificationStatus === 'Verifying' ? 'text-amber-400' :
                      e.verificationStatus === 'Failed' ? 'text-red-400' : 'text-white/40'
                    }`}>{e.verificationStatus}</span>
                  </td>
                  <td className="px-4 py-3 text-white/50">{e.linkedUnit || '—'}</td>
                  <td className="px-4 py-3 text-white/50">{e.daysInPipeline}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rows now navigate to /gcpdemo/enquirers/[id] detail page */}
    </div>
  )
}
