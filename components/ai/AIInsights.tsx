'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useData } from '@/contexts/DataContext'
import {
  Lightbulb,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  AlertTriangle,
  Info,
  Phone,
  Mail,
  Calendar,
  Eye,
  CheckCircle,
} from 'lucide-react'

// Status categories - matching leads page
const STATUS_CATEGORIES = {
  positive: [
    'Viewing Booked', 'Negotiating', 'Reserved', 'Exchanged', 'Completed',
    'Qualified', 'Interested', 'Offer Made', 'Under Offer'
  ],
  pending: [
    'New', 'Contact Pending', 'Follow Up', 'Contacted', 'Callback Requested',
    'Awaiting Response', 'In Progress', 'Pending', 'To Contact', 'Enquiry'
  ],
  negative: ['Not Proceeding', 'Lost', 'Unresponsive', 'Not Interested', 'Withdrawn'],
  disqualified: ['Disqualified', 'Duplicate', 'Invalid', 'Fake', 'Agent'],
}

interface Insight {
  type: 'critical' | 'warning' | 'positive' | 'info'
  title: string
  description: string
  action?: string
}

interface RecommendedAction {
  priority: number
  title: string
  description: string
  actionType: 'call' | 'email' | 'book_viewing' | 'review'
  leadId?: string
  leadIds?: string[]
}

interface AIInsightsProps {
  onActionClick?: (action: RecommendedAction) => void
}

export function AIInsights({ onActionClick }: AIInsightsProps) {
  const { leads, campaigns, isLoading, refreshData } = useData()
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set())

  // Generate insights from local data
  const { insights, recommendedActions } = useMemo(() => {
    const insightsList: Insight[] = []
    const actionsList: RecommendedAction[] = []

    // Exclude disqualified from all stats
    const activeLeads = leads.filter(l => !STATUS_CATEGORIES.disqualified.includes(l.status || ''))

    // Calculate stats
    const totalLeads = activeLeads.length
    const hotLeads = activeLeads.filter(b => (b.ai_quality_score ?? b.quality_score ?? 0) >= 50)
    const warmLeads = activeLeads.filter(b => {
      const score = b.ai_quality_score ?? b.quality_score ?? 0
      return score >= 40 && score < 70
    })
    const coldLeads = totalLeads - hotLeads.length - warmLeads.length

    // Find stale leads (in Follow Up status for 5+ days)
    const now = new Date()
    const staleLeads = activeLeads.filter(b => {
      if (b.status !== 'Follow Up' && b.status !== 'Contacted' && b.status !== 'Contact Pending') return false
      const createdAt = new Date(b.created_at || now)
      const daysDiff = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
      return daysDiff >= 5
    })

    // Find hot leads without viewing booked
    const hotLeadsNoViewing = activeLeads.filter(b =>
      (b.ai_quality_score ?? b.quality_score ?? 0) >= 50 &&
      b.status !== 'Viewing Booked' &&
      b.status !== 'Completed' &&
      b.status !== 'Reserved' &&
      b.status !== 'Exchanged'
    )

    // Calculate week over week change
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const leadsThisWeek = activeLeads.filter(b => new Date(b.created_at || now) >= oneWeekAgo).length

    // Find underperforming campaigns
    const underperformingCampaigns = campaigns.filter(c => {
      const cpl = c.cpl ?? (c.spend && c.leads ? c.spend / c.leads : 0)
      return cpl > 100 && (c.status === 'active' || c.status === 'Active')
    })

    // Critical: Hot leads without follow-up
    if (hotLeadsNoViewing.length > 0) {
      insightsList.push({
        type: 'critical',
        title: `${hotLeadsNoViewing.length} hot leads need viewing scheduled`,
        description: 'These high-scoring leads are ready to move forward but don\'t have viewings booked yet.',
        action: 'Schedule viewings today'
      })

      actionsList.push({
        priority: 1,
        title: `Book viewings for ${hotLeadsNoViewing.length} hot leads`,
        description: 'High-quality leads waiting for viewing slots',
        actionType: 'book_viewing',
        leadIds: hotLeadsNoViewing.slice(0, 5).map(l => l.id)
      })
    }

    // Warning: Stale leads
    if (staleLeads.length > 0) {
      insightsList.push({
        type: 'warning',
        title: `${staleLeads.length} leads silent for 5+ days`,
        description: 'These leads haven\'t been contacted recently and may go cold.',
        action: 'Re-engage with follow-up sequence'
      })

      actionsList.push({
        priority: 2,
        title: `Re-engage ${staleLeads.length} stale leads`,
        description: 'No response in 5+ days - send follow-up',
        actionType: 'email',
        leadIds: staleLeads.slice(0, 10).map(l => l.id)
      })
    }

    // Positive: Weekly lead growth
    if (leadsThisWeek > 0) {
      const avgLeadsPerWeek = totalLeads / Math.max(1, 4) // Assume 4 weeks of data
      const change = ((leadsThisWeek - avgLeadsPerWeek) / Math.max(1, avgLeadsPerWeek) * 100).toFixed(0)

      insightsList.push({
        type: leadsThisWeek > avgLeadsPerWeek ? 'positive' : 'info',
        title: `${leadsThisWeek} new leads this week`,
        description: leadsThisWeek > avgLeadsPerWeek
          ? `Lead volume up ${change}% compared to average`
          : 'Pipeline activity is steady'
      })
    }

    // Warning: Underperforming campaigns
    if (underperformingCampaigns.length > 0) {
      insightsList.push({
        type: 'warning',
        title: `${underperformingCampaigns.length} campaigns with high CPL`,
        description: `${underperformingCampaigns.map(c => c.name).slice(0, 2).join(', ')} have CPL above £100`,
        action: 'Review creative or pause spend'
      })
    }

    // Add top hot lead to call
    const topHotLead = activeLeads
      .filter(b => (b.ai_quality_score ?? b.quality_score ?? 0) >= 50)
      .sort((a, b) => (b.ai_quality_score ?? b.quality_score ?? 0) - (a.ai_quality_score ?? a.quality_score ?? 0))[0]

    if (topHotLead) {
      actionsList.push({
        priority: 1,
        title: `Call ${topHotLead.full_name || topHotLead.first_name || 'Hot Lead'}`,
        description: `Score: ${topHotLead.ai_quality_score ?? topHotLead.quality_score ?? 0} - ${topHotLead.ai_next_action || 'High priority contact'}`,
        actionType: 'call',
        leadId: topHotLead.id
      })
    }

    // Summary stats
    const activeCampaigns = campaigns.filter(c => c.status === 'active' || c.status === 'Active').length
    insightsList.push({
      type: 'info',
      title: `Pipeline: ${hotLeads.length} hot, ${warmLeads.length} warm, ${coldLeads} cold`,
      description: `${activeCampaigns} active campaigns generating leads`
    })

    // Sort actions by priority
    actionsList.sort((a, b) => a.priority - b.priority)

    return {
      insights: insightsList.slice(0, 5),
      recommendedActions: actionsList.slice(0, 5)
    }
  }, [leads, campaigns])

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'positive':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const getInsightStyle = (type: string) => {
    switch (type) {
      case 'critical':
        return 'border-l-4 border-l-red-500 bg-red-500/5'
      case 'warning':
        return 'border-l-4 border-l-yellow-500 bg-yellow-500/5'
      case 'positive':
        return 'border-l-4 border-l-green-500 bg-green-500/5'
      default:
        return 'border-l-4 border-l-blue-500 bg-blue-500/5'
    }
  }

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <Phone className="h-4 w-4" />
      case 'email':
        return <Mail className="h-4 w-4" />
      case 'book_viewing':
        return <Calendar className="h-4 w-4" />
      default:
        return <Eye className="h-4 w-4" />
    }
  }

  const handleComplete = (index: number) => {
    setCompletedActions(prev => {
      const newSet = new Set(prev)
      newSet.add(String(index))
      return newSet
    })
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Insights Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              AI Insights
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => refreshData()} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {insights.map((insight, index) => (
            <div
              key={index}
              className={`p-3 rounded-md ${getInsightStyle(insight.type)}`}
            >
              <div className="flex items-start gap-2">
                {getInsightIcon(insight.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{insight.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{insight.description}</p>
                  {insight.action && (
                    <p className="text-xs text-primary mt-1">→ {insight.action}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
          {insights.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No insights available - add leads to see analysis
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recommended Actions Card */}
      {recommendedActions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                Recommended Actions
                <Badge variant="secondary">{recommendedActions.length}</Badge>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {recommendedActions.map((action, index) => (
              <div
                key={index}
                className={`p-3 rounded-md border transition-all ${
                  completedActions.has(String(index))
                    ? 'bg-muted/50 opacity-60'
                    : 'hover:bg-muted/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    {action.priority}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {getActionIcon(action.actionType)}
                      <p className="text-sm font-medium">{action.title}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{action.description}</p>
                  </div>
                  <div className="flex gap-1">
                    {!completedActions.has(String(index)) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => {
                          handleComplete(index)
                          onActionClick?.(action)
                        }}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Done
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
