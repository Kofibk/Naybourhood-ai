'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  X
} from 'lucide-react'
import type { AIDashboardInsights } from '@/types'

interface AIInsightsProps {
  onActionClick?: (action: AIDashboardInsights['recommendedActions'][0]) => void
}

export function AIInsights({ onActionClick }: AIInsightsProps) {
  const [insights, setInsights] = useState<AIDashboardInsights | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set())

  const fetchInsights = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/ai/dashboard-insights')
      if (!response.ok) throw new Error('Failed to fetch insights')
      const data = await response.json()
      setInsights(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load insights')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInsights()
  }, [])

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

  if (loading) {
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

  if (error) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            <p>{error}</p>
            <Button variant="outline" size="sm" onClick={fetchInsights} className="mt-2">
              Try Again
            </Button>
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
            <Button variant="ghost" size="sm" onClick={fetchInsights} disabled={loading} aria-label="Refresh insights">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {insights?.insights.map((insight, index) => (
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
          {(!insights?.insights || insights.insights.length === 0) && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No insights available
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recommended Actions Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              🚀 Recommended Actions
            </CardTitle>
            {insights?.recommendedActions && insights.recommendedActions.length > 3 && (
              <Button variant="ghost" size="sm">
                View All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {insights?.recommendedActions.map((action, index) => (
            <div
              key={index}
              className={`p-3 rounded-md border transition-colors ${
                completedActions.has(String(index))
                  ? 'bg-muted/50 opacity-60'
                  : 'hover:bg-muted/50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-medium tabular-nums">
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
                    <>
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
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
          {(!insights?.recommendedActions || insights.recommendedActions.length === 0) && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No actions recommended
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
