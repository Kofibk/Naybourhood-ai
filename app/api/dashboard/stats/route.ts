import { NextRequest, NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'

// Revalidate every 30 seconds
export const revalidate = 30

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
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

  const searchParams = request.nextUrl.searchParams
  const userType = searchParams.get('user_type') || 'developer'

  // Derive effective company ID: admins can specify one, others get their own
  const effectiveCompanyId = isAdmin
    ? (searchParams.get('company_id') || null)
    : (userProfile?.company_id || null)

  try {
    const isBroker = userType === 'broker'

    if (isBroker) {
      // Broker: fetch borrower stats
      const statsResult = await supabase.rpc('get_borrower_dashboard_stats', {
        p_company_id: effectiveCompanyId,
        p_company_name: null
      })

      // Fetch recent borrowers with company scoping
      let borrowersQuery = supabase
        .from('borrowers')
        .select('id, full_name, first_name, last_name, email, phone, status, finance_type, loan_amount, company_id, date_added, created_at')
        .order('created_at', { ascending: false })
        .limit(50)

      if (effectiveCompanyId) {
        borrowersQuery = borrowersQuery.eq('company_id', effectiveCompanyId)
      }

      const { data: recentBorrowers } = await borrowersQuery

      const loadTime = Date.now() - startTime
      return NextResponse.json({
        stats: statsResult.data || {},
        recentLeads: recentBorrowers || [],
        topCampaigns: [],
        userType: 'broker',
        loadTimeMs: loadTime,
      }, {
        headers: {
          'Cache-Control': 'private, s-maxage=30, stale-while-revalidate=60',
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

      // Fetch recent buyers with company scoping
      let buyersQuery = supabase
        .from('buyers')
        .select('id, full_name, first_name, last_name, email, phone, status, ai_quality_score, ai_intent_score, ai_confidence, ai_classification, ai_summary, budget_range, development_name, source_platform, company_id, created_at')
        .order('created_at', { ascending: false })
        .limit(50)

      if (effectiveCompanyId) {
        buyersQuery = buyersQuery.eq('company_id', effectiveCompanyId)
      }

      // Fetch top campaigns with company scoping
      let campaignsQuery = supabase
        .from('campaigns')
        .select('campaign_name, development_name, total_spent, number_of_leads, impressions, clicks, ctr, company_id')
        .order('number_of_leads', { ascending: false })
        .limit(10)

      if (effectiveCompanyId) {
        campaignsQuery = campaignsQuery.eq('company_id', effectiveCompanyId)
      }

      const [{ data: recentBuyers }, { data: topCampaigns }] = await Promise.all([
        buyersQuery,
        campaignsQuery
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
          'Cache-Control': 'private, s-maxage=30, stale-while-revalidate=60',
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
