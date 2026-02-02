import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Edge caching - revalidate every 30 seconds
export const revalidate = 30

// Use edge runtime for faster cold starts
export const runtime = 'edge'

// Helper for timing individual operations
function logTiming(name: string, startTime: number, metadata?: Record<string, any>) {
  const duration = Date.now() - startTime
  const emoji = duration > 1000 ? '🔴' : duration > 500 ? '🟠' : duration > 200 ? '🟡' : '🟢'
  const metadataStr = metadata ? ` | ${JSON.stringify(metadata)}` : ''
  console.log(`[PERF] [API/dashboard/stats] ${emoji} ${name}: ${duration}ms${metadataStr}`)
  return duration
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const timings: Record<string, number> = {}

  console.log(`\n[PERF] ========== API: /api/dashboard/stats ==========`)

  const searchParams = request.nextUrl.searchParams
  const companyId = searchParams.get('company_id')
  const companyName = searchParams.get('company_name')
  const userType = searchParams.get('user_type') || 'developer'
  
  console.log(`[PERF] [API/dashboard/stats] 🚀 Request: userType=${userType}, companyId=${companyId || 'all'}`)

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
      const statsStart = Date.now()
      const statsResult = await supabase.rpc('get_borrower_dashboard_stats', {
        p_company_id: companyId || null,
        p_company_name: companyName || null
      })
      timings.borrower_stats_rpc = logTiming('get_borrower_dashboard_stats RPC', statsStart)

      // Also fetch recent borrowers directly (simpler query)
      const borrowersStart = Date.now()
      const { data: recentBorrowers } = await supabase
        .from('borrowers')
        .select('id, full_name, first_name, last_name, email, phone, status, finance_type, loan_amount, company_id, date_added, created_at')
        .order('created_at', { ascending: false })
        .limit(50)
      timings.recent_borrowers = logTiming('recent_borrowers', borrowersStart, { count: recentBorrowers?.length || 0 })

      const loadTime = Date.now() - startTime
      console.log(`[PERF] [API/dashboard/stats] ✅ Total: ${loadTime}ms`)
      console.log(`[PERF] ==========================================\n`)

      return NextResponse.json({
        stats: statsResult.data || {},
        recentLeads: recentBorrowers || [],
        topCampaigns: [],
        userType: 'broker',
        loadTimeMs: loadTime,
        timings,
        cached: false
      }, {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
          'X-Load-Time': `${loadTime}ms`
        }
      })
    } else {
      // Developer/Agent/Admin: fetch buyer stats and campaign stats in parallel
      const rpcStart = Date.now()
      const [buyerStatsResult, campaignStatsResult] = await Promise.all([
        (async () => {
          const start = Date.now()
          const result = await supabase.rpc('get_buyer_dashboard_stats', {
            p_company_id: companyId || null
          })
          timings.buyer_stats_rpc = Date.now() - start
          return result
        })(),
        (async () => {
          const start = Date.now()
          const result = await supabase.rpc('get_campaign_stats', {
            p_company_id: companyId || null
          })
          timings.campaign_stats_rpc = Date.now() - start
          return result
        })()
      ])
      logTiming('parallel_rpc_calls', rpcStart, { buyer_stats: timings.buyer_stats_rpc, campaign_stats: timings.campaign_stats_rpc })

      // Fetch recent buyers directly (simpler query)
      const buyersStart = Date.now()
      const { data: recentBuyers } = await supabase
        .from('buyers')
        .select('id, full_name, first_name, last_name, email, phone, status, ai_quality_score, ai_classification, ai_summary, budget_range, development_name, source_platform, company_id, created_at')
        .order('created_at', { ascending: false })
        .limit(50)
      timings.recent_buyers = logTiming('recent_buyers', buyersStart, { count: recentBuyers?.length || 0 })

      // Fetch top campaigns directly
      const campaignsStart = Date.now()
      const { data: topCampaigns } = await supabase
        .from('campaigns')
        .select('campaign_name, development_name, total_spent, number_of_leads, impressions, clicks, ctr, company_id')
        .order('number_of_leads', { ascending: false })
        .limit(10)
      timings.top_campaigns = logTiming('top_campaigns', campaignsStart, { count: topCampaigns?.length || 0 })

      const loadTime = Date.now() - startTime
      console.log(`[PERF] [API/dashboard/stats] ✅ Total: ${loadTime}ms`)
      console.log(`[PERF] ==========================================\n`)

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
        timings,
        cached: false
      }, {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
          'X-Load-Time': `${loadTime}ms`
        }
      })
    }
  } catch (error) {
    const loadTime = Date.now() - startTime
    console.error(`[PERF] [API/dashboard/stats] ❌ Error after ${loadTime}ms:`, error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats', details: String(error) },
      { status: 500 }
    )
  }
}
