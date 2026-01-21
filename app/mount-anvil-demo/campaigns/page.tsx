'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useMountAnvilDemo } from '@/contexts/MountAnvilDemoContext'
import {
  DEMO_DEVELOPMENTS,
  DEMO_CAMPAIGNS,
  DEMO_BUYERS,
} from '@/lib/mount-anvil-demo-data'
import { formatCurrency, formatNumber } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Megaphone,
  Building2,
  TrendingUp,
  TrendingDown,
  Flame,
  Wallet,
  BarChart3,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Sparkles,
  ArrowUpRight,
  Eye,
  MousePointer,
  Settings,
} from 'lucide-react'

// Health score badge
function HealthBadge({ score }: { score: number }) {
  const color = score >= 70 ? 'emerald' : score >= 50 ? 'amber' : 'red'
  return (
    <div className="flex items-center gap-2">
      <div className={`w-20 h-2 bg-white/10 rounded-full overflow-hidden`}>
        <div
          className={`h-full rounded-full bg-${color}-400`}
          style={{ width: `${score}%`, backgroundColor: color === 'emerald' ? '#34D399' : color === 'amber' ? '#FBBF24' : '#EF4444' }}
        />
      </div>
      <span className={`text-sm font-medium ${
        color === 'emerald' ? 'text-emerald-400' : color === 'amber' ? 'text-amber-400' : 'text-red-400'
      }`}>
        {score}
      </span>
    </div>
  )
}

// Platform icon
function PlatformIcon({ platform }: { platform: string }) {
  const colors: Record<string, string> = {
    'Meta Ads': 'bg-blue-500/20 text-blue-400',
    'LinkedIn': 'bg-sky-500/20 text-sky-400',
    'TikTok': 'bg-pink-500/20 text-pink-400',
    'WeChat/Juwai': 'bg-green-500/20 text-green-400',
    'Million Pound Homes': 'bg-amber-500/20 text-amber-400',
  }

  return (
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[platform] || 'bg-slate-500/20 text-slate-400'}`}>
      <Megaphone className="w-5 h-5" />
    </div>
  )
}

export default function CampaignsPage() {
  const { user, isLoading } = useMountAnvilDemo()
  const [selectedDevelopment, setSelectedDevelopment] = useState<string>('all')

  // Filter campaigns
  const filteredCampaigns = useMemo(() => {
    if (selectedDevelopment === 'all') return DEMO_CAMPAIGNS
    return DEMO_CAMPAIGNS.filter(c => c.development_id === selectedDevelopment)
  }, [selectedDevelopment])

  // Calculate totals
  const totals = useMemo(() => {
    const totalSpend = filteredCampaigns.reduce((sum, c) => sum + (c.spend || 0), 0)
    const totalLeads = filteredCampaigns.reduce((sum, c) => sum + (c.leads || 0), 0)
    const totalImpressions = filteredCampaigns.reduce((sum, c) => sum + (c.impressions || 0), 0)
    const totalClicks = filteredCampaigns.reduce((sum, c) => sum + (c.clicks || 0), 0)
    const avgCPL = totalLeads > 0 ? Math.round(totalSpend / totalLeads) : 0
    const avgCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00'

    // Count hot leads from campaigns
    const campaignIds = filteredCampaigns.map(c => c.id)
    const hotLeads = DEMO_BUYERS.filter(
      b => campaignIds.includes(b.campaign_id || '') && b.ai_classification === 'Hot Lead'
    ).length

    return { totalSpend, totalLeads, totalImpressions, totalClicks, avgCPL, avgCTR, hotLeads }
  }, [filteredCampaigns])

  // Platform breakdown
  const platformBreakdown = useMemo(() => {
    const platforms: Record<string, { spend: number; leads: number; hot: number }> = {}

    filteredCampaigns.forEach(campaign => {
      const platform = campaign.platform || 'Other'
      if (!platforms[platform]) {
        platforms[platform] = { spend: 0, leads: 0, hot: 0 }
      }
      platforms[platform].spend += campaign.spend || 0
      platforms[platform].leads += campaign.leads || 0

      // Count hot leads for this campaign
      const campaignHot = DEMO_BUYERS.filter(
        b => b.campaign_id === campaign.id && b.ai_classification === 'Hot Lead'
      ).length
      platforms[platform].hot += campaignHot
    })

    return Object.entries(platforms).map(([name, data]) => ({
      name,
      ...data,
      cpl: data.leads > 0 ? Math.round(data.spend / data.leads) : 0,
    }))
  }, [filteredCampaigns])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0A0A0A] border-r border-white/5 flex flex-col">
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

        <nav className="flex-1 p-4 space-y-1">
          <Link
            href="/mount-anvil-demo"
            className="flex items-center gap-3 px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
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
            className="flex items-center gap-3 px-4 py-3 text-white bg-white/5 rounded-xl"
          >
            <Megaphone className="w-5 h-5" />
            Campaigns
          </Link>
          <Link
            href="/mount-anvil-demo/developments"
            className="flex items-center gap-3 px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
          >
            <Building2 className="w-5 h-5" />
            Developments
          </Link>
          <Link
            href="/mount-anvil-demo/settings"
            className="flex items-center gap-3 px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
          >
            <Settings className="w-5 h-5" />
            Settings
          </Link>
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center text-white font-medium">
              {user.firstName.charAt(0)}
            </div>
            <div>
              <p className="text-white font-medium text-sm">{user.firstName}</p>
              <p className="text-white/40 text-xs">{user.role}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/5 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white text-2xl font-bold">Campaign Analytics</h2>
              <p className="text-white/50 text-sm mt-1">
                Performance across {filteredCampaigns.length} campaigns
              </p>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={selectedDevelopment}
                onChange={(e) => setSelectedDevelopment(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none cursor-pointer"
              >
                <option value="all">All Developments</option>
                {DEMO_DEVELOPMENTS.map((dev) => (
                  <option key={dev.id} value={dev.id}>{dev.name}</option>
                ))}
              </select>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-8">
          {/* KPI Cards */}
          <div className="grid grid-cols-6 gap-4 mb-8">
            <div className="bg-[#111111] border border-white/10 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-purple-400" />
                </div>
              </div>
              <p className="text-white/50 text-sm">Total Spend</p>
              <p className="text-white text-2xl font-bold mt-1">{formatCurrency(totals.totalSpend)}</p>
            </div>

            <div className="bg-[#111111] border border-white/10 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
              </div>
              <p className="text-white/50 text-sm">Total Leads</p>
              <p className="text-white text-2xl font-bold mt-1">{formatNumber(totals.totalLeads)}</p>
            </div>

            <div className="bg-[#111111] border border-white/10 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
                  <Flame className="w-5 h-5 text-red-400" />
                </div>
              </div>
              <p className="text-white/50 text-sm">Hot Leads</p>
              <p className="text-white text-2xl font-bold mt-1">{totals.hotLeads}</p>
            </div>

            <div className="bg-[#111111] border border-white/10 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-emerald-400" />
                </div>
              </div>
              <p className="text-white/50 text-sm">Avg CPL</p>
              <p className="text-white text-2xl font-bold mt-1">{formatCurrency(totals.avgCPL)}</p>
            </div>

            <div className="bg-[#111111] border border-white/10 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
                  <Eye className="w-5 h-5 text-amber-400" />
                </div>
              </div>
              <p className="text-white/50 text-sm">Impressions</p>
              <p className="text-white text-2xl font-bold mt-1">{formatNumber(totals.totalImpressions)}</p>
            </div>

            <div className="bg-[#111111] border border-white/10 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-pink-500/10 rounded-xl flex items-center justify-center">
                  <MousePointer className="w-5 h-5 text-pink-400" />
                </div>
              </div>
              <p className="text-white/50 text-sm">Avg CTR</p>
              <p className="text-white text-2xl font-bold mt-1">{totals.avgCTR}%</p>
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-3 gap-6 mb-6">
            {/* Platform Breakdown */}
            <div className="bg-[#111111] border border-white/10 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-6">Performance by Source</h3>
              <div className="space-y-4">
                {platformBreakdown.map((platform) => (
                  <div key={platform.name} className="flex items-center gap-4">
                    <PlatformIcon platform={platform.name} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white font-medium text-sm">{platform.name}</span>
                        <span className="text-white/50 text-sm">{platform.leads} leads</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-400 rounded-full"
                            style={{ width: `${(platform.leads / totals.totalLeads) * 100}%` }}
                          />
                        </div>
                        <span className="text-white/40 text-xs w-16 text-right">
                          {formatCurrency(platform.cpl)} CPL
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cost Analysis */}
            <div className="bg-[#111111] border border-white/10 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-6">Cost Per Qualified Lead</h3>
              <div className="space-y-4">
                {filteredCampaigns
                  .sort((a, b) => (a.cpl || 0) - (b.cpl || 0))
                  .slice(0, 5)
                  .map((campaign) => {
                    const campaignBuyers = DEMO_BUYERS.filter(b => b.campaign_id === campaign.id)
                    const qualifiedCount = campaignBuyers.filter(b =>
                      b.ai_classification === 'Hot Lead' || b.ai_classification === 'Qualified'
                    ).length
                    const costPerQualified = qualifiedCount > 0
                      ? Math.round((campaign.spend || 0) / qualifiedCount)
                      : 0

                    return (
                      <div key={campaign.id} className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium text-sm truncate">{campaign.name}</p>
                          <p className="text-white/40 text-xs">{qualifiedCount} qualified leads</p>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${
                            costPerQualified < 2000 ? 'text-emerald-400' :
                            costPerQualified < 3500 ? 'text-amber-400' : 'text-red-400'
                          }`}>
                            {formatCurrency(costPerQualified)}
                          </p>
                          <p className="text-white/40 text-xs">per qualified</p>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>

            {/* AI Insights */}
            <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-white font-semibold">AI Recommendations</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-emerald-400 mt-0.5" />
                  <div>
                    <p className="text-white font-medium text-sm">Scale Nine Elms Launch</p>
                    <p className="text-white/60 text-xs mt-0.5">Outperforming by 23% - increase budget</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5" />
                  <div>
                    <p className="text-white font-medium text-sm">Optimise TikTok</p>
                    <p className="text-white/60 text-xs mt-0.5">High CPL - add pre-qualification</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div>
                    <p className="text-white font-medium text-sm">WeChat Performance</p>
                    <p className="text-white/60 text-xs mt-0.5">High-value leads despite CPL</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Campaign Table */}
          <div className="bg-[#111111] border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10">
              <h3 className="text-white font-semibold">All Campaigns</h3>
            </div>
            <table className="w-full">
              <thead>
                <tr className="text-left text-white/50 text-sm border-b border-white/10 bg-white/5">
                  <th className="px-6 py-4 font-medium">Campaign</th>
                  <th className="px-6 py-4 font-medium">Platform</th>
                  <th className="px-6 py-4 font-medium">Spend</th>
                  <th className="px-6 py-4 font-medium">Leads</th>
                  <th className="px-6 py-4 font-medium">CPL</th>
                  <th className="px-6 py-4 font-medium">Hot</th>
                  <th className="px-6 py-4 font-medium">CTR</th>
                  <th className="px-6 py-4 font-medium">Health</th>
                  <th className="px-6 py-4 font-medium">AI Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredCampaigns.map((campaign) => {
                  const campaignBuyers = DEMO_BUYERS.filter(b => b.campaign_id === campaign.id)
                  const hotCount = campaignBuyers.filter(b => b.ai_classification === 'Hot Lead').length

                  return (
                    <tr key={campaign.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <PlatformIcon platform={campaign.platform || ''} />
                          <div>
                            <p className="text-white font-medium">{campaign.name}</p>
                            <p className="text-white/40 text-xs">{campaign.development}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-white/5 text-white/70 text-sm rounded-lg">
                          {campaign.platform}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-white font-medium">
                        {formatCurrency(campaign.spend || 0)}
                      </td>
                      <td className="px-6 py-4 text-white">{campaign.leads}</td>
                      <td className="px-6 py-4">
                        <span className={`font-medium ${
                          (campaign.cpl || 0) < 1500 ? 'text-emerald-400' :
                          (campaign.cpl || 0) < 2500 ? 'text-amber-400' : 'text-red-400'
                        }`}>
                          {formatCurrency(campaign.cpl || 0)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 ${hotCount > 0 ? 'text-red-400' : 'text-white/40'}`}>
                          {hotCount > 0 && <Flame className="w-3 h-3" />}
                          {hotCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-white/70">{campaign.ctr?.toFixed(2)}%</td>
                      <td className="px-6 py-4">
                        <HealthBadge score={campaign.ai_health_score || 0} />
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-white/60 text-sm max-w-xs truncate">
                          {campaign.ai_performance_summary}
                        </p>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
