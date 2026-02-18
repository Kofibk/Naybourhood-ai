import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

// Force dynamic rendering - this route uses cookies
export const dynamic = 'force-dynamic'

// Get admin client for database operations (bypasses RLS)
function getSupabaseClient() {
  try {
    return createAdminClient()
  } catch {
    return createClient()
  }
}

function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return null
  return new Anthropic({ apiKey })
}

// Fallback scoring when no API key
function getFallbackScores(buyer: any): any {
  let qualityScore = 20
  let intentScore = 20

  if (buyer.full_name || buyer.first_name) qualityScore += 5
  if (buyer.email) qualityScore += 5
  if (buyer.phone) qualityScore += 5
  if (buyer.location || buyer.area) qualityScore += 5
  if (buyer.budget || buyer.budget_range) qualityScore += 5
  if (buyer.payment_method?.toLowerCase() === 'cash') qualityScore += 15
  else if (buyer.payment_method?.toLowerCase() === 'mortgage') qualityScore += 5
  if (buyer.proof_of_funds) qualityScore += 10

  if (buyer.timeline) {
    const timeline = buyer.timeline.toLowerCase()
    if (/immediate|asap|now/i.test(timeline)) intentScore += 30
    else if (/1-3 months|soon/i.test(timeline)) intentScore += 20
    else intentScore += 10
  }

  const status = (buyer.status || '').toLowerCase()
  if (/viewing|negotiating|reserved|exchanged/i.test(status)) intentScore += 25
  else if (/follow.?up/i.test(status)) intentScore += 15
  else intentScore += 5

  if (buyer.proof_of_funds) intentScore += 10
  if (buyer.uk_solicitor) intentScore += 5
  if (buyer.uk_broker) intentScore += 5

  qualityScore = Math.min(100, qualityScore)
  intentScore = Math.min(100, intentScore)

  let classification = 'Nurture'
  let priority = 'P3'

  if (qualityScore >= 70 && intentScore >= 70) {
    classification = 'Hot'
    priority = 'P1'
  } else if (qualityScore >= 70 && intentScore >= 45) {
    classification = 'Warm-Qualified'
    priority = 'P2'
  } else if (qualityScore >= 45 && intentScore >= 70) {
    classification = 'Warm-Engaged'
    priority = 'P2'
  } else if (qualityScore < 20 || intentScore < 20) {
    classification = 'Cold'
    priority = 'P4'
  }

  return {
    quality_score: qualityScore,
    intent_score: intentScore,
    confidence: 5,
    classification,
    priority,
    summary: `${buyer.full_name || 'Lead'} - ${buyer.payment_method || 'unknown payment'} buyer`,
    next_action: 'Contact to confirm interest',
  }
}

// Score unscored leads in batches
export async function POST(request: NextRequest) {
  try {
    const { limit = 50 } = await request.json().catch(() => ({}))

    const supabase = getSupabaseClient()
    const client = getAnthropicClient()

    // Fetch unscored leads (where ai_scored_at is null)
    const { data: unscoredLeads, error } = await supabase
      .from('buyers')
      .select('*')
      .is('ai_scored_at', null)
      .order('created_at', { ascending: false })
      .limit(Math.min(limit, 100))

    if (error) {
      console.error('[Batch Score] Fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 })
    }

    if (!unscoredLeads || unscoredLeads.length === 0) {
      return NextResponse.json({
        success: true,
        scored: 0,
        message: 'No unscored leads found',
      })
    }

    console.log(`[Batch Score] Scoring ${unscoredLeads.length} leads...`)

    let scored = 0
    let failed = 0

    // Process leads in parallel (but limited concurrency)
    const BATCH_SIZE = 5
    for (let i = 0; i < unscoredLeads.length; i += BATCH_SIZE) {
      const batch = unscoredLeads.slice(i, i + BATCH_SIZE)

      await Promise.all(
        batch.map(async (buyer) => {
          try {
            // Use fallback scoring (fast, no API calls)
            // Claude AI scoring would be too slow for bulk imports
            const scores = getFallbackScores(buyer)

            const { error: updateError } = await supabase
              .from('buyers')
              .update({
                ai_quality_score: scores.quality_score,
                ai_intent_score: scores.intent_score,
                ai_confidence: scores.confidence / 10,
                ai_summary: scores.summary,
                ai_next_action: scores.next_action,
                ai_classification: scores.classification,
                ai_priority: scores.priority,
                ai_scored_at: new Date().toISOString(),
                quality_score: scores.quality_score,
                intent_score: scores.intent_score,
              })
              .eq('id', buyer.id)

            if (updateError) {
              console.error(`[Batch Score] Update error for ${buyer.id}:`, updateError)
              failed++
            } else {
              scored++
            }
          } catch (err) {
            console.error(`[Batch Score] Error scoring ${buyer.id}:`, err)
            failed++
          }
        })
      )
    }

    console.log(`[Batch Score] Complete: ${scored} scored, ${failed} failed`)

    return NextResponse.json({
      success: true,
      scored,
      failed,
      total: unscoredLeads.length,
    })
  } catch (error) {
    console.error('[Batch Score] Error:', error)
    return NextResponse.json({ error: 'Batch scoring failed' }, { status: 500 })
  }
}
