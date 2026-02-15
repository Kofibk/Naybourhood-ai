import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

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

  // Get user's company_id
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('company_id, is_internal_team')
    .eq('id', user.id)
    .single()

  if (!userProfile?.company_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Paginate server-side so client makes only 1 request
  let allRows: any[] = []
  let from = 0
  const batchSize = 1000
  let hasMore = true

  while (hasMore) {
    const { data, error } = await supabase
      .from('campaigns')
      .select(SELECT_COLUMNS)
      .eq('company_id', userProfile.company_id)
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
