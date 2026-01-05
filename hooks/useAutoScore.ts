'use client'

import { useEffect, useRef, useCallback } from 'react'
import type { Buyer } from '@/types'

interface ScoreResult {
  id: string
  success: boolean
  quality_score?: number
  intent_score?: number
  confidence?: number
  classification?: string
  priority?: string
  summary?: string
  next_action?: string
  risk_flags?: string[]
  recommendations?: string[]
}

interface UseAutoScoreOptions {
  leads: Buyer[]
  onScoreComplete?: (results: ScoreResult[]) => void
  batchSize?: number
  delayBetweenBatches?: number
  enabled?: boolean
}

/**
 * Hook that automatically scores leads without AI scores
 * Runs in the background when leads are loaded
 */
export function useAutoScore({
  leads,
  onScoreComplete,
  batchSize = 5,
  delayBetweenBatches = 1000,
  enabled = true,
}: UseAutoScoreOptions) {
  const scoringRef = useRef(false)
  const scoredIdsRef = useRef<Set<string>>(new Set())

  // Find leads that need scoring
  const getUnscoredLeads = useCallback(() => {
    return leads.filter(lead => {
      // Skip if already scored in this session
      if (scoredIdsRef.current.has(lead.id)) return false

      // Check if lead has been AI scored
      // Check for non-null scores (0 is a valid score, null means unscored)
      const hasScore = (lead.ai_quality_score !== null && lead.ai_quality_score !== undefined) ||
                       (lead.quality_score !== null && lead.quality_score !== undefined) ||
                       lead.ai_scored_at

      return !hasScore
    })
  }, [leads])

  // Score a single lead
  const scoreLead = useCallback(async (leadId: string): Promise<ScoreResult> => {
    try {
      const response = await fetch('/api/ai/score-buyer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyerId: leadId }),
      })

      if (!response.ok) {
        console.warn(`[AutoScore] Failed to score lead ${leadId}:`, response.status)
        return { id: leadId, success: false }
      }

      const data = await response.json()
      return {
        id: leadId,
        success: true,
        quality_score: data.quality_score,
        intent_score: data.intent_score,
        confidence: data.confidence,
        classification: data.classification,
        priority: data.priority,
        summary: data.summary,
        next_action: data.next_action,
        risk_flags: data.risk_flags,
        recommendations: data.recommendations,
      }
    } catch (error) {
      console.error(`[AutoScore] Error scoring lead ${leadId}:`, error)
      return { id: leadId, success: false }
    }
  }, [])

  // Score leads in batches
  const scoreLeadsInBatches = useCallback(async (leadsToScore: Buyer[]) => {
    if (scoringRef.current) return
    scoringRef.current = true

    console.log(`[AutoScore] Starting to score ${leadsToScore.length} leads in batches of ${batchSize}`)

    const allResults: ScoreResult[] = []

    for (let i = 0; i < leadsToScore.length; i += batchSize) {
      const batch = leadsToScore.slice(i, i + batchSize)

      // Score batch in parallel
      const batchResults = await Promise.all(
        batch.map(lead => scoreLead(lead.id))
      )

      // Mark as scored
      batch.forEach(lead => scoredIdsRef.current.add(lead.id))
      allResults.push(...batchResults)

      const successCount = batchResults.filter(r => r.success).length
      console.log(`[AutoScore] Batch ${Math.floor(i / batchSize) + 1}: ${successCount}/${batch.length} scored successfully`)

      // Delay between batches to avoid rate limiting
      if (i + batchSize < leadsToScore.length) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches))
      }
    }

    scoringRef.current = false

    if (onScoreComplete) {
      onScoreComplete(allResults)
    }

    console.log(`[AutoScore] Completed scoring ${allResults.length} leads`)
  }, [batchSize, delayBetweenBatches, scoreLead, onScoreComplete])

  // Auto-score when leads change
  useEffect(() => {
    if (!enabled || leads.length === 0) return

    const unscoredLeads = getUnscoredLeads()

    if (unscoredLeads.length > 0) {
      console.log(`[AutoScore] Found ${unscoredLeads.length} unscored leads`)
      scoreLeadsInBatches(unscoredLeads)
    }
  }, [enabled, leads, getUnscoredLeads, scoreLeadsInBatches])

  return {
    isScoring: scoringRef.current,
    scoredCount: scoredIdsRef.current.size,
  }
}
