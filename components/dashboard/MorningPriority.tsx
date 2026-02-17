'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useDashboardStats } from '@/hooks/useDashboardStats'
import { getGreeting, getDateString, formatNumber } from '@/lib/utils'
import { getNBScoreColor } from '@/lib/scoring/nb-score'
import { NBScoreRing } from '@/components/ui/nb-score-ring'
import { LeadCard } from './LeadCard'
import {
  Users,
  Flame,
  Sparkles,
  Target,
  ChevronRight,
  Loader2,
  Filter,
  ArrowUpRight,
} from 'lucide-react'

interface MorningPriorityProps {
  userType: 'developer' | 'agent' | 'broker'
  userName: string
  companyId?: string
  companyName?: string
  planBadge?: string
}

export function MorningPriority({
  userType,
  userName,
  companyId,
  companyName,
  planBadge = 'Trial',
}: MorningPriorityProps) {
  const {
    stats,
    recentLeads,
    isLoading,
    isSyncing,
  } = useDashboardStats(userType, companyId, companyName)

  const [classificationFilter, setClassificationFilter] = useState<string>('all')

  const buyerStats = stats?.buyers
  const borrowerStats = stats?.borrowers

  const metrics = useMemo(() => {
    if (userType === 'broker' && borrowerStats) {
      return {
        totalLeads: borrowerStats.total_leads || 0,
        hotLeads: borrowerStats.contact_pending || 0,
        avgScore: 0,
        qualifiedRate: borrowerStats.total_leads > 0
          ? Math.round((borrowerStats.completed / borrowerStats.total_leads) * 100)
          : 0,
      }
    }

    if (buyerStats) {
      const totalLeads = buyerStats.total_leads || 0
      const hotLeads = buyerStats.hot_leads || 0
      const qualified = buyerStats.qualified || 0
      const qualifiedRate = totalLeads > 0
        ? Math.round(((hotLeads + qualified) / totalLeads) * 100)
        : 0

      return {
        totalLeads,
        hotLeads,
        avgScore: buyerStats.avg_score || 0,
        qualifiedRate,
      }
    }

    return { totalLeads: 0, hotLeads: 0, avgScore: 0, qualifiedRate: 0 }
  }, [userType, buyerStats, borrowerStats])

  // Sort leads: Hot first, then Qualified, then by score
  const sortedLeads = useMemo(() => {
    const classificationOrder: Record<string, number> = {
      'Hot Lead': 0,
      'Hot': 0,
      'Qualified': 1,
      'Warm-Qualified': 1,
      'Needs Qualification': 2,
      'Warm-Engaged': 2,
      'Nurture': 3,
      'Nurture-Premium': 3,
      'Nurture-Standard': 3,
      'Low Priority': 4,
      'Cold': 4,
    }

    let leads = [...recentLeads]

    if (classificationFilter !== 'all') {
      leads = leads.filter((l) => {
        const cls = l.ai_classification || ''
        return cls === classificationFilter
      })
    }

    return leads.sort((a, b) => {
      const aOrder = classificationOrder[a.ai_classification || ''] ?? 5
      const bOrder = classificationOrder[b.ai_classification || ''] ?? 5
      if (aOrder !== bOrder) return aOrder - bOrder
      return (b.ai_quality_score || 0) - (a.ai_quality_score || 0)
    })
  }, [recentLeads, classificationFilter])

  const typeConfig = {
    developer: { title: 'Buyers', path: '/developer/buyers' },
    agent: { title: 'Leads', path: '/agent/buyers' },
    broker: { title: 'Clients', path: '/broker/borrowers' },
  }[userType]

  if (isLoading && !stats) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">{getGreeting()}, {userName}</h2>
          <p className="text-sm text-white/50 mt-1">{getDateString()}</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-[#111111] border border-white/10 rounded-2xl p-5">
              <div className="animate-pulse">
                <div className="h-10 w-10 bg-white/10 rounded-xl mb-3" />
                <div className="h-4 w-20 bg-white/10 rounded mb-2" />
                <div className="h-8 w-16 bg-white/10 rounded" />
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[#111111] border border-white/10 rounded-xl p-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-white/10 rounded" />
                  <div className="h-3 w-48 bg-white/10 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Sync indicator */}
      {isSyncing && (
        <div className="fixed top-4 right-4 bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-full text-xs flex items-center gap-2 z-50">
          <Loader2 className="w-3 h-3 animate-spin" />
          Syncing...
        </div>
      )}

      {/* Greeting card */}
      <div className="bg-gradient-to-r from-[#111111] to-[#0d0d0d] border border-white/10 rounded-2xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {getGreeting()}, {userName}
            </h2>
            <p className="text-sm text-white/50 mt-1">{getDateString()}</p>
            {companyName && (
              <p className="text-sm text-white/40 mt-0.5">{companyName}</p>
            )}
          </div>
          <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
            {planBadge}
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#111111] border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-white/50 text-sm">Total {typeConfig.title}</p>
          <p className="text-white text-3xl font-bold mt-1">{formatNumber(metrics.totalLeads)}</p>
        </div>

        <div className="bg-[#111111] border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
              <Flame className="w-5 h-5 text-red-400" />
            </div>
            {metrics.hotLeads > 0 && (
              <span className="text-red-400 text-xs font-medium bg-red-500/10 px-2 py-1 rounded-full">
                Priority
              </span>
            )}
          </div>
          <p className="text-white/50 text-sm">Hot Leads</p>
          <p className="text-white text-3xl font-bold mt-1">{metrics.hotLeads}</p>
        </div>

        <div className="bg-[#111111] border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <p className="text-white/50 text-sm">Avg NB Score</p>
          <div className="flex items-center gap-3 mt-1">
            <NBScoreRing score={Math.round(metrics.avgScore)} size={48} />
            <p className="text-3xl font-bold" style={{ color: getNBScoreColor(Math.round(metrics.avgScore)) }}>
              {Math.round(metrics.avgScore)}
            </p>
          </div>
        </div>

        <div className="bg-[#111111] border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
              <Target className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <p className="text-white/50 text-sm">Qualified Rate</p>
          <p className="text-white text-3xl font-bold mt-1">{metrics.qualifiedRate}%</p>
        </div>
      </div>

      {/* Priority Leads */}
      <div className="bg-[#111111] border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Flame className="w-5 h-5 text-red-400" />
            Priority {typeConfig.title}
          </h3>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-white/5 rounded-lg p-0.5">
              {['all', 'Hot Lead', 'Qualified', 'Needs Qualification'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setClassificationFilter(filter)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    classificationFilter === filter
                      ? 'bg-white/10 text-white'
                      : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  {filter === 'all' ? 'All' : filter}
                </button>
              ))}
            </div>
            <Link
              href={typeConfig.path}
              className="text-emerald-400 text-sm hover:underline flex items-center gap-1"
            >
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="space-y-2">
          {sortedLeads.length > 0 ? (
            sortedLeads.slice(0, 10).map((lead) => (
              <LeadCard
                key={lead.id}
                id={lead.id}
                firstName={lead.first_name}
                lastName={lead.last_name}
                fullName={lead.full_name}
                nbScore={lead.ai_quality_score ?? 0}
                classification={lead.ai_classification || 'Needs Qualification'}
                aiSummary={lead.ai_summary}
                dateAdded={lead.date_added || lead.created_at}
                userType={userType}
              />
            ))
          ) : (
            <div className="text-center py-12 text-white/40">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>No {typeConfig.title.toLowerCase()} yet</p>
              <p className="text-sm mt-1">Import leads or connect a lead source to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
