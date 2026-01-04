import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient, isSupabaseConfigured } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Get invitation details from request body
    const body = await request.json()
    const { email, name, role, company_id, inviter_role } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    if (!name) {
      return NextResponse.json(
        { error: 'Full name is required' },
        { status: 400 }
      )
    }

    if (!company_id) {
      return NextResponse.json(
        { error: 'Company is required' },
        { status: 400 }
      )
    }

    // Check authentication - support both Supabase auth and demo mode
    let isAdmin = false

    if (isSupabaseConfigured()) {
      const supabase = createClient()
      const { data: { user: currentUser } } = await supabase.auth.getUser()

      if (currentUser) {
        // Check if current user is admin
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', currentUser.id)
          .single()

        isAdmin = profile?.role === 'admin'
      }
    }

    // For development: allow if inviter claims to be admin (passed from frontend)
    // In production, remove this fallback and rely only on Supabase auth
    if (!isAdmin && inviter_role === 'admin') {
      console.log('[Invite API] Using demo mode admin access')
      isAdmin = true
    }

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Only admins can invite users' },
        { status: 403 }
      )
    }

    // If Supabase is configured, use the full invite flow
    if (isSupabaseConfigured()) {
      try {
        // Create admin client for invitation
        const adminClient = createAdminClient()

        // Send invitation email via Supabase Auth
        const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
          data: {
            full_name: name,
            role: role || 'developer',
            company_id: company_id,
          },
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`,
        })

        if (error) {
          console.error('[Invite API] Supabase invite error:', error)

          // If invite fails, try to just create the profile
          const { error: profileError } = await adminClient
            .from('profiles')
            .insert({
              id: crypto.randomUUID(),
              email: email,
              full_name: name,
              role: role || 'developer',
              company_id: company_id,
            })

          if (profileError) {
            console.error('[Invite API] Profile creation fallback error:', profileError)
            return NextResponse.json(
              { error: `Invite failed: ${error.message}` },
              { status: 400 }
            )
          }

          return NextResponse.json({
            success: true,
            message: `User profile created for ${email}. They will need to sign up separately.`,
            note: 'Email invitation failed - profile created only',
          })
        }

        // Create profile entry for the invited user
        if (data.user) {
          const { error: profileError } = await adminClient
            .from('profiles')
            .upsert({
              id: data.user.id,
              email: email,
              full_name: name,
              role: role || 'developer',
              company_id: company_id,
            })

          if (profileError) {
            console.error('[Invite API] Profile creation error:', profileError)
          }
        }

        return NextResponse.json({
          success: true,
          message: `Invitation sent to ${email}`,
          user: data.user,
        })
      } catch (adminError) {
        console.error('[Invite API] Admin client error:', adminError)
        return NextResponse.json(
          { error: 'Failed to send invitation. Check Supabase configuration.' },
          { status: 500 }
        )
      }
    } else {
      // Demo mode - just return success (no actual invite sent)
      return NextResponse.json({
        success: true,
        message: `Demo mode: Invitation would be sent to ${email}`,
        demo: true,
      })
    }
  } catch (error) {
    console.error('[Invite API] Server error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get all users (for admin)
export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ users: [] })
    }

    const supabase = createClient()
    const { data: { user: currentUser } } = await supabase.auth.getUser()

    // For demo mode, return empty or allow access
    if (!currentUser) {
      // Check for demo mode via query param or header
      const url = new URL(request.url)
      const demoMode = url.searchParams.get('demo') === 'true'

      if (demoMode) {
        const { data: users, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })

        return NextResponse.json({ users: users || [] })
      }

      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if current user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', currentUser.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can view all users' },
        { status: 403 }
      )
    }

    // Get all profiles
    const { data: users, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ users })
  } catch (error) {
    console.error('[Users API] Server error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
