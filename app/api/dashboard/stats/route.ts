import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Edge caching - revalidate every 30 seconds
export const revalidate = 30

// Use edge runtime for faster cold starts
export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const timings: Record<string, number> = {}

  const searchParams = request.nextUrl.searchParams
  const companyId = searchParams.get('company_id')
  const companyName = searchParams.get('company_name')
  const userType = searchParams.get('user_type') || 'developer'

  console.log(`[Dashboard API] Request: userType=${userType}, companyId=${companyId || 'all'}`)

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
    const isBroker = userType === 'broker'

    if (isBroker) {
      // --- Broker: borrower stats ---
      let borrowerStats: Record<string, number> = {}

      // Try RPC first, fall back to direct count queries
      const rpcStart = Date.now()
      const rpcResult = await supabase.rpc('get_borrower_dashboard_stats', {
        p_company_id: companyId || null,
        p_company_name: companyName || null
      })
      timings.borrower_stats_rpc = Date.now() - rpcStart

      if (rpcResult.error || !rpcResult.data) {
        console.warn('[Dashboard API] Borrower RPC failed, using count fallback:', rpcResult.error?.message)

        // Fallback: direct .count() queries without .range() for accurate totals
        const fallbackStart = Date.now()
        const buildQuery = () => {
          let q = supabase.from('borrowers').select('id', { count: 'exact', head: true })
          if (companyId) q = q.eq('company_id', companyId)
          return q
        }

        const [totalResult, newResult, contactedResult, qualifiedResult, completedResult] = await Promise.all([
          buildQuery(),
          buildQuery().eq('status', 'New'),
          buildQuery().eq('status', 'Contacted'),
          buildQuery().eq('status', 'Qualified'),
          buildQuery().eq('status', 'Completed'),
        ])
        timings.borrower_count_fallback = Date.now() - fallbackStart

        borrowerStats = {
          total_leads: totalResult.count ?? 0,
          contact_pending: newResult.count ?? 0,
          follow_up: contactedResult.count ?? 0,
          awaiting_docs: qualifiedResult.count ?? 0,
          completed: completedResult.count ?? 0,
          not_proceeding: 0,
          total_loan_amount: 0,
          avg_loan_amount: 0,
          last_24h: 0,
          last_7d: 0,
          last_30d: 0,
        }

        console.log('[Dashboard API] Borrower fallback stats:', borrowerStats)
      } else {
        borrowerStats = rpcResult.data
        console.log('[Dashboard API] Borrower RPC stats:', borrowerStats)
      }

      // Recent borrowers with explicit columns and .range()
      const borrowersStart = Date.now()
      const { data: recentBorrowers, error: borrowersError } = await supabase
        .from('borrowers')
        .select('id, full_name, first_name, last_name, email, phone, status, finance_type, loan_amount, company_id, date_added, created_at')
        .order('created_at', { ascending: false })
        .range(0, 49)

      timings.recent_borrowers = Date.now() - borrowersStart
      if (borrowersError) console.warn('[Dashboard API] Recent borrowers error:', borrowersError.message)
      console.log('[Dashboard API] Recent borrowers count:', recentBorrowers?.length ?? 0)

      const loadTime = Date.now() - startTime
      return NextResponse.json({
        stats: borrowerStats,
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
      // --- Developer/Agent/Admin: buyer stats + campaign stats ---
      let buyerStats: Record<string, number> = {}
      let campaignStats: Record<string, number> = {}

      // Try RPC functions in parallel
      const rpcStart = Date.now()
      const [buyerRpcResult, campaignRpcResult] = await Promise.all([
        supabase.rpc('get_buyer_dashboard_stats', { p_company_id: companyId || null }),
        supabase.rpc('get_campaign_stats', { p_company_id: companyId || null }),
      ])
      timings.parallel_rpc = Date.now() - rpcStart

      // Handle buyer stats - RPC or fallback to .count() queries
      if (buyerRpcResult.error || !buyerRpcResult.data) {
        console.warn('[Dashboard API] Buyer RPC failed, using count fallback:', buyerRpcResult.error?.message)

        const fallbackStart = Date.now()
        const buildQuery = () => {
          let q = supabase.from('buyers').select('id', { count: 'exact', head: true })
          if (companyId) q = q.eq('company_id', companyId)
          return q
        }

        const [totalResult, hotResult, qualifiedResult, viewingResult, recentResult] = await Promise.all([
          buildQuery(),
          buildQuery().in('ai_classification', ['Hot', 'Hot Lead']),
          buildQuery().in('ai_classification', ['Qualified', 'Warm-Qualified']),
          buildQuery().eq('viewing_booked', true),
          buildQuery().gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        ])
        timings.buyer_count_fallback = Date.now() - fallbackStart

        buyerStats = {
          total_leads: totalResult.count ?? 0,
          hot_leads: hotResult.count ?? 0,
          qualified: qualifiedResult.count ?? 0,
          needs_qualification: 0,
          nurture: 0,
          low_priority: 0,
          avg_score: 0,
          contact_pending: 0,
          in_progress: 0,
          qualified_status: 0,
          viewing_booked: viewingResult.count ?? 0,
          converted: 0,
          last_24h: 0,
          last_7d: recentResult.count ?? 0,
          last_30d: 0,
        }

        console.log('[Dashboard API] Buyer fallback stats:', buyerStats)
      } else {
        buyerStats = buyerRpcResult.data
        console.log('[Dashboard API] Buyer RPC stats:', buyerStats)
      }

      // Handle campaign stats - RPC or fallback
      if (campaignRpcResult.error || !campaignRpcResult.data) {
        console.warn('[Dashboard API] Campaign RPC failed, using count fallback:', campaignRpcResult.error?.message)

        const fallbackStart = Date.now()
        const buildCampaignQuery = () => {
          let q = supabase.from('campaigns').select('id', { count: 'exact', head: true })
          if (companyId) q = q.eq('company_id', companyId)
          return q
        }

        const [campaignCountResult] = await Promise.all([
          buildCampaignQuery(),
        ])
        timings.campaign_count_fallback = Date.now() - fallbackStart

        campaignStats = {
          total_campaigns: campaignCountResult.count ?? 0,
          total_spend: 0,
          total_leads: 0,
          total_impressions: 0,
          total_clicks: 0,
          avg_cpl: 0,
          avg_ctr: 0,
        }

        console.log('[Dashboard API] Campaign fallback stats:', campaignStats)
      } else {
        campaignStats = campaignRpcResult.data
        console.log('[Dashboard API] Campaign RPC stats:', campaignStats)
      }

      // Recent buyers with explicit columns and .range()
      const buyersStart = Date.now()
      const { data: recentBuyers, error: buyersError } = await supabase
        .from('buyers')
        .select('id, full_name, first_name, last_name, email, phone, status, ai_quality_score, ai_classification, ai_summary, budget_range, development_name, source_platform, company_id, created_at')
        .order('created_at', { ascending: false })
        .range(0, 49)

      timings.recent_buyers = Date.now() - buyersStart
      if (buyersError) console.warn('[Dashboard API] Recent buyers error:', buyersError.message)
      console.log('[Dashboard API] Recent buyers count:', recentBuyers?.length ?? 0)

      // Top campaigns with explicit columns and .range()
      const campaignsStart = Date.now()
      const { data: topCampaigns, error: campaignsError } = await supabase
        .from('campaigns')
        .select('campaign_name, development_name, total_spent, number_of_leads, impressions, clicks, ctr, company_id')
        .order('number_of_leads', { ascending: false })
        .range(0, 9)

      timings.top_campaigns = Date.now() - campaignsStart
      if (campaignsError) console.warn('[Dashboard API] Top campaigns error:', campaignsError.message)
      console.log('[Dashboard API] Top campaigns count:', topCampaigns?.length ?? 0)

      const loadTime = Date.now() - startTime
      console.log(`[Dashboard API] Total: ${loadTime}ms`, timings)

      return NextResponse.json({
        stats: {
          buyers: buyerStats,
          campaigns: campaignStats
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
    console.error(`[Dashboard API] Error after ${loadTime}ms:`, error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats', details: String(error) },
      { status: 500 }
    )
  }
}
