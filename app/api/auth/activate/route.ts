import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * Activate a user's membership after they accept an invite.
 * Uses admin client to bypass RLS.
 * Called from the client-side AuthHandler after setSession succeeds.
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, email } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    console.log('[Activate API] 🔄 Activating user:', { userId, email })

    const adminClient = createAdminClient()

    // Update membership_status to 'active' using admin client (bypasses RLS)
    const { data, error } = await adminClient
      .from('user_profiles')
      .update({ membership_status: 'active' })
      .eq('id', userId)
      .select('id, email, membership_status, is_internal_team, onboarding_completed')

    if (error) {
      console.error('[Activate API] ❌ Failed to activate user:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    if (!data || data.length === 0) {
      console.error('[Activate API] ⚠️ No rows updated for userId:', userId)
      return NextResponse.json(
        { error: 'No profile found for this user' },
        { status: 404 }
      )
    }

    console.log('[Activate API] ✅ User activated:', data[0])

    return NextResponse.json({
      success: true,
      profile: data[0],
    })
  } catch (error: any) {
    console.error('[Activate API] ❌ Server error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
