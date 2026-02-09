'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ClassificationBadge } from '@/components/badges/ClassificationBadge'
import { RiskFlagList } from '@/components/badges/RiskFlagBadge'
import { NBScoreHero } from '@/components/scoring/NBScoreHero'
import {
  Bot,
  RefreshCw,
  Target,
  Lightbulb,
} from 'lucide-react'
import type { AIBuyerSummary as AIBuyerSummaryType } from '@/types'

interface AIBuyerSummaryProps {
  buyerId: string
  initialData?: AIBuyerSummaryType
}

function getClassificationLabel(quality: number, intent: number): string {
  const combined = (quality + intent) / 2
  if (combined >= 70) return 'Hot'
  if (quality >= 70 && intent >= 45) return 'Warm-Qualified'
  if (quality >= 45 && intent >= 70) return 'Warm-Engaged'
  if (combined >= 45) return 'Nurture'
  return 'Cold'
}

export function AIBuyerSummary({ buyerId, initialData }: AIBuyerSummaryProps) {
  const [summary, setSummary] = useState<AIBuyerSummaryType | null>(initialData || null)
  const [loading, setLoading] = useState(!initialData)
  const [error, setError] = useState<string | null>(null)

  const fetchSummary = useCallback(async () => {
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
  }, [buyerId])

  useEffect(() => {
    if (!initialData) {
      fetchSummary()
    }
  }, [buyerId, initialData, fetchSummary])

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

  const classificationLabel = getClassificationLabel(summary.quality_score, summary.intent_score)

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
        {/* NB Score Hero + Classification */}
        <div className="flex items-center justify-center gap-6">
          <NBScoreHero
            qualityScore={summary.quality_score}
            intentScore={summary.intent_score}
            size="lg"
            showBreakdown
          />
          <div className="flex flex-col items-center gap-2">
            <ClassificationBadge classification={classificationLabel} size="lg" />
            <span className="text-xs text-muted-foreground">
              {Math.round(summary.confidence * 100)}% confidence
            </span>
          </div>
        </div>

        {/* Summary Text */}
        <div className="p-3 bg-muted/50 rounded-md">
          <p className="text-sm leading-relaxed">{summary.summary}</p>
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

        {/* Risk Flags as inline badges */}
        {summary.risk_flags.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">
              Risk Flags
            </div>
            <RiskFlagList flags={summary.risk_flags} />
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
