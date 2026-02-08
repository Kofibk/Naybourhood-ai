import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { AICampaignAnalysis } from '@/types'

// Analyze a campaign and generate AI insights
export async function POST(request: NextRequest) {
  try {
    const { campaignId } = await request.json()

    if (!campaignId) {
      return NextResponse.json({ error: 'Campaign ID required' }, { status: 400 })
    }

    const supabase = createClient()

    // Fetch campaign data
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('id, campaign_name, name, ad_name, ad_set_name, date, company_id, development_id, development_name, platform, delivery_status, status, total_spent, spend, number_of_leads, leads, impressions, link_clicks, clicks, reach, ctr')
      .eq('id', campaignId)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Fetch associated buyers
    const { data: buyers } = await supabase
      .from('buyers')
      .select('id, full_name, first_name, last_name, email, phone, country, status, quality_score, ai_quality_score, intent_score, ai_intent_score, ai_confidence, ai_summary, ai_next_action, ai_risk_flags, ai_recommendations, ai_classification, ai_priority, ai_scored_at, budget, budget_range, budget_min, budget_max, bedrooms, preferred_bedrooms, location, area, timeline, source, source_campaign, campaign_id, development_id, development_name, company_id, payment_method, mortgage_status, proof_of_funds, uk_broker, uk_solicitor, assigned_to, assigned_user_name, assigned_at, purpose, ready_in_28_days, viewing_intent_confirmed, viewing_booked, viewing_date, replied, stop_comms, next_follow_up, broker_connected, last_wa_message, transcript, call_summary, notes, date_added, created_at, updated_at')
      .eq('campaign_id', campaignId)

    const buyersList = buyers || []

    // Calculate health score
    let healthScore = 50 // Base

    // Lead quality component (+/- 20)
    const avgScore = buyersList.length > 0
      ? buyersList.reduce((acc, b) => acc + (b.ai_quality_score || b.quality_score || 50), 0) / buyersList.length
      : 50
    healthScore += (avgScore - 50) * 0.4

    // Conversion rate component (+/- 15)
    const viewingsBooked = buyersList.filter(b => b.status === 'Viewing Booked' || b.status === 'Offer Made').length
    const conversionRate = buyersList.length > 0 ? viewingsBooked / buyersList.length : 0
    if (conversionRate > 0.1) healthScore += 15
    else if (conversionRate < 0.03 && buyersList.length > 10) healthScore -= 15

    // CPL component (+/- 15)
    const spend = campaign.spend || campaign.total_spent || 0
    const leads = campaign.leads || campaign.number_of_leads || buyersList.length
    const cpl = leads > 0 ? spend / leads : 0
    if (cpl > 0 && cpl < 50) healthScore += 15
    else if (cpl > 150) healthScore -= 15

    // Lead volume component (+/- 10)
    if (leads > 50) healthScore += 10
    else if (leads < 10 && spend > 1000) healthScore -= 10

    healthScore = Math.max(0, Math.min(100, Math.round(healthScore)))

    // Generate recommendations
    const recommendations: string[] = []

    if (cpl > 100) {
      recommendations.push('Review targeting - CPL is above optimal range')
    }

    const hotLeads = buyersList.filter(b => (b.ai_quality_score || b.quality_score || 0) >= 70).length
    const hotLeadPercent = buyersList.length > 0 ? (hotLeads / buyersList.length) * 100 : 0

    if (hotLeadPercent < 20) {
      recommendations.push('Lead quality is low - add qualification questions to form')
    }

    if (conversionRate < 0.05 && buyersList.length > 20) {
      recommendations.push('Low conversion rate - improve follow-up speed')
    }

    // Source analysis
    const sourceBreakdown: Record<string, number[]> = {}
    buyersList.forEach(b => {
      const source = b.source || 'Unknown'
      if (!sourceBreakdown[source]) sourceBreakdown[source] = []
      sourceBreakdown[source].push(b.ai_quality_score || b.quality_score || 50)
    })

    const bestSource = Object.entries(sourceBreakdown)
      .map(([source, scores]) => ({
        source,
        avgScore: scores.reduce((a, b) => a + b, 0) / scores.length,
        count: scores.length
      }))
      .sort((a, b) => b.avgScore - a.avgScore)[0]

    if (bestSource && bestSource.avgScore > 60) {
      recommendations.push(`${bestSource.source} is top performer - consider increasing budget allocation`)
    }

    if (recommendations.length === 0) {
      recommendations.push('Campaign performing well - maintain current strategy')
    }

    // Generate summary
    const summary = `This campaign has generated ${leads} leads with an average quality score of ${avgScore.toFixed(0)}. CPL is £${cpl.toFixed(2)}. ${hotLeadPercent.toFixed(0)}% of leads are hot (score 70+). ${viewingsBooked} viewings have been booked so far.`

    // Predictions (simplified)
    const leadsPerDay = leads / Math.max(1, 30) // Assume 30 days
    const predictedLeads = Math.round(leadsPerDay * 30)
    const predictedViewings = Math.round(predictedLeads * conversionRate)
    const predictedReservations = Math.round(predictedViewings * 0.25)

    // With recommendations improvement
    const improvedLeads = Math.round(predictedLeads * 1.15)
    const improvedViewings = Math.round(predictedViewings * 1.5)
    const improvedReservations = Math.round(improvedViewings * 0.3)

    // Update campaign in database
    const { error: updateError } = await supabase
      .from('campaigns')
      .update({
        ai_health_score: healthScore,
        ai_performance_summary: summary,
        ai_recommendations: recommendations,
        ai_analyzed_at: new Date().toISOString()
      })
      .eq('id', campaignId)

    if (updateError) {
      console.error('[AI Campaign] Update error:', updateError)
    }

    const response: AICampaignAnalysis = {
      summary,
      health_score: healthScore,
      recommendations,
      prediction: {
        currentTrajectory: {
          leads: predictedLeads,
          viewings: predictedViewings,
          reservations: predictedReservations
        },
        withRecommendations: {
          leads: improvedLeads,
          viewings: improvedViewings,
          reservations: improvedReservations
        }
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[AI Campaign] Error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze campaign' },
      { status: 500 }
    )
  }
}

// Get analysis for all campaigns
export async function GET() {
  try {
    const supabase = createClient()

    const { data: campaigns, error } = await supabase
      .from('campaigns')
      .select('id, name, ai_health_score, ai_performance_summary, ai_recommendations')
      .order('ai_health_score', { ascending: false, nullsFirst: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ campaigns })
  } catch (error) {
    console.error('[AI Campaign GET] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaign analysis' },
      { status: 500 }
    )
  }
}
