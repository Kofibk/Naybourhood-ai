import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
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
    return createAdminClient()
  } catch {
    return createClient()
  }
}

// Score a single buyer using the scoring library
function scoreBuyer(buyer: any) {
  const qualityResult = calculateQualityScore(buyer)
  const intentResult = calculateIntentScore(buyer)
  const confidenceResult = calculateConfidenceScore(buyer)
  const spamCheck = checkSpam(buyer)

  const qualityScore = Math.round(qualityResult.total)
  const intentScore = Math.round(intentResult.total)
  const confidenceScore = Math.round(confidenceResult.total * 10)

  const classification = determineClassification(
    qualityScore,
    intentScore,
    confidenceScore,
    spamCheck,
    buyer
  )

  const priorityInfo = determinePriority(classification, qualityScore, intentScore)

  return {
    quality_score: qualityScore,
    intent_score: intentScore,
    confidence: confidenceScore,
    classification,
    priority: priorityInfo.priority,
    summary: `${buyer.full_name || buyer.first_name || 'Lead'} - ${buyer.payment_method || 'unknown payment'} buyer`,
    next_action: 'Contact to confirm interest',
    is_spam: spamCheck.isSpam,
  }
}

// Rescore ALL leads (or specific ones) with updated classification logic
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const {
      limit = 500,  // Max leads to rescore per call
      offset = 0,   // For pagination
      force = true, // Rescore even if already scored
      buyerIds,     // Optional: specific buyer IDs to rescore
    } = body

    const supabase = getSupabaseClient()

    let query = supabase
      .from('buyers')
      .select('*')
      .order('created_at', { ascending: false })

    // If specific IDs provided, filter to those
    if (buyerIds && Array.isArray(buyerIds) && buyerIds.length > 0) {
      query = query.in('id', buyerIds)
    } else if (!force) {
      // Only rescore unscored leads if not forcing
      query = query.is('ai_scored_at', null)
    }

    query = query.range(offset, offset + limit - 1)

    const { data: leads, error, count } = await query

    if (error) {
      console.error('[Rescore All] Fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 })
    }

    if (!leads || leads.length === 0) {
      return NextResponse.json({
        success: true,
        scored: 0,
        message: 'No leads to rescore',
      })
    }

    console.log(`[Rescore All] Rescoring ${leads.length} leads with updated classification logic...`)

    let scored = 0
    let failed = 0
    const results: Array<{ id: string; classification: string; quality: number; intent: number }> = []

    // Process leads in parallel (but limited concurrency)
    const BATCH_SIZE = 10
    for (let i = 0; i < leads.length; i += BATCH_SIZE) {
      const batch = leads.slice(i, i + BATCH_SIZE)

      await Promise.all(
        batch.map(async (buyer) => {
          try {
            const scores = scoreBuyer(buyer)

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
              console.error(`[Rescore All] Update error for ${buyer.id}:`, updateError)
              failed++
            } else {
              scored++
              results.push({
                id: buyer.id,
                classification: scores.classification,
                quality: scores.quality_score,
                intent: scores.intent_score,
              })
            }
          } catch (err) {
            console.error(`[Rescore All] Error scoring ${buyer.id}:`, err)
            failed++
          }
        })
      )
    }

    // Summary of classification distribution
    const classificationCounts = results.reduce((acc, r) => {
      acc[r.classification] = (acc[r.classification] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    console.log(`[Rescore All] Complete: ${scored} scored, ${failed} failed`)
    console.log(`[Rescore All] Classification distribution:`, classificationCounts)

    return NextResponse.json({
      success: true,
      scored,
      failed,
      total: leads.length,
      hasMore: leads.length === limit,
      nextOffset: offset + limit,
      classificationDistribution: classificationCounts,
    })
  } catch (error) {
    console.error('[Rescore All] Error:', error)
    return NextResponse.json({ error: 'Rescore failed' }, { status: 500 })
  }
}

// GET endpoint to check current scoring status
export async function GET() {
  try {
    const supabase = getSupabaseClient()

    // Get counts by classification
    const { data: allLeads, error } = await supabase
      .from('buyers')
      .select('ai_classification, ai_scored_at')

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
    }

    const total = allLeads?.length || 0
    const scored = allLeads?.filter(l => l.ai_scored_at).length || 0
    const unscored = total - scored

    const classificationCounts = (allLeads || []).reduce((acc, l) => {
      const cls = l.ai_classification || 'Unscored'
      acc[cls] = (acc[cls] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      total,
      scored,
      unscored,
      classificationDistribution: classificationCounts,
    })
  } catch (error) {
    console.error('[Rescore Status] Error:', error)
    return NextResponse.json({ error: 'Failed to get status' }, { status: 500 })
  }
}
