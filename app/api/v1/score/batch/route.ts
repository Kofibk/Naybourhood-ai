import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey, logApiUsage } from '@/lib/api-auth'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import {
  scoreLeadNaybourhood,
  convertToLegacyFormat,
} from '@/lib/scoring/naybourhood-scoring'
import type { Buyer } from '@/types'

const MAX_BATCH_SIZE = 50

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

interface BatchResultItem {
  index: number
  buyer_id?: string
  quality_score: number
  intent_score: number
  confidence_score: number
  classification: string
  call_priority: number
  is_28_day_buyer: boolean
  is_fake_lead: boolean
  risk_flags: string[]
}

interface BatchErrorItem {
  index: number
  buyer_id?: string
  error: string
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
        endpoint: '/api/v1/score/batch',
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
  if (!auth.permissions?.score_batch) {
    await logApiUsage({
      apiKeyId: auth.keyId!,
      endpoint: '/api/v1/score/batch',
      method: 'POST',
      statusCode: 403,
      responseTimeMs: Date.now() - startTime,
    })
    return NextResponse.json(
      { error: 'API key does not have score_batch permission' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()

    // Accept buyer_ids array or leads array
    let buyers: Buyer[] = []

    if (body.buyer_ids && Array.isArray(body.buyer_ids)) {
      if (body.buyer_ids.length > MAX_BATCH_SIZE) {
        await logApiUsage({
          apiKeyId: auth.keyId!,
          endpoint: '/api/v1/score/batch',
          method: 'POST',
          statusCode: 400,
          responseTimeMs: Date.now() - startTime,
        })
        return NextResponse.json(
          { error: `Maximum batch size is ${MAX_BATCH_SIZE}. Received ${body.buyer_ids.length}.` },
          { status: 400 }
        )
      }

      const supabase = getAdminClient()
      const { data, error } = await supabase
        .from('buyers')
        .select('id, full_name, first_name, last_name, email, phone, country, budget, budget_range, budget_min, budget_max, bedrooms, preferred_bedrooms, location, area, timeline, timeline_to_purchase, purpose, purchase_purpose, ready_within_28_days, ready_in_28_days, status, payment_method, proof_of_funds, mortgage_status, uk_broker, uk_solicitor, source, source_platform, notes, company_id')
        .in('id', body.buyer_ids)
        .eq('company_id', auth.companyId!)
        .range(0, MAX_BATCH_SIZE - 1)

      if (error) {
        await logApiUsage({
          apiKeyId: auth.keyId!,
          endpoint: '/api/v1/score/batch',
          method: 'POST',
          statusCode: 500,
          responseTimeMs: Date.now() - startTime,
        })
        return NextResponse.json({ error: 'Failed to fetch buyers' }, { status: 500 })
      }

      buyers = (data || []) as Buyer[]
    } else if (body.leads && Array.isArray(body.leads)) {
      if (body.leads.length > MAX_BATCH_SIZE) {
        await logApiUsage({
          apiKeyId: auth.keyId!,
          endpoint: '/api/v1/score/batch',
          method: 'POST',
          statusCode: 400,
          responseTimeMs: Date.now() - startTime,
        })
        return NextResponse.json(
          { error: `Maximum batch size is ${MAX_BATCH_SIZE}. Received ${body.leads.length}.` },
          { status: 400 }
        )
      }
      buyers = body.leads as Buyer[]
    } else {
      await logApiUsage({
        apiKeyId: auth.keyId!,
        endpoint: '/api/v1/score/batch',
        method: 'POST',
        statusCode: 400,
        responseTimeMs: Date.now() - startTime,
      })
      return NextResponse.json(
        { error: 'Provide either buyer_ids array or leads array in request body' },
        { status: 400 }
      )
    }

    const results: BatchResultItem[] = []
    const errors: BatchErrorItem[] = []

    for (let i = 0; i < buyers.length; i++) {
      try {
        const buyer = buyers[i]
        const result = scoreLeadNaybourhood(buyer)
        const legacy = convertToLegacyFormat(result)

        results.push({
          index: i,
          buyer_id: buyer.id,
          quality_score: result.qualityScore.total,
          intent_score: result.intentScore.total,
          confidence_score: result.confidenceScore.total,
          classification: result.classification,
          call_priority: result.callPriority.level,
          is_28_day_buyer: result.is28DayBuyer,
          is_fake_lead: result.fakeLeadCheck.isFake,
          risk_flags: result.riskFlags,
        })
      } catch (err) {
        errors.push({
          index: i,
          buyer_id: buyers[i]?.id,
          error: 'Scoring failed',
        })
      }
    }

    const responseTime = Date.now() - startTime

    await logApiUsage({
      apiKeyId: auth.keyId!,
      endpoint: '/api/v1/score/batch',
      method: 'POST',
      statusCode: 200,
      responseTimeMs: responseTime,
    })

    return NextResponse.json({
      total: buyers.length,
      scored: results.length,
      failed: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined,
    }, {
      headers: {
        'X-RateLimit-Remaining': String(auth.rateLimitRemaining ?? 0),
        'X-Response-Time': `${responseTime}ms`,
      },
    })
  } catch (error) {
    console.error('[Score Batch API] Error:', error)
    await logApiUsage({
      apiKeyId: auth.keyId!,
      endpoint: '/api/v1/score/batch',
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
