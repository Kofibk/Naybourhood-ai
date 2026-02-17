import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { isEffectiveAdmin } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const SELECT_COLUMNS = [
  'id', 'campaign_id', 'campaign_name', 'company_id', 'development_id',
  'platform', 'delivery_status',
  'total_spent', 'number_of_leads',
  'impressions', 'link_clicks', 'clicks', 'reach',
  'date', 'ad_name', 'ad_set_name'
].join(',')

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ data: [] })
  }

  const supabase = createClient()

  // Authentication check
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's company_id and role
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('company_id, is_internal_team, user_type')
    .eq('id', user.id)
    .single()

  const isAdmin = isEffectiveAdmin(user.email, userProfile)

  if (!userProfile?.company_id && !isAdmin) {
    return NextResponse.json({ error: 'No company associated with your account' }, { status: 403 })
  }

  // Paginate server-side so client makes only 1 request
  let allRows: any[] = []
  let from = 0
  const batchSize = 1000
  let hasMore = true

  while (hasMore) {
    let query = supabase
      .from('campaigns')
      .select(SELECT_COLUMNS)

    // Admin/internal users see all campaigns; others filtered by company
    if (!isAdmin && userProfile?.company_id) {
      query = query.eq('company_id', userProfile.company_id)
    }

    const { data, error } = await query
      .range(from, from + batchSize - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    if (data && data.length > 0) {
      allRows = allRows.concat(data)
      from += batchSize
      hasMore = data.length === batchSize
    } else {
      hasMore = false
    }
  }

  return NextResponse.json({ data: allRows })
}
