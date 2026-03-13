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
import { enrichBuyerProfile, enrichmentToText } from '@/lib/enrichment/buyer-enrichment'

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
  _debug?: {
    hasAnthropicKey: boolean
    hasEnrichment: boolean
    enrichmentLength: number
    summarySource: string
  }
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
async function generateClaudeSummary(client: Anthropic, buyer: any, naybourhoodScore: NaybourhoodScoreResult, kycStatus?: string): Promise<{ summary: string; next_action: string; recommendations: string[] }> {
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
      model: 'claude-opus-4-5-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    })

    const textContent = response.content.find(c => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude')
    }

    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])

      // Ensure summary is always stored as structured JSON with paragraph + signals
      let summaryObj: { paragraph: string; signals: Array<{ label: string; detail: string }> }

      if (typeof parsed.summary === 'object' && parsed.summary?.paragraph) {
        // Claude returned the expected structured object
        summaryObj = parsed.summary
      } else if (typeof parsed.summary === 'string') {
        // Claude returned summary as a plain string — wrap it with empty signals
        // so the card component can still pair it with client-side signals
        summaryObj = { paragraph: parsed.summary, signals: [] }
      } else {
        // Unexpected shape — use whatever we got as the paragraph
        summaryObj = { paragraph: String(parsed.summary || ''), signals: [] }
      }

      return {
        summary: JSON.stringify(summaryObj),
        next_action: parsed.next_action,
        recommendations: parsed.recommendations
      }
    }
  } catch (err: any) {
    console.error('[AI Score] Claude summary generation failed:', err?.message || err)
    console.error('[AI Score] Full error:', JSON.stringify(err, null, 2))
  }

  // Fallback summary generation (includes enrichment data if available)
  return generateFallbackSummary(buyer, naybourhoodScore, kycStatus)
}

// Parse enrichment text fields (from background_research)
function parseEnrichmentField(text: string, label: string): string {
  const regex = new RegExp(`${label}:\\s*(.+?)(?:\\n-|\\n\\n|$)`, 'i')
  const match = text.match(regex)
  const value = match?.[1]?.trim() || ''
  // Skip empty/no-data fields
  if (!value || value.toLowerCase().startsWith('no data') || value.toLowerCase().startsWith('none') || value.length < 5) {
    return ''
  }
  return value
}

// Generate fallback summary without Claude (uses enrichment data when available)
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
  const enrichment = buyer.background_research || ''

  // Extract enrichment fields
  const enrichedProfBackground = parseEnrichmentField(enrichment, 'Professional Background')
  const enrichedBusinessActivity = parseEnrichmentField(enrichment, 'Business Activity')
  const enrichedWealthSignals = parseEnrichmentField(enrichment, 'Wealth Signals')
  const enrichedPropertyHistory = parseEnrichmentField(enrichment, 'Property History')
  const enrichedMediaPresence = parseEnrichmentField(enrichment, 'Media Presence')
  const enrichedRiskFlags = parseEnrichmentField(enrichment, 'Risk Flags')
  const hasEnrichment = !!(enrichedProfBackground || enrichedBusinessActivity || enrichedWealthSignals)

  // Build paragraph (2-3 sentences, commercially useful facts only)
  let paragraph = ''

  // Sentence 1: Who they are + what they want
  const professionalContext = enrichedProfBackground
    || (jobTitle && companyName ? `${jobTitle} at ${companyName}` : jobTitle || companyName || '')
  const bedroomInfo = bedrooms ? `${bedrooms}-bed` : 'property'
  const paymentDesc = paymentType.toLowerCase() === 'cash' ? 'cash' : paymentType.toLowerCase() === 'mortgage' ? 'mortgage' : paymentType
  const locationName = locationInfo !== 'the area' ? locationInfo : ''

  if (hasEnrichment && enrichedProfBackground) {
    // Lead with enrichment data
    paragraph = `${name} is ${enrichedProfBackground}.`
    const seekingParts = [bedroomInfo, locationName].filter(Boolean).join(' in ')
    if (seekingParts) {
      paragraph += ` Seeking a ${seekingParts} via ${paymentDesc}.`
    }
  } else if (professionalContext) {
    paragraph = `${name} is a ${professionalContext} seeking a ${bedroomInfo}${locationName ? ` in ${locationName}` : ''} via ${paymentDesc}.`
  } else {
    paragraph = `${name} is a ${paymentDesc} buyer seeking a ${bedroomInfo}${locationName ? ` in ${locationName}` : ''}.`
  }

  // Sentence 2: Financial/identity context
  if (hasEnrichment) {
    // Add identity/financial context from enrichment
    const identityConfirmed = parseEnrichmentField(enrichment, 'Identity Confirmed')
    if (identityConfirmed === 'no' || identityConfirmed === 'partial') {
      paragraph += ' Identity is unverified and financial capacity unconfirmed — KYC is the immediate blocker before this lead can progress.'
    } else {
      const budgetPart = budget ? `Budget: ${budget}` : 'Budget not disclosed'
      paragraph += ` ${budgetPart}.`
    }
  } else {
    const budgetPart = budget ? `Budget: ${budget}` : 'Budget not disclosed'
    if (score.is28DayBuyer) {
      paragraph += ` ${budgetPart}; ready to complete within 28 days, making this an immediate-priority lead.`
    } else if (timeline) {
      paragraph += ` ${budgetPart}; timeline: ${timeline}.`
    } else {
      paragraph += ` ${budgetPart}; purchase timeline not yet confirmed.`
    }
  }

  // Build signals — enrichment signals take priority over form-derived ones
  const signals: Array<{ label: string; detail: string }> = []

  // Professional Background (enriched first)
  if (enrichedProfBackground) {
    signals.push({ label: 'Professional Background', detail: enrichedProfBackground.endsWith('.') ? enrichedProfBackground : enrichedProfBackground + '.' })
  } else if (professionalContext) {
    signals.push({ label: 'Professional Background', detail: `${professionalContext}.` })
  }

  // Property Intent
  if (bedrooms || locationName) {
    const intentParts = [bedrooms ? `${bedrooms}` : '', locationName].filter(Boolean).join(' in ')
    const intentExtra = score.intentScore
      ? `; intent score of ${score.intentScore.total} suggests ${score.intentScore.total > 70 ? 'strong pipeline commitment' : 'active search without strong pipeline commitment'}`
      : ''
    signals.push({ label: 'Property Intent', detail: `${intentParts}${intentExtra}.` })
  }

  // Financial Profile (enriched or form-based)
  if (enrichedWealthSignals) {
    signals.push({ label: 'Financial Profile', detail: enrichedWealthSignals.endsWith('.') ? enrichedWealthSignals : enrichedWealthSignals + '.' })
  } else if (paymentType.toLowerCase() === 'cash') {
    if (buyer.proof_of_funds) {
      signals.push({ label: 'Financial Profile', detail: `Verified cash buyer${budget ? ` with ${budget} budget` : ''}.` })
    } else {
      signals.push({ label: 'Financial Profile', detail: `Claims cash buyer status${budget ? ` with ${budget} budget` : ''} but proof of funds not yet provided.` })
    }
  } else if (paymentType.toLowerCase() === 'mortgage') {
    const mortgageStatus = buyer.mortgage_status?.toLowerCase()
    const budgetPart = budget ? `, targeting ${budget}` : '; budget unspecified'
    if (mortgageStatus === 'approved' || mortgageStatus === 'aip') {
      signals.push({ label: 'Financial Profile', detail: `Mortgage buyer with AIP in place${budgetPart}.` })
    } else {
      signals.push({ label: 'Financial Profile', detail: `Mortgage buyer with no AIP or proof of funds on file${budgetPart}.` })
    }
  }

  // Verification Status
  if (kycStatus === 'passed') {
    signals.push({ label: 'Verification Status', detail: 'AML/KYC checks passed — identity confirmed.' })
  } else if (kycStatus === 'failed') {
    signals.push({ label: 'Verification Status', detail: 'AML/KYC verification failed — do not proceed without review.' })
  } else {
    const enrichedVerification = hasEnrichment
      ? 'AML/KYC not completed; cross-border profile may require enhanced due diligence.'
      : 'Not yet verified — AML/KYC check recommended before progressing.'
    signals.push({ label: 'Verification Status', detail: enrichedVerification })
  }

  // Risk Flags (enriched or score-based)
  if (enrichedRiskFlags) {
    signals.push({ label: 'Risk Flag', detail: enrichedRiskFlags.endsWith('.') ? enrichedRiskFlags : enrichedRiskFlags + '.' })
  } else if (score.riskFlags.length > 0) {
    signals.push({ label: 'Risk Flag', detail: score.riskFlags[0] + '.' })
  }
  if (score.fakeLeadCheck.flags.length > 0) {
    signals.push({ label: 'Risk Flag', detail: `Authenticity concern: ${score.fakeLeadCheck.flags[0]}.` })
  }

  // Business Activity (from enrichment)
  if (enrichedBusinessActivity) {
    signals.push({ label: 'Business Activity', detail: enrichedBusinessActivity.endsWith('.') ? enrichedBusinessActivity : enrichedBusinessActivity + '.' })
  }

  // Media Presence (from enrichment)
  if (enrichedMediaPresence) {
    signals.push({ label: 'Media Presence', detail: enrichedMediaPresence.endsWith('.') ? enrichedMediaPresence : enrichedMediaPresence + '.' })
  }

  // International Exposure
  if (country && !['uk', 'united kingdom', 'england', 'scotland', 'wales', 'gb', 'great britain'].includes(country)) {
    signals.push({ label: 'International Exposure', detail: `Based in ${buyer.country}; international payment and legal considerations apply.` })
  }

  // Engagement
  if (!hasEnrichment && buyer.source) {
    const status = buyer.status || ''
    signals.push({ label: 'Engagement', detail: `Sourced via ${buyer.source}${status ? `; current status: ${status}` : ''}.` })
  }

  // Next Action Readiness (for enriched profiles, KYC is usually the blocker)
  if (hasEnrichment && kycStatus !== 'passed') {
    signals.push({ label: 'Next Action Readiness', detail: 'Do not advance to viewing; complete KYC verification first.' })
  }

  // Missing Data (only commercially meaningful gaps, skip if enriched)
  if (!hasEnrichment) {
    const missingItems: string[] = []
    if (!budget) missingItems.push('budget')
    if (!timeline) missingItems.push('timeline')
    if (!buyer.phone && !buyer.email) missingItems.push('contact details')
    if (missingItems.length > 0) {
      signals.push({ label: 'Missing Data', detail: `No ${missingItems.join(', ')} provided — limits qualification accuracy.` })
    }
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
    console.log('[AI Score] Anthropic client available:', !!client, '| ANTHROPIC_API_KEY set:', !!process.env.ANTHROPIC_API_KEY)

    // ALWAYS run web enrichment on every score — fresh web search each time
    let enrichmentText = ''
    if (!client) {
      console.warn('[AI Score] ⚠️ No Anthropic API key — enrichment and Claude summary will be SKIPPED. Set ANTHROPIC_API_KEY env var.')
    } else {
      console.log('[AI Score] Running web enrichment for buyer profile...')
      console.log('[AI Score] Enrichment identifiers:', {
        name: buyer.full_name || buyer.first_name || 'NONE',
        email: buyer.email || 'NONE',
        phone: buyer.phone || 'NONE',
        company: buyer.company_name || 'NONE',
        jobTitle: buyer.job_title || 'NONE',
        location: buyer.location || buyer.area || buyer.country || 'NONE',
      })
      try {
        const enrichment = await enrichBuyerProfile(client, {
          name: buyer.full_name || buyer.first_name || undefined,
          email: buyer.email || undefined,
          phone: buyer.phone || undefined,
          company: buyer.company_name || undefined,
          jobTitle: buyer.job_title || undefined,
          location: buyer.location || buyer.area || buyer.country || undefined,
        })
        console.log('[AI Score] Enrichment result:', {
          identityConfirmed: enrichment.identityConfirmed,
          confidence: enrichment.enrichmentConfidence,
          rawSummaryLength: enrichment.rawSummary?.length || 0,
          rawSummaryPreview: enrichment.rawSummary?.substring(0, 300) || 'EMPTY',
        })
        enrichmentText = enrichmentToText(enrichment)
        if (enrichmentText) {
          console.log(`[AI Score] ✅ Enrichment complete — ${enrichmentText.length} chars`)
          // Save enrichment to DB
          const { error: enrichUpdateErr } = await supabase
            .from('buyers')
            .update({ background_research: enrichmentText })
            .eq('id', buyerId)
          if (enrichUpdateErr) {
            console.error('[AI Score] ❌ Failed to save enrichment to DB:', enrichUpdateErr)
          }
          buyer.background_research = enrichmentText
        } else {
          console.log('[AI Score] ⚠️ Enrichment returned empty (low confidence + unconfirmed identity)')
        }
      } catch (enrichErr: any) {
        console.error('[AI Score] ❌ Enrichment failed:', enrichErr?.message || enrichErr)
      }
    }

    // Generate summary (with Claude if available, otherwise fallback)
    let summaryData: { summary: string; next_action: string; recommendations: string[] }
    if (client) {
      console.log('[AI Score] Enhancing with Claude AI summary')
      summaryData = await generateClaudeSummary(client, buyer, naybourhoodScore, kycStatus)
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

    const summarySource = !client ? 'fallback_no_api_key' : 'claude_or_fallback'
    console.log('[AI Score] Final summary (first 200 chars):', summaryData.summary.substring(0, 200))
    console.log('[AI Score] Summary source:', summarySource)

    const response: ScoreBuyerResponse = {
      success: true,
      summary: summaryData.summary,
      _debug: {
        hasAnthropicKey: !!client,
        hasEnrichment: !!buyer.background_research,
        enrichmentLength: buyer.background_research?.length || 0,
        summarySource,
      },
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
