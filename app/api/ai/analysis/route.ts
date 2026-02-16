import { NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import type { AIAnalysis } from '@/types'

// Force dynamic rendering - this route uses cookies
export const dynamic = 'force-dynamic'

// Generate comprehensive AI analysis of the pipeline
export async function GET() {
  try {
    const supabase = createClient()

    // Authentication check - require logged in user
    if (isSupabaseConfigured()) {
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }

      // Verify user has a profile (internal team or valid client)
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('user_type')
        .eq('id', user.id)
        .single()

      if (!profile) {
        return NextResponse.json(
          { error: 'User profile not found' },
          { status: 403 }
        )
      }
    }

    // Fetch all buyers
    const { data: buyers, error: buyersError } = await supabase
      .from('buyers')
      .select('*')

    if (buyersError) {
      console.error('[AI Analysis] Buyers error:', buyersError)
    }

    // Fetch all campaigns
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select('*')

    if (campaignsError) {
      console.error('[AI Analysis] Campaigns error:', campaignsError)
    }

    const buyersList = buyers || []
    const campaignsList = campaigns || []

    // Pipeline health analysis
    const statusGroups: Record<string, number> = {}
    const sourceGroups: Record<string, { total: number; hot: number; scores: number[] }> = {}

    buyersList.forEach(b => {
      const status = b.status || 'Unknown'
      statusGroups[status] = (statusGroups[status] || 0) + 1

      const source = b.source || 'Unknown'
      if (!sourceGroups[source]) {
        sourceGroups[source] = { total: 0, hot: 0, scores: [] }
      }
      sourceGroups[source].total++
      const score = b.ai_quality_score || b.quality_score || 50
      sourceGroups[source].scores.push(score)
      if (score >= 70) sourceGroups[source].hot++
    })

    // Calculate pipeline health score
    const totalLeads = buyersList.length
    const hotLeads = buyersList.filter(b => (b.ai_quality_score || b.quality_score || 0) >= 70).length
    const viewingsBooked = buyersList.filter(b => b.status === 'Viewing Booked').length
    const completed = buyersList.filter(b => b.status === 'Completed' || b.status === 'Exchanged').length

    let pipelineScore = 50

    // Hot lead ratio (+/- 20)
    const hotRatio = totalLeads > 0 ? hotLeads / totalLeads : 0
    pipelineScore += (hotRatio - 0.2) * 100

    // Conversion rate (+/- 15)
    const conversionRate = totalLeads > 0 ? viewingsBooked / totalLeads : 0
    if (conversionRate > 0.1) pipelineScore += 15
    else if (conversionRate < 0.03) pipelineScore -= 10

    // Pipeline balance (+/- 15)
    const earlyStage = (statusGroups['Contact Pending'] || 0) + (statusGroups['Follow Up'] || 0)
    const earlyStageRatio = totalLeads > 0 ? earlyStage / totalLeads : 0
    if (earlyStageRatio > 0.7) pipelineScore -= 10 // Too top-heavy
    if (earlyStageRatio < 0.3 && totalLeads > 20) pipelineScore += 10 // Good balance

    pipelineScore = Math.max(0, Math.min(100, Math.round(pipelineScore)))

    // Pipeline summary
    const pipelineSummary = pipelineScore >= 70
      ? `Your pipeline is healthy with ${hotLeads} hot leads and a ${(conversionRate * 100).toFixed(1)}% viewing conversion rate.`
      : pipelineScore >= 50
        ? `Pipeline is performing adequately. Focus on moving ${earlyStage} leads in early stages to viewings.`
        : `Pipeline needs attention. ${earlyStageRatio > 0.7 ? 'Too many leads stuck in early stages.' : 'Lead quality may need improvement.'}`

    // Source performance
    const sourcePerformance = Object.entries(sourceGroups)
      .map(([source, data]) => ({
        source,
        hotLeadPercent: Math.round((data.hot / Math.max(1, data.total)) * 100),
        avgScore: Math.round(data.scores.reduce((a, b) => a + b, 0) / Math.max(1, data.scores.length)),
        count: data.total,
        recommendation: data.hot / Math.max(1, data.total) > 0.3
          ? 'High performer - consider increasing budget'
          : data.hot / Math.max(1, data.total) < 0.1
            ? 'Review targeting or creative'
            : 'Performing as expected'
      }))
      .sort((a, b) => b.hotLeadPercent - a.hotLeadPercent)
      .slice(0, 5)

    // Bottleneck analysis
    const bottlenecks = []

    // Follow Up → Viewing conversion
    const followUpLeads = statusGroups['Follow Up'] || 0
    const followUpToViewing = followUpLeads > 0 && viewingsBooked > 0
      ? viewingsBooked / (followUpLeads + viewingsBooked)
      : 0

    if (followUpToViewing < 0.35) {
      bottlenecks.push({
        stage: 'Follow Up → Viewing',
        currentRate: Math.round(followUpToViewing * 100),
        benchmark: 35,
        recommendation: 'Faster follow-up and offer virtual viewings to increase conversion'
      })
    }

    // Viewing → Reserved conversion
    const viewingToReserved = viewingsBooked > 0 && completed > 0
      ? completed / viewingsBooked
      : 0

    if (viewingToReserved < 0.25) {
      bottlenecks.push({
        stage: 'Viewing → Reserved',
        currentRate: Math.round(viewingToReserved * 100),
        benchmark: 25,
        recommendation: 'Better pre-qualification before viewing to improve close rate'
      })
    }

    // Predictions
    const now = new Date()
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const recentLeads = buyersList.filter(b => new Date(b.created_at || now) >= oneMonthAgo).length
    const recentViewings = buyersList.filter(b =>
      new Date(b.created_at || now) >= oneMonthAgo &&
      (b.status === 'Viewing Booked' || b.status === 'Negotiating' || b.status === 'Completed')
    ).length

    const predictedViewings = Math.round(recentViewings * 1.1)
    const predictedReservations = Math.round(predictedViewings * 0.25)

    const totalSpend = campaignsList.reduce((acc, c) => acc + (c.spend || c.amount_spent || 0), 0)
    const avgDealValue = 250000 // Assume average property value
    const pipelineValue = `£${((predictedReservations * avgDealValue) / 1000000).toFixed(1)}M`

    // At risk leads (no activity in 5+ days, not closed)
    const atRiskLeads = buyersList.filter(b => {
      const updatedAt = new Date(b.updated_at || b.created_at || now)
      const daysSinceUpdate = Math.floor((now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24))
      return daysSinceUpdate >= 5 && b.status !== 'Completed' && b.status !== 'Not Proceeding'
    }).length

    // Top recommendations
    const topRecommendations: string[] = []

    if (atRiskLeads > 0) {
      topRecommendations.push(`Re-engage ${atRiskLeads} at-risk leads before they go cold`)
    }

    if (hotLeads > 0 && viewingsBooked < hotLeads * 0.5) {
      topRecommendations.push(`Book viewings for ${hotLeads - viewingsBooked} hot leads waiting`)
    }

    if (sourcePerformance[0]?.hotLeadPercent > 30) {
      topRecommendations.push(`Increase spend on ${sourcePerformance[0].source} - best performing source`)
    }

    if (bottlenecks.length > 0) {
      topRecommendations.push(bottlenecks[0].recommendation)
    }

    if (topRecommendations.length === 0) {
      topRecommendations.push('Pipeline is healthy - maintain current strategy')
    }

    const response: AIAnalysis = {
      pipelineHealth: {
        score: pipelineScore,
        summary: pipelineSummary
      },
      sourcePerformance: sourcePerformance.map(s => ({
        source: s.source,
        hotLeadPercent: s.hotLeadPercent,
        recommendation: s.recommendation
      })),
      bottlenecks,
      predictions: {
        viewings: predictedViewings,
        reservations: predictedReservations,
        pipelineValue,
        atRiskLeads
      },
      topRecommendations: topRecommendations.slice(0, 5)
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[AI Analysis] Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate analysis' },
      { status: 500 }
    )
  }
}
