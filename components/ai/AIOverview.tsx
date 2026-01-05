'use client'

import { useEffect, useState } from 'react'
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
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AIInsight {
  type: 'critical' | 'warning' | 'positive' | 'info'
  title: string
  description: string
  action?: string
  actionType?: 'call' | 'email' | 'view_list' | 'book_viewing'
  leadId?: string
}

interface AIOverviewProps {
  pageType: 'leads' | 'campaigns' | 'dashboard'
  insights?: AIInsight[]
  loading?: boolean
  onRefresh?: () => void
  onAction?: (insight: AIInsight) => void
  className?: string
}

export function AIOverview({
  pageType,
  insights: propInsights,
  loading: propLoading,
  onRefresh,
  onAction,
  className,
}: AIOverviewProps) {
  const [insights, setInsights] = useState<AIInsight[]>(propInsights || [])
  const [loading, setLoading] = useState(propLoading || false)
  const [expanded, setExpanded] = useState(true)

  useEffect(() => {
    if (!propInsights) {
      fetchInsights()
    }
  }, [pageType])

  useEffect(() => {
    if (propInsights) {
      setInsights(propInsights)
    }
  }, [propInsights])

  const fetchInsights = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/ai/dashboard-insights')
      if (response.ok) {
        const data = await response.json()
        setInsights(data.insights || [])
      }
    } catch (error) {
      console.error('Error fetching AI insights:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh()
    } else {
      fetchInsights()
    }
  }

  const getTypeStyles = (type: AIInsight['type']) => {
    switch (type) {
      case 'critical':
        return 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-600 dark:text-yellow-400'
      case 'positive':
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
        return TrendingUp
      default:
        return Lightbulb
    }
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
            <span className="text-sm text-muted-foreground">Analyzing your data...</span>
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
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <span className="font-medium text-sm">AI Insights</span>
            <Badge variant="secondary" className="text-[10px]">
              {insights.length} recommendations
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
                      <div className="font-medium text-sm">{insight.title}</div>
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
                      <div className="font-medium text-sm">{insight.title}</div>
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
