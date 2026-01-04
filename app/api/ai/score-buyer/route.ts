import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { AIBuyerSummary } from '@/types'

// Score a buyer and generate AI summary
export async function POST(request: NextRequest) {
  try {
    const { buyerId } = await request.json()

    if (!buyerId) {
      return NextResponse.json({ error: 'Buyer ID required' }, { status: 400 })
    }

    const supabase = createClient()

    // Fetch buyer data
    const { data: buyer, error } = await supabase
      .from('buyers')
      .select('*')
      .eq('id', buyerId)
      .single()

    if (error || !buyer) {
      return NextResponse.json({ error: 'Buyer not found' }, { status: 404 })
    }

    // Calculate Quality Score (0-100)
    let qualityScore = 50 // Base score

    // Budget fit (+25)
    if (buyer.budget || buyer.budget_min || buyer.budget_max) {
      qualityScore += 15
      if (buyer.budget_min && buyer.budget_min >= 500000) qualityScore += 10
    }

    // Financial readiness (+25)
    if (buyer.payment_method === 'Cash' || buyer.payment_method === 'cash') {
      qualityScore += 20
    } else if (buyer.mortgage_status === 'Approved' || buyer.mortgage_status === 'AIP') {
      qualityScore += 15
    }
    if (buyer.proof_of_funds) qualityScore += 5

    // Profile completeness (+20)
    let completeness = 0
    if (buyer.full_name || buyer.first_name) completeness += 5
    if (buyer.email) completeness += 5
    if (buyer.phone) completeness += 5
    if (buyer.location || buyer.area) completeness += 5
    qualityScore += completeness

    // Source quality (+15)
    const highIntentSources = ['WhatsApp', 'Referral', 'Website', 'Direct']
    if (highIntentSources.includes(buyer.source || '')) {
      qualityScore += 15
    } else if (buyer.source) {
      qualityScore += 8
    }

    // Calculate Intent Score (0-100)
    let intentScore = 40 // Base score

    // Timeline urgency (+30)
    const urgentTimelines = ['Immediately', 'ASAP', '1-3 months', 'Ready now', '28 days']
    if (urgentTimelines.some(t => (buyer.timeline || '').toLowerCase().includes(t.toLowerCase()))) {
      intentScore += 30
    } else if (buyer.timeline) {
      intentScore += 15
    }

    // Action taken (+25)
    if (buyer.status === 'Viewing Booked' || buyer.status === 'Offer Made') {
      intentScore += 25
    } else if (buyer.status === 'Qualified') {
      intentScore += 15
    } else if (buyer.status === 'Contacted') {
      intentScore += 10
    }

    // Has preferences specified (+25)
    if (buyer.bedrooms) intentScore += 10
    if (buyer.location || buyer.area) intentScore += 10
    if (buyer.budget) intentScore += 5

    // Calculate Confidence (0-1)
    let confidence = 0.5 // Base

    // More data = higher confidence
    const dataPoints = [
      buyer.full_name || buyer.first_name,
      buyer.email,
      buyer.phone,
      buyer.budget,
      buyer.timeline,
      buyer.location || buyer.area,
      buyer.payment_method,
      buyer.notes
    ].filter(Boolean).length

    confidence = Math.min(1, 0.3 + (dataPoints * 0.1))

    // Clamp scores
    qualityScore = Math.max(0, Math.min(100, Math.round(qualityScore)))
    intentScore = Math.max(0, Math.min(100, Math.round(intentScore)))
    confidence = Math.round(confidence * 100) / 100

    // Generate risk flags
    const riskFlags: string[] = []
    if (!buyer.proof_of_funds && buyer.payment_method !== 'Cash') {
      riskFlags.push('No proof of funds received')
    }
    if (buyer.source?.toLowerCase().includes('international') || buyer.location?.toLowerCase().includes('uae') || buyer.location?.toLowerCase().includes('dubai')) {
      riskFlags.push('International buyer - may need extended timeline')
    }
    if (!buyer.phone && !buyer.email) {
      riskFlags.push('Limited contact information')
    }

    // Generate next action
    let nextAction = 'Follow up to qualify further'
    if (qualityScore >= 70 && intentScore >= 60) {
      nextAction = 'Book viewing within 48 hours'
    } else if (qualityScore >= 70) {
      nextAction = 'Confirm budget and timeline'
    } else if (intentScore >= 70) {
      nextAction = 'Request proof of funds or AIP'
    }

    // Generate summary
    const budgetStr = buyer.budget || (buyer.budget_min ? `£${(buyer.budget_min / 1000).toFixed(0)}k+` : 'Unknown')
    const paymentStr = buyer.payment_method || 'Unknown payment method'
    const locationStr = buyer.location || buyer.area || 'location not specified'

    const summary = `${buyer.full_name || buyer.first_name || 'Lead'} is a ${paymentStr.toLowerCase()} buyer looking in ${locationStr}. Budget: ${budgetStr}. Timeline: ${buyer.timeline || 'not specified'}. ${riskFlags.length > 0 ? 'Note: ' + riskFlags[0] + '.' : ''}`

    // Generate recommendations
    const recommendations: string[] = []
    if (!buyer.proof_of_funds) {
      recommendations.push('Request proof of funds before viewing')
    }
    if (buyer.bedrooms) {
      recommendations.push(`Prepare ${buyer.bedrooms}-bed options in ${locationStr}`)
    }
    if (qualityScore >= 70) {
      recommendations.push('Introduce to solicitor early in process')
    }
    if (buyer.source?.toLowerCase().includes('international')) {
      recommendations.push('Set up currency exchange consultation')
    }

    // Update buyer in database
    const { error: updateError } = await supabase
      .from('buyers')
      .update({
        ai_quality_score: qualityScore,
        ai_intent_score: intentScore,
        ai_confidence: confidence,
        ai_summary: summary,
        ai_next_action: nextAction,
        ai_risk_flags: riskFlags,
        ai_scored_at: new Date().toISOString()
      })
      .eq('id', buyerId)

    if (updateError) {
      console.error('[AI Score] Update error:', updateError)
    }

    const response: AIBuyerSummary = {
      summary,
      quality_score: qualityScore,
      intent_score: intentScore,
      confidence,
      next_action: nextAction,
      risk_flags: riskFlags,
      recommendations
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
