import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { scoreLead } from '@/lib/scoring'
import { generateAISummaryWithLLM } from '@/lib/scoring/ai-summary'
import type { Buyer } from '@/types'

export interface ScoreBuyerResponse {
  success: boolean
  summary: string
  quality_score: number
  intent_score: number
  confidence: number
  classification: string
  priority: string
  priority_response_time: string
  next_action: string
  risk_flags: string[]
  recommendations: string[]
  is_spam: boolean
  spam_flags: string[]
  score_breakdown: {
    quality: {
      total: number
      profileCompleteness: { score: number; maxScore: number; details: string[] }
      financialQualification: { score: number; maxScore: number; details: string[] }
      verificationStatus: { score: number; maxScore: number; details: string[] }
      inventoryFit: { score: number; maxScore: number; details: string[] }
    }
    intent: {
      total: number
      timeline: { score: number; maxScore: number; details: string[] }
      purpose: { score: number; maxScore: number; details: string[] }
      engagement: { score: number; maxScore: number; details: string[] }
      commitment: { score: number; maxScore: number; details: string[] }
      negativeModifiers: { score: number; maxScore: number; details: string[] }
    }
    confidence: {
      total: number
      dataCompleteness: { score: number; maxScore: number; details: string[] }
      verificationLevel: { score: number; maxScore: number; details: string[] }
      engagementData: { score: number; maxScore: number; details: string[] }
      transcriptQuality: { score: number; maxScore: number; details: string[] }
    }
  }
}

// Score a buyer and generate AI summary
export async function POST(request: NextRequest) {
  try {
    const { buyerId } = await request.json()

    if (!buyerId) {
      return NextResponse.json({ error: 'Buyer ID required' }, { status: 400 })
    }

    const supabase = createClient()

    // Fetch buyer data
    const { data: buyer, error } = await supabase
      .from('buyers')
      .select('*')
      .eq('id', buyerId)
      .single()

    if (error || !buyer) {
      return NextResponse.json({ error: 'Buyer not found' }, { status: 404 })
    }

    // Run comprehensive scoring
    const scores = scoreLead(buyer as Buyer)

    // Generate AI summary
    const aiSummary = await generateAISummaryWithLLM(buyer as Buyer, scores)

    // Prepare score breakdown for response
    const scoreBreakdown = {
      quality: {
        total: scores.qualityScore.total,
        profileCompleteness: {
          score: scores.qualityScore.breakdown.profileCompleteness.score,
          maxScore: scores.qualityScore.breakdown.profileCompleteness.maxScore,
          details: scores.qualityScore.breakdown.profileCompleteness.details
        },
        financialQualification: {
          score: scores.qualityScore.breakdown.financialQualification.score,
          maxScore: scores.qualityScore.breakdown.financialQualification.maxScore,
          details: scores.qualityScore.breakdown.financialQualification.details
        },
        verificationStatus: {
          score: scores.qualityScore.breakdown.verificationStatus.score,
          maxScore: scores.qualityScore.breakdown.verificationStatus.maxScore,
          details: scores.qualityScore.breakdown.verificationStatus.details
        },
        inventoryFit: {
          score: scores.qualityScore.breakdown.inventoryFit.score,
          maxScore: scores.qualityScore.breakdown.inventoryFit.maxScore,
          details: scores.qualityScore.breakdown.inventoryFit.details
        }
      },
      intent: {
        total: scores.intentScore.total,
        timeline: {
          score: scores.intentScore.breakdown.timeline.score,
          maxScore: scores.intentScore.breakdown.timeline.maxScore,
          details: scores.intentScore.breakdown.timeline.details
        },
        purpose: {
          score: scores.intentScore.breakdown.purpose.score,
          maxScore: scores.intentScore.breakdown.purpose.maxScore,
          details: scores.intentScore.breakdown.purpose.details
        },
        engagement: {
          score: scores.intentScore.breakdown.engagement.score,
          maxScore: scores.intentScore.breakdown.engagement.maxScore,
          details: scores.intentScore.breakdown.engagement.details
        },
        commitment: {
          score: scores.intentScore.breakdown.commitment.score,
          maxScore: scores.intentScore.breakdown.commitment.maxScore,
          details: scores.intentScore.breakdown.commitment.details
        },
        negativeModifiers: {
          score: scores.intentScore.breakdown.negativeModifiers.score,
          maxScore: scores.intentScore.breakdown.negativeModifiers.maxScore,
          details: scores.intentScore.breakdown.negativeModifiers.details
        }
      },
      confidence: {
        total: scores.confidenceScore.total,
        dataCompleteness: {
          score: scores.confidenceScore.breakdown.dataCompleteness.score,
          maxScore: scores.confidenceScore.breakdown.dataCompleteness.maxScore,
          details: scores.confidenceScore.breakdown.dataCompleteness.details
        },
        verificationLevel: {
          score: scores.confidenceScore.breakdown.verificationLevel.score,
          maxScore: scores.confidenceScore.breakdown.verificationLevel.maxScore,
          details: scores.confidenceScore.breakdown.verificationLevel.details
        },
        engagementData: {
          score: scores.confidenceScore.breakdown.engagementData.score,
          maxScore: scores.confidenceScore.breakdown.engagementData.maxScore,
          details: scores.confidenceScore.breakdown.engagementData.details
        },
        transcriptQuality: {
          score: scores.confidenceScore.breakdown.transcriptQuality.score,
          maxScore: scores.confidenceScore.breakdown.transcriptQuality.maxScore,
          details: scores.confidenceScore.breakdown.transcriptQuality.details
        }
      }
    }

    // Update buyer in database with scores
    const { error: updateError } = await supabase
      .from('buyers')
      .update({
        ai_quality_score: scores.qualityScore.total,
        ai_intent_score: scores.intentScore.total,
        ai_confidence: scores.confidenceScore.total / 10,  // Normalize to 0-1
        ai_summary: aiSummary.summary,
        ai_next_action: aiSummary.nextAction,
        ai_risk_flags: scores.riskFlags,
        ai_scored_at: new Date().toISOString(),
        // Also update the standard score fields
        quality_score: scores.qualityScore.total,
        intent_score: scores.intentScore.total
      })
      .eq('id', buyerId)

    if (updateError) {
      console.error('[AI Score] Update error:', updateError)
    }

    const response: ScoreBuyerResponse = {
      success: true,
      summary: aiSummary.summary,
      quality_score: scores.qualityScore.total,
      intent_score: scores.intentScore.total,
      confidence: scores.confidenceScore.total,
      classification: scores.classification,
      priority: scores.priority.priority,
      priority_response_time: scores.priority.responseTime,
      next_action: aiSummary.nextAction,
      risk_flags: scores.riskFlags,
      recommendations: aiSummary.recommendations,
      is_spam: scores.spamCheck.isSpam,
      spam_flags: scores.spamCheck.flags,
      score_breakdown: scoreBreakdown
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[AI Score] Error:', error)
    return NextResponse.json(
      { error: 'Failed to score buyer' },
      { status: 500 }
    )
  }
}

// Batch scoring endpoint
export async function PUT(request: NextRequest) {
  try {
    const { buyerIds } = await request.json()

    if (!buyerIds || !Array.isArray(buyerIds)) {
      return NextResponse.json({ error: 'Buyer IDs array required' }, { status: 400 })
    }

    const supabase = createClient()

    // Fetch all buyers
    const { data: buyers, error } = await supabase
      .from('buyers')
      .select('*')
      .in('id', buyerIds)

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch buyers' }, { status: 500 })
    }

    const results = []

    for (const buyer of buyers || []) {
      try {
        // Run scoring
        const scores = scoreLead(buyer as Buyer)
        const aiSummary = await generateAISummaryWithLLM(buyer as Buyer, scores)

        // Update in database
        await supabase
          .from('buyers')
          .update({
            ai_quality_score: scores.qualityScore.total,
            ai_intent_score: scores.intentScore.total,
            ai_confidence: scores.confidenceScore.total / 10,
            ai_summary: aiSummary.summary,
            ai_next_action: aiSummary.nextAction,
            ai_risk_flags: scores.riskFlags,
            ai_scored_at: new Date().toISOString(),
            quality_score: scores.qualityScore.total,
            intent_score: scores.intentScore.total
          })
          .eq('id', buyer.id)

        results.push({
          id: buyer.id,
          success: true,
          classification: scores.classification,
          quality_score: scores.qualityScore.total,
          intent_score: scores.intentScore.total
        })
      } catch (err) {
        results.push({
          id: buyer.id,
          success: false,
          error: 'Scoring failed'
        })
      }
    }

    return NextResponse.json({
      success: true,
      scored: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    })
  } catch (error) {
    console.error('[AI Score Batch] Error:', error)
    return NextResponse.json(
      { error: 'Failed to batch score buyers' },
      { status: 500 }
    )
  }
}
