import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { isEffectiveAdmin } from '@/lib/auth'
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
  const prompt = `You are a real estate CRM AI assistant. Generate a structured buyer overview in two parts.

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
- Job Title: ${buyer.job_title || 'Not specified'}
- Company: ${buyer.company_name || 'Not specified'}

SCORING (already calculated by Naybourhood AI Framework):
- Quality Score: ${naybourhoodScore.qualityScore.total}/100
- Intent Score: ${naybourhoodScore.intentScore.total}/100
- Confidence: ${naybourhoodScore.confidenceScore.total}/100
- Classification: ${naybourhoodScore.classification}
- Is 28-Day Buyer: ${naybourhoodScore.is28DayBuyer ? 'YES - HARD RULE AUTO HOT LEAD' : 'No'}
- Call Priority: Level ${naybourhoodScore.callPriority.level} (${naybourhoodScore.callPriority.responseTime})
- Risk Flags: ${naybourhoodScore.riskFlags.join(', ') || 'None'}

ENRICHED/BACKGROUND DATA:
${buyer.background_research || 'None available'}

Generate a buyer overview with TWO parts:

PART 1 - PARAGRAPH: 2-3 sentences max. Cover who this buyer is, what they do, their property intent, and their current position in the buying journey. Third person. No filler. Every sentence must carry a commercially useful fact. If enriched data is available, lead with the most credible external signal first.

PART 2 - KEY SIGNALS: 4-6 bullet points. Each bullet is a signal label followed by one sharp sentence.
Signal labels to draw from: Financial Profile, Property Intent, Verification Status, Engagement, International Exposure, Professional Background, Risk Flag, Next Action Readiness, Missing Data, Media Presence, Business Activity.
Only include bullets where a real signal exists. Never invent data. Only flag Missing Data if the absence is commercially meaningful.

Also provide:
- The single most important next action for the sales team
- Up to 3 actionable recommendations

Respond ONLY with valid JSON:
{
  "summary": {
    "paragraph": "<2-3 sentence overview paragraph>",
    "signals": [
      { "label": "<Signal Label>", "detail": "<one sharp sentence>" }
    ]
  },
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
      const parsed = JSON.parse(jsonMatch[0])
      // Serialize the structured summary as JSON string for storage
      const summaryStr = typeof parsed.summary === 'object'
        ? JSON.stringify(parsed.summary)
        : parsed.summary
      return {
        summary: summaryStr,
        next_action: parsed.next_action,
        recommendations: parsed.recommendations
      }
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
  const budget = buyer.budget || buyer.budget_range || ''
  const bedrooms = buyer.bedrooms || buyer.preferred_bedrooms || ''
  const timeline = buyer.timeline || ''
  const country = (buyer.country || '').toLowerCase()
  const jobTitle = buyer.job_title || ''
  const companyName = buyer.company_name || ''

  // Build paragraph (2-3 sentences, commercially useful facts only)
  let paragraph = ''

  // Sentence 1: Who they are + what they want
  const professionalContext = jobTitle && companyName
    ? `${jobTitle} at ${companyName}`
    : jobTitle || companyName || ''
  const bedroomInfo = bedrooms ? `${bedrooms}-bedroom property` : 'property'
  const paymentDesc = paymentType.toLowerCase() === 'cash' ? 'cash' : paymentType.toLowerCase() === 'mortgage' ? 'mortgage' : paymentType

  if (professionalContext) {
    paragraph = `${name} is a ${professionalContext} seeking a ${bedroomInfo} in ${locationInfo} via ${paymentDesc}.`
  } else {
    paragraph = `${name} is a ${paymentDesc} buyer seeking a ${bedroomInfo} in ${locationInfo}.`
  }

  // Sentence 2: Budget + timeline/journey position
  const budgetPart = budget ? `Budget: ${budget}` : 'Budget not disclosed'
  if (score.is28DayBuyer) {
    paragraph += ` ${budgetPart}; ready to complete within 28 days, making this an immediate-priority lead.`
  } else if (timeline) {
    paragraph += ` ${budgetPart}; timeline: ${timeline}.`
  } else {
    paragraph += ` ${budgetPart}; purchase timeline not yet confirmed.`
  }

  // Sentence 3: Journey position (only if adds value)
  const status = buyer.status || ''
  if (status && !['new', 'unknown', ''].includes(status.toLowerCase())) {
    paragraph += ` Currently at "${status}" stage.`
  }

  // Build signals
  const signals: Array<{ label: string; detail: string }> = []

  // Financial Profile
  if (paymentType.toLowerCase() === 'cash') {
    if (buyer.proof_of_funds) {
      signals.push({ label: 'Financial Profile', detail: `Verified cash buyer${budget ? ` with ${budget} budget` : ''}.` })
    } else {
      signals.push({ label: 'Financial Profile', detail: `Claims cash buyer status${budget ? ` with ${budget} budget` : ''} but proof of funds not yet provided.` })
    }
  } else if (paymentType.toLowerCase() === 'mortgage') {
    const mortgageStatus = buyer.mortgage_status?.toLowerCase()
    if (mortgageStatus === 'approved' || mortgageStatus === 'aip') {
      signals.push({ label: 'Financial Profile', detail: `Mortgage buyer with AIP in place${budget ? `, targeting ${budget}` : ''}.` })
    } else {
      signals.push({ label: 'Financial Profile', detail: `Mortgage buyer without AIP${budget ? `, targeting ${budget}` : ''} — financing unconfirmed.` })
    }
  }

  // Property Intent
  if (bedrooms || locationInfo !== 'the area') {
    const purposeInfo = buyer.purchase_purpose || buyer.purpose || ''
    const intentParts = [bedrooms ? `${bedrooms}-bed` : '', locationInfo !== 'the area' ? locationInfo : '', purposeInfo].filter(Boolean)
    signals.push({ label: 'Property Intent', detail: `Looking for ${intentParts.join(' in ')}${score.is28DayBuyer ? ' with 28-day purchase readiness' : ''}.` })
  }

  // Verification Status
  if (kycStatus === 'passed') {
    signals.push({ label: 'Verification Status', detail: 'AML/KYC checks passed — identity confirmed.' })
  } else if (kycStatus === 'failed') {
    signals.push({ label: 'Verification Status', detail: 'AML/KYC verification failed — do not proceed without review.' })
  } else {
    signals.push({ label: 'Verification Status', detail: 'Not yet verified — AML/KYC check recommended before progressing.' })
  }

  // International Exposure
  if (country && !['uk', 'united kingdom', 'england', 'scotland', 'wales', 'gb', 'great britain'].includes(country)) {
    signals.push({ label: 'International Exposure', detail: `Based in ${buyer.country}; international payment and legal considerations apply.` })
  }

  // Professional Background
  if (professionalContext) {
    signals.push({ label: 'Professional Background', detail: `${professionalContext}.` })
  }

  // Risk Flags
  if (score.riskFlags.length > 0) {
    signals.push({ label: 'Risk Flag', detail: score.riskFlags[0] + '.' })
  }
  if (score.fakeLeadCheck.flags.length > 0) {
    signals.push({ label: 'Risk Flag', detail: `Authenticity concern: ${score.fakeLeadCheck.flags[0]}.` })
  }

  // Engagement
  if (buyer.source) {
    signals.push({ label: 'Engagement', detail: `Sourced via ${buyer.source}${status ? `; current status: ${status}` : ''}.` })
  }

  // Missing Data (only commercially meaningful gaps)
  const missingItems: string[] = []
  if (!budget) missingItems.push('budget')
  if (!timeline) missingItems.push('timeline')
  if (!buyer.phone && !buyer.email) missingItems.push('contact details')
  if (missingItems.length > 0) {
    signals.push({ label: 'Missing Data', detail: `No ${missingItems.join(', ')} provided — limits qualification accuracy.` })
  }

  // Serialize the structured summary as JSON
  const structuredSummary = JSON.stringify({
    paragraph,
    signals: signals.slice(0, 6)
  })

  // Next action
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

  return { summary: structuredSummary, next_action, recommendations: recommendations.slice(0, 3) }
}


// Score a buyer using Naybourhood AI Scoring Framework
export async function POST(request: NextRequest) {
  try {
    const { buyerId } = await request.json()

    if (!buyerId) {
      return NextResponse.json({ error: 'Buyer ID required' }, { status: 400 })
    }

    // Authentication check
    const authClient = createClient()
    const { data: { user }, error: authError } = await authClient.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get user profile for company scoping
    const { data: userProfile } = await authClient
      .from('user_profiles')
      .select('company_id, is_internal_team')
      .eq('id', user.id)
      .single()

    const supabase = getSupabaseClient()

    // Fetch buyer data with company scoping
    let buyerQuery = supabase
      .from('buyers')
      .select('*')
      .eq('id', buyerId)

    // Non-admin users can only score their own company's buyers
    if (!isEffectiveAdmin(user.email, userProfile) && userProfile?.company_id) {
      buyerQuery = buyerQuery.eq('company_id', userProfile.company_id)
    }

    const { data: buyer, error } = await buyerQuery.single()

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

    // Authentication check
    const authClient = createClient()
    const { data: { user }, error: authError } = await authClient.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get user profile for company scoping
    const { data: batchUserProfile } = await authClient
      .from('user_profiles')
      .select('company_id, is_internal_team')
      .eq('id', user.id)
      .single()

    const supabase = getSupabaseClient()
    const client = getAnthropicClient()

    // Fetch buyers with company scoping
    let buyersQuery = supabase
      .from('buyers')
      .select('*')
      .in('id', buyerIds)

    if (!isEffectiveAdmin(user.email, batchUserProfile) && batchUserProfile?.company_id) {
      buyersQuery = buyersQuery.eq('company_id', batchUserProfile.company_id)
    }

    const { data: buyers, error } = await buyersQuery

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
