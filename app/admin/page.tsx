'use client'

import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useData } from '@/contexts/DataContext'
import { getGreeting, getDateString, formatCurrency } from '@/lib/utils'
import {
  Users,
  Flame,
  Target,
  PoundSterling,
  TrendingDown,
  CheckCircle,
  Lightbulb,
  AlertCircle,
  Phone,
  MessageCircle,
  Calendar,
  RefreshCw,
  Upload,
  Eye,
  Building2,
  Megaphone,
} from 'lucide-react'

const COLORS = {
  hot: '#ef4444',
  warm: '#f59e0b',
  qualified: '#22c55e',
  new: '#3b82f6',
  cold: '#6b7280',
}

// Animated counter hook
function useAnimatedCounter(target: number, duration: number = 2000) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let start = 0
    const increment = target / (duration / 16)
    const timer = setInterval(() => {
      start += increment
      if (start >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [target, duration])

  return count
}

function AnimatedNumber({
  value,
  prefix = '',
  suffix = '',
  className = '',
}: {
  value: number
  prefix?: string
  suffix?: string
  className?: string
}) {
  const count = useAnimatedCounter(value)
  return (
    <span className={className}>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  )
}

export default function AdminDashboard() {
  const { leads, campaigns, companies, isLoading, isSupabase, error, refreshData } = useData()
  const [user, setUser] = useState<{ name?: string }>({})

  useEffect(() => {
    const stored = localStorage.getItem('naybourhood_user')
    if (stored) {
      setUser(JSON.parse(stored))
    }
  }, [])

  const userName = user.name?.split(' ')[0] || 'there'

  // Calculate real metrics from data
  const metrics = useMemo(() => {
    const totalLeads = leads.length
    const hotLeads = leads.filter(l => (l.quality_score || 0) >= 80).length
    const avgScore = totalLeads > 0
      ? Math.round(leads.reduce((sum, l) => sum + (l.quality_score || 0), 0) / totalLeads)
      : 0
    const totalSpend = campaigns.reduce((sum, c) => sum + (c.spend || c.amount_spent || 0), 0)
    const totalCampaignLeads = campaigns.reduce((sum, c) => sum + (c.leads || c.lead_count || 0), 0)
    const avgCPL = totalCampaignLeads > 0 ? Math.round(totalSpend / totalCampaignLeads) : 0
    const qualifiedLeads = leads.filter(l => l.status === 'Qualified' || (l.quality_score || 0) >= 70).length
    const qualifiedRate = totalLeads > 0 ? Math.round((qualifiedLeads / totalLeads) * 100) : 0

    return {
      totalLeads,
      hotLeads,
      avgScore,
      totalSpend,
      avgCPL,
      qualifiedRate,
      totalCampaigns: campaigns.length,
      activeCampaigns: campaigns.filter(c => c.status === 'active').length,
      totalCompanies: companies.length,
    }
  }, [leads, campaigns, companies])

  // Calculate lead classifications from real data
  const classificationData = useMemo(() => {
    const hot = leads.filter(l => (l.quality_score || 0) >= 85).length
    const warm = leads.filter(l => (l.quality_score || 0) >= 70 && (l.quality_score || 0) < 85).length
    const qualified = leads.filter(l => l.status === 'Qualified').length
    const newLeads = leads.filter(l => l.status === 'New').length
    const cold = leads.filter(l => (l.quality_score || 0) < 50).length

    return [
      { name: 'Hot (85+)', value: hot, color: COLORS.hot },
      { name: 'Warm (70-84)', value: warm, color: COLORS.warm },
      { name: 'Qualified', value: qualified, color: COLORS.qualified },
      { name: 'New', value: newLeads, color: COLORS.new },
      { name: 'Cold (<50)', value: cold, color: COLORS.cold },
    ]
  }, [leads])

  // Get leads requiring action (high score, not yet contacted)
  const actionLeads = useMemo(() => {
    return leads
      .filter(l => (l.quality_score || 0) >= 75 && l.status !== 'Completed')
      .sort((a, b) => (b.quality_score || 0) - (a.quality_score || 0))
      .slice(0, 5)
  }, [leads])

  // Get campaign alerts (high CPL campaigns)
  const campaignAlerts = useMemo(() => {
    return campaigns
      .filter(c => c.status === 'active' && (c.cpl || c.cost_per_lead || 0) > 50)
      .sort((a, b) => (b.cpl || b.cost_per_lead || 0) - (a.cpl || a.cost_per_lead || 0))
      .slice(0, 3)
  }, [campaigns])

  // Build funnel from real data
  const funnelData = useMemo(() => {
    const total = leads.length
    const contacted = leads.filter(l => l.status !== 'New').length
    const qualified = leads.filter(l => l.status === 'Qualified' || l.status === 'Viewing Booked').length
    const viewing = leads.filter(l => l.status === 'Viewing Booked').length
    const offer = leads.filter(l => l.status === 'Offer Made' || l.status === 'Completed').length

    return [
      { name: 'Total', value: total, color: '#ffffff' },
      { name: 'Contacted', value: contacted, color: '#3b82f6' },
      { name: 'Qualified', value: qualified, color: '#22c55e' },
      { name: 'Viewing', value: viewing, color: '#f59e0b' },
      { name: 'Offer', value: offer, color: '#a855f7' },
    ]
  }, [leads])

  // AI recommendations based on real data
  const aiRecommendations = useMemo(() => {
    const recs: string[] = []

    if (actionLeads.length > 0) {
      const topLead = actionLeads[0]
      recs.push(`Follow up with ${topLead.full_name || topLead.first_name} (Score: ${topLead.quality_score}) - High priority lead`)
    }

    const highCPLCampaigns = campaigns.filter(c => (c.cpl || 0) > 60)
    if (highCPLCampaigns.length > 0) {
      recs.push(`Review ${highCPLCampaigns.length} campaigns with CPL above £60`)
    }

    const newLeadsCount = leads.filter(l => l.status === 'New').length
    if (newLeadsCount > 5) {
      recs.push(`${newLeadsCount} new leads awaiting initial contact`)
    }

    const activeCampaigns = campaigns.filter(c => c.status === 'active')
    if (activeCampaigns.length > 0) {
      const bestCampaign = activeCampaigns.sort((a, b) => (a.cpl || 999) - (b.cpl || 999))[0]
      if (bestCampaign) {
        recs.push(`Best performing: ${bestCampaign.name} with £${bestCampaign.cpl || bestCampaign.cost_per_lead} CPL`)
      }
    }

    if (metrics.qualifiedRate < 50) {
      recs.push('Qualified rate below 50% - consider refining targeting')
    }

    return recs.length > 0 ? recs : ['All systems running smoothly - keep up the great work!']
  }, [leads, campaigns, actionLeads, metrics.qualifiedRate])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display">
            {getGreeting()}, {userName}
          </h2>
          <p className="text-sm text-muted-foreground">{getDateString()}</p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs text-muted-foreground">
              Campaigns: {campaigns.length} · Leads: {leads.length} · Companies: {companies.length}
            </p>
            <Badge
              variant={isSupabase ? 'success' : 'destructive'}
              className="text-[10px]"
            >
              {isSupabase ? 'Live Data' : 'Not Connected'}
            </Badge>
            {error && (
              <Badge variant="destructive" className="text-[10px]">
                {error}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => refreshData()}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`}
            />
            {isLoading ? 'Loading...' : 'Sync'}
          </Button>
          <Button variant="outline" size="sm" className="text-xs">
            <Upload className="h-3.5 w-3.5 mr-1.5" />
            Upload
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="animate-fade-in">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Total Leads</span>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <AnimatedNumber
              value={metrics.totalLeads}
              className="text-2xl font-bold"
            />
          </CardContent>
        </Card>
        <Card className="animate-fade-in" style={{ animationDelay: '100ms' }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Hot Leads</span>
              <Flame className="h-4 w-4 text-orange-500" />
            </div>
            <AnimatedNumber
              value={metrics.hotLeads}
              className="text-2xl font-bold text-orange-500"
            />
          </CardContent>
        </Card>
        <Card className="animate-fade-in" style={{ animationDelay: '200ms' }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Avg Score</span>
              <Target className="h-4 w-4 text-muted-foreground" />
            </div>
            <AnimatedNumber
              value={metrics.avgScore}
              className="text-2xl font-bold"
            />
          </CardContent>
        </Card>
        <Card className="animate-fade-in" style={{ animationDelay: '300ms' }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Total Spend</span>
              <PoundSterling className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">
              {formatCurrency(metrics.totalSpend)}
            </div>
          </CardContent>
        </Card>
        <Card className="animate-fade-in" style={{ animationDelay: '400ms' }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Avg CPL</span>
              <TrendingDown className="h-4 w-4 text-success" />
            </div>
            <AnimatedNumber
              value={metrics.avgCPL}
              prefix="£"
              className="text-2xl font-bold text-success"
            />
          </CardContent>
        </Card>
        <Card className="animate-fade-in" style={{ animationDelay: '500ms' }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Qualified Rate</span>
              <CheckCircle className="h-4 w-4 text-success" />
            </div>
            <AnimatedNumber
              value={metrics.qualifiedRate}
              suffix="%"
              className="text-2xl font-bold text-success"
            />
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Lead Classification */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Lead Classification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-32 h-32 relative flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {metrics.totalLeads.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                {classificationData.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span>{item.name}</span>
                    </div>
                    <span className="font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conversion Funnel */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Conversion Funnel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {funnelData.map((stage, i) => {
              const maxValue = funnelData[0].value || 1
              const widthPercent = Math.max((stage.value / maxValue) * 100, 15)
              const prevValue = i > 0 ? funnelData[i - 1].value : stage.value
              const rate =
                prevValue > 0
                  ? Math.round((stage.value / prevValue) * 100)
                  : 100
              return (
                <div key={stage.name} className="flex items-center gap-3">
                  <span className="text-xs w-16 text-muted-foreground">
                    {stage.name}
                  </span>
                  <div className="flex-1">
                    <div
                      className="h-8 rounded flex items-center justify-end pr-3 transition-all"
                      style={{
                        width: `${widthPercent}%`,
                        backgroundColor: stage.color,
                      }}
                    >
                      <span className="text-xs font-medium text-white">
                        {stage.value}
                      </span>
                    </div>
                  </div>
                  {i > 0 && (
                    <span
                      className={`text-xs w-12 text-right ${
                        rate >= 50 ? 'text-success' : 'text-warning'
                      }`}
                    >
                      {rate}%
                    </span>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      {/* AI Recommendations */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-yellow-500" />
            AI Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {aiRecommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Action Required - Real Leads */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-500" />
            Priority Leads
            <Badge variant="destructive">{actionLeads.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {actionLeads.length === 0 ? (
            <p className="text-sm text-muted-foreground">No priority leads at this time</p>
          ) : (
            actionLeads.map((lead) => (
              <div
                key={lead.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-warning/5 border border-warning/20"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{lead.full_name || lead.first_name || 'Unknown'}</span>
                    {lead.budget && <Badge variant="muted">{lead.budget}</Badge>}
                    {lead.status && <Badge variant="warning">{lead.status}</Badge>}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>Score: {lead.quality_score || 0}</span>
                    {lead.intent_score && <span>Intent: {lead.intent_score}</span>}
                    {lead.timeline && <span>{lead.timeline}</span>}
                    {lead.source && <span>via {lead.source}</span>}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="icon" className="h-8 w-8">
                    <Phone className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="outline" className="h-8 w-8">
                    <MessageCircle className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="outline" className="h-8 w-8">
                    <Calendar className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Campaign Performance - Real Campaigns */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-primary" />
            Active Campaigns
            <Badge variant="secondary">{campaigns.filter(c => c.status === 'active').length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {campaigns.filter(c => c.status === 'active').length === 0 ? (
            <p className="text-sm text-muted-foreground">No active campaigns</p>
          ) : (
            campaigns
              .filter(c => c.status === 'active')
              .slice(0, 5)
              .map((campaign) => (
                <div
                  key={campaign.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-card border"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{campaign.name}</span>
                      {campaign.platform && <Badge variant="secondary">{campaign.platform}</Badge>}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>Spend: {formatCurrency(campaign.spend || campaign.amount_spent || 0)}</span>
                      <span>Leads: {campaign.leads || campaign.lead_count || 0}</span>
                      <span className={`font-medium ${(campaign.cpl || 0) > 50 ? 'text-warning' : 'text-success'}`}>
                        CPL: £{campaign.cpl || campaign.cost_per_lead || 0}
                      </span>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    View
                  </Button>
                </div>
              ))
          )}
        </CardContent>
      </Card>

      {/* Companies Overview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            Companies
            <Badge variant="secondary">{companies.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {companies.slice(0, 5).map((company) => (
              <div
                key={company.id}
                className="p-3 rounded-lg bg-card border text-center"
              >
                <p className="font-medium text-sm truncate">{company.name}</p>
                <p className="text-xs text-muted-foreground">{company.tier || company.type || 'Client'}</p>
                <Badge variant={company.status === 'active' ? 'success' : 'secondary'} className="mt-2 text-[10px]">
                  {company.status || 'Active'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
