import { NextRequest, NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { scoreLead } from '@/lib/scoring'
import { generateAISummary } from '@/lib/scoring/ai-summary'

// GET /api/leads/[id] - Get a single lead
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const leadId = params.id

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ lead: null, demo: true })
    }

    const supabase = createClient()

    // Authentication check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { data: lead, error } = await supabase
      .from('buyers')
      .select('*')
      .eq('id', leadId)
      .single()

    if (error) {
      console.error('[Lead API] Query error:', error)
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    return NextResponse.json({ lead })
  } catch (error) {
    console.error('[Lead API] Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/leads/[id] - Update a lead
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const leadId = params.id

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        success: true,
        message: 'Demo mode: Lead would be updated',
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

    // Remove read-only fields
    const { id, created_at, ...updateData } = body

    // Check if we should re-score the lead (financial or intent-related fields changed)
    const shouldRescore = [
      'payment_method',
      'proof_of_funds',
      'mortgage_status',
      'budget',
      'budget_range',
      'timeline',
      'uk_broker',
      'uk_solicitor',
      'status'
    ].some(field => field in updateData)

    // Fetch current lead data for re-scoring
    if (shouldRescore) {
      const { data: currentLead } = await supabase
        .from('buyers')
        .select('*')
        .eq('id', leadId)
        .single()

      if (currentLead) {
        const mergedLead = { ...currentLead, ...updateData }
        try {
          const scoreResult = scoreLead(mergedLead)
          updateData.ai_quality_score = scoreResult.qualityScore.total
          updateData.ai_intent_score = scoreResult.intentScore.total
          updateData.ai_confidence = scoreResult.confidenceScore.total
          updateData.ai_classification = scoreResult.classification
          updateData.ai_priority = scoreResult.priority.priority
          updateData.ai_risk_flags = scoreResult.riskFlags
          updateData.ai_scored_at = new Date().toISOString()

          const summaryResult = generateAISummary(mergedLead, scoreResult)
          updateData.ai_summary = summaryResult.summary
          updateData.ai_next_action = summaryResult.nextAction
          updateData.ai_recommendations = summaryResult.recommendations
        } catch (scoreError) {
          console.error('[Lead API] Re-scoring error:', scoreError)
        }
      }
    }

    updateData.updated_at = new Date().toISOString()

    const { data: lead, error } = await supabase
      .from('buyers')
      .update(updateData)
      .eq('id', leadId)
      .select()
      .single()

    if (error) {
      console.error('[Lead API] Update error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      lead
    })
  } catch (error) {
    console.error('[Lead API] Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/leads/[id] - Delete a lead (soft delete by marking as Duplicate)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const leadId = params.id

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        success: true,
        message: 'Demo mode: Lead would be deleted',
        demo: true
      })
    }

    const supabase = createClient()

    // Authentication check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check if user is admin
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    const isAdmin = userProfile?.user_type === 'admin'

    // Check for hard delete parameter (admin only)
    const { searchParams } = new URL(request.url)
    const hardDelete = searchParams.get('hard') === 'true'

    if (hardDelete) {
      if (!isAdmin) {
        return NextResponse.json(
          { error: 'Only admins can permanently delete leads' },
          { status: 403 }
        )
      }

      const { error } = await supabase
        .from('buyers')
        .delete()
        .eq('id', leadId)

      if (error) {
        console.error('[Lead API] Delete error:', error)
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        message: 'Lead permanently deleted'
      })
    } else {
      // Soft delete - mark as Duplicate
      const { data: lead, error } = await supabase
        .from('buyers')
        .update({
          status: 'Duplicate',
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId)
        .select()
        .single()

      if (error) {
        console.error('[Lead API] Soft delete error:', error)
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        lead,
        message: 'Lead marked as duplicate'
      })
    }
  } catch (error) {
    console.error('[Lead API] Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
