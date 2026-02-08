import { NextRequest, NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { scoreLead } from '@/lib/scoring'
import { generateAISummary } from '@/lib/scoring/ai-summary'

// GET /api/leads - List leads with filtering, pagination, and search
export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ leads: [], total: 0, demo: true })
    }

    const supabase = createClient()

    // Authentication check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get user profile to check role and company_id
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('user_type, company_id, is_internal_team')
      .eq('id', user.id)
      .single()

    const isAdmin = userProfile?.user_type === 'admin' || userProfile?.is_internal_team === true

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '50')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status')
    const classification = searchParams.get('classification')
    const assignedTo = searchParams.get('assignedTo')
    const developmentId = searchParams.get('developmentId')
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Explicit columns - no select('*')
    const BUYERS_API_COLUMNS = [
      'id', 'full_name', 'first_name', 'last_name', 'email', 'phone', 'country',
      'status', 'quality_score', 'ai_quality_score', 'intent_score', 'ai_intent_score',
      'ai_confidence', 'ai_summary', 'ai_next_action', 'ai_risk_flags',
      'ai_recommendations', 'ai_classification', 'ai_priority', 'ai_scored_at',
      'budget', 'budget_range', 'budget_min', 'budget_max',
      'bedrooms', 'preferred_bedrooms', 'location', 'area', 'timeline',
      'source', 'source_campaign', 'campaign_id',
      'development_id', 'development_name', 'company_id',
      'payment_method', 'mortgage_status', 'proof_of_funds',
      'uk_broker', 'uk_solicitor',
      'assigned_to', 'assigned_user_name', 'assigned_at',
      'purpose', 'ready_in_28_days',
      'viewing_intent_confirmed', 'viewing_booked', 'viewing_date',
      'replied', 'stop_comms', 'next_follow_up', 'broker_connected',
      'last_wa_message', 'transcript', 'call_summary',
      'notes', 'date_added', 'created_at', 'updated_at',
    ].join(', ')

    // Build query
    let query = supabase
      .from('buyers')
      .select(BUYERS_API_COLUMNS, { count: 'exact' })

    // Filter by company for non-admin users
    if (!isAdmin && userProfile?.company_id) {
      query = query.eq('company_id', userProfile.company_id)
    }

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }

    if (classification) {
      query = query.eq('ai_classification', classification)
    }

    if (assignedTo) {
      query = query.eq('assigned_to', assignedTo)
    }

    if (developmentId) {
      query = query.eq('development_id', developmentId)
    }

    // Search filter
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
    }

    // Exclude duplicates from counts (show them but don't count)
    query = query.neq('status', 'Duplicate')

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data: leads, count, error } = await query

    if (error) {
      console.error('[Leads API] Query error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      leads: leads || [],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    })
  } catch (error) {
    console.error('[Leads API] Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/leads - Create a new lead
export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        success: true,
        message: 'Demo mode: Lead would be created',
        demo: true
      })
    }

    const supabase = createClient()

    // Authentication check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()

    // Validate required fields
    if (!body.full_name && !body.first_name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    // Generate full_name if not provided
    if (!body.full_name && body.first_name) {
      body.full_name = `${body.first_name} ${body.last_name || ''}`.trim()
    }

    // Score the lead
    try {
      const scoreResult = scoreLead(body)
      body.ai_quality_score = scoreResult.qualityScore.total
      body.ai_intent_score = scoreResult.intentScore.total
      body.ai_confidence = scoreResult.confidenceScore.total
      body.ai_classification = scoreResult.classification
      body.ai_priority = scoreResult.priority.priority
      body.ai_risk_flags = scoreResult.riskFlags
      body.ai_scored_at = new Date().toISOString()

      // Generate AI summary
      const summaryResult = generateAISummary(body, scoreResult)
      body.ai_summary = summaryResult.summary
      body.ai_next_action = summaryResult.nextAction
      body.ai_recommendations = summaryResult.recommendations
    } catch (scoreError) {
      console.error('[Leads API] Scoring error:', scoreError)
    }

    // Set defaults
    body.status = body.status || 'Contact Pending'
    body.created_at = new Date().toISOString()

    const { data: lead, error } = await supabase
      .from('buyers')
      .insert(body)
      .select()
      .single()

    if (error) {
      console.error('[Leads API] Insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      lead
    })
  } catch (error) {
    console.error('[Leads API] Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
