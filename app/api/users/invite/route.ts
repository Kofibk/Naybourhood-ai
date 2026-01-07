import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { sendInviteEmail, isEmailConfigured } from '@/lib/email'

// Check if service role key is configured (required for invites)
function isServiceRoleConfigured(): boolean {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  return !!(key && key !== 'your-supabase-service-role-key' && key.length > 20)
}

export async function POST(request: NextRequest) {
  try {
    // Get invitation details from request body
    const body = await request.json()
    const { email, name, role, company_id, is_internal, inviter_role } = body

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

    // Company only required for external users
    if (!is_internal && !company_id) {
      return NextResponse.json(
        { error: 'Company is required for external users' },
        { status: 400 }
      )
    }

    // Check authentication - support both Supabase auth and demo mode
    let isAdmin = false
    let currentUserEmail = ''

    if (isSupabaseConfigured()) {
      const supabase = createClient()
      const { data: { user: currentUser } } = await supabase.auth.getUser()

      if (currentUser) {
        currentUserEmail = currentUser.email || ''

        // Check if current user is admin or super_admin
        // Try both profiles and user_profiles tables
        let profile = null

        // Try profiles table first
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', currentUser.id)
          .single()

        if (profileData) {
          profile = profileData
        } else {
          // Fallback to user_profiles table
          const { data: userProfileData } = await supabase
            .from('user_profiles')
            .select('user_type')
            .eq('id', currentUser.id)
            .single()

          if (userProfileData) {
            profile = { role: userProfileData.user_type }
          }
        }

        // Allow admin, super_admin, or specific allowed emails
        const allowedEmails = ['kofi@millionpound.homes', 'kofi@naybourhood.ai']
        isAdmin = profile?.role === 'admin' ||
                  profile?.role === 'super_admin' ||
                  allowedEmails.includes(currentUser.email || '')
      }
    }

    // Demo/Quick Access mode: Allow admin actions when using Quick Access feature
    // This is for development and demo purposes when user isn't fully authenticated via Supabase
    if (!isAdmin && (inviter_role === 'admin' || inviter_role === 'super_admin')) {
      console.log('[Invite API] Using Quick Access admin mode')
      isAdmin = true
    }

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Only admins can invite users' },
        { status: 403 }
      )
    }

    // Check Supabase configuration
    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        success: false,
        error: 'Supabase is not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment variables.',
      }, { status: 500 })
    }

    // Check service role key (required for email invites)
    if (!isServiceRoleConfigured()) {
      console.error('[Invite API] Missing SUPABASE_SERVICE_ROLE_KEY')
      return NextResponse.json({
        success: false,
        error: 'Email invitations require SUPABASE_SERVICE_ROLE_KEY. Add it to your environment variables (find it in Supabase Dashboard > Settings > API > service_role key).',
      }, { status: 500 })
    }

    try {
      // Create admin client for invitation
      const adminClient = createAdminClient()

      // Send invitation email via Supabase Auth
      const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`
      console.log('[Invite API] Sending invite to:', email, 'with redirect:', redirectUrl)

      const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
        data: {
          full_name: name,
          role: role || 'developer',
          company_id: company_id || null,
          is_internal: is_internal || false,
        },
        redirectTo: redirectUrl,
      })

      if (error) {
        console.error('[Invite API] Supabase invite error:', error.message, error)

        // Check for specific error types
        if (error.message.includes('already registered')) {
          return NextResponse.json({
            success: false,
            error: `User ${email} is already registered. They can log in directly.`,
          }, { status: 400 })
        }

        if (error.message.includes('rate limit')) {
          return NextResponse.json({
            success: false,
            error: 'Too many invitations sent. Please wait a moment and try again.',
          }, { status: 429 })
        }

        // If invite fails, try to just create the profile as fallback
        const { error: profileError } = await adminClient
          .from('profiles')
          .insert({
            id: crypto.randomUUID(),
            email: email,
            full_name: name,
            role: role || 'developer',
            company_id: company_id || null,
            is_internal: is_internal || false,
          })

        if (profileError) {
          console.error('[Invite API] Profile creation fallback error:', profileError)
          return NextResponse.json({
            success: false,
            error: `Invite failed: ${error.message}. Check Supabase email settings.`,
          }, { status: 400 })
        }

        return NextResponse.json({
          success: true,
          message: `User profile created for ${email}. Email invite failed - they will need to sign up separately.`,
          note: 'Email invitation failed - profile created only. Check Supabase email configuration.',
          emailSent: false,
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
            company_id: company_id || null,
            is_internal: is_internal || false,
          })

        if (profileError) {
          console.error('[Invite API] Profile creation error:', profileError)
        }
      }

      // Send branded invite email via Resend (in addition to Supabase's email)
      if (isEmailConfigured()) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

        // Get inviter's name
        let inviterName: string | undefined
        const supabase = createClient()
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        if (currentUser) {
          const { data: inviterProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', currentUser.id)
            .single()
          inviterName = inviterProfile?.full_name || undefined
        }

        // Get company name if applicable
        let companyName: string | undefined
        if (company_id) {
          const { data: company } = await supabase
            .from('companies')
            .select('name')
            .eq('id', company_id)
            .single()
          companyName = company?.name || undefined
        }

        await sendInviteEmail({
          recipientName: name,
          recipientEmail: email,
          inviterName,
          role: role || 'developer',
          companyName,
          inviteLink: `${appUrl}/login?email=${encodeURIComponent(email)}`,
        })
      }

      return NextResponse.json({
        success: true,
        message: `Invitation email sent to ${email}`,
        emailSent: true,
        user: data.user,
      })
    } catch (adminError: any) {
      console.error('[Invite API] Admin client error:', adminError)

      // Check if it's a configuration error
      if (adminError.message?.includes('Missing Supabase')) {
        return NextResponse.json({
          success: false,
          error: 'Supabase admin credentials are missing. Please add SUPABASE_SERVICE_ROLE_KEY to your environment variables.',
        }, { status: 500 })
      }

      return NextResponse.json({
        success: false,
        error: `Failed to send invitation: ${adminError.message || 'Unknown error'}`,
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('[Invite API] Server error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error',
    }, { status: 500 })
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

    // For demo mode, use admin client to bypass RLS
    if (!currentUser) {
      // Check for demo mode via query param or header
      const url = new URL(request.url)
      const demoMode = url.searchParams.get('demo') === 'true'

      if (demoMode && isServiceRoleConfigured()) {
        // Use admin client to bypass RLS for demo mode
        const adminClient = createAdminClient()
        const { data: users, error } = await adminClient
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) {
          console.error('[Users API] Admin fetch error:', error)
          return NextResponse.json({ users: [] })
        }

        return NextResponse.json({ users: users || [] })
      }

      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if current user is admin or super_admin
    let userRole = null

    // Try profiles table first
    const { data: profileData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', currentUser.id)
      .single()

    if (profileData) {
      userRole = profileData.role
    } else {
      // Fallback to user_profiles table
      const { data: userProfileData } = await supabase
        .from('user_profiles')
        .select('user_type')
        .eq('id', currentUser.id)
        .single()

      if (userProfileData) {
        userRole = userProfileData.user_type
      }
    }

    // Allow admin, super_admin, or specific emails
    const allowedEmails = ['kofi@millionpound.homes', 'kofi@naybourhood.ai']
    const isAdmin = userRole === 'admin' ||
                    userRole === 'super_admin' ||
                    allowedEmails.includes(currentUser.email || '')

    if (!isAdmin) {
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
