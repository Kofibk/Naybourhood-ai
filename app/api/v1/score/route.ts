import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey, logApiUsage } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase/server'
import {
  scoreLeadNaybourhood,
  convertToLegacyFormat,
  type NaybourhoodScoreResult,
  type NaybourhoodClassification,
} from '@/lib/scoring/naybourhood-scoring'
import type { Buyer } from '@/types'

function generateAiSummary(buyer: Buyer, result: NaybourhoodScoreResult): string {
  const name = buyer.full_name || [buyer.first_name, buyer.last_name].filter(Boolean).join(' ') || 'Unknown buyer'
  const payment = (buyer.payment_method || '').toLowerCase()
  const paymentLabel = payment === 'cash' ? 'Cash buyer' : payment === 'mortgage' ? 'Mortgage buyer' : 'Buyer'
  const bedrooms = buyer.bedrooms || buyer.preferred_bedrooms
  const bedroomStr = bedrooms ? `${bedrooms}-bed` : ''
  const location = buyer.location || buyer.area || ''
  const purpose = buyer.purpose || buyer.purchase_purpose || ''
  const budget = buyer.budget || buyer.budget_range || ''

  const parts: string[] = []

  // Opening: "Cash buyer looking for 3-bed in London for primary residence."
  const lookingFor = [bedroomStr, location ? `in ${location}` : '', purpose ? `for ${purpose}` : ''].filter(Boolean).join(' ')
  parts.push(`${paymentLabel}${lookingFor ? ` looking for ${lookingFor}` : ''}.`)

  if (budget) {
    parts.push(`Budget ${budget}.`)
  }

  if (result.is28DayBuyer) {
    parts.push('Ready to purchase within 28 days.')
  } else {
    const timeline = buyer.timeline || buyer.timeline_to_purchase
    if (timeline) {
      parts.push(`Timeline: ${timeline}.`)
    }
  }

  if (result.fakeLeadCheck.isFake) {
    parts.push('Flagged as potential fake lead.')
  } else if (result.classification === 'Hot Lead') {
    parts.push('High proceedability.')
  } else if (result.classification === 'Qualified') {
    parts.push('Good proceedability - qualified lead.')
  } else if (result.classification === 'Needs Qualification') {
    parts.push('Missing key data - needs qualification.')
  } else if (result.classification === 'Low Priority') {
    parts.push('Low urgency or insufficient quality signals.')
  }

  return `${name}: ${parts.join(' ')}`
}

function generateAiRecommendations(buyer: Buyer, result: NaybourhoodScoreResult): string[] {
  const classification = result.classification
  const recs: string[] = []

  const primaryRec: Record<NaybourhoodClassification, string> = {
    'Hot Lead': 'Schedule viewing within 24 hours',
    'Qualified': 'Send development brochure + follow up in 48 hours',
    'Needs Qualification': 'WhatsApp to confirm budget, timeline, and bedroom requirements',
    'Nurture': 'Add to 3-month email sequence',
    'Low Priority': 'No immediate action - monitor for re-engagement',
    'Disqualified': 'Archive - do not pursue',
  }
  recs.push(primaryRec[classification])

  if (classification === 'Disqualified') return recs

  const bedrooms = buyer.bedrooms || buyer.preferred_bedrooms
  const budget = buyer.budget || buyer.budget_range || ''
  const payment = (buyer.payment_method || '').toLowerCase()

  if (budget && bedrooms) {
    recs.push(`Prepare ${bedrooms}-bed options in ${budget} range`)
  }

  if (payment === 'mortgage') {
    const broker = (buyer.uk_broker || '').toLowerCase()
    if (!broker || broker === 'no' || broker === 'unknown') {
      recs.push('Introduce to partner mortgage broker')
    }
    if (!buyer.proof_of_funds) {
      recs.push('Request mortgage AIP or proof of funds')
    }
  }

  if (payment === 'cash' && !buyer.proof_of_funds) {
    recs.push('Request proof of funds before viewing')
  }

  const solicitor = (buyer.uk_solicitor || '').toLowerCase()
  if (solicitor === 'no' || solicitor === 'unknown') {
    recs.push('Recommend conveyancing solicitor')
  }

  if (result.is28DayBuyer && classification !== 'Hot Lead') {
    recs.unshift('Immediate call required - 28-day purchase intent')
  }

  return recs.slice(0, 5)
}

function getAdminClient() {
  return createAdminClient()
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const authHeader = request.headers.get('authorization')

  // Authenticate
  const auth = await validateApiKey(authHeader)

  if (!auth.valid) {
    if (auth.keyId) {
      await logApiUsage({
        apiKeyId: auth.keyId,
        endpoint: '/api/v1/score',
        method: 'POST',
        statusCode: auth.status,
        responseTimeMs: Date.now() - startTime,
      })
    }
    return NextResponse.json(
      { error: auth.error },
      {
        status: auth.status,
        headers: auth.rateLimitRemaining !== undefined
          ? { 'X-RateLimit-Remaining': String(auth.rateLimitRemaining) }
          : undefined,
      }
    )
  }

  // Check permission
  if (!auth.permissions?.score_single) {
    await logApiUsage({
      apiKeyId: auth.keyId!,
      endpoint: '/api/v1/score',
      method: 'POST',
      statusCode: 403,
      responseTimeMs: Date.now() - startTime,
    })
    return NextResponse.json(
      { error: 'API key does not have score_single permission' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()

    // Accept either a buyer_id to look up, or inline lead data
    let buyerData: Buyer

    if (body.buyer_id) {
      const supabase = getAdminClient()
      const { data: buyer, error } = await supabase
        .from('buyers')
        .select('id, full_name, first_name, last_name, email, phone, country, budget, budget_range, budget_min, budget_max, bedrooms, preferred_bedrooms, location, area, timeline, timeline_to_purchase, purpose, purchase_purpose, ready_within_28_days, ready_in_28_days, status, payment_method, proof_of_funds, mortgage_status, uk_broker, uk_solicitor, source, source_platform, notes, company_id')
        .eq('id', body.buyer_id)
        .eq('company_id', auth.companyId!)
        .single()

      if (error || !buyer) {
        await logApiUsage({
          apiKeyId: auth.keyId!,
          endpoint: '/api/v1/score',
          method: 'POST',
          statusCode: 404,
          responseTimeMs: Date.now() - startTime,
        })
        return NextResponse.json({ error: 'Buyer not found' }, { status: 404 })
      }
      buyerData = buyer as Buyer
    } else if (body.lead) {
      // Inline lead data
      buyerData = body.lead as Buyer
    } else {
      await logApiUsage({
        apiKeyId: auth.keyId!,
        endpoint: '/api/v1/score',
        method: 'POST',
        statusCode: 400,
        responseTimeMs: Date.now() - startTime,
      })
      return NextResponse.json(
        { error: 'Provide either buyer_id or lead object in request body' },
        { status: 400 }
      )
    }

    // Score using Naybourhood framework
    const result = scoreLeadNaybourhood(buyerData)
    const legacy = convertToLegacyFormat(result)

    const responseTime = Date.now() - startTime

    await logApiUsage({
      apiKeyId: auth.keyId!,
      endpoint: '/api/v1/score',
      method: 'POST',
      statusCode: 200,
      responseTimeMs: responseTime,
    })

    return NextResponse.json({
      quality_score: result.qualityScore.total,
      intent_score: result.intentScore.total,
      confidence_score: result.confidenceScore.total,
      classification: result.classification,
      legacy_classification: legacy.ai_classification,
      priority: legacy.ai_priority,
      call_priority: result.callPriority.level,
      call_priority_reason: result.callPriority.description,
      response_time: result.callPriority.responseTime,
      is_28_day_buyer: result.is28DayBuyer,
      is_fake_lead: result.fakeLeadCheck.isFake,
      fake_lead_flags: result.fakeLeadCheck.flags,
      risk_flags: result.riskFlags,
      low_urgency: result.lowUrgencyFlag,
      ai_summary: generateAiSummary(buyerData, result),
      ai_recommendations: generateAiRecommendations(buyerData, result),
      score_breakdown: {
        quality: {
          total: result.qualityScore.total,
          factors: result.qualityScore.breakdown,
          is_disqualified: result.qualityScore.isDisqualified,
        },
        intent: {
          total: result.intentScore.total,
          factors: result.intentScore.breakdown,
          is_28_day_buyer: result.intentScore.is28DayBuyer,
        },
        confidence: {
          total: result.confidenceScore.total,
          factors: result.confidenceScore.breakdown,
        },
      },
    }, {
      headers: {
        'X-RateLimit-Remaining': String(auth.rateLimitRemaining ?? 0),
        'X-Response-Time': `${responseTime}ms`,
      },
    })
  } catch (error) {
    console.error('[Score API] Error:', error)
    await logApiUsage({
      apiKeyId: auth.keyId!,
      endpoint: '/api/v1/score',
      method: 'POST',
      statusCode: 500,
      responseTimeMs: Date.now() - startTime,
    })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
