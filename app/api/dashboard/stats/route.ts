import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Edge caching - revalidate every 30 seconds
export const revalidate = 30

// Use edge runtime for faster cold starts
export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  const searchParams = request.nextUrl.searchParams
  const companyId = searchParams.get('company_id')
  const companyName = searchParams.get('company_name')
  const userType = searchParams.get('user_type') || 'developer'

  // Create Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { error: 'Supabase not configured' },
      { status: 500 }
    )
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // Fetch stats based on user type - all in parallel
    const isBroker = userType === 'broker'

    if (isBroker) {
      // Broker: fetch borrower stats only (recent borrowers function may not exist)
      const statsResult = await supabase.rpc('get_borrower_dashboard_stats', {
        p_company_id: companyId || null,
        p_company_name: companyName || null
      })

      // Also fetch recent borrowers directly (simpler query)
      const { data: recentBorrowers } = await supabase
        .from('borrowers')
        .select('id, full_name, first_name, last_name, email, phone, status, finance_type, loan_amount, company_id, date_added, created_at')
        .order('created_at', { ascending: false })
        .limit(50)

      const loadTime = Date.now() - startTime

      return NextResponse.json({
        stats: statsResult.data || {},
        recentLeads: recentBorrowers || [],
        topCampaigns: [],
        userType: 'broker',
        loadTimeMs: loadTime,
        cached: false
      }, {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
          'X-Load-Time': `${loadTime}ms`
        }
      })
    } else {
      // Developer/Agent/Admin: fetch buyer stats and campaign stats
      const [buyerStatsResult, campaignStatsResult] = await Promise.all([
        supabase.rpc('get_buyer_dashboard_stats', {
          p_company_id: companyId || null
        }),
        supabase.rpc('get_campaign_stats', {
          p_company_id: companyId || null
        })
      ])

      // Fetch recent buyers directly (simpler query)
      const { data: recentBuyers } = await supabase
        .from('buyers')
        .select('id, full_name, first_name, last_name, email, phone, status, ai_quality_score, ai_classification, ai_summary, budget_range, development_name, source_platform, company_id, created_at')
        .order('created_at', { ascending: false })
        .limit(50)

      // Fetch top campaigns directly
      const { data: topCampaigns } = await supabase
        .from('campaigns')
        .select('campaign_name, development_name, total_spent, number_of_leads, impressions, clicks, ctr, company_id')
        .order('number_of_leads', { ascending: false })
        .limit(10)

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
          company_id: c.company_id
        })),
        userType,
        loadTimeMs: loadTime,
        cached: false
      }, {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
          'X-Load-Time': `${loadTime}ms`
        }
      })
    }
  } catch (error) {
    console.error('[Dashboard Stats API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats', details: String(error) },
      { status: 500 }
    )
  }
}
