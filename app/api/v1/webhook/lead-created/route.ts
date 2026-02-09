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

interface HubSpotConfig {
  api_key: string
  pipeline_id?: string
  stage_id?: string
}

async function getCompanyHubSpotConfig(
  supabase: ReturnType<typeof getAdminClient>,
  companyId: string,
): Promise<HubSpotConfig | null> {
  try {
    const { data } = await supabase
      .from('companies')
      .select('hubspot_api_key, hubspot_pipeline_id, hubspot_stage_id')
      .eq('id', companyId)
      .single()

    if (data?.hubspot_api_key) {
      return {
        api_key: data.hubspot_api_key,
        pipeline_id: data.hubspot_pipeline_id,
        stage_id: data.hubspot_stage_id,
      }
    }
  } catch {
    // HubSpot columns may not exist yet - that's fine
  }
  return null
}

async function pushToHubSpot(
  config: HubSpotConfig,
  lead: Buyer,
  scores: ReturnType<typeof scoreLeadNaybourhood>,
): Promise<{ success: boolean; hubspot_id?: string; error?: string }> {
  try {
    const properties: Record<string, string> = {
      firstname: lead.first_name || lead.full_name?.split(' ')[0] || '',
      lastname: lead.last_name || lead.full_name?.split(' ').slice(1).join(' ') || '',
      email: lead.email || '',
      phone: lead.phone || '',
      naybourhood_quality_score: String(scores.qualityScore.total),
      naybourhood_intent_score: String(scores.intentScore.total),
      naybourhood_classification: scores.classification,
      naybourhood_call_priority: String(scores.callPriority.level),
    }

    if (lead.budget) properties.budget = lead.budget
    if (lead.country) properties.country = lead.country

    const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.api_key}`,
      },
      body: JSON.stringify({ properties }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        error: `HubSpot API error: ${response.status} - ${errorData.message || 'Unknown error'}`,
      }
    }

    const data = await response.json()
    return { success: true, hubspot_id: data.id }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'HubSpot push failed',
    }
  }
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
        endpoint: '/api/v1/webhook/lead-created',
        method: 'POST',
        statusCode: auth.status,
        responseTimeMs: Date.now() - startTime,
      })
    }
    return NextResponse.json(
      { error: auth.error },
      { status: auth.status }
    )
  }

  // Check permission
  if (!auth.permissions?.webhook) {
    await logApiUsage({
      apiKeyId: auth.keyId!,
      endpoint: '/api/v1/webhook/lead-created',
      method: 'POST',
      statusCode: 403,
      responseTimeMs: Date.now() - startTime,
    })
    return NextResponse.json(
      { error: 'API key does not have webhook permission' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const lead = body.lead || body

    // Validate required fields
    if (!lead.full_name && !lead.first_name && !lead.email) {
      await logApiUsage({
        apiKeyId: auth.keyId!,
        endpoint: '/api/v1/webhook/lead-created',
        method: 'POST',
        statusCode: 400,
        responseTimeMs: Date.now() - startTime,
      })
      return NextResponse.json(
        { error: 'At least one of full_name, first_name, or email is required' },
        { status: 400 }
      )
    }

    const supabase = getAdminClient()

    // Build full_name if not provided
    const fullName = lead.full_name ||
      [lead.first_name, lead.last_name].filter(Boolean).join(' ') ||
      lead.email

    // Insert the lead into buyers table
    const insertData: Record<string, unknown> = {
      company_id: auth.companyId,
      full_name: fullName,
      first_name: lead.first_name || fullName.split(' ')[0],
      last_name: lead.last_name || fullName.split(' ').slice(1).join(' '),
      email: lead.email,
      phone: lead.phone,
      country: lead.country,
      budget: lead.budget,
      budget_range: lead.budget_range || lead.budget,
      payment_method: lead.payment_method,
      timeline: lead.timeline,
      timeline_to_purchase: lead.timeline_to_purchase || lead.timeline,
      purpose: lead.purpose,
      purchase_purpose: lead.purchase_purpose || lead.purpose,
      source: lead.source || 'API Webhook',
      source_platform: lead.source_platform || 'api',
      location: lead.location,
      area: lead.area || lead.location,
      bedrooms: lead.bedrooms,
      status: 'Contact Pending',
      notes: lead.notes,
    }

    // Remove undefined values
    const cleanInsert = Object.fromEntries(
      Object.entries(insertData).filter(([, v]) => v !== undefined && v !== null)
    )

    const { data: newBuyer, error: insertError } = await supabase
      .from('buyers')
      .insert(cleanInsert)
      .select('id, full_name, email, company_id')
      .single()

    if (insertError) {
      console.error('[Webhook] Insert error:', insertError)
      await logApiUsage({
        apiKeyId: auth.keyId!,
        endpoint: '/api/v1/webhook/lead-created',
        method: 'POST',
        statusCode: 500,
        responseTimeMs: Date.now() - startTime,
      })
      return NextResponse.json(
        { error: 'Failed to create lead' },
        { status: 500 }
      )
    }

    // Score the lead
    const buyerForScoring: Buyer = { ...lead, id: newBuyer.id, company_id: auth.companyId } as Buyer
    const scores = scoreLeadNaybourhood(buyerForScoring)
    const legacy = convertToLegacyFormat(scores)

    // Update the lead with scores
    await supabase
      .from('buyers')
      .update({
        ai_quality_score: scores.qualityScore.total,
        ai_intent_score: scores.intentScore.total,
        ai_confidence: scores.confidenceScore.total / 10,
        ai_classification: scores.classification,
        ai_priority: legacy.ai_priority,
        ai_scored_at: new Date().toISOString(),
        quality_score: scores.qualityScore.total,
        intent_score: scores.intentScore.total,
        ready_within_28_days: scores.is28DayBuyer,
        call_priority: scores.callPriority.level,
        call_priority_reason: scores.callPriority.description,
        low_urgency_flag: scores.lowUrgencyFlag,
        is_fake_lead: scores.fakeLeadCheck.isFake,
        fake_lead_flags: scores.fakeLeadCheck.flags,
        ai_risk_flags: scores.riskFlags,
      })
      .eq('id', newBuyer.id)

    // Push to HubSpot if configured
    let hubspotResult: { success: boolean; hubspot_id?: string; error?: string } | null = null
    const hubspotConfig = await getCompanyHubSpotConfig(supabase, auth.companyId!)

    if (hubspotConfig) {
      hubspotResult = await pushToHubSpot(hubspotConfig, buyerForScoring, scores)
    }

    const responseTime = Date.now() - startTime

    await logApiUsage({
      apiKeyId: auth.keyId!,
      endpoint: '/api/v1/webhook/lead-created',
      method: 'POST',
      statusCode: 201,
      responseTimeMs: responseTime,
    })

    return NextResponse.json({
      success: true,
      buyer_id: newBuyer.id,
      scoring: {
        quality_score: scores.qualityScore.total,
        intent_score: scores.intentScore.total,
        confidence_score: scores.confidenceScore.total,
        classification: scores.classification,
        call_priority: scores.callPriority.level,
        is_28_day_buyer: scores.is28DayBuyer,
        is_fake_lead: scores.fakeLeadCheck.isFake,
      },
      hubspot: hubspotResult ? {
        pushed: hubspotResult.success,
        hubspot_id: hubspotResult.hubspot_id,
        error: hubspotResult.error,
      } : { pushed: false, reason: 'HubSpot not configured' },
    }, {
      status: 201,
      headers: {
        'X-RateLimit-Remaining': String(auth.rateLimitRemaining ?? 0),
        'X-Response-Time': `${responseTime}ms`,
      },
    })
  } catch (error) {
    console.error('[Webhook] Error:', error)
    await logApiUsage({
      apiKeyId: auth.keyId!,
      endpoint: '/api/v1/webhook/lead-created',
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
