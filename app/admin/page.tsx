'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useData } from '@/contexts/DataContext'
import { getGreeting, getDateString, formatCurrency } from '@/lib/utils'
import {
  dashboardMetrics,
  leadClassifications,
  funnelData,
  timelineData,
  sourceData,
  aiRecommendations,
  campaignAlerts,
  actionLeads,
} from '@/lib/demoData'
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
} from 'lucide-react'

const COLORS = {
  hot: '#ef4444',
  star: '#eab308',
  lightning: '#3b82f6',
  valid: '#22c55e',
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
  const { leads, campaigns, isLoading, isSupabase, error, refreshData } = useData()
  const [user, setUser] = useState<{ name?: string }>({})

  useEffect(() => {
    const stored = localStorage.getItem('naybourhood_user')
    if (stored) {
      setUser(JSON.parse(stored))
    }
  }, [])

  const userName = user.name?.split(' ')[0] || 'there'

  const classificationData = Object.entries(leadClassifications).map(
    ([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: COLORS[name as keyof typeof COLORS],
    })
  )

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
              Campaigns: {campaigns.length} · Leads: {leads.length}
            </p>
            <Badge
              variant={isSupabase ? 'success' : 'secondary'}
              className="text-[10px]"
            >
              {isSupabase ? 'Supabase' : 'Demo Data'}
            </Badge>
            {error && (
              <Badge variant="destructive" className="text-[10px]">
                Error
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
              value={dashboardMetrics.totalLeads}
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
              value={dashboardMetrics.hotLeads}
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
              value={dashboardMetrics.avgScore}
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
              {formatCurrency(dashboardMetrics.totalSpend)}
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
              value={dashboardMetrics.avgCPL}
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
              value={dashboardMetrics.qualifiedRate}
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
                    {dashboardMetrics.totalLeads.toLocaleString()}
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
              const maxValue = funnelData[0].value
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

      {/* Action Required */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-500" />
            Action Required
            <Badge variant="destructive">{actionLeads.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {actionLeads.map((lead) => (
            <div
              key={lead.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-warning/5 border border-warning/20"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{lead.name}</span>
                  <Badge variant="muted">{lead.budget}</Badge>
                  <Badge variant="warning">{lead.status}</Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>Q: {lead.qualityScore}</span>
                  <span>I: {lead.intentScore}</span>
                  <span>{lead.timeline}</span>
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
          ))}
        </CardContent>
      </Card>

      {/* Campaign Alerts */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-warning" />
            Campaign Alerts
            <Badge variant="warning">{campaignAlerts.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {campaignAlerts.map((alert) => (
            <div
              key={alert.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-warning/5 border border-warning/20"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{alert.campaign}</span>
                  <span className="text-destructive font-medium text-sm">
                    CPL: £{alert.currentCPL}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {alert.recommendation}. Target: £{alert.targetCPL}.
                  {alert.savings && (
                    <span className="text-success"> Save £{alert.savings}</span>
                  )}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="success"
                  className="bg-success hover:bg-success/90"
                >
                  <CheckCircle className="h-3.5 w-3.5 mr-1" />
                  Apply
                </Button>
                <Button size="icon" variant="outline" className="h-8 w-8">
                  <Eye className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
