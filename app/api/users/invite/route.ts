import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Check if the current user is authenticated and is an admin
    const supabase = createClient()
    const { data: { user: currentUser } } = await supabase.auth.getUser()

    if (!currentUser) {
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
        { error: 'Only admins can invite users' },
        { status: 403 }
      )
    }

    // Get invitation details from request body
    const body = await request.json()
    const { email, name, role, company_id } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Create admin client for invitation
    const adminClient = createAdminClient()

    // Send invitation email via Supabase Auth
    const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
      data: {
        full_name: name,
        role: role || 'agent',
        company_id: company_id || null,
      },
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback?next=/admin`,
    })

    if (error) {
      console.error('[Invite API] Error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    // Create profile entry for the invited user
    if (data.user) {
      const { error: profileError } = await adminClient
        .from('profiles')
        .upsert({
          id: data.user.id,
          email: email,
          full_name: name,
          role: role || 'agent',
          company_id: company_id || null,
        })

      if (profileError) {
        console.error('[Invite API] Profile creation error:', profileError)
        // Don't fail the whole request - user is already invited
      }
    }

    return NextResponse.json({
      success: true,
      message: `Invitation sent to ${email}`,
      user: data.user,
    })
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
    const supabase = createClient()
    const { data: { user: currentUser } } = await supabase.auth.getUser()

    if (!currentUser) {
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
