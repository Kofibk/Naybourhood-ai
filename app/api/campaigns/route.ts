import { createClient } from '@supabase/supabase-js'
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
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  // Paginate server-side so client makes only 1 request
  let allRows: any[] = []
  let from = 0
  const batchSize = 1000
  let hasMore = true

  while (hasMore) {
    const { data, error } = await supabase
      .from('campaigns')
      .select(SELECT_COLUMNS)
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
