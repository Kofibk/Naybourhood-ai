import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { sendInviteEmail, isEmailConfigured } from '@/lib/email'
import { getAuthCallbackUrl, parseFullName, buildDisplayName } from '@/lib/auth'

// Force dynamic rendering - this route uses cookies
export const dynamic = 'force-dynamic'

/**
 * Resend invite link to a user
 * Used when original invite link has expired or been used
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Authentication service not configured' },
        { status: 500 }
      )
    }

    const adminClient = createAdminClient()
    const requestOrigin = new URL(request.url).origin

    // Check if user exists in user_profiles
    const { data: profile, error: profileError } = await adminClient
      .from('user_profiles')
      .select('*')
      .eq('email', email.toLowerCase())
      .single()

    if (profileError || !profile) {
      console.log('[Resend Invite] No profile found for email:', email)
      return NextResponse.json(
        { error: 'No invitation found for this email. Please contact an administrator.' },
        { status: 404 }
      )
    }

    // Check if user has already activated (status is active)
    if (profile.membership_status === 'active' && profile.onboarding_completed) {
      return NextResponse.json(
        { error: 'This account is already active. Please sign in instead.' },
        { status: 400 }
      )
    }

    console.log('[Resend Invite] Generating new invite link for:', email, {
      profileId: profile.id,
      status: profile.membership_status,
      isInternal: profile.is_internal_team,
    })

    // Generate a new invite link
    const redirectUrl = getAuthCallbackUrl(requestOrigin)
    const { data, error } = await adminClient.auth.admin.generateLink({
      type: 'invite',
      email: email.toLowerCase(),
      options: {
        redirectTo: redirectUrl,
        data: {
          full_name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
          role: profile.user_type || 'developer',
          company_id: profile.company_id || null,
          is_internal: profile.is_internal_team || false,
        },
      },
    })

    if (error) {
      console.error('[Resend Invite] Error generating link:', error)
      
      // If user already confirmed, they should just log in
      if (error.message.includes('already confirmed') || error.message.includes('already registered')) {
        return NextResponse.json(
          { error: 'This account is already confirmed. Please sign in using password or magic link.' },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { error: `Failed to generate invite link: ${error.message}` },
        { status: 400 }
      )
    }

    const inviteLink = data?.properties?.action_link
    if (!inviteLink) {
      console.error('[Resend Invite] No invite link in response')
      return NextResponse.json(
        { error: 'Failed to generate invite link' },
        { status: 500 }
      )
    }

    console.log('[Resend Invite] New invite link generated successfully')

    // Send the invite email
    if (!isEmailConfigured()) {
      return NextResponse.json({
        success: true,
        message: 'New invite link generated but email service not configured.',
        note: 'RESEND_API_KEY not set',
      })
    }

    // Get company name if applicable
    let companyName: string | undefined
    if (profile.company_id) {
      const { data: company } = await adminClient
        .from('companies')
        .select('name')
        .eq('id', profile.company_id)
        .single()
      companyName = company?.name || undefined
    }

    const recipientName = buildDisplayName(profile.first_name, profile.last_name, email)
    
    const emailResult = await sendInviteEmail({
      recipientName,
      recipientEmail: email,
      role: profile.user_type || 'developer',
      companyName,
      inviteLink,
    })

    if (!emailResult.success) {
      console.error('[Resend Invite] Failed to send email:', emailResult.error)
      return NextResponse.json({
        success: false,
        error: `Failed to send email: ${emailResult.error}`,
      }, { status: 502 })
    }

    console.log('[Resend Invite] Email sent successfully to:', email)

    return NextResponse.json({
      success: true,
      message: `A new invitation has been sent to ${email}. Please check your inbox.`,
    })

  } catch (error: any) {
    console.error('[Resend Invite] Server error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
