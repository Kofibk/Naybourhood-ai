'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useMountAnvilDemo } from '@/contexts/MountAnvilDemoContext'
import {
  DEMO_DEVELOPMENTS,
  DEMO_CAMPAIGNS,
  DEMO_BUYERS,
  getDemoMetrics,
  getClassificationCounts,
  getHotLeadAlerts,
  getDemoBuyersByDevelopment,
  getDemoCampaignsByDevelopment,
} from '@/lib/mount-anvil-demo-data'
import { getGreeting, formatCurrency, formatNumber } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Megaphone,
  Building2,
  TrendingUp,
  Flame,
  Target,
  Wallet,
  BarChart3,
  ChevronDown,
  LogOut,
  Bell,
  Phone,
  Mail,
  Calendar,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ChevronRight,
  Sparkles,
  Eye,
  X,
} from 'lucide-react'

// Classification colors
const CLASSIFICATION_COLORS = {
  'Hot Lead': { bg: 'bg-red-500', text: 'text-red-400', fill: '#EF4444' },
  'Qualified': { bg: 'bg-emerald-500', text: 'text-emerald-400', fill: '#10B981' },
  'Needs Qualification': { bg: 'bg-amber-500', text: 'text-amber-400', fill: '#F59E0B' },
  'Nurture': { bg: 'bg-blue-500', text: 'text-blue-400', fill: '#3B82F6' },
  'Low Priority': { bg: 'bg-slate-500', text: 'text-slate-400', fill: '#64748B' },
}

export default function MountAnvilDashboard() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading, logout } = useMountAnvilDemo()
  const [selectedDevelopment, setSelectedDevelopment] = useState<string>('all')
  const [showDevDropdown, setShowDevDropdown] = useState(false)
  const [showAlerts, setShowAlerts] = useState(false)
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([])

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/mount-anvil-demo/login')
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null
  }

  const developmentId = selectedDevelopment === 'all' ? undefined : selectedDevelopment
  const metrics = getDemoMetrics(developmentId)
  const classificationCounts = getClassificationCounts(developmentId)
  const alerts = getHotLeadAlerts().filter(a => !dismissedAlerts.includes(a.id))
  const buyers = developmentId ? getDemoBuyersByDevelopment(developmentId) : DEMO_BUYERS
  const campaigns = developmentId ? getDemoCampaignsByDevelopment(developmentId) : DEMO_CAMPAIGNS
  const hotLeads = buyers.filter(b => b.ai_classification === 'Hot Lead')
  const selectedDev = DEMO_DEVELOPMENTS.find(d => d.id === selectedDevelopment)

  const handleLogout = () => {
    logout()
    router.push('/mount-anvil-demo/login')
  }

  const dismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => [...prev, alertId])
  }

  // Calculate donut chart segments
  const total = Object.values(classificationCounts).reduce((a, b) => a + b, 0)
  const segments = [
    { name: 'Hot Lead', value: classificationCounts.hotLead, color: CLASSIFICATION_COLORS['Hot Lead'].fill },
    { name: 'Qualified', value: classificationCounts.qualified, color: CLASSIFICATION_COLORS['Qualified'].fill },
    { name: 'Needs Qualification', value: classificationCounts.needsQualification, color: CLASSIFICATION_COLORS['Needs Qualification'].fill },
    { name: 'Nurture', value: classificationCounts.nurture, color: CLASSIFICATION_COLORS['Nurture'].fill },
    { name: 'Low Priority', value: classificationCounts.lowPriority, color: CLASSIFICATION_COLORS['Low Priority'].fill },
  ]

  // Generate SVG path for donut chart
  const generateDonutPaths = () => {
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

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0A0A0A] border-r border-white/5 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-semibold text-lg tracking-tight">Naybourhood</h1>
              <p className="text-white/40 text-xs">Mount Anvil</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          <Link
            href="/mount-anvil-demo"
            className="flex items-center gap-3 px-4 py-3 text-white bg-white/5 rounded-xl"
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </Link>
          <Link
            href="/mount-anvil-demo/leads"
            className="flex items-center gap-3 px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
          >
            <Users className="w-5 h-5" />
            Leads
          </Link>
          <Link
            href="/mount-anvil-demo/campaigns"
            className="flex items-center gap-3 px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
          >
            <Megaphone className="w-5 h-5" />
            Campaigns
          </Link>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center text-white font-medium">
                {user.firstName.charAt(0)}
              </div>
              <div>
                <p className="text-white font-medium text-sm">{user.firstName}</p>
                <p className="text-white/40 text-xs">{user.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/5 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white text-2xl font-bold">
                {getGreeting()}, {user.firstName}
              </h2>
              <p className="text-white/50 text-sm mt-1">
                Here&apos;s your buyer intelligence overview
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* Development Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowDevDropdown(!showDevDropdown)}
                  className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 text-white transition-colors"
                >
                  <Building2 className="w-4 h-4 text-white/60" />
                  <span className="text-sm">
                    {selectedDev ? selectedDev.name : 'All Developments'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-white/40" />
                </button>
                {showDevDropdown && (
                  <div className="absolute right-0 mt-2 w-64 bg-[#171717] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-30">
                    <button
                      onClick={() => {
                        setSelectedDevelopment('all')
                        setShowDevDropdown(false)
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors ${
                        selectedDevelopment === 'all' ? 'bg-white/5' : ''
                      }`}
                    >
                      <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">All Developments</p>
                        <p className="text-white/40 text-xs">{DEMO_BUYERS.length} total leads</p>
                      </div>
                    </button>
                    {DEMO_DEVELOPMENTS.map((dev) => (
                      <button
                        key={dev.id}
                        onClick={() => {
                          setSelectedDevelopment(dev.id)
                          setShowDevDropdown(false)
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors ${
                          selectedDevelopment === dev.id ? 'bg-white/5' : ''
                        }`}
                      >
                        <div className="w-8 h-8 bg-slate-500/20 rounded-lg flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm">{dev.name}</p>
                          <p className="text-white/40 text-xs">{dev.location}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Alerts */}
              <div className="relative">
                <button
                  onClick={() => setShowAlerts(!showAlerts)}
                  className={`relative p-2.5 rounded-xl transition-colors ${
                    alerts.length > 0
                      ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  <Bell className="w-5 h-5" />
                  {alerts.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-medium">
                      {alerts.length}
                    </span>
                  )}
                </button>

                {showAlerts && alerts.length > 0 && (
                  <div className="absolute right-0 mt-2 w-96 bg-[#171717] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-30">
                    <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                      <h3 className="text-white font-semibold">Hot Lead Alerts</h3>
                      <span className="text-white/40 text-sm">{alerts.length} active</span>
                    </div>
                    <div className="max-h-96 overflow-auto">
                      {alerts.map((alert) => (
                        <div
                          key={alert.id}
                          className={`px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors ${
                            alert.urgency === 'critical' ? 'bg-red-500/5' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {alert.urgency === 'critical' && (
                                  <AlertCircle className="w-4 h-4 text-red-400" />
                                )}
                                <span className="text-white font-medium text-sm">
                                  {alert.buyerName}
                                </span>
                                <span className="text-white/40 text-xs">
                                  {alert.development}
                                </span>
                              </div>
                              <p className="text-white/60 text-sm">{alert.message}</p>
                            </div>
                            <button
                              onClick={() => dismissAlert(alert.id)}
                              className="p-1 text-white/30 hover:text-white/60 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <Link
                            href={`/mount-anvil-demo/leads/${alert.buyerId}`}
                            className="inline-flex items-center gap-1 text-emerald-400 text-sm mt-2 hover:underline"
                          >
                            View lead <ChevronRight className="w-3 h-3" />
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-8">
          {/* Priority Alert Banner */}
          {alerts.some(a => a.urgency === 'critical') && (
            <div className="mb-6 bg-gradient-to-r from-red-500/10 to-red-500/5 border border-red-500/20 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold">Priority Action Required</h3>
                <p className="text-white/60 text-sm">
                  Victoria Huang needs a decision by Jan 25 - visa timeline dependent. Call today to finalize offer.
                </p>
              </div>
              <Link
                href="/mount-anvil-demo/leads/buyer-te-001"
                className="px-4 py-2 bg-red-500 hover:bg-red-400 text-white font-medium rounded-xl transition-colors flex items-center gap-2"
              >
                <Phone className="w-4 h-4" />
                Call Now
              </Link>
            </div>
          )}

          {/* KPI Cards */}
          <div className="grid grid-cols-5 gap-4 mb-8">
            <div className="bg-[#111111] border border-white/10 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-white/50 text-sm">Total Leads</p>
              <p className="text-white text-3xl font-bold mt-1">{formatNumber(metrics.totalLeads)}</p>
            </div>

            <div className="bg-[#111111] border border-white/10 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
                  <Flame className="w-5 h-5 text-red-400" />
                </div>
                <span className="text-red-400 text-xs font-medium bg-red-500/10 px-2 py-1 rounded-full">
                  +2 today
                </span>
              </div>
              <p className="text-white/50 text-sm">Hot Leads</p>
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
          <div className="grid grid-cols-3 gap-6">
            {/* Lead Classification Donut */}
            <div className="bg-[#111111] border border-white/10 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-6">Lead Classification</h3>
              <div className="flex items-center gap-6">
                <div className="relative">
                  <svg width="200" height="200" viewBox="0 0 200 200">
                    {generateDonutPaths()}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-white text-3xl font-bold">{total}</p>
                      <p className="text-white/40 text-sm">Total</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  {segments.map((segment) => (
                    <div key={segment.name} className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: segment.color }}
                      />
                      <div className="flex-1">
                        <p className="text-white/70 text-sm">{segment.name}</p>
                      </div>
                      <p className="text-white font-medium">{segment.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Hot Leads List */}
            <div className="col-span-2 bg-[#111111] border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Flame className="w-5 h-5 text-red-400" />
                  Hot Leads
                </h3>
                <Link
                  href="/mount-anvil-demo/leads?classification=Hot+Lead"
                  className="text-emerald-400 text-sm hover:underline flex items-center gap-1"
                >
                  View all <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="space-y-3">
                {hotLeads.slice(0, 5).map((lead) => (
                  <Link
                    key={lead.id}
                    href={`/mount-anvil-demo/leads/${lead.id}`}
                    className="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-colors group"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-red-500/20 to-red-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-semibold">
                        {(lead.first_name || lead.full_name || 'U').charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-white font-medium truncate">{lead.full_name}</p>
                        {lead.ai_risk_flags?.includes('time_sensitive_visa') && (
                          <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Urgent
                          </span>
                        )}
                      </div>
                      <p className="text-white/50 text-sm truncate">{lead.ai_summary}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-400 font-semibold">{lead.ai_quality_score}</span>
                        <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-400 rounded-full"
                            style={{ width: `${lead.ai_quality_score}%` }}
                          />
                        </div>
                      </div>
                      <p className="text-white/40 text-xs mt-1">{lead.development_name}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-white/60 transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Campaign Performance */}
          <div className="mt-6 bg-[#111111] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-purple-400" />
                Campaign Performance
              </h3>
              <Link
                href="/mount-anvil-demo/campaigns"
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
                    <th className="pb-4 font-medium">Hot</th>
                    <th className="pb-4 font-medium">Health</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {campaigns.map((campaign) => {
                    const campaignBuyers = buyers.filter(b => b.campaign_id === campaign.id)
                    const hotCount = campaignBuyers.filter(b => b.ai_classification === 'Hot Lead').length
                    return (
                      <tr key={campaign.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                              <Megaphone className="w-4 h-4 text-purple-400" />
                            </div>
                            <div>
                              <p className="text-white font-medium">{campaign.name}</p>
                              <p className="text-white/40 text-xs">{campaign.development}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          <span className="px-2.5 py-1 bg-white/5 text-white/70 text-sm rounded-lg">
                            {campaign.platform}
                          </span>
                        </td>
                        <td className="py-4 text-white">{formatCurrency(campaign.spend || 0)}</td>
                        <td className="py-4 text-white">{campaign.leads}</td>
                        <td className="py-4 text-white">{formatCurrency(campaign.cpl || 0)}</td>
                        <td className="py-4">
                          <span className={`inline-flex items-center gap-1 ${hotCount > 0 ? 'text-red-400' : 'text-white/40'}`}>
                            {hotCount > 0 && <Flame className="w-3 h-3" />}
                            {hotCount}
                          </span>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-white/10 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  (campaign.ai_health_score || 0) >= 70
                                    ? 'bg-emerald-400'
                                    : (campaign.ai_health_score || 0) >= 50
                                    ? 'bg-amber-400'
                                    : 'bg-red-400'
                                }`}
                                style={{ width: `${campaign.ai_health_score || 0}%` }}
                              />
                            </div>
                            <span className="text-white/60 text-sm">{campaign.ai_health_score}</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Insights */}
          <div className="mt-6 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">AI Insights</h3>
                <p className="text-white/50 text-sm">Naybourhood intelligence recommendations</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span className="text-white font-medium text-sm">High Conversion Potential</span>
                </div>
                <p className="text-white/60 text-sm">
                  3 hot leads have viewing booked this week. Prepare personalized viewing packs.
                </p>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <span className="text-white font-medium text-sm">Qualification Gap</span>
                </div>
                <p className="text-white/60 text-sm">
                  10 leads need qualification. WhatsApp outreach could improve data quality by 40%.
                </p>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  <span className="text-white font-medium text-sm">Campaign Optimization</span>
                </div>
                <p className="text-white/60 text-sm">
                  Nine Elms Launch outperforming by 23%. Consider reallocating budget from TikTok.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
