'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Target,
  Zap,
  PauseCircle,
  ArrowRight,
  CheckCircle,
  DollarSign,
  Lightbulb,
} from 'lucide-react'
import type { Campaign } from '@/types'

interface CampaignInsight {
  type: 'critical' | 'warning' | 'opportunity' | 'success'
  campaign: string
  message: string
  action: string
  metric?: string
  icon: any
}

interface CampaignInsightsProps {
  campaigns: Campaign[]
  leadCountByCampaign: Record<string, number>
}

export function CampaignInsights({ campaigns, leadCountByCampaign }: CampaignInsightsProps) {
  const insights = useMemo(() => {
    const result: CampaignInsight[] = []

    // Calculate averages for comparison
    const activeCampaigns = campaigns.filter(c => c.status === 'active' || c.status === 'Active')
    const totalSpend = activeCampaigns.reduce((sum, c) => sum + (c.spend || 0), 0)
    const totalLeads = activeCampaigns.reduce((sum, c) => sum + (leadCountByCampaign[c.id] || c.leads || 0), 0)
    const avgCPL = totalLeads > 0 ? totalSpend / totalLeads : 50 // Default benchmark

    campaigns.forEach(campaign => {
      const leads = leadCountByCampaign[campaign.id] || campaign.leads || 0
      const spend = campaign.spend || 0
      const cpl = leads > 0 ? spend / leads : 0
      const isActive = campaign.status === 'active' || campaign.status === 'Active'

      // Critical: High spend, no leads
      if (spend > 500 && leads === 0) {
        result.push({
          type: 'critical',
          campaign: campaign.name,
          message: `Spending £${spend.toLocaleString()} with zero leads`,
          action: 'Pause campaign and review targeting',
          metric: `£${spend.toLocaleString()} spent, 0 leads`,
          icon: AlertTriangle,
        })
      }

      // Warning: CPL significantly above average
      else if (cpl > avgCPL * 1.5 && cpl > 75 && leads > 0) {
        result.push({
          type: 'warning',
          campaign: campaign.name,
          message: `CPL of £${Math.round(cpl)} is ${Math.round((cpl / avgCPL - 1) * 100)}% above average`,
          action: 'Optimize ad creative or narrow audience',
          metric: `£${Math.round(cpl)} CPL vs £${Math.round(avgCPL)} avg`,
          icon: TrendingDown,
        })
      }

      // Opportunity: Good CPL, could scale
      else if (cpl < avgCPL * 0.7 && leads >= 5 && cpl > 0 && isActive) {
        result.push({
          type: 'opportunity',
          campaign: campaign.name,
          message: `Strong performer with £${Math.round(cpl)} CPL`,
          action: 'Consider increasing budget to scale results',
          metric: `${Math.round((1 - cpl / avgCPL) * 100)}% below avg CPL`,
          icon: TrendingUp,
        })
      }

      // Success: Good volume and CPL
      else if (leads >= 20 && cpl <= avgCPL && cpl > 0) {
        result.push({
          type: 'success',
          campaign: campaign.name,
          message: `Generating ${leads} leads at £${Math.round(cpl)} CPL`,
          action: 'Maintain current strategy',
          metric: `${leads} leads, £${Math.round(cpl)} CPL`,
          icon: CheckCircle,
        })
      }

      // Warning: Inactive campaign with recent spend
      if (!isActive && spend > 0 && leads > 0) {
        result.push({
          type: 'warning',
          campaign: campaign.name,
          message: 'Paused campaign with ${leads} leads',
          action: 'Review if reactivation makes sense',
          metric: `${leads} leads at £${leads > 0 ? Math.round(spend / leads) : 0} CPL`,
          icon: PauseCircle,
        })
      }
    })

    // Sort: critical first, then warning, opportunity, success
    const priority = { critical: 0, warning: 1, opportunity: 2, success: 3 }
    return result.sort((a, b) => priority[a.type] - priority[b.type]).slice(0, 6)
  }, [campaigns, leadCountByCampaign])

  // Summary stats
  const summaryStats = useMemo(() => {
    const activeCampaigns = campaigns.filter(c => c.status === 'active' || c.status === 'Active')
    const totalSpend = campaigns.reduce((sum, c) => sum + (c.spend || 0), 0)
    const totalLeads = campaigns.reduce((sum, c) => sum + (leadCountByCampaign[c.id] || c.leads || 0), 0)
    const avgCPL = totalLeads > 0 ? Math.round(totalSpend / totalLeads) : 0
    const highCPL = campaigns.filter(c => {
      const leads = leadCountByCampaign[c.id] || c.leads || 0
      const cpl = leads > 0 ? (c.spend || 0) / leads : 0
      return cpl > 75 && leads > 0
    }).length

    return {
      active: activeCampaigns.length,
      total: campaigns.length,
      avgCPL,
      highCPL,
      totalSpend,
      totalLeads,
    }
  }, [campaigns, leadCountByCampaign])

  if (insights.length === 0) {
    return null
  }

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'opportunity':
        return 'bg-blue-50 border-blue-200 text-blue-800'
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'critical':
        return <Badge variant="destructive">Action Required</Badge>
      case 'warning':
        return <Badge className="bg-yellow-500">Review Needed</Badge>
      case 'opportunity':
        return <Badge className="bg-blue-500">Opportunity</Badge>
      case 'success':
        return <Badge className="bg-green-500">Performing Well</Badge>
      default:
        return null
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-yellow-500" />
            Campaign Optimization Insights
          </CardTitle>
          <div className="flex gap-2 text-xs">
            <span className="text-muted-foreground">
              {summaryStats.active}/{summaryStats.total} active
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">
              Avg CPL: £{summaryStats.avgCPL}
            </span>
            {summaryStats.highCPL > 0 && (
              <>
                <span className="text-muted-foreground">•</span>
                <span className="text-red-600 font-medium">
                  {summaryStats.highCPL} high CPL
                </span>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight, i) => {
          const Icon = insight.icon
          return (
            <div
              key={i}
              className={`p-3 rounded-lg border ${getTypeStyles(insight.type)}`}
            >
              <div className="flex items-start gap-3">
                <Icon className="h-5 w-5 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm truncate">{insight.campaign}</span>
                    {getTypeBadge(insight.type)}
                  </div>
                  <p className="text-sm">{insight.message}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs opacity-75">{insight.metric}</span>
                    <span className="text-xs flex items-center gap-1 font-medium">
                      <ArrowRight className="h-3 w-3" />
                      {insight.action}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {/* Quick recommendations */}
        <div className="pt-3 border-t mt-4">
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Quick Recommendations
          </h4>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            {summaryStats.highCPL > 0 && (
              <li className="flex items-start gap-2">
                <Zap className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                Review {summaryStats.highCPL} campaign(s) with CPL above £75 - consider pausing or optimizing
              </li>
            )}
            {summaryStats.avgCPL > 60 && (
              <li className="flex items-start gap-2">
                <DollarSign className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                Overall CPL of £{summaryStats.avgCPL} is high - target benchmark is £30-50
              </li>
            )}
            {summaryStats.avgCPL <= 40 && summaryStats.avgCPL > 0 && (
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                Excellent CPL of £{summaryStats.avgCPL} - consider scaling top performers
              </li>
            )}
            <li className="flex items-start gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
              Focus budget on campaigns generating Hot and Warm-Qualified leads
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
