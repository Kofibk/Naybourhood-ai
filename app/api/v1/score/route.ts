import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey, logApiUsage } from '@/lib/api-auth'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import {
  scoreLeadNaybourhood,
  convertToLegacyFormat,
} from '@/lib/scoring/naybourhood-scoring'
import type { Buyer } from '@/types'

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase credentials')
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
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
