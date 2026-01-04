'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Bot,
  RefreshCw,
  AlertTriangle,
  Target,
  Lightbulb,
  Flame,
  Thermometer,
  Snowflake
} from 'lucide-react'
import type { AIBuyerSummary as AIBuyerSummaryType } from '@/types'

interface AIBuyerSummaryProps {
  buyerId: string
  initialData?: AIBuyerSummaryType
}

export function AIBuyerSummary({ buyerId, initialData }: AIBuyerSummaryProps) {
  const [summary, setSummary] = useState<AIBuyerSummaryType | null>(initialData || null)
  const [loading, setLoading] = useState(!initialData)
  const [error, setError] = useState<string | null>(null)

  const fetchSummary = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/ai/score-buyer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyerId })
      })
      if (!response.ok) throw new Error('Failed to score buyer')
      const data = await response.json()
      setSummary(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate summary')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!initialData) {
      fetchSummary()
    }
  }, [buyerId, initialData])

  const getClassification = (quality: number, intent: number) => {
    const combined = (quality * 0.5) + (intent * 0.5)
    if (combined >= 70) return { label: 'Hot', icon: Flame, color: 'text-red-500', bg: 'bg-red-500' }
    if (combined >= 45) return { label: 'Warm', icon: Thermometer, color: 'text-orange-500', bg: 'bg-orange-500' }
    return { label: 'Cold', icon: Snowflake, color: 'text-blue-500', bg: 'bg-blue-500' }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            AI Buyer Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Analyzing buyer...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !summary) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            AI Buyer Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            <p>{error || 'No summary available'}</p>
            <Button variant="outline" size="sm" onClick={fetchSummary} className="mt-2">
              Generate Summary
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const classification = getClassification(summary.quality_score, summary.intent_score)
  const ClassIcon = classification.icon

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            AI Buyer Summary
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={fetchSummary} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Re-score
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Text */}
        <div className="p-3 bg-muted/50 rounded-md">
          <p className="text-sm leading-relaxed">{summary.summary}</p>
        </div>

        {/* Scores */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Quality</span>
              <span className="text-sm font-medium">{summary.quality_score}</span>
            </div>
            <Progress value={summary.quality_score} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Intent</span>
              <span className="text-sm font-medium">{summary.intent_score}</span>
            </div>
            <Progress value={summary.intent_score} className="h-2" />
          </div>
          <div className="flex flex-col items-center justify-center">
            <span className="text-xs text-muted-foreground mb-1">Confidence</span>
            <span className="text-lg font-bold">{Math.round(summary.confidence * 100)}%</span>
          </div>
        </div>

        {/* Classification Badge */}
        <div className="flex items-center justify-center">
          <Badge className={`${classification.bg} text-white px-4 py-1`}>
            <ClassIcon className="h-4 w-4 mr-1" />
            {classification.label} Lead
          </Badge>
        </div>

        {/* Next Action */}
        <div className="p-3 bg-primary/5 border border-primary/20 rounded-md">
          <div className="flex items-start gap-2">
            <Target className="h-4 w-4 text-primary mt-0.5" />
            <div>
              <p className="text-xs font-medium text-primary uppercase">Next Action</p>
              <p className="text-sm mt-0.5">{summary.next_action}</p>
            </div>
          </div>
        </div>

        {/* Risk Flags */}
        {summary.risk_flags.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <AlertTriangle className="h-3 w-3" />
              Risk Flags
            </div>
            <ul className="space-y-1">
              {summary.risk_flags.map((flag, index) => (
                <li key={index} className="text-sm text-yellow-600 dark:text-yellow-500 flex items-start gap-2">
                  <span>•</span>
                  <span>{flag}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        {summary.recommendations.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <Lightbulb className="h-3 w-3" />
              Recommendations
            </div>
            <ol className="space-y-1 list-decimal list-inside">
              {summary.recommendations.map((rec, index) => (
                <li key={index} className="text-sm text-muted-foreground">
                  {rec}
                </li>
              ))}
            </ol>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
