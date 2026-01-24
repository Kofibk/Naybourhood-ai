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
      // Broker: fetch borrower stats and recent borrowers
      const [statsResult, recentResult] = await Promise.all([
        supabase.rpc('get_borrower_dashboard_stats', {
          p_company_id: companyId || null,
          p_company_name: companyName || null
        }),
        supabase.rpc('get_recent_borrowers', {
          p_company_id: companyId || null,
          p_company_name: companyName || null,
          p_limit: 50
        })
      ])

      const loadTime = Date.now() - startTime

      return NextResponse.json({
        stats: statsResult.data || {},
        recentLeads: recentResult.data || [],
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
      // Developer/Agent/Admin: fetch buyer stats, campaign stats, and recent buyers
      const [buyerStatsResult, campaignStatsResult, recentBuyersResult, topCampaignsResult] = await Promise.all([
        supabase.rpc('get_buyer_dashboard_stats', {
          p_company_id: companyId || null
        }),
        supabase.rpc('get_campaign_stats', {
          p_company_id: companyId || null
        }),
        supabase.rpc('get_recent_buyers', {
          p_company_id: companyId || null,
          p_limit: 50
        }),
        supabase.rpc('get_top_campaigns', {
          p_company_id: companyId || null,
          p_limit: 10
        })
      ])

      const loadTime = Date.now() - startTime

      return NextResponse.json({
        stats: {
          buyers: buyerStatsResult.data || {},
          campaigns: campaignStatsResult.data || {}
        },
        recentLeads: recentBuyersResult.data || [],
        topCampaigns: topCampaignsResult.data || [],
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
