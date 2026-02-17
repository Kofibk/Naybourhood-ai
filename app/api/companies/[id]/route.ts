import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { isEffectiveAdmin } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/**
 * DELETE a company by ID.
 * Uses admin client to bypass RLS and handles foreign key references
 * by nullifying company_id on related tables before deletion.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const companyId = params.id

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 })
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    // Verify the requesting user is an admin
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_type, is_internal_team')
      .eq('id', user.id)
      .single()

    const isAdmin = isEffectiveAdmin(user.email, profile) ||
                    profile?.user_type === 'super_admin'

    if (!isAdmin) {
      return NextResponse.json({ error: 'Only admins can delete companies' }, { status: 403 })
    }

    const adminClient = createAdminClient()

    console.log('[Delete Company] 🗑️ Starting deletion for company:', companyId)

    // Step 1: Nullify company_id on user_profiles (no ON DELETE CASCADE)
    const { error: profilesError } = await adminClient
      .from('user_profiles')
      .update({ company_id: null })
      .eq('company_id', companyId)

    if (profilesError) {
      console.error('[Delete Company] ❌ Failed to unlink user_profiles:', profilesError)
    } else {
      console.log('[Delete Company] ✅ Unlinked user_profiles')
    }

    // Step 2: Nullify company_id on buyers (no ON DELETE CASCADE)
    const { error: buyersError } = await adminClient
      .from('buyers')
      .update({ company_id: null })
      .eq('company_id', companyId)

    if (buyersError) {
      console.error('[Delete Company] ⚠️ Failed to unlink buyers:', buyersError.message)
    }

    // Step 3: Nullify company_id on campaigns (no ON DELETE CASCADE)
    const { error: campaignsError } = await adminClient
      .from('campaigns')
      .update({ company_id: null })
      .eq('company_id', companyId)

    if (campaignsError) {
      console.error('[Delete Company] ⚠️ Failed to unlink campaigns:', campaignsError.message)
    }

    // Step 4: Nullify company_id on developments (no ON DELETE CASCADE)
    const { error: developmentsError } = await adminClient
      .from('developments')
      .update({ company_id: null })
      .eq('company_id', companyId)

    if (developmentsError) {
      console.error('[Delete Company] ⚠️ Failed to unlink developments:', developmentsError.message)
    }

    // Step 5: Nullify company_id on finance_leads (no ON DELETE CASCADE)
    const { error: financeError } = await adminClient
      .from('finance_leads')
      .update({ company_id: null })
      .eq('company_id', companyId)

    if (financeError) {
      console.error('[Delete Company] ⚠️ Failed to unlink finance_leads:', financeError.message)
    }

    // Step 6: Delete the company (api_keys and subscriptions have ON DELETE CASCADE)
    const { error: deleteError } = await adminClient
      .from('companies')
      .delete()
      .eq('id', companyId)

    if (deleteError) {
      console.error('[Delete Company] ❌ Failed to delete company:', deleteError)
      return NextResponse.json(
        { error: `Failed to delete company: ${deleteError.message}` },
        { status: 500 }
      )
    }

    console.log('[Delete Company] ✅ Company deleted successfully:', companyId)

    return NextResponse.json({ success: true, message: 'Company deleted successfully' })
  } catch (error: any) {
    console.error('[Delete Company] ❌ Server error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
