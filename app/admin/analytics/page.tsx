'use client'

import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useCampaigns } from '@/hooks/useCampaigns'
import { useDevelopments } from '@/hooks/useDevelopments'
import { useLeads } from '@/hooks/useLeads'
import { useCompanies } from '@/hooks/useCompanies'
import { formatCurrency } from '@/lib/utils'
import {
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  PoundSterling,
  BarChart3,
  Flame,
  Star,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Download,
  Building2,
  Megaphone,
} from 'lucide-react'

export default function AnalyticsPage() {
  const { leads, isLoading: leadsLoading } = useLeads()
  const { companies } = useCompanies()
  const { campaigns, isLoading: campaignsLoading, refreshCampaigns } = useCampaigns()
  const { developments, isLoading: developmentsLoading } = useDevelopments()
  const dataLoading = campaignsLoading || developmentsLoading
  const isLoading = leadsLoading || dataLoading

  // Calculate comprehensive analytics
  const analytics = useMemo(() => {
    // Lead quality metrics
    const hotLeads = leads.filter(l => (l.quality_score || 0) >= 80)
    const warmLeads = leads.filter(l => (l.quality_score || 0) >= 60 && (l.quality_score || 0) < 80)
    const coldLeads = leads.filter(l => (l.quality_score || 0) < 60)

    const avgQualityScore = leads.length > 0
      ? Math.round(leads.reduce((sum, l) => sum + (l.quality_score || 0), 0) / leads.length)
      : 0

    const avgIntentScore = leads.length > 0
      ? Math.round(leads.reduce((sum, l) => sum + (l.intent_score || 0), 0) / leads.length)
      : 0

    // Status breakdown
    const statusCounts = leads.reduce((acc, l) => {
      const status = l.status || 'New'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Source performance
    const sourceCounts = leads.reduce((acc, l) => {
      const source = l.source || 'Unknown'
      if (!acc[source]) {
        acc[source] = { count: 0, totalScore: 0 }
      }
      acc[source].count++
      acc[source].totalScore += l.quality_score || 0
      return acc
    }, {} as Record<string, { count: number; totalScore: number }>)

    const sourcePerformance = Object.entries(sourceCounts)
      .map(([source, data]) => ({
        source,
        count: data.count,
        avgScore: Math.round(data.totalScore / data.count),
      }))
      .sort((a, b) => b.count - a.count)

    // Campaign metrics
    const totalSpend = campaigns.reduce((sum, c) => sum + (c.spend || 0), 0)
    const totalCampaignLeads = campaigns.reduce((sum, c) => sum + (c.leads || 0), 0)
    const avgCPL = totalCampaignLeads > 0 ? Math.round(totalSpend / totalCampaignLeads) : 0
    const activeCampaigns = campaigns.filter(c => c.status === 'active' || c.status === 'Active').length

    // Development performance (if available)
    const developmentStats = campaigns.reduce((acc, c) => {
      const dev = c.development || c.client || 'Unknown'
      if (!acc[dev]) {
        acc[dev] = { spend: 0, leads: 0, campaigns: 0 }
      }
      acc[dev].spend += c.spend || 0
      acc[dev].leads += c.leads || 0
      acc[dev].campaigns++
      return acc
    }, {} as Record<string, { spend: number; leads: number; campaigns: number }>)

    const developmentPerformance = Object.entries(developmentStats)
      .map(([name, data]) => ({
        name,
        ...data,
        cpl: data.leads > 0 ? Math.round(data.spend / data.leads) : 0,
      }))
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 10)

    // Best and worst campaigns
    const sortedCampaigns = [...campaigns]
      .filter(c => (c.leads || 0) > 0)
      .sort((a, b) => (a.cpl || 999) - (b.cpl || 999))

    const bestCampaigns = sortedCampaigns.slice(0, 5)
    const worstCampaigns = sortedCampaigns.slice(-5).reverse()

    // Conversion funnel
    const funnel = {
      total: leads.length,
      contacted: leads.filter(l => l.status !== 'New').length,
      qualified: leads.filter(l => l.status === 'Qualified' || l.status === 'Viewing Booked').length,
      viewing: leads.filter(l => l.status === 'Viewing Booked').length,
      offer: leads.filter(l => l.status === 'Offer Made' || l.status === 'Completed').length,
      completed: leads.filter(l => l.status === 'Completed').length,
    }

    return {
      leads: {
        total: leads.length,
        hot: hotLeads.length,
        warm: warmLeads.length,
        cold: coldLeads.length,
        avgQualityScore,
        avgIntentScore,
        hotPercentage: leads.length > 0 ? Math.round((hotLeads.length / leads.length) * 100) : 0,
      },
      status: statusCounts,
      sources: sourcePerformance,
      campaigns: {
        total: campaigns.length,
        active: activeCampaigns,
        totalSpend,
        totalLeads: totalCampaignLeads,
        avgCPL,
      },
      developments: developmentPerformance,
      bestCampaigns,
      worstCampaigns,
      funnel,
    }
  }, [leads, campaigns])

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success'
    if (score >= 60) return 'text-warning'
    return 'text-white/50'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-display">Analytics</h2>
          <p className="text-sm text-white/50">
            Lead quality, campaign performance, and business insights
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshCampaigns()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-[#111111] border border-white/10 rounded-xl">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-5 w-5 text-white/50" />
            </div>
            <div className="text-2xl font-bold">{analytics.leads.total.toLocaleString()}</div>
            <div className="text-xs text-white/50">Total Leads</div>
          </div>
        </div>
        <div className="bg-[#111111] border border-white/10 rounded-xl">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Flame className="h-5 w-5 text-orange-500" />
              <Badge variant="success" className="text-[10px]">
                {analytics.leads.hotPercentage}%
              </Badge>
            </div>
            <div className="text-2xl font-bold text-orange-500">{analytics.leads.hot}</div>
            <div className="text-xs text-white/50">Hot Leads (80+)</div>
          </div>
        </div>
        <div className="bg-[#111111] border border-white/10 rounded-xl">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Target className="h-5 w-5 text-white/50" />
            </div>
            <div className={`text-2xl font-bold ${getScoreColor(analytics.leads.avgQualityScore)}`}>
              {analytics.leads.avgQualityScore}
            </div>
            <div className="text-xs text-white/50">Avg Quality Score</div>
          </div>
        </div>
        <div className="bg-[#111111] border border-white/10 rounded-xl">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <PoundSterling className="h-5 w-5 text-white/50" />
            </div>
            <div className="text-2xl font-bold">{formatCurrency(analytics.campaigns.totalSpend)}</div>
            <div className="text-xs text-white/50">Total Spend</div>
          </div>
        </div>
        <div className="bg-[#111111] border border-white/10 rounded-xl">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingDown className="h-5 w-5 text-success" />
            </div>
            <div className={`text-2xl font-bold ${analytics.campaigns.avgCPL > 50 ? 'text-destructive' : 'text-success'}`}>
              £{analytics.campaigns.avgCPL}
            </div>
            <div className="text-xs text-white/50">Avg CPL</div>
          </div>
        </div>
        <div className="bg-[#111111] border border-white/10 rounded-xl">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Megaphone className="h-5 w-5 text-white/50" />
            </div>
            <div className="text-2xl font-bold">{analytics.campaigns.active}</div>
            <div className="text-xs text-white/50">Active Campaigns</div>
          </div>
        </div>
      </div>

      {/* Lead Quality Analysis */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-[#111111] border border-white/10 rounded-xl">
          <div className="p-4 pb-2">
            <h3 className="text-sm font-medium text-white flex items-center gap-2">
              <Star className="h-4 w-4" />
              Lead Quality Breakdown
            </h3>
          </div>
          <div className="px-4 pb-4 space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                  <span className="text-sm">Hot Leads (80+)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{analytics.leads.hot}</span>
                  <span className="text-xs text-white/50">
                    ({analytics.leads.hotPercentage}%)
                  </span>
                </div>
              </div>
              <div className="w-full bg-white/5 rounded-full h-2">
                <div
                  className="bg-orange-500 h-2 rounded-full"
                  style={{ width: `${analytics.leads.hotPercentage}%` }}
                />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span className="text-sm">Warm Leads (60-79)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{analytics.leads.warm}</span>
                  <span className="text-xs text-white/50">
                    ({analytics.leads.total > 0 ? Math.round((analytics.leads.warm / analytics.leads.total) * 100) : 0}%)
                  </span>
                </div>
              </div>
              <div className="w-full bg-white/5 rounded-full h-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full"
                  style={{ width: `${analytics.leads.total > 0 ? (analytics.leads.warm / analytics.leads.total) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-400" />
                  <span className="text-sm">Cold Leads (&lt;60)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{analytics.leads.cold}</span>
                  <span className="text-xs text-white/50">
                    ({analytics.leads.total > 0 ? Math.round((analytics.leads.cold / analytics.leads.total) * 100) : 0}%)
                  </span>
                </div>
              </div>
              <div className="w-full bg-white/5 rounded-full h-2">
                <div
                  className="bg-gray-400 h-2 rounded-full"
                  style={{ width: `${analytics.leads.total > 0 ? (analytics.leads.cold / analytics.leads.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#111111] border border-white/10 rounded-xl">
          <div className="p-4 pb-2">
            <h3 className="text-sm font-medium text-white flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Conversion Funnel
            </h3>
          </div>
          <div className="px-4 pb-4 space-y-3">
            {[
              { label: 'Total Leads', value: analytics.funnel.total, color: '#ffffff' },
              { label: 'Contacted', value: analytics.funnel.contacted, color: '#3b82f6' },
              { label: 'Qualified', value: analytics.funnel.qualified, color: '#22c55e' },
              { label: 'Viewing Booked', value: analytics.funnel.viewing, color: '#f59e0b' },
              { label: 'Offer Made', value: analytics.funnel.offer, color: '#a855f7' },
              { label: 'Completed', value: analytics.funnel.completed, color: '#10b981' },
            ].map((stage, i, arr) => {
              const maxValue = arr[0].value || 1
              const widthPercent = Math.max((stage.value / maxValue) * 100, 10)
              const prevValue = i > 0 ? arr[i - 1].value : stage.value
              const rate = prevValue > 0 ? Math.round((stage.value / prevValue) * 100) : 100
              return (
                <div key={stage.label} className="flex items-center gap-3">
                  <span className="text-xs w-24 text-white/50">{stage.label}</span>
                  <div className="flex-1">
                    <div
                      className="h-6 rounded flex items-center justify-end pr-2 transition-all"
                      style={{ width: `${widthPercent}%`, backgroundColor: stage.color }}
                    >
                      <span className="text-xs font-medium text-white">{stage.value}</span>
                    </div>
                  </div>
                  {i > 0 && (
                    <span className={`text-xs w-10 text-right ${rate >= 50 ? 'text-success' : 'text-warning'}`}>
                      {rate}%
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Source Performance */}
      <div className="bg-[#111111] border border-white/10 rounded-xl">
        <div className="p-4 pb-2">
          <h3 className="text-sm font-medium text-white">Lead Source Performance</h3>
        </div>
        <div className="px-4 pb-4">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left p-3 text-sm font-medium text-white/40">Source</th>
                  <th className="text-right p-3 text-sm font-medium text-white/40">Leads</th>
                  <th className="text-right p-3 text-sm font-medium text-white/40">Avg Score</th>
                  <th className="text-right p-3 text-sm font-medium text-white/40">Quality</th>
                </tr>
              </thead>
              <tbody>
                {analytics.sources.slice(0, 10).map((source) => (
                  <tr key={source.source} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="p-3 font-medium">{source.source}</td>
                    <td className="p-3 text-right">{source.count}</td>
                    <td className="p-3 text-right">
                      <span className={getScoreColor(source.avgScore)}>{source.avgScore}</span>
                    </td>
                    <td className="p-3 text-right">
                      <Badge variant={source.avgScore >= 70 ? 'success' : source.avgScore >= 50 ? 'warning' : 'secondary'}>
                        {source.avgScore >= 70 ? 'High' : source.avgScore >= 50 ? 'Medium' : 'Low'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Development Performance */}
      <div className="bg-[#111111] border border-white/10 rounded-xl">
        <div className="p-4 pb-2">
          <h3 className="text-sm font-medium text-white flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Development Performance
          </h3>
        </div>
        <div className="px-4 pb-4">
          <div className="space-y-3">
            {analytics.developments.length === 0 ? (
              <p className="text-sm text-white/50 text-center py-4">No development data available</p>
            ) : (
              analytics.developments.map((dev) => (
                <div key={dev.name} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02]">
                  <div>
                    <p className="font-medium">{dev.name}</p>
                    <p className="text-xs text-white/50">{dev.campaigns} campaigns</p>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(dev.spend)}</p>
                      <p className="text-xs text-white/50">Spend</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{dev.leads}</p>
                      <p className="text-xs text-white/50">Leads</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${dev.cpl > 50 ? 'text-destructive' : 'text-success'}`}>
                        £{dev.cpl}
                      </p>
                      <p className="text-xs text-white/50">CPL</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Best & Worst Campaigns */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-[#111111] border border-white/10 rounded-xl">
          <div className="p-4 pb-2">
            <h3 className="text-sm font-medium text-white flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success" />
              Top Performing Campaigns
            </h3>
          </div>
          <div className="px-4 pb-4">
            <div className="space-y-3">
              {analytics.bestCampaigns.length === 0 ? (
                <p className="text-sm text-white/50 text-center py-4">No campaign data</p>
              ) : (
                analytics.bestCampaigns.map((campaign) => (
                  <div key={campaign.id} className="flex items-center justify-between p-3 rounded-lg bg-success/5 border border-success/20">
                    <div>
                      <p className="font-medium text-sm">{campaign.name}</p>
                      <p className="text-xs text-white/50">{campaign.development || campaign.client}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-success">£{campaign.cpl || 0} CPL</p>
                      <p className="text-xs text-white/50">{campaign.leads || 0} leads</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="bg-[#111111] border border-white/10 rounded-xl">
          <div className="p-4 pb-2">
            <h3 className="text-sm font-medium text-white flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Campaigns Needing Review
            </h3>
          </div>
          <div className="px-4 pb-4">
            <div className="space-y-3">
              {analytics.worstCampaigns.length === 0 ? (
                <p className="text-sm text-white/50 text-center py-4">No campaign data</p>
              ) : (
                analytics.worstCampaigns.map((campaign) => (
                  <div key={campaign.id} className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                    <div>
                      <p className="font-medium text-sm">{campaign.name}</p>
                      <p className="text-xs text-white/50">{campaign.development || campaign.client}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-destructive">£{campaign.cpl || 0} CPL</p>
                      <p className="text-xs text-white/50">{campaign.leads || 0} leads</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="bg-[#111111] border border-white/10 rounded-xl">
        <div className="p-4 pb-2">
          <h3 className="text-sm font-medium text-white flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Lead Status Distribution
          </h3>
        </div>
        <div className="px-4 pb-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {Object.entries(analytics.status)
              .sort((a, b) => b[1] - a[1])
              .map(([status, count]) => (
                <div key={status} className="text-center p-3 rounded-lg bg-white/[0.02]">
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-xs text-white/50">{status}</p>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}
