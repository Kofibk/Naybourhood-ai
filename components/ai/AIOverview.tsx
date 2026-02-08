'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Brain,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  TrendingUp,
  Target,
  Lightbulb,
  Phone,
  Mail,
  Calendar,
  Eye,
  Zap,
  Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLeads } from '@/hooks/useLeads'
import type { Buyer } from '@/types'

interface AIInsight {
  type: 'critical' | 'warning' | 'positive' | 'info' | 'opportunity' | 'action'
  title: string
  description: string
  action?: string
  actionType?: 'call' | 'email' | 'view_list' | 'book_viewing'
  urgency?: 'now' | 'today' | 'this_week'
  leadId?: string
  leadIds?: string[]
}

interface AIOverviewProps {
  pageType: 'leads' | 'campaigns' | 'dashboard'
  leads?: Buyer[]  // Optional: pass leads directly
  insights?: AIInsight[]
  loading?: boolean
  onRefresh?: () => void
  onAction?: (insight: AIInsight) => void
  className?: string
}

export function AIOverview({
  pageType,
  leads: propLeads,
  insights: propInsights,
  loading: propLoading,
  onRefresh,
  onAction,
  className,
}: AIOverviewProps) {
  const { leads: contextLeads } = useLeads()
  const leads = propLeads || contextLeads

  const [insights, setInsights] = useState<AIInsight[]>(propInsights || [])
  const [loading, setLoading] = useState(propLoading || false)
  const [expanded, setExpanded] = useState(true)
  const [summary, setSummary] = useState<string>('')
  const [topPriority, setTopPriority] = useState<string>('')
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null)

  // Generate insights using Claude AI
  const generateInsights = useCallback(async () => {
    if (leads.length === 0) return

    setLoading(true)
    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'dashboard_insights',
          data: { leads },
        }),
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.content) {
          // Map Claude response to our insight format
          const claudeInsights = (result.content.insights || []).map((i: any) => ({
            type: mapInsightType(i.type),
            title: i.title,
            description: i.description,
            action: i.action,
            urgency: i.urgency,
            leadIds: i.leadIds,
          }))

          setInsights(claudeInsights)
          setSummary(result.content.summary || '')
          setTopPriority(result.content.topPriority || '')
          setLastGenerated(new Date())
        }
      }
    } catch (error) {
      console.error('[AIOverview] Error generating insights:', error)
    } finally {
      setLoading(false)
    }
  }, [leads])

  // Map Claude's insight types to our types
  const mapInsightType = (type: string): AIInsight['type'] => {
    switch (type) {
      case 'warning':
        return 'warning'
      case 'opportunity':
        return 'positive'
      case 'action':
        return 'info'
      default:
        return 'info'
    }
  }

  // Generate insights when leads change (with debounce)
  useEffect(() => {
    if (propInsights) {
      setInsights(propInsights)
      return
    }

    // Only auto-generate if we have leads and haven't generated recently
    if (leads.length > 0 && !lastGenerated) {
      const timer = setTimeout(() => {
        generateInsights()
      }, 1000) // 1 second debounce

      return () => clearTimeout(timer)
    }
  }, [leads.length, propInsights, lastGenerated, generateInsights])

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh()
    } else {
      generateInsights()
    }
  }

  const getTypeStyles = (type: AIInsight['type']) => {
    switch (type) {
      case 'critical':
        return 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-600 dark:text-yellow-400'
      case 'positive':
      case 'opportunity':
        return 'bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400'
      default:
        return 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400'
    }
  }

  const getTypeIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'critical':
        return AlertTriangle
      case 'warning':
        return AlertTriangle
      case 'positive':
      case 'opportunity':
        return TrendingUp
      case 'action':
        return Zap
      default:
        return Lightbulb
    }
  }

  const getUrgencyBadge = (urgency?: string) => {
    if (!urgency) return null
    const styles: Record<string, string> = {
      now: 'bg-red-100 text-red-700 border-red-200',
      today: 'bg-orange-100 text-orange-700 border-orange-200',
      this_week: 'bg-blue-100 text-blue-700 border-blue-200',
    }
    const labels: Record<string, string> = {
      now: 'Now',
      today: 'Today',
      this_week: 'This Week',
    }
    return (
      <Badge variant="outline" className={cn('text-[9px] ml-1', styles[urgency])}>
        <Clock className="h-2 w-2 mr-0.5" />
        {labels[urgency] || urgency}
      </Badge>
    )
  }

  const getActionIcon = (actionType?: string) => {
    switch (actionType) {
      case 'call':
        return Phone
      case 'email':
        return Mail
      case 'book_viewing':
        return Calendar
      default:
        return Eye
    }
  }

  if (loading && insights.length === 0) {
    return (
      <Card className={cn('bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20', className)}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Brain className="h-5 w-5 text-primary animate-pulse" />
            <span className="text-sm text-muted-foreground">Claude AI is analyzing your leads...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show prompt to generate insights if none exist
  if (insights.length === 0 && leads.length > 0) {
    return (
      <Card className={cn('bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20', className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">
                {leads.length} leads ready for AI analysis
              </span>
            </div>
            <Button size="sm" onClick={generateInsights} disabled={loading}>
              <Zap className="h-4 w-4 mr-1" />
              Generate Insights
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (insights.length === 0) {
    return null
  }

  // Separate critical/warning from other insights
  const priorityInsights = insights.filter(i => i.type === 'critical' || i.type === 'warning')
  const otherInsights = insights.filter(i => i.type !== 'critical' && i.type !== 'warning')

  return (
    <Card className={cn('bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20', className)}>
      <CardContent className="p-4">
        {/* Header with summary */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <div>
              <span className="font-medium text-sm">Claude AI Insights</span>
              {summary && (
                <p className="text-xs text-muted-foreground">{summary}</p>
              )}
            </div>
            <Badge variant="secondary" className="text-[10px]">
              {insights.length} insights
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={cn('h-3 w-3 mr-1', loading && 'animate-spin')} />
              Refresh
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Top Priority Banner */}
        {topPriority && expanded && (
          <div className="mb-3 p-2 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Top Priority: {topPriority}</span>
            </div>
          </div>
        )}

        {/* Insights Grid */}
        {expanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Priority insights first */}
            {priorityInsights.map((insight, i) => {
              const Icon = getTypeIcon(insight.type)
              const ActionIcon = getActionIcon(insight.actionType)
              return (
                <div
                  key={i}
                  className={cn(
                    'p-3 rounded-lg border transition-all hover:scale-[1.02]',
                    getTypeStyles(insight.type)
                  )}
                >
                  <div className="flex items-start gap-2">
                    <Icon className="h-4 w-4 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm flex items-center flex-wrap">
                        {insight.title}
                        {getUrgencyBadge(insight.urgency)}
                      </div>
                      <p className="text-xs opacity-80 mt-0.5 line-clamp-2">{insight.description}</p>
                      {insight.action && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-6 text-[10px] mt-2"
                          onClick={() => onAction?.(insight)}
                        >
                          <ActionIcon className="h-3 w-3 mr-1" />
                          {insight.action}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Other insights */}
            {otherInsights.slice(0, 3).map((insight, i) => {
              const Icon = getTypeIcon(insight.type)
              const ActionIcon = getActionIcon(insight.actionType)
              return (
                <div
                  key={`other-${i}`}
                  className={cn(
                    'p-3 rounded-lg border transition-all hover:scale-[1.02]',
                    getTypeStyles(insight.type)
                  )}
                >
                  <div className="flex items-start gap-2">
                    <Icon className="h-4 w-4 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm flex items-center flex-wrap">
                        {insight.title}
                        {getUrgencyBadge(insight.urgency)}
                      </div>
                      <p className="text-xs opacity-80 mt-0.5 line-clamp-2">{insight.description}</p>
                      {insight.action && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-6 text-[10px] mt-2"
                          onClick={() => onAction?.(insight)}
                        >
                          <ActionIcon className="h-3 w-3 mr-1" />
                          {insight.action}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
