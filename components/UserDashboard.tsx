'use client'

import { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useDashboardStats } from '@/hooks/useDashboardStats'
import { getGreeting, formatCurrency, formatNumber } from '@/lib/utils'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { getNBScoreColor } from '@/lib/scoring/nb-score'
import { NBScoreRing } from '@/components/ui/nb-score-ring'
import {
  Users,
  Flame,
  Target,
  ChevronRight,
  Sparkles,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Megaphone,
  Mail,
  X,
  ArrowUpRight,
  Loader2,
} from 'lucide-react'

interface UserDashboardProps {
  userType: 'developer' | 'agent' | 'broker'
  userName: string
  companyId?: string
}

// Classification colors — 6 categories for breakdown
const CLASSIFICATION_COLORS: Record<string, { bg: string; text: string; fill: string }> = {
  'Hot Lead': { bg: 'bg-red-500', text: 'text-red-400', fill: '#EF4444' },
  'Qualified': { bg: 'bg-emerald-500', text: 'text-emerald-400', fill: '#10B981' },
  'Warm': { bg: 'bg-amber-500', text: 'text-amber-400', fill: '#F59E0B' },
  'Nurture': { bg: 'bg-blue-500', text: 'text-blue-400', fill: '#3B82F6' },
  'Cold': { bg: 'bg-slate-400', text: 'text-slate-400', fill: '#94A3B8' },
  'Disqualified': { bg: 'bg-red-900', text: 'text-red-300', fill: '#7F1D1D' },
}

const config = {
  developer: {
    title: 'Buyers',
    metricLabel: 'Active Buyers',
  },
  agent: {
    title: 'Leads',
    metricLabel: 'Active Leads',
  },
  broker: {
    title: 'Clients',
    metricLabel: 'Active Clients',
  },
}

export function UserDashboard({ userType, userName, companyId }: UserDashboardProps) {
  const router = useRouter()
  const typeConfig = config[userType]
  const [showEmailBanner, setShowEmailBanner] = useState(false)
  const [emailConfirmed, setEmailConfirmed] = useState(true)

  // Get company name for broker matching
  const [companyName, setCompanyName] = useState<string | undefined>()
  useEffect(() => {
    try {
      const stored = localStorage.getItem('naybourhood_user')
      if (stored) {
        const user = JSON.parse(stored)
        setCompanyName(user.company)
      }
    } catch { /* ignore */ }
  }, [])

  // Use the optimized dashboard stats hook - loads in < 300ms!
  const {
    stats,
    recentLeads,
    topCampaigns,
    isLoading,
    isSyncing,
    loadTimeMs
  } = useDashboardStats(userType, companyId, companyName)

  // Extract stats based on user type
  const buyerStats = stats?.buyers
  const borrowerStats = stats?.borrowers
  const campaignStats = stats?.campaigns

  // Calculate metrics from pre-aggregated stats
  const metrics = useMemo(() => {
    if (userType === 'broker' && borrowerStats) {
      return {
        totalLeads: borrowerStats.total_leads || 0,
        hotLeads: borrowerStats.contact_pending || 0,
        avgScore: 0, // Brokers don't have AI scores
        totalSpend: 0,
        qualifiedRate: borrowerStats.total_leads > 0
          ? Math.round((borrowerStats.completed / borrowerStats.total_leads) * 100)
          : 0,
      }
    }

    if (buyerStats) {
      const totalLeads = buyerStats.total_leads || 0
      const hotLeads = buyerStats.hot_leads || 0
      const qualified = buyerStats.qualified || 0
      const qualifiedRate = totalLeads > 0 ? Math.round(((hotLeads + qualified) / totalLeads) * 100) : 0

      return {
        totalLeads,
        hotLeads,
        avgScore: buyerStats.avg_score || 0,
        totalSpend: campaignStats?.total_spend || 0,
        qualifiedRate,
      }
    }

    return {
      totalLeads: 0,
      hotLeads: 0,
      avgScore: 0,
      totalSpend: 0,
      qualifiedRate: 0,
    }
  }, [userType, buyerStats, borrowerStats, campaignStats])

  // Classification counts — 6 categories for breakdown
  const classificationCounts = useMemo(() => {
    if (userType === 'broker' && borrowerStats) {
      return {
        hotLead: borrowerStats.contact_pending || 0,
        qualified: borrowerStats.completed || 0,
        warm: borrowerStats.awaiting_docs || 0,
        nurture: borrowerStats.follow_up || 0,
        cold: borrowerStats.not_proceeding || 0,
        disqualified: 0,
      }
    }

    if (buyerStats) {
      return {
        hotLead: buyerStats.hot_leads || 0,
        qualified: buyerStats.qualified || 0,
        warm: buyerStats.needs_qualification || 0,
        nurture: buyerStats.nurture || 0,
        cold: buyerStats.low_priority || 0,
        disqualified: 0,
      }
    }

    return {
      hotLead: 0,
      qualified: 0,
      warm: 0,
      nurture: 0,
      cold: 0,
      disqualified: 0,
    }
  }, [userType, buyerStats, borrowerStats])

  // Get hot leads from recent leads (already fetched)
  const hotLeads = useMemo(() => {
    if (userType === 'broker') {
      return recentLeads.filter((l: any) => {
        const status = l.status?.toLowerCase() || ''
        return status.includes('contact') || status.includes('pending')
      }).slice(0, 5)
    }
    return recentLeads.filter((l: any) => {
      const score = l.ai_quality_score
      return l.ai_classification === 'Hot Lead' || (score && score >= 70)
    }).slice(0, 5)
  }, [recentLeads, userType])

  // Check if email confirmation is pending
  useEffect(() => {
    const checkEmailConfirmation = async () => {
      const emailPending = localStorage.getItem('naybourhood_email_pending')
      if (emailPending === 'true') {
        setShowEmailBanner(true)
        setEmailConfirmed(false)
        return
      }

      if (isSupabaseConfigured()) {
        try {
          const supabase = createClient()
          const { data: { user } } = await supabase.auth.getUser()
          if (user && !user.email_confirmed_at) {
            setShowEmailBanner(true)
            setEmailConfirmed(false)
          } else {
            localStorage.removeItem('naybourhood_email_pending')
          }
        } catch { /* ignore */ }
      }
    }
    checkEmailConfirmation()
  }, [])

  const handleResendConfirmation = async () => {
    if (!isSupabaseConfigured()) return
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        await supabase.auth.resend({ type: 'signup', email: user.email })
        alert('Confirmation email sent! Please check your inbox.')
      }
    } catch (err) {
      console.error('Failed to resend confirmation:', err)
      alert('Failed to resend confirmation email. Please try again.')
    }
  }

  const dismissEmailBanner = () => setShowEmailBanner(false)

  // Donut chart — 6 classification segments
  const total = Object.values(classificationCounts).reduce((a, b) => a + b, 0)
  const segments = [
    { name: 'Hot Lead', value: classificationCounts.hotLead, color: CLASSIFICATION_COLORS['Hot Lead'].fill },
    { name: 'Qualified', value: classificationCounts.qualified, color: CLASSIFICATION_COLORS['Qualified'].fill },
    { name: 'Warm', value: classificationCounts.warm, color: CLASSIFICATION_COLORS['Warm'].fill },
    { name: 'Nurture', value: classificationCounts.nurture, color: CLASSIFICATION_COLORS['Nurture'].fill },
    { name: 'Cold', value: classificationCounts.cold, color: CLASSIFICATION_COLORS['Cold'].fill },
    { name: 'Disqualified', value: classificationCounts.disqualified, color: CLASSIFICATION_COLORS['Disqualified'].fill },
  ]

  const generateDonutPaths = () => {
    if (total === 0) return null
    let currentAngle = -90
    const paths: JSX.Element[] = []
    const radius = 80, innerRadius = 50, cx = 100, cy = 100

    segments.forEach((segment, index) => {
      if (segment.value === 0) return
      const percentage = segment.value / total
      const angle = percentage * 360
      const startAngle = currentAngle
      const endAngle = currentAngle + angle
      const startRadians = (startAngle * Math.PI) / 180
      const endRadians = (endAngle * Math.PI) / 180
      const x1 = cx + radius * Math.cos(startRadians)
      const y1 = cy + radius * Math.sin(startRadians)
      const x2 = cx + radius * Math.cos(endRadians)
      const y2 = cy + radius * Math.sin(endRadians)
      const x3 = cx + innerRadius * Math.cos(endRadians)
      const y3 = cy + innerRadius * Math.sin(endRadians)
      const x4 = cx + innerRadius * Math.cos(startRadians)
      const y4 = cy + innerRadius * Math.sin(startRadians)
      const largeArc = angle > 180 ? 1 : 0
      const path = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`
      paths.push(<path key={index} d={path} fill={segment.color} className="transition-all duration-300 hover:opacity-80" />)
      currentAngle += angle
    })
    return paths
  }

  // Loading state - show skeletons only on first load
  if (isLoading && !stats) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">{getGreeting()}, {userName}</h2>
          <p className="text-sm text-white/50 mt-1">Here&apos;s your buyer intelligence overview</p>
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
      </div>
    )
  }

  // Not assigned to company
  if (!companyId) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">{getGreeting()}, {userName}</h2>
          <p className="text-sm text-white/50 mt-1">Here&apos;s your buyer intelligence overview</p>
        </div>
        <div className="bg-[#111111] border border-white/10 rounded-2xl p-12 text-center">
          <Users className="h-12 w-12 text-white/30 mx-auto mb-4" />
          <p className="text-white/60">Your account is not linked to a company.</p>
          <p className="text-sm text-white/40 mt-2">Contact an administrator to assign you to a company.</p>
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

      {/* Load time indicator (dev) */}
      {loadTimeMs > 0 && (
        <div className="text-xs text-white/30 text-right">
          Loaded in {loadTimeMs}ms
        </div>
      )}

      {/* Email Confirmation Banner */}
      {showEmailBanner && !emailConfirmed && (
        <div className="bg-gradient-to-r from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Mail className="w-6 h-6 text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-semibold">Confirm your email</h3>
            <p className="text-white/60 text-sm">Please confirm your email address to unlock all features.</p>
          </div>
          <button onClick={handleResendConfirmation} className="px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white font-medium rounded-xl transition-colors flex items-center gap-2">
            <Mail className="w-4 h-4" /> Resend Email
          </button>
          <button onClick={dismissEmailBanner} className="p-2 text-white/40 hover:text-white/60 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* KPI Cards — 4 hero metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Buyers */}
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

        {/* Hot Leads */}
        <div className="bg-[#111111] border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
              <Flame className="w-5 h-5 text-red-400" />
            </div>
            {metrics.hotLeads > 0 && (
              <span className="text-red-400 text-xs font-medium bg-red-500/10 px-2 py-1 rounded-full">Priority</span>
            )}
          </div>
          <p className="text-white/50 text-sm">Hot Leads</p>
          <p className="text-white text-3xl font-bold mt-1">{metrics.hotLeads}</p>
        </div>

        {/* Average NB Score — hero metric with colour coding */}
        <div className="bg-[#111111] border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <p className="text-white/50 text-sm">Average NB Score</p>
          <div className="flex items-center gap-3 mt-1">
            <NBScoreRing score={Math.round(metrics.avgScore)} size={48} />
            <p className="text-3xl font-bold" style={{ color: getNBScoreColor(Math.round(metrics.avgScore)) }}>
              {Math.round(metrics.avgScore)}
            </p>
          </div>
        </div>

        {/* Qualified Rate */}
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

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-5 lg:grid-cols-2 gap-6">
        {/* Lead Classification Donut */}
        <div className="xl:col-span-2 bg-[#111111] border border-white/10 rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-6">Lead Classification</h3>
          {total > 0 ? (
            <div className="flex flex-col xl:flex-row items-center gap-6">
              <div className="relative flex-shrink-0">
                <svg width="180" height="180" viewBox="0 0 200 200">{generateDonutPaths()}</svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-white text-2xl font-bold">{total}</p>
                    <p className="text-white/40 text-xs">Total</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2 w-full xl:w-auto">
                {segments.map((segment) => (
                  <div key={segment.name} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: segment.color }} />
                    <p className="text-white/70 text-sm flex-1 truncate">{segment.name}</p>
                    <p className="text-white font-medium text-sm">{segment.value}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-white/40">No leads to display</div>
          )}
        </div>

        {/* Hot Leads List */}
        <div className="xl:col-span-3 bg-[#111111] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Flame className="w-5 h-5 text-red-400" /> Hot {typeConfig.title}
            </h3>
            <Link href={userType === 'broker' ? `/${userType}/borrowers` : `/${userType}/buyers`} className="text-emerald-400 text-sm hover:underline flex items-center gap-1">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {hotLeads.length > 0 ? (
              hotLeads.map((lead: any) => (
                <Link
                  key={lead.id}
                  href={userType === 'broker' ? `/${userType}/borrowers` : `/${userType}/buyers`}
                  className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors group"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500/20 to-red-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold text-sm">{(lead.first_name || lead.full_name || 'U').charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <p className="text-white font-medium truncate text-sm">{lead.full_name}</p>
                    <p className="text-white/50 text-xs truncate max-w-[200px] xl:max-w-[300px]">
                      {userType === 'broker'
                        ? `${lead.finance_type || 'Finance'} • ${lead.loan_amount ? `£${Number(lead.loan_amount).toLocaleString()}` : 'No amount'}`
                        : (lead.ai_summary || `${lead.budget_range || 'No budget'} • ${lead.timeline_to_purchase || 'No timeline'}`)}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {userType === 'broker' ? (
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        lead.status?.toLowerCase().includes('active') ? 'bg-emerald-500/20 text-emerald-400' :
                        lead.status?.toLowerCase().includes('pending') ? 'bg-amber-500/20 text-amber-400' :
                        'bg-white/10 text-white/60'
                      }`}>{lead.status || 'Pending'}</span>
                    ) : (
                      <>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-sm" style={{ color: getNBScoreColor(lead.final_score ?? lead.ai_quality_score ?? 0) }}>
                            {lead.final_score ?? lead.ai_quality_score ?? '-'}
                          </span>
                          <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${lead.final_score ?? lead.ai_quality_score ?? 0}%`, backgroundColor: getNBScoreColor(lead.final_score ?? lead.ai_quality_score ?? 0) }} />
                          </div>
                        </div>
                        <p className="text-white/40 text-[10px] mt-0.5 truncate max-w-[80px]">{lead.development_name || lead.source_platform || '-'}</p>
                      </>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors flex-shrink-0" />
                </Link>
              ))
            ) : (
              <div className="text-center py-8 text-white/40">No hot {typeConfig.title.toLowerCase()} yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Campaign Performance */}
      {topCampaigns.length > 0 && (
        <div className="bg-[#111111] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-purple-400" /> Campaign Performance
            </h3>
            <Link href={`/${userType}/campaigns`} className="text-emerald-400 text-sm hover:underline flex items-center gap-1">
              View all campaigns <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-white/50 text-sm border-b border-white/10">
                  <th className="pb-4 font-medium">Campaign</th>
                  <th className="pb-4 font-medium">Spend</th>
                  <th className="pb-4 font-medium">Leads</th>
                  <th className="pb-4 font-medium">CPL</th>
                  <th className="pb-4 font-medium">CTR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {topCampaigns.slice(0, 5).map((campaign: any, idx: number) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                          <Megaphone className="w-4 h-4 text-purple-400" />
                        </div>
                        <p className="text-white font-medium truncate max-w-[200px]">{campaign.campaign_name}</p>
                      </div>
                    </td>
                    <td className="py-4 text-white">{formatCurrency(campaign.spend || 0)}</td>
                    <td className="py-4 text-white">{campaign.leads || 0}</td>
                    <td className="py-4 text-white">{formatCurrency(campaign.cpl || 0)}</td>
                    <td className="py-4 text-white">{campaign.ctr || 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AI Insights */}
      <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold">AI Insights</h3>
            <p className="text-white/50 text-sm">Naybourhood intelligence recommendations</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/5 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span className="text-white font-medium text-sm">High Conversion Potential</span>
            </div>
            <p className="text-white/60 text-sm">
              {metrics.hotLeads} hot {typeConfig.title.toLowerCase()} ready for follow-up. Prioritize outreach to maximize conversions.
            </p>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span className="text-white font-medium text-sm">Qualification Gap</span>
            </div>
            <p className="text-white/60 text-sm">
              {classificationCounts.warm} {typeConfig.title.toLowerCase()} need qualification. Consider WhatsApp outreach.
            </p>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <span className="text-white font-medium text-sm">Performance Insight</span>
            </div>
            <p className="text-white/60 text-sm">
              {metrics.qualifiedRate}% qualification rate. {metrics.qualifiedRate >= 50 ? 'Great performance!' : 'Consider optimizing your targeting.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
