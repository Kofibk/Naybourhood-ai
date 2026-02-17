import { NextRequest, NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { getDemoDashboardStats } from '@/lib/demo-data'

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  // Demo mode: return realistic sample data for presentations
  const searchParams = request.nextUrl.searchParams
  if (searchParams.get('demo') === 'true') {
    return NextResponse.json(getDemoDashboardStats(), {
      headers: { 'Cache-Control': 'private, no-store' },
    })
  }

  if (!isSupabaseConfigured()) {
    // Fallback to demo data when Supabase is not configured
    return NextResponse.json(getDemoDashboardStats(), {
      headers: { 'Cache-Control': 'private, no-store' },
    })
  }

  const supabase = createClient()

  // Authentication check
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  // Get user profile for company scoping
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('user_type, company_id, is_internal_team')
    .eq('id', user.id)
    .single()

  const isAdmin = userProfile?.user_type === 'admin' || userProfile?.is_internal_team === true

  if (!userProfile?.company_id && !isAdmin) {
    return NextResponse.json({ error: 'No company associated with your account' }, { status: 403 })
  }

  const userType = searchParams.get('user_type') || 'developer'

  // Admins can specify a company_id; others always get their own
  const effectiveCompanyId = isAdmin
    ? (searchParams.get('company_id') || userProfile.company_id)
    : userProfile.company_id

  try {
    const isBroker = userType === 'broker'

    if (isBroker) {
      // Broker: fetch borrower stats
      const statsResult = await supabase.rpc('get_borrower_dashboard_stats', {
        p_company_id: effectiveCompanyId,
        p_company_name: null
      })

      // Fetch recent borrowers — skip company filter for internal team (sees all)
      let borrowersQuery = supabase
        .from('borrowers')
        .select('id, full_name, first_name, last_name, email, phone, status, finance_type, loan_amount, company_id, date_added, created_at')

      if (effectiveCompanyId) {
        borrowersQuery = borrowersQuery.eq('company_id', effectiveCompanyId)
      }

      const { data: recentBorrowers } = await borrowersQuery
        .order('created_at', { ascending: false })
        .limit(50)

      const loadTime = Date.now() - startTime
      return NextResponse.json({
        stats: statsResult.data || {},
        recentLeads: recentBorrowers || [],
        topCampaigns: [],
        userType: 'broker',
        loadTimeMs: loadTime,
      }, {
        headers: {
          'Cache-Control': 'private, no-store',
          'X-Load-Time': `${loadTime}ms`
        }
      })
    } else {
      // Developer/Agent/Admin: fetch buyer stats and campaign stats in parallel
      const [buyerStatsResult, campaignStatsResult] = await Promise.all([
        supabase.rpc('get_buyer_dashboard_stats', {
          p_company_id: effectiveCompanyId
        }),
        supabase.rpc('get_campaign_stats', {
          p_company_id: effectiveCompanyId
        })
      ])

      // Fetch recent buyers — skip company filter for internal team (sees all)
      let buyersQuery = supabase
        .from('buyers')
        .select('id, full_name, first_name, last_name, email, phone, status, ai_quality_score, ai_intent_score, ai_confidence, ai_classification, ai_summary, budget_range, development_name, source_platform, company_id, created_at')

      if (effectiveCompanyId) {
        buyersQuery = buyersQuery.eq('company_id', effectiveCompanyId)
      }

      // Fetch top campaigns — skip company filter for internal team (sees all)
      let campaignsQuery = supabase
        .from('campaigns')
        .select('campaign_name, development_name, total_spent, number_of_leads, impressions, clicks, ctr, company_id')

      if (effectiveCompanyId) {
        campaignsQuery = campaignsQuery.eq('company_id', effectiveCompanyId)
      }

      const [{ data: recentBuyers }, { data: topCampaigns }] = await Promise.all([
        buyersQuery
          .order('created_at', { ascending: false })
          .limit(50),
        campaignsQuery
          .order('number_of_leads', { ascending: false })
          .limit(10)
      ])

      const loadTime = Date.now() - startTime
      return NextResponse.json({
        stats: {
          buyers: buyerStatsResult.data || {},
          campaigns: campaignStatsResult.data || {}
        },
        recentLeads: recentBuyers || [],
        topCampaigns: (topCampaigns || []).map(c => ({
          campaign_name: c.campaign_name,
          development_name: c.development_name,
          spend: c.total_spent || 0,
          leads: c.number_of_leads || 0,
          cpl: c.number_of_leads > 0 ? (c.total_spent || 0) / c.number_of_leads : 0,
          impressions: c.impressions || 0,
          clicks: c.clicks || 0,
          ctr: c.ctr || 0,
        })),
        userType,
        loadTimeMs: loadTime,
      }, {
        headers: {
          'Cache-Control': 'private, no-store',
          'X-Load-Time': `${loadTime}ms`
        }
      })
    }
  } catch (error) {
    console.error('[Dashboard Stats] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}
