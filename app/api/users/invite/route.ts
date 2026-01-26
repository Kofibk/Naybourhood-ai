import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { sendInviteEmail, isEmailConfigured } from '@/lib/email'

// Check if service role key is configured (required for invites)
function isServiceRoleConfigured(): boolean {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  return !!(key && key !== 'your-supabase-service-role-key' && key.length > 20)
}

// Master admin email - has full access to all companies
const MASTER_ADMIN_EMAIL = 'kofi@naybourhood.ai'

export async function POST(request: NextRequest) {
  try {
    // Get invitation details from request body
    const body = await request.json()
    const { email, name, role, job_role, company_id, is_internal, inviter_role } = body

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

    // Check authentication - support both Supabase auth and demo/quick-access mode
    let isAdmin = false
    let isCompanyAdmin = false
    let canInvite = false
    let inviterCompanyId: string | null = null
    let isAuthConfigured = false

    if (isSupabaseConfigured()) {
      isAuthConfigured = true
      const supabase = createClient()
      const { data: { user: currentUser } } = await supabase.auth.getUser()

      if (currentUser) {
        // Check if current user is admin, internal team member, or company admin
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('user_type, is_internal_team, is_company_admin, company_id')
          .eq('id', currentUser.id)
          .single()

        // Global admin access: user_type = 'admin' OR is_internal_team = true
        isAdmin = profile?.user_type === 'admin' || profile?.is_internal_team === true
        isCompanyAdmin = profile?.is_company_admin === true
        inviterCompanyId = profile?.company_id || null

        // Determine if user can invite
        if (isAdmin) {
          // Global admins can invite to any company
          canInvite = true
        } else if (isCompanyAdmin && inviterCompanyId) {
          // Company admins can only invite to their own company
          if (company_id === inviterCompanyId) {
            canInvite = true
          }
        } else if (profile?.user_type && inviterCompanyId) {
          // Non-admin can only invite to their own company
          if (company_id === inviterCompanyId) {
            canInvite = true
          }
        }
      }
    }

    // Quick Access / Demo mode: Allow invites when not using Supabase auth
    // Check localStorage-based authentication via inviter_role and inviter_company_id
    if (!canInvite && !isAuthConfigured) {
      // Check for master admin (kofi@naybourhood.ai) - full access to everything
      const inviterEmail = body.inviter_email
      if (inviterEmail === MASTER_ADMIN_EMAIL || body.is_master_admin === true) {
        console.log('[Invite API] Using Master Admin access')
        isAdmin = true
        canInvite = true
      }
      // Trust the inviter_role from the client (Quick Access mode)
      else if (inviter_role === 'admin') {
        console.log('[Invite API] Using Quick Access admin mode')
        isAdmin = true
        canInvite = true
      } else if (inviter_role && body.inviter_company_id) {
        // Non-admin Quick Access users can invite to their own company
        if (company_id === body.inviter_company_id) {
          console.log('[Invite API] Using Quick Access team invite mode')
          canInvite = true
          inviterCompanyId = body.inviter_company_id
        }
      }
    }

    if (!canInvite) {
      // Provide helpful error message
      if (!isAuthConfigured && !inviter_role) {
        return NextResponse.json(
          { error: 'Authentication required. Please log in to invite team members.' },
          { status: 401 }
        )
      }
      if (isCompanyAdmin && company_id !== inviterCompanyId) {
        return NextResponse.json(
          { error: 'You can only invite users to your own company.' },
          { status: 403 }
        )
      }
      if (inviterCompanyId && company_id !== inviterCompanyId) {
        return NextResponse.json(
          { error: 'You can only invite users to your own company.' },
          { status: 403 }
        )
      }
      return NextResponse.json(
        { error: 'You do not have permission to invite users. Please contact an admin.' },
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
          .from('user_profiles')
          .insert({
            id: crypto.randomUUID(),
            email: email,
            full_name: name,
            role: role || 'developer',
            job_role: job_role || null,
            company_id: company_id || null,
            is_internal: is_internal || false,
            status: 'pending',
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

      // Create profile entry for the invited user with 'pending' status
      if (data.user) {
        const { error: profileError } = await adminClient
          .from('user_profiles')
          .upsert({
            id: data.user.id,
            email: email,
            full_name: name,
            role: role || 'developer',
            job_role: job_role || null,
            company_id: company_id || null,
            is_internal: is_internal || false,
            status: 'pending',
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
            .from('user_profiles')
            .select('first_name, last_name')
            .eq('id', currentUser.id)
            .single()
          const fullName = inviterProfile ? `${inviterProfile.first_name || ''} ${inviterProfile.last_name || ''}`.trim() : ''
          inviterName = fullName || undefined
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
          .from('user_profiles')
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

    // Check if current user is admin or internal team member
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_type, is_internal_team')
      .eq('id', currentUser.id)
      .single()

    const isAdmin = profile?.user_type === 'admin' || profile?.is_internal_team === true
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Only admins can view all users' },
        { status: 403 }
      )
    }

    // Get all profiles
    const { data: users, error } = await supabase
      .from('user_profiles')
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
