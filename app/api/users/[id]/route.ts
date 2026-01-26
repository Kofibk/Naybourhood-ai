import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient, isSupabaseConfigured } from '@/lib/supabase/server'

// DELETE user by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Check authentication
    let isAdmin = false
    let isSuperAdmin = false
    let currentUserId: string | null = null

    if (isSupabaseConfigured()) {
      const supabase = createClient()
      const { data: { user: currentUser } } = await supabase.auth.getUser()

      if (currentUser) {
        currentUserId = currentUser.id

        // Check if current user is admin, super admin, or internal team
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('user_type, is_internal_team')
          .eq('id', currentUser.id)
          .single()

        isAdmin = profile?.user_type === 'admin' || profile?.user_type === 'super_admin' || profile?.is_internal_team === true
        isSuperAdmin = profile?.user_type === 'super_admin' || profile?.is_internal_team === true
      }
    }

    // For demo mode - check request headers for admin role
    if (!isAdmin) {
      const inviterRole = request.headers.get('x-user-role')
      if (inviterRole === 'admin' || inviterRole === 'super_admin') {
        isAdmin = true
        isSuperAdmin = inviterRole === 'super_admin'
      }
    }

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Only admins can delete users' },
        { status: 403 }
      )
    }

    // Prevent self-deletion
    if (currentUserId === userId) {
      return NextResponse.json(
        { error: 'You cannot delete your own account' },
        { status: 400 }
      )
    }

    if (isSupabaseConfigured()) {
      try {
        const adminClient = createAdminClient()

        // Delete from profiles table first
        const { error: profileError } = await adminClient
          .from('user_profiles')
          .delete()
          .eq('id', userId)

        if (profileError) {
          console.error('[Delete User] Profile deletion error:', profileError)
          return NextResponse.json(
            { error: `Failed to delete user profile: ${profileError.message}` },
            { status: 400 }
          )
        }

        // Try to delete from Supabase Auth (may fail if user was created differently)
        try {
          await adminClient.auth.admin.deleteUser(userId)
        } catch (authError) {
          // Auth deletion may fail for demo users, that's ok
          console.log('[Delete User] Auth deletion skipped (user may be demo-only)')
        }

        return NextResponse.json({
          success: true,
          message: 'User deleted successfully',
        })
      } catch (adminError) {
        console.error('[Delete User] Admin client error:', adminError)
        return NextResponse.json(
          { error: 'Failed to delete user. Check Supabase configuration.' },
          { status: 500 }
        )
      }
    } else {
      // Demo mode - just return success
      return NextResponse.json({
        success: true,
        message: 'Demo mode: User would be deleted',
        demo: true,
      })
    }
  } catch (error) {
    console.error('[Delete User] Server error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ user: null })
    }

    const supabase = createClient()

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*, companies(name)')
      .eq('id', userId)
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      )
    }

    return NextResponse.json({ user: profile })
  } catch (error) {
    console.error('[Get User] Server error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// UPDATE user by ID
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id
    const body = await request.json()

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        success: true,
        message: 'Demo mode: User would be updated',
        demo: true,
      })
    }

    const supabase = createClient()
    const { data: { user: currentUser } } = await supabase.auth.getUser()

    // Check if current user can update this profile
    let canUpdate = false
    let isSuperAdmin = false

    if (currentUser) {
      // Get current user's role
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('user_type, is_internal_team')
        .eq('id', currentUser.id)
        .single()

      isSuperAdmin = profile?.user_type === 'super_admin' || profile?.is_internal_team === true
      const isAdmin = profile?.user_type === 'admin' || profile?.is_internal_team === true

      // Users can update their own profile
      if (currentUser.id === userId) {
        canUpdate = true
      } else {
        // Super admins and internal team can update anyone, regular admins can update non-admins
        if (isSuperAdmin) {
          canUpdate = true
        } else if (isAdmin) {
          // Check target user's role - admins can't edit super_admins
          const { data: targetProfile } = await supabase
            .from('user_profiles')
            .select('user_type')
            .eq('id', userId)
            .single()

          canUpdate = targetProfile?.user_type !== 'super_admin'
        }
      }
    }

    // Demo mode fallback
    if (!canUpdate) {
      const inviterRole = request.headers.get('x-user-role')
      canUpdate = inviterRole === 'admin' || inviterRole === 'super_admin'
      isSuperAdmin = inviterRole === 'super_admin'
    }

    if (!canUpdate) {
      return NextResponse.json(
        { error: 'Unauthorised to update this user' },
        { status: 403 }
      )
    }

    // Filter out read-only fields
    // Only super_admin can change roles to/from super_admin
    const { id, created_at, email, ...updateData } = body

    // Prevent non-super_admins from setting super_admin role
    if (updateData.role === 'super_admin' && !isSuperAdmin) {
      return NextResponse.json(
        { error: 'Only Super Admins can assign the Super Admin role' },
        { status: 403 }
      )
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      user: data,
    })
  } catch (error) {
    console.error('[Update User] Server error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
