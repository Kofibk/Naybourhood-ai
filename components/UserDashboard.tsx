'use client'

import { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useData } from '@/contexts/DataContext'
import { getGreeting, formatCurrency, formatNumber } from '@/lib/utils'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import {
  Users,
  Flame,
  Target,
  Wallet,
  BarChart3,
  ChevronRight,
  Sparkles,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Megaphone,
  Mail,
  X,
  ArrowUpRight,
} from 'lucide-react'

interface UserDashboardProps {
  userType: 'developer' | 'agent' | 'broker'
  userName: string
  companyId?: string
}

// Classification colors matching the demo
const CLASSIFICATION_COLORS = {
  'Hot Lead': { bg: 'bg-red-500', text: 'text-red-400', fill: '#EF4444' },
  'Qualified': { bg: 'bg-emerald-500', text: 'text-emerald-400', fill: '#10B981' },
  'Needs Qualification': { bg: 'bg-amber-500', text: 'text-amber-400', fill: '#F59E0B' },
  'Nurture': { bg: 'bg-blue-500', text: 'text-blue-400', fill: '#3B82F6' },
  'Low Priority': { bg: 'bg-slate-500', text: 'text-slate-400', fill: '#64748B' },
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
  const { leads, campaigns, financeLeads, isLoading, isSyncing } = useData()
  const typeConfig = config[userType]
  const [showEmailBanner, setShowEmailBanner] = useState(false)
  const [emailConfirmed, setEmailConfirmed] = useState(true)

  // Check if email confirmation is pending
  useEffect(() => {
    const checkEmailConfirmation = async () => {
      // Check localStorage flag first
      const emailPending = localStorage.getItem('naybourhood_email_pending')
      if (emailPending === 'true') {
        setShowEmailBanner(true)
        setEmailConfirmed(false)
        return
      }

      // Also check with Supabase if configured
      if (isSupabaseConfigured()) {
        try {
          const supabase = createClient()
          const { data: { user } } = await supabase.auth.getUser()
          if (user && !user.email_confirmed_at) {
            setShowEmailBanner(true)
            setEmailConfirmed(false)
          } else {
            // Email is confirmed, clear the flag
            localStorage.removeItem('naybourhood_email_pending')
          }
        } catch {
          // Ignore errors
        }
      }
    }

    checkEmailConfirmation()
  }, [])

  // Handle resend confirmation email
  const handleResendConfirmation = async () => {
    if (!isSupabaseConfigured()) return

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        await supabase.auth.resend({
          type: 'signup',
          email: user.email,
        })
        alert('Confirmation email sent! Please check your inbox.')
      }
    } catch (err) {
      console.error('Failed to resend confirmation:', err)
      alert('Failed to resend confirmation email. Please try again.')
    }
  }

  // Dismiss email banner
  const dismissEmailBanner = () => {
    setShowEmailBanner(false)
  }

  // Filter leads by companyId for multi-tenant data isolation
  // For brokers, use financeLeads (borrowers) instead of leads (buyers)
  const myLeads = useMemo(() => {
    if (!companyId) return []

    // Brokers use financeLeads (borrowers)
    if (userType === 'broker') {
      // Get company name for text-based matching
      let companyName: string | undefined
      try {
        const stored = localStorage.getItem('naybourhood_user')
        if (stored) {
          const user = JSON.parse(stored)
          companyName = user.company
        }
      } catch { /* ignore */ }

      return financeLeads.filter(lead => {
        // Match by company_id (UUID match)
        if (lead.company_id === companyId) return true
        // Match by company name (text match)
        if (companyName && lead.company?.toLowerCase() === companyName.toLowerCase()) return true
        return false
      })
    }

    // Test company ID - show all leads for testing
    if (companyId === 'mph-company') {
      return leads
    }
    return leads.filter(lead => lead.company_id === companyId)
  }, [leads, financeLeads, companyId, userType])

  // Filter campaigns by companyId
  const myCampaigns = useMemo(() => {
    if (!companyId) return []
    if (companyId === 'mph-company') {
      return campaigns
    }
    return campaigns.filter(c => c.company_id === companyId)
  }, [campaigns, companyId])

  // Get hot leads (score >= 70 or classification is 'Hot Lead')
  // For brokers, get leads with active/urgent status
  const hotLeads = useMemo(() => {
    if (userType === 'broker') {
      // For brokers, prioritize by status
      return myLeads.filter((l: any) => {
        const status = l.status?.toLowerCase() || ''
        return status.includes('active') || status.includes('urgent') || status.includes('qualified')
      }).slice(0, 5)
    }
    return myLeads.filter((l: any) => {
      const score = l.ai_quality_score ?? l.quality_score
      const isHotClassification = l.ai_classification === 'Hot Lead'
      const isHighScore = score !== null && score !== undefined && score >= 70
      return isHotClassification || isHighScore
    }).slice(0, 5)
  }, [myLeads, userType])

  // Calculate classification counts for donut chart
  // For brokers, use status-based classification
  const classificationCounts = useMemo(() => {
    const counts = {
      hotLead: 0,
      qualified: 0,
      needsQualification: 0,
      nurture: 0,
      lowPriority: 0,
    }

    myLeads.forEach((lead: any) => {
      if (userType === 'broker') {
        // For brokers, map status to classifications
        const status = lead.status?.toLowerCase() || ''
        if (status.includes('active') || status.includes('urgent')) {
          counts.hotLead++
        } else if (status.includes('qualified') || status.includes('approved')) {
          counts.qualified++
        } else if (status.includes('pending') || status.includes('contact')) {
          counts.needsQualification++
        } else if (status.includes('follow') || status.includes('nurture')) {
          counts.nurture++
        } else {
          counts.lowPriority++
        }
      } else {
        const classification = lead.ai_classification?.toLowerCase() || ''
        if (classification.includes('hot')) {
          counts.hotLead++
        } else if (classification.includes('qualified') && !classification.includes('needs')) {
          counts.qualified++
        } else if (classification.includes('needs') || classification.includes('qualification')) {
          counts.needsQualification++
        } else if (classification.includes('nurture')) {
          counts.nurture++
        } else {
          counts.lowPriority++
        }
      }
    })

    return counts
  }, [myLeads, userType])

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalLeads = myLeads.length
    const hotLeadsCount = classificationCounts.hotLead
    const qualifiedCount = classificationCounts.qualified + classificationCounts.hotLead
    const qualifiedRate = totalLeads > 0 ? Math.round((qualifiedCount / totalLeads) * 100) : 0

    // Calculate average AI score (for brokers, use 0 as they don't have AI scores)
    let avgScore = 0
    if (userType !== 'broker') {
      const scoredLeads = myLeads.filter((l: any) => l.ai_quality_score !== null && l.ai_quality_score !== undefined)
      avgScore = scoredLeads.length > 0
        ? Math.round(scoredLeads.reduce((sum: number, l: any) => sum + (l.ai_quality_score || 0), 0) / scoredLeads.length)
        : 0
    }

    // Calculate total spend from campaigns
    const totalSpend = myCampaigns.reduce((sum, c) => sum + (c.spend || 0), 0)

    return {
      totalLeads,
      hotLeads: hotLeadsCount,
      avgScore,
      totalSpend,
      qualifiedRate,
    }
  }, [myLeads, myCampaigns, classificationCounts])

  // Donut chart segments
  const total = Object.values(classificationCounts).reduce((a, b) => a + b, 0)
  const segments = [
    { name: 'Hot Lead', value: classificationCounts.hotLead, color: CLASSIFICATION_COLORS['Hot Lead'].fill },
    { name: 'Qualified', value: classificationCounts.qualified, color: CLASSIFICATION_COLORS['Qualified'].fill },
    { name: 'Needs Qualification', value: classificationCounts.needsQualification, color: CLASSIFICATION_COLORS['Needs Qualification'].fill },
    { name: 'Nurture', value: classificationCounts.nurture, color: CLASSIFICATION_COLORS['Nurture'].fill },
    { name: 'Low Priority', value: classificationCounts.lowPriority, color: CLASSIFICATION_COLORS['Low Priority'].fill },
  ]

  // Generate SVG paths for donut chart
  const generateDonutPaths = () => {
    if (total === 0) return null

    let currentAngle = -90 // Start from top
    const paths: JSX.Element[] = []
    const radius = 80
    const innerRadius = 50
    const cx = 100
    const cy = 100

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

      paths.push(
        <path
          key={index}
          d={path}
          fill={segment.color}
          className="transition-all duration-300 hover:opacity-80"
        />
      )

      currentAngle += angle
    })

    return paths
  }

  // Only show loading skeletons if we have NO data and are loading
  // If we have cached data, show it while syncing in background
  // For brokers, check financeLeads instead of leads
  const hasData = userType === 'broker'
    ? financeLeads.length > 0 || campaigns.length > 0
    : leads.length > 0 || campaigns.length > 0
  if (isLoading && !hasData) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">
            {getGreeting()}, {userName}
          </h2>
          <p className="text-sm text-white/50 mt-1">Here&apos;s your buyer intelligence overview</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
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

  // Show message if not assigned to a company
  if (!companyId) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">
            {getGreeting()}, {userName}
          </h2>
          <p className="text-sm text-white/50 mt-1">Here&apos;s your buyer intelligence overview</p>
        </div>
        <div className="bg-[#111111] border border-white/10 rounded-2xl p-12 text-center">
          <Users className="h-12 w-12 text-white/30 mx-auto mb-4" />
          <p className="text-white/60">Your account is not linked to a company.</p>
          <p className="text-sm text-white/40 mt-2">
            Contact an administrator to assign you to a company to view your dashboard.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Email Confirmation Banner */}
      {showEmailBanner && !emailConfirmed && (
        <div className="bg-gradient-to-r from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Mail className="w-6 h-6 text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-semibold">Confirm your email</h3>
            <p className="text-white/60 text-sm">
              Please confirm your email address to unlock all features and secure your account.
            </p>
          </div>
          <button
            onClick={handleResendConfirmation}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white font-medium rounded-xl transition-colors flex items-center gap-2"
          >
            <Mail className="w-4 h-4" />
            Resend Email
          </button>
          <button
            onClick={dismissEmailBanner}
            className="p-2 text-white/40 hover:text-white/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
          <p className="text-white/50 text-sm">Hot {typeConfig.title}</p>
          <p className="text-white text-3xl font-bold mt-1">{metrics.hotLeads}</p>
        </div>

        <div className="bg-[#111111] border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
              <Target className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <p className="text-white/50 text-sm">Avg AI Score</p>
          <p className="text-white text-3xl font-bold mt-1">{metrics.avgScore}</p>
        </div>

        <div className="bg-[#111111] border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
              <Wallet className="w-5 h-5 text-purple-400" />
            </div>
          </div>
          <p className="text-white/50 text-sm">Total Spend</p>
          <p className="text-white text-3xl font-bold mt-1">{formatCurrency(metrics.totalSpend)}</p>
        </div>

        <div className="bg-[#111111] border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-amber-400" />
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
                <svg width="180" height="180" viewBox="0 0 200 200">
                  {generateDonutPaths()}
                </svg>
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
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: segment.color }}
                    />
                    <p className="text-white/70 text-sm flex-1 truncate">{segment.name}</p>
                    <p className="text-white font-medium text-sm">{segment.value}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-white/40">
              No leads to display
            </div>
          )}
        </div>

        {/* Hot Leads List */}
        <div className="xl:col-span-3 bg-[#111111] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Flame className="w-5 h-5 text-red-400" />
              Hot {typeConfig.title}
            </h3>
            <Link
              href={`/${userType}/buyers`}
              className="text-emerald-400 text-sm hover:underline flex items-center gap-1"
            >
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {hotLeads.length > 0 ? (
              hotLeads.map((lead) => (
                <Link
                  key={lead.id}
                  href={`/${userType}/buyers`}
                  className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors group"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500/20 to-red-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold text-sm">
                      {(lead.first_name || lead.full_name || 'U').charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <p className="text-white font-medium truncate text-sm">{lead.full_name}</p>
                    <p className="text-white/50 text-xs truncate max-w-[200px] xl:max-w-[300px]">
                      {lead.ai_summary || `${lead.budget || 'No budget'} • ${lead.timeline || 'No timeline'}`}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-emerald-400 font-semibold text-sm">
                        {lead.ai_quality_score ?? lead.quality_score ?? '-'}
                      </span>
                      <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-400 rounded-full"
                          style={{ width: `${lead.ai_quality_score ?? lead.quality_score ?? 0}%` }}
                        />
                      </div>
                    </div>
                    <p className="text-white/40 text-[10px] mt-0.5 truncate max-w-[80px]">{lead.development_name || lead.source || '-'}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors flex-shrink-0" />
                </Link>
              ))
            ) : (
              <div className="text-center py-8 text-white/40">
                No hot {typeConfig.title.toLowerCase()} yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Campaign Performance */}
      {myCampaigns.length > 0 && (
        <div className="bg-[#111111] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-purple-400" />
              Campaign Performance
            </h3>
            <Link
              href={`/${userType}/campaigns`}
              className="text-emerald-400 text-sm hover:underline flex items-center gap-1"
            >
              View all campaigns <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-white/50 text-sm border-b border-white/10">
                  <th className="pb-4 font-medium">Campaign</th>
                  <th className="pb-4 font-medium">Platform</th>
                  <th className="pb-4 font-medium">Spend</th>
                  <th className="pb-4 font-medium">Leads</th>
                  <th className="pb-4 font-medium">CPL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {myCampaigns.slice(0, 5).map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                          <Megaphone className="w-4 h-4 text-purple-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{campaign.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className="px-2.5 py-1 bg-white/5 text-white/70 text-sm rounded-lg">
                        {campaign.platform || 'Meta'}
                      </span>
                    </td>
                    <td className="py-4 text-white">{formatCurrency(campaign.spend || 0)}</td>
                    <td className="py-4 text-white">{campaign.leads || 0}</td>
                    <td className="py-4 text-white">{formatCurrency(campaign.cpl || 0)}</td>
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
              {hotLeads.length} hot {typeConfig.title.toLowerCase()} ready for follow-up. Prioritize outreach to maximize conversions.
            </p>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span className="text-white font-medium text-sm">Qualification Gap</span>
            </div>
            <p className="text-white/60 text-sm">
              {classificationCounts.needsQualification} {typeConfig.title.toLowerCase()} need qualification. Consider WhatsApp outreach for faster engagement.
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
