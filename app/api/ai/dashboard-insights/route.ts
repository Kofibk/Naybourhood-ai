import { NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import type { AIDashboardInsights } from '@/types'

// Generate AI-powered dashboard insights based on pipeline data
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
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!profile) {
        return NextResponse.json(
          { error: 'User profile not found' },
          { status: 403 }
        )
      }
    }

    // Fetch buyers data
    const { data: buyers, error: buyersError } = await supabase
      .from('buyers')
      .select('*')
      .order('created_at', { ascending: false })

    if (buyersError) {
      console.error('[AI Dashboard] Buyers fetch error:', buyersError)
    }

    // Fetch campaigns data
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select('*')

    if (campaignsError) {
      console.error('[AI Dashboard] Campaigns fetch error:', campaignsError)
    }

    const buyersList = buyers || []
    const campaignsList = campaigns || []

    // Calculate stats
    const totalLeads = buyersList.length
    const hotLeads = buyersList.filter(b => (b.ai_quality_score || b.quality_score || 0) >= 70).length
    const warmLeads = buyersList.filter(b => {
      const score = b.ai_quality_score || b.quality_score || 0
      return score >= 40 && score < 70
    }).length

    // Find stale leads (in Follow Up status for 5+ days)
    const now = new Date()
    const staleLeads = buyersList.filter(b => {
      if (b.status !== 'Follow Up' && b.status !== 'Contacted') return false
      const createdAt = new Date(b.created_at || now)
      const daysDiff = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
      return daysDiff >= 5
    })

    // Find hot leads without viewing booked
    const hotLeadsNoViewing = buyersList.filter(b =>
      (b.ai_quality_score || b.quality_score || 0) >= 70 &&
      b.status !== 'Viewing Booked' &&
      b.status !== 'Completed'
    )

    // Calculate week over week change
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const leadsThisWeek = buyersList.filter(b => new Date(b.created_at || now) >= oneWeekAgo).length

    // Find underperforming campaigns
    const underperformingCampaigns = campaignsList.filter(c => {
      const cpl = c.cpl || (c.spend && c.leads ? c.spend / c.leads : 0)
      return cpl > 100 && (c.status === 'active' || c.status === 'Active')
    })

    // Generate insights
    const insights: AIDashboardInsights['insights'] = []
    const recommendedActions: AIDashboardInsights['recommendedActions'] = []

    // Critical: Hot leads without follow-up
    if (hotLeadsNoViewing.length > 0) {
      insights.push({
        type: 'critical',
        title: `${hotLeadsNoViewing.length} hot leads need viewing scheduled`,
        description: 'These high-scoring leads are ready to move forward but don\'t have viewings booked yet.',
        action: 'Schedule viewings today'
      })

      recommendedActions.push({
        priority: 1,
        title: `Book viewings for ${hotLeadsNoViewing.length} hot leads`,
        description: 'High-quality leads waiting for viewing slots',
        actionType: 'book_viewing',
        leadIds: hotLeadsNoViewing.slice(0, 5).map(l => l.id)
      })
    }

    // Warning: Stale leads
    if (staleLeads.length > 0) {
      insights.push({
        type: 'warning',
        title: `${staleLeads.length} leads silent for 5+ days`,
        description: 'These leads haven\'t been contacted recently and may go cold.',
        action: 'Re-engage with follow-up sequence'
      })

      recommendedActions.push({
        priority: 2,
        title: `Re-engage ${staleLeads.length} stale leads`,
        description: 'No response in 5+ days - send follow-up',
        actionType: 'email',
        leadIds: staleLeads.slice(0, 10).map(l => l.id)
      })
    }

    // Positive: Weekly lead growth
    if (leadsThisWeek > 0) {
      const avgLeadsPerWeek = totalLeads / Math.max(1, 4) // Assume 4 weeks of data
      const change = ((leadsThisWeek - avgLeadsPerWeek) / Math.max(1, avgLeadsPerWeek) * 100).toFixed(0)

      insights.push({
        type: leadsThisWeek > avgLeadsPerWeek ? 'positive' : 'info',
        title: `${leadsThisWeek} new leads this week`,
        description: leadsThisWeek > avgLeadsPerWeek
          ? `Lead volume up ${change}% compared to average`
          : 'Pipeline activity is steady'
      })
    }

    // Warning: Underperforming campaigns
    if (underperformingCampaigns.length > 0) {
      insights.push({
        type: 'warning',
        title: `${underperformingCampaigns.length} campaigns with high CPL`,
        description: `${underperformingCampaigns.map(c => c.name).slice(0, 2).join(', ')} have CPL above £100`,
        action: 'Review creative or pause spend'
      })
    }

    // Add top hot lead to call
    const topHotLead = buyersList
      .filter(b => (b.ai_quality_score || b.quality_score || 0) >= 70)
      .sort((a, b) => (b.ai_quality_score || b.quality_score || 0) - (a.ai_quality_score || a.quality_score || 0))[0]

    if (topHotLead) {
      recommendedActions.push({
        priority: 1,
        title: `Call ${topHotLead.full_name || topHotLead.first_name || 'Hot Lead'}`,
        description: `Score: ${topHotLead.ai_quality_score || topHotLead.quality_score || 0} - ${topHotLead.ai_next_action || 'High priority contact'}`,
        actionType: 'call',
        leadId: topHotLead.id
      })
    }

    // Summary stats
    insights.push({
      type: 'info',
      title: `Pipeline: ${hotLeads} hot, ${warmLeads} warm, ${totalLeads - hotLeads - warmLeads} cold`,
      description: `${campaignsList.filter(c => c.status === 'active' || c.status === 'Active').length} active campaigns generating leads`
    })

    // Sort by priority
    recommendedActions.sort((a, b) => a.priority - b.priority)

    const response: AIDashboardInsights = {
      insights: insights.slice(0, 5),
      recommendedActions: recommendedActions.slice(0, 5)
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[AI Dashboard] Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    )
  }
}
