import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import type { Buyer } from '@/types'
import {
  scoreLeadNaybourhood,
  convertToLegacyFormat,
  NaybourhoodScoreResult
} from '@/lib/scoring/naybourhood-scoring'

// Force dynamic rendering - this route uses cookies
export const dynamic = 'force-dynamic'

// Get admin client for database operations (bypasses RLS)
function getSupabaseClient() {
  try {
    // Try admin client first (service role) - works for all users including Quick Access
    return createAdminClient()
  } catch {
    // Fall back to regular client if service role key not configured
    console.log('[AI Score] Using regular Supabase client (service role not configured)')
    return createClient()
  }
}

// Initialize Anthropic client
function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return null
  }
  return new Anthropic({ apiKey })
}

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
  // Naybourhood Framework Fields
  is_28_day_buyer: boolean
  call_priority: number
  call_priority_reason: string
  low_urgency_flag: boolean
  naybourhood_classification: string
  score_breakdown: {
    quality: {
      total: number
      breakdown: Array<{ factor: string; points: number; reason: string }>
      isDisqualified: boolean
      disqualificationReason?: string
    }
    intent: {
      total: number
      breakdown: Array<{ factor: string; points: number; reason: string }>
      is28DayBuyer: boolean
    }
    confidence: {
      total: number
      breakdown: Array<{ factor: string; points: number; reason: string }>
    }
  }
}

// Generate enhanced AI summary using Claude (complements Naybourhood scoring)
async function generateClaudeSummary(client: Anthropic, buyer: any, naybourhoodScore: NaybourhoodScoreResult): Promise<{ summary: string; next_action: string; recommendations: string[] }> {
  const prompt = `You are a real estate CRM AI assistant. Generate a concise buyer summary and action recommendations.

BUYER DATA:
- Name: ${buyer.full_name || buyer.first_name || 'Unknown'}
- Email: ${buyer.email || 'Not provided'}
- Phone: ${buyer.phone || 'Not provided'}
- Country: ${buyer.country || 'Not specified'}
- Budget: ${buyer.budget || buyer.budget_range || 'Not specified'}
- Payment Method: ${buyer.payment_method || 'Unknown'}
- Purchase Purpose: ${buyer.purchase_purpose || buyer.purpose || 'Not specified'}
- Timeline: ${buyer.timeline || 'Not specified'}
- Ready in 28 Days: ${buyer.ready_within_28_days || buyer.ready_in_28_days ? 'Yes' : 'No'}
- Location Preference: ${buyer.location || buyer.area || 'Not specified'}
- Bedrooms: ${buyer.bedrooms || buyer.preferred_bedrooms || 'Not specified'}
- Status: ${buyer.status || 'New'}
- UK Broker: ${buyer.uk_broker || 'Unknown'}
- UK Solicitor: ${buyer.uk_solicitor || 'Unknown'}
- Source: ${buyer.source || 'Unknown'}
- Notes: ${buyer.notes || 'None'}

SCORING (already calculated by Naybourhood AI Framework):
- Quality Score: ${naybourhoodScore.qualityScore.total}/100
- Intent Score: ${naybourhoodScore.intentScore.total}/100
- Classification: ${naybourhoodScore.classification}
- Is 28-Day Buyer: ${naybourhoodScore.is28DayBuyer ? 'YES - HARD RULE AUTO HOT LEAD' : 'No'}
- Call Priority: Level ${naybourhoodScore.callPriority.level} (${naybourhoodScore.callPriority.responseTime})
- Risk Flags: ${naybourhoodScore.riskFlags.join(', ') || 'None'}

Based on this data, provide:
1. A 2-3 sentence summary highlighting buyer readiness and key characteristics
2. The single most important next action for the sales team
3. Up to 3 actionable recommendations

Respond ONLY with valid JSON:
{
  "summary": "<2-3 sentence summary>",
  "next_action": "<single specific action>",
  "recommendations": ["<rec1>", "<rec2>", "<rec3>"]
}`

  try {
    const response = await client.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    })

    const textContent = response.content.find(c => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude')
    }

    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
  } catch (err) {
    console.log('[AI Score] Claude summary generation failed, using fallback')
  }

  // Fallback summary generation
  return generateFallbackSummary(buyer, naybourhoodScore)
}

// Generate fallback summary without Claude
function generateFallbackSummary(buyer: any, score: NaybourhoodScoreResult, kycStatus?: string): { summary: string; next_action: string; recommendations: string[] } {
  const name = buyer.full_name || buyer.first_name || 'This lead'
  const paymentType = buyer.payment_method || 'potential'
  const locationInfo = buyer.location || buyer.area || 'the area'
  const budget = buyer.budget || buyer.budget_range || 'Not specified'

  let summary = `${name} is a ${paymentType} buyer interested in ${locationInfo}. Budget: ${budget}.`

  if (score.is28DayBuyer) {
    summary += ' URGENT: Ready to purchase within 28 days - immediate priority.'
  } else if (score.classification === 'Hot Lead') {
    summary += ' High-quality lead with strong purchase intent.'
  }

  // Add KYC context to summary
  if (kycStatus === 'passed') {
    summary += ' Buyer verified - AML/KYC checks passed.'
  } else if (kycStatus === 'failed') {
    summary += ' WARNING: AML/KYC verification failed.'
  }

  let next_action = 'Contact lead to confirm interest and timeline'
  if (score.is28DayBuyer) {
    next_action = 'Call immediately - 28-day buyer requires same-day contact'
  } else if (score.classification === 'Hot Lead') {
    next_action = 'Schedule discovery call within 2 hours'
  } else if (score.classification === 'Needs Qualification') {
    next_action = 'Verify contact details and gather missing information'
  }

  const recommendations: string[] = []

  if (score.fakeLeadCheck.flags.length > 0) {
    recommendations.push('Verify lead authenticity - some red flags detected')
  }

  // KYC-based recommendations
  if (!kycStatus || kycStatus === 'not_started') {
    recommendations.push('Recommend: Run AML/KYC verification')
  } else if (kycStatus === 'passed') {
    recommendations.push('Buyer verified - proceed with confidence')
  } else if (kycStatus === 'failed') {
    recommendations.push('Review KYC failure details before proceeding')
  }

  if (!buyer.proof_of_funds && buyer.payment_method?.toLowerCase() !== 'cash') {
    recommendations.push('Request proof of funds or mortgage approval')
  }

  if (!buyer.uk_broker || buyer.uk_broker === 'no') {
    if (buyer.payment_method?.toLowerCase() === 'mortgage') {
      recommendations.push('Introduce to partner mortgage broker')
    }
  }

  if (!buyer.timeline) {
    recommendations.push('Confirm purchase timeline')
  }

  if (recommendations.length < 3) {
    recommendations.push('Schedule property viewing')
  }

  return { summary, next_action, recommendations: recommendations.slice(0, 3) }
}


// Score a buyer using Naybourhood AI Scoring Framework
export async function POST(request: NextRequest) {
  try {
    const { buyerId } = await request.json()

    if (!buyerId) {
      return NextResponse.json({ error: 'Buyer ID required' }, { status: 400 })
    }

    const supabase = getSupabaseClient()

    // Fetch buyer data
    const { data: buyer, error } = await supabase
      .from('buyers')
      .select('*')
      .eq('id', buyerId)
      .single()

    if (error || !buyer) {
      return NextResponse.json({ error: 'Buyer not found' }, { status: 404 })
    }

    // Use Naybourhood AI Scoring Framework
    console.log('[AI Score] Using Naybourhood AI Scoring Framework')
    const naybourhoodScore = scoreLeadNaybourhood(buyer as Buyer)

    // Convert to legacy format for database storage
    const legacyScores = convertToLegacyFormat(naybourhoodScore)

    // Look up latest KYC status for this buyer
    let kycStatus: string | undefined
    try {
      const { data: kycData } = await supabase
        .from('kyc_checks')
        .select('status')
        .eq('buyer_id', buyerId)
        .order('created_at', { ascending: false })
        .range(0, 0)
      kycStatus = kycData?.[0]?.status
    } catch {
      // kyc_checks table may not exist yet - continue without it
    }

    // Get Anthropic client for enhanced summary generation
    const client = getAnthropicClient()

    // Generate summary (with Claude if available, otherwise fallback)
    let summaryData: { summary: string; next_action: string; recommendations: string[] }
    if (client) {
      console.log('[AI Score] Enhancing with Claude AI summary')
      summaryData = await generateClaudeSummary(client, buyer, naybourhoodScore)
    } else {
      console.log('[AI Score] Using fallback summary generation')
      summaryData = generateFallbackSummary(buyer, naybourhoodScore, kycStatus)
    }

    // Update buyer in database with Naybourhood scores
    const { error: updateError } = await supabase
      .from('buyers')
      .update({
        // AI scores
        ai_quality_score: naybourhoodScore.qualityScore.total,
        ai_intent_score: naybourhoodScore.intentScore.total,
        ai_confidence: naybourhoodScore.confidenceScore.total / 10, // Normalize to 0-10
        ai_summary: summaryData.summary,
        ai_next_action: summaryData.next_action,
        ai_risk_flags: naybourhoodScore.riskFlags,
        ai_recommendations: summaryData.recommendations,
        ai_classification: naybourhoodScore.classification,
        ai_priority: legacyScores.ai_priority,
        ai_scored_at: new Date().toISOString(),
        // Standard score fields
        quality_score: naybourhoodScore.qualityScore.total,
        intent_score: naybourhoodScore.intentScore.total,
        // Naybourhood-specific fields
        ready_within_28_days: naybourhoodScore.is28DayBuyer,
        call_priority: naybourhoodScore.callPriority.level,
        call_priority_reason: naybourhoodScore.callPriority.description,
        low_urgency_flag: naybourhoodScore.lowUrgencyFlag,
        is_fake_lead: naybourhoodScore.fakeLeadCheck.isFake,
        fake_lead_flags: naybourhoodScore.fakeLeadCheck.flags
      })
      .eq('id', buyerId)

    if (updateError) {
      console.error('[AI Score] Update error:', updateError)
    }

    const response: ScoreBuyerResponse = {
      success: true,
      summary: summaryData.summary,
      quality_score: naybourhoodScore.qualityScore.total,
      intent_score: naybourhoodScore.intentScore.total,
      confidence: naybourhoodScore.confidenceScore.total,
      classification: legacyScores.ai_classification,
      priority: legacyScores.ai_priority,
      priority_response_time: naybourhoodScore.callPriority.responseTime,
      next_action: summaryData.next_action,
      risk_flags: naybourhoodScore.riskFlags,
      recommendations: summaryData.recommendations,
      is_spam: naybourhoodScore.fakeLeadCheck.isFake,
      spam_flags: naybourhoodScore.fakeLeadCheck.flags,
      // Naybourhood Framework Fields
      is_28_day_buyer: naybourhoodScore.is28DayBuyer,
      call_priority: naybourhoodScore.callPriority.level,
      call_priority_reason: naybourhoodScore.callPriority.description,
      low_urgency_flag: naybourhoodScore.lowUrgencyFlag,
      naybourhood_classification: naybourhoodScore.classification,
      score_breakdown: {
        quality: {
          total: naybourhoodScore.qualityScore.total,
          breakdown: naybourhoodScore.qualityScore.breakdown,
          isDisqualified: naybourhoodScore.qualityScore.isDisqualified,
          disqualificationReason: naybourhoodScore.qualityScore.disqualificationReason
        },
        intent: {
          total: naybourhoodScore.intentScore.total,
          breakdown: naybourhoodScore.intentScore.breakdown,
          is28DayBuyer: naybourhoodScore.intentScore.is28DayBuyer
        },
        confidence: {
          total: naybourhoodScore.confidenceScore.total,
          breakdown: naybourhoodScore.confidenceScore.breakdown
        }
      }
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

// Batch scoring endpoint using Naybourhood AI Scoring Framework
export async function PUT(request: NextRequest) {
  try {
    const { buyerIds } = await request.json()

    if (!buyerIds || !Array.isArray(buyerIds)) {
      return NextResponse.json({ error: 'Buyer IDs array required' }, { status: 400 })
    }

    const supabase = getSupabaseClient()
    const client = getAnthropicClient()

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
        // Use Naybourhood AI Scoring Framework
        const naybourhoodScore = scoreLeadNaybourhood(buyer as Buyer)
        const legacyScores = convertToLegacyFormat(naybourhoodScore)

        // Generate summary
        let summaryData: { summary: string; next_action: string; recommendations: string[] }
        if (client) {
          summaryData = await generateClaudeSummary(client, buyer, naybourhoodScore)
        } else {
          summaryData = generateFallbackSummary(buyer, naybourhoodScore)
        }

        // Update in database
        await supabase
          .from('buyers')
          .update({
            // AI scores
            ai_quality_score: naybourhoodScore.qualityScore.total,
            ai_intent_score: naybourhoodScore.intentScore.total,
            ai_confidence: naybourhoodScore.confidenceScore.total / 10,
            ai_summary: summaryData.summary,
            ai_next_action: summaryData.next_action,
            ai_risk_flags: naybourhoodScore.riskFlags,
            ai_recommendations: summaryData.recommendations,
            ai_classification: naybourhoodScore.classification,
            ai_priority: legacyScores.ai_priority,
            ai_scored_at: new Date().toISOString(),
            // Standard score fields
            quality_score: naybourhoodScore.qualityScore.total,
            intent_score: naybourhoodScore.intentScore.total,
            // Naybourhood-specific fields
            ready_within_28_days: naybourhoodScore.is28DayBuyer,
            call_priority: naybourhoodScore.callPriority.level,
            call_priority_reason: naybourhoodScore.callPriority.description,
            low_urgency_flag: naybourhoodScore.lowUrgencyFlag,
            is_fake_lead: naybourhoodScore.fakeLeadCheck.isFake,
            fake_lead_flags: naybourhoodScore.fakeLeadCheck.flags
          })
          .eq('id', buyer.id)

        results.push({
          id: buyer.id,
          success: true,
          classification: naybourhoodScore.classification,
          quality_score: naybourhoodScore.qualityScore.total,
          intent_score: naybourhoodScore.intentScore.total,
          is_28_day_buyer: naybourhoodScore.is28DayBuyer,
          call_priority: naybourhoodScore.callPriority.level
        })
      } catch (err) {
        console.error(`[AI Score Batch] Error scoring ${buyer.id}:`, err)
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
