import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import type { Buyer } from '@/types'
import {
  calculateQualityScore,
  calculateIntentScore,
  calculateConfidenceScore,
  checkSpam,
  determineClassification,
  determinePriority,
} from '@/lib/scoring'

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

// Generate AI scores using Claude
async function generateClaudeScores(client: Anthropic, buyer: any): Promise<any> {
  const prompt = `You are a real estate CRM AI assistant specialized in lead scoring. Analyze this buyer lead and generate comprehensive scores.

BUYER DATA:
- Name: ${buyer.full_name || buyer.first_name || 'Unknown'}
- Email: ${buyer.email || 'Not provided'}
- Phone: ${buyer.phone || 'Not provided'}
- Country: ${buyer.country || 'Not specified'}
- Budget: ${buyer.budget || buyer.budget_range || 'Not specified'}
- Payment Method: ${buyer.payment_method || 'Unknown'}
- Mortgage Status: ${buyer.mortgage_status || 'N/A'}
- Timeline: ${buyer.timeline || 'Not specified'}
- Location Preference: ${buyer.location || buyer.area || 'Not specified'}
- Bedrooms: ${buyer.bedrooms || buyer.preferred_bedrooms || 'Not specified'}
- Status: ${buyer.status || 'New'}
- Proof of Funds: ${buyer.proof_of_funds ? 'Yes' : 'No'}
- UK Broker: ${buyer.uk_broker ? 'Yes' : 'No'}
- UK Solicitor: ${buyer.uk_solicitor ? 'Yes' : 'No'}
- Source: ${buyer.source || 'Unknown'}
- Notes: ${buyer.notes || 'None'}
- Created: ${buyer.created_at || buyer.date_added || 'Unknown'}

SCORING CRITERIA:

1. QUALITY SCORE (0-100) - Based on:
   - Profile Completeness (25 pts): Name, Email, Phone, Location, Country, Bedrooms
   - Financial Qualification (35 pts): Cash=15pts, Mortgage=5pts; Mortgage approved/AIP=10pts; Proof of funds=10pts; Budget specified=5pts; Premium budget bonus=5pts
   - Verification Status (20 pts): UK Broker=8pts, UK Solicitor=7pts, Valid email=2pts, Valid phone=3pts
   - Inventory Fit (20 pts): Location preference=8pts, Bedroom preference=6pts, Budget range=6pts

2. INTENT SCORE (0-100) - Based on:
   - Timeline (30 pts): Immediate/ASAP=30, 1-3 months=20, 3-6 months=10, 6-12 months=5
   - Purpose (25 pts): Cash buyer=15pts, Mortgage=10pts, Specific criteria=10pts
   - Engagement (25 pts): Viewing booked/negotiating=25pts, Reserved/exchanged=25pts, Follow-up=15pts
   - Commitment (20 pts): Proof of funds=10pts, Mortgage approved=8pts, Solicitor=5pts
   - Apply negative modifiers for: Not proceeding (-50), Fake/unverifiable (-75), Duplicate (-25), Stale lead (-15)

3. CONFIDENCE SCORE (0-10) - Based on data quality and verification level

4. CLASSIFICATION (based on Quality + Intent):
   - Hot: Quality >= 70 AND Intent >= 70
   - Warm-Qualified: Quality >= 70 AND Intent >= 45
   - Warm-Engaged: Quality >= 45 AND Intent >= 70
   - Nurture: Quality 35-69 AND Intent 35-69
   - Cold: Lower scores
   - Disqualified: Quality < 20 OR Intent < 20

5. PRIORITY:
   - P1: Hot leads (respond < 1 hour)
   - P2: Warm leads (respond < 4 hours)
   - P3: Nurture leads (respond < 24 hours)
   - P4: Cold/Disqualified (48+ hours)

6. SPAM CHECK: Look for suspicious patterns (test names, fake emails, unrealistic budgets)

Respond ONLY with valid JSON (no markdown, no explanation):
{
  "quality_score": <number 0-100>,
  "intent_score": <number 0-100>,
  "confidence": <number 0-10>,
  "classification": "<Hot|Warm-Qualified|Warm-Engaged|Nurture|Cold|Disqualified|Spam>",
  "priority": "<P1|P2|P3|P4>",
  "priority_response_time": "<string>",
  "summary": "<2-3 sentence buyer summary focusing on readiness and potential>",
  "next_action": "<single specific action the sales team should take>",
  "recommendations": ["<rec1>", "<rec2>", "<rec3>"],
  "risk_flags": ["<flag1>", "<flag2>"],
  "is_spam": <boolean>,
  "spam_flags": [],
  "score_breakdown": {
    "quality": {
      "total": <number>,
      "profileCompleteness": { "score": <number>, "maxScore": 25, "details": ["<detail>"] },
      "financialQualification": { "score": <number>, "maxScore": 35, "details": ["<detail>"] },
      "verificationStatus": { "score": <number>, "maxScore": 20, "details": ["<detail>"] },
      "inventoryFit": { "score": <number>, "maxScore": 20, "details": ["<detail>"] }
    },
    "intent": {
      "total": <number>,
      "timeline": { "score": <number>, "maxScore": 30, "details": ["<detail>"] },
      "purpose": { "score": <number>, "maxScore": 25, "details": ["<detail>"] },
      "engagement": { "score": <number>, "maxScore": 25, "details": ["<detail>"] },
      "commitment": { "score": <number>, "maxScore": 20, "details": ["<detail>"] },
      "negativeModifiers": { "score": <number>, "maxScore": 0, "details": [] }
    },
    "confidence": {
      "total": <number>,
      "dataCompleteness": { "score": <number>, "maxScore": 10, "details": ["<detail>"] },
      "verificationLevel": { "score": <number>, "maxScore": 10, "details": ["<detail>"] },
      "engagementData": { "score": <number>, "maxScore": 10, "details": ["<detail>"] },
      "transcriptQuality": { "score": <number>, "maxScore": 10, "details": ["<detail>"] }
    }
  }
}`

  const response = await client.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  })

  const textContent = response.content.find(c => c.type === 'text')
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from Claude')
  }

  // Parse JSON from response
  const jsonMatch = textContent.text.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0])
  }

  throw new Error('Failed to parse Claude response')
}

// Fallback scoring using the scoring library (budget-aware classification)
function getFallbackScores(buyer: any): any {
  // Use the proper scoring library for consistent classification
  const qualityResult = calculateQualityScore(buyer)
  const intentResult = calculateIntentScore(buyer)
  const confidenceResult = calculateConfidenceScore(buyer)
  const spamCheck = checkSpam(buyer)

  const qualityScore = Math.round(qualityResult.total)
  const intentScore = Math.round(intentResult.total)
  const confidenceScore = Math.round(confidenceResult.total * 10) // Scale to 0-10

  // Use the updated classification logic with budget floors
  const classification = determineClassification(
    qualityScore,
    intentScore,
    confidenceScore,
    spamCheck,
    buyer
  )

  const priorityInfo = determinePriority(classification, qualityScore, intentScore)

  const name = buyer.full_name || buyer.first_name || 'This lead'
  const paymentType = buyer.payment_method || 'potential'
  const locationInfo = buyer.location || buyer.area || 'the area'

  // Generate risk flags
  const riskFlags: string[] = []
  if (!buyer.proof_of_funds) riskFlags.push('No proof of funds received')
  if (!buyer.email) riskFlags.push('Missing email address')
  if (!buyer.phone) riskFlags.push('Missing phone number')
  if (spamCheck.flags.length > 0) riskFlags.push(...spamCheck.flags)

  return {
    quality_score: qualityScore,
    intent_score: intentScore,
    confidence: confidenceScore,
    classification,
    priority: priorityInfo.priority,
    priority_response_time: priorityInfo.responseTime,
    summary: `${name} is a ${paymentType} buyer interested in ${locationInfo}. Budget: ${buyer.budget || buyer.budget_range || 'Not specified'}.`,
    next_action: 'Contact lead to confirm interest and timeline',
    recommendations: [
      'Verify contact information',
      'Confirm budget and timeline',
      'Schedule discovery call'
    ],
    risk_flags: riskFlags,
    is_spam: spamCheck.isSpam,
    spam_flags: spamCheck.flags,
    score_breakdown: {
      quality: {
        total: qualityScore,
        profileCompleteness: { score: qualityResult.breakdown.profileCompleteness.score, maxScore: 25, details: qualityResult.breakdown.profileCompleteness.details },
        financialQualification: { score: qualityResult.breakdown.financialQualification.score, maxScore: 35, details: qualityResult.breakdown.financialQualification.details },
        verificationStatus: { score: qualityResult.breakdown.verificationStatus.score, maxScore: 20, details: qualityResult.breakdown.verificationStatus.details },
        inventoryFit: { score: qualityResult.breakdown.inventoryFit.score, maxScore: 20, details: qualityResult.breakdown.inventoryFit.details }
      },
      intent: {
        total: intentScore,
        timeline: { score: intentResult.breakdown.timeline.score, maxScore: 30, details: intentResult.breakdown.timeline.details },
        purpose: { score: intentResult.breakdown.purpose.score, maxScore: 25, details: intentResult.breakdown.purpose.details },
        engagement: { score: intentResult.breakdown.engagement.score, maxScore: 25, details: intentResult.breakdown.engagement.details },
        commitment: { score: intentResult.breakdown.commitment.score, maxScore: 20, details: intentResult.breakdown.commitment.details },
        negativeModifiers: { score: intentResult.breakdown.negativeModifiers.score, maxScore: 0, details: intentResult.breakdown.negativeModifiers.details }
      },
      confidence: {
        total: confidenceScore,
        dataCompleteness: { score: confidenceResult.breakdown.dataCompleteness.score, maxScore: 10, details: confidenceResult.breakdown.dataCompleteness.details },
        verificationLevel: { score: confidenceResult.breakdown.verificationLevel.score, maxScore: 10, details: confidenceResult.breakdown.verificationLevel.details },
        engagementData: { score: confidenceResult.breakdown.engagementData.score, maxScore: 10, details: confidenceResult.breakdown.engagementData.details },
        transcriptQuality: { score: confidenceResult.breakdown.transcriptQuality.score, maxScore: 10, details: confidenceResult.breakdown.transcriptQuality.details }
      }
    }
  }
}

// Score a buyer using Claude AI
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

    // Get Anthropic client
    const client = getAnthropicClient()

    let scores: any

    if (client) {
      // Use Claude AI for scoring
      console.log('[AI Score] Using Claude AI for lead scoring')
      scores = await generateClaudeScores(client, buyer)
    } else {
      // Fallback to basic scoring
      console.log('[AI Score] No Anthropic API key, using fallback scoring')
      scores = getFallbackScores(buyer)
    }

    // Update buyer in database with scores
    const { error: updateError } = await supabase
      .from('buyers')
      .update({
        ai_quality_score: scores.quality_score,
        ai_intent_score: scores.intent_score,
        ai_confidence: scores.confidence / 10, // Normalize to 0-1
        ai_summary: scores.summary,
        ai_next_action: scores.next_action,
        ai_risk_flags: scores.risk_flags,
        ai_classification: scores.classification,
        ai_priority: scores.priority,
        ai_scored_at: new Date().toISOString(),
        // Also update the standard score fields
        quality_score: scores.quality_score,
        intent_score: scores.intent_score
      })
      .eq('id', buyerId)

    if (updateError) {
      console.error('[AI Score] Update error:', updateError)
    }

    const response: ScoreBuyerResponse = {
      success: true,
      summary: scores.summary,
      quality_score: scores.quality_score,
      intent_score: scores.intent_score,
      confidence: scores.confidence,
      classification: scores.classification,
      priority: scores.priority,
      priority_response_time: scores.priority_response_time,
      next_action: scores.next_action,
      risk_flags: scores.risk_flags || [],
      recommendations: scores.recommendations || [],
      is_spam: scores.is_spam || false,
      spam_flags: scores.spam_flags || [],
      score_breakdown: scores.score_breakdown
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

// Batch scoring endpoint using Claude AI
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
        let scores: any

        if (client) {
          // Use Claude AI for scoring
          scores = await generateClaudeScores(client, buyer)
        } else {
          // Fallback scoring
          scores = getFallbackScores(buyer)
        }

        // Update in database
        await supabase
          .from('buyers')
          .update({
            ai_quality_score: scores.quality_score,
            ai_intent_score: scores.intent_score,
            ai_confidence: scores.confidence / 10,
            ai_summary: scores.summary,
            ai_next_action: scores.next_action,
            ai_risk_flags: scores.risk_flags,
            ai_classification: scores.classification,
            ai_priority: scores.priority,
            ai_scored_at: new Date().toISOString(),
            quality_score: scores.quality_score,
            intent_score: scores.intent_score
          })
          .eq('id', buyer.id)

        results.push({
          id: buyer.id,
          success: true,
          classification: scores.classification,
          quality_score: scores.quality_score,
          intent_score: scores.intent_score
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
