import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { sendInviteEmail, isEmailConfigured } from '@/lib/email'
import {
  isMasterAdmin,
  hasElevatedPermissions,
  getAuthCallbackUrl,
  parseFullName,
  buildDisplayName,
} from '@/lib/auth'

// Force dynamic rendering - this route uses cookies and admin operations
export const dynamic = 'force-dynamic'

// Check if service role key is configured (required for invites)
function isServiceRoleConfigured(): boolean {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  return !!(key && key !== 'your-supabase-service-role-key' && key.length > 20)
}

export async function POST(request: NextRequest) {
  try {
    // Get invitation details from request body
    const body = await request.json()
    const { email, name, role, job_role, company_id, is_internal, inviter_role } = body

    console.log('[Invite API] 📨 Received invite request:', {
      email,
      name,
      role,
      job_role,
      company_id,
      is_internal,
      inviter_role,
      timestamp: new Date().toISOString(),
    })

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

        // Check for master admin email first (bypass all other checks)
        if (hasElevatedPermissions(currentUser.email)) {
          console.log('[Invite API] Elevated admin detected:', currentUser.email)
          isAdmin = true
          canInvite = true
        } else {
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
    }

    // Quick Access / Demo mode: Allow invites when not using Supabase auth
    // Check localStorage-based authentication via inviter_role and inviter_company_id
    if (!canInvite && !isAuthConfigured) {
      // Check for master admin - full access to everything
      const inviterEmail = body.inviter_email
      if (isMasterAdmin(inviterEmail) || body.is_master_admin === true) {
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

      const requestOrigin = new URL(request.url).origin

      // Generate invite link via Supabase Auth (no email sent)
      const redirectUrl = getAuthCallbackUrl(requestOrigin)
      console.log('[Invite API] Generating invite link for:', email, 'with redirect:', redirectUrl, '(origin:', requestOrigin, ')')

      const { data, error } = await adminClient.auth.admin.generateLink({
        type: 'invite',
        email,
        options: {
          redirectTo: redirectUrl,
          data: {
            full_name: name,
            role: role || 'developer',
            company_id: company_id || null,
            is_internal: is_internal || false,
          },
        },
      })

      if (error) {
        console.error('[Invite API] Supabase invite link error:', error.message, error)

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
        const { firstName, lastName } = parseFullName(name)
        // Internal team members skip onboarding
        const fallbackSkipOnboarding = is_internal || false
        
        // Validate role against check constraint
        const validUserTypes = ['developer', 'agent', 'broker', 'admin']
        const safeRole = validUserTypes.includes(role) ? role : 'developer'
        
        // Validate job_role against check constraint  
        const validJobRoles = ['operations', 'marketing', 'sales', 'management', 'other']
        const safeJobRole = job_role && validJobRoles.includes(job_role) ? job_role : null
        
        console.log('[Invite API] 🔄 Fallback profile creation:', {
          role: safeRole,
          job_role: safeJobRole,
          originalRole: role,
          originalJobRole: job_role,
        })
        
        const { error: profileError } = await adminClient
          .from('user_profiles')
          .insert({
            id: crypto.randomUUID(),
            email: email.toLowerCase(),
            first_name: firstName,
            last_name: lastName,
            user_type: safeRole,
            job_role: safeJobRole,
            company_id: company_id || null,
            is_internal_team: is_internal || false,
            membership_status: 'pending',
            onboarding_completed: fallbackSkipOnboarding,
          })

        if (profileError) {
          console.error('[Invite API] Profile creation fallback error:', profileError)
          return NextResponse.json({
            success: false,
            error: `Invite failed: ${error.message}.`,
          }, { status: 400 })
        }

        return NextResponse.json({
          success: true,
          message: `User profile created for ${email}. Email invite failed - they will need to sign up separately.`,
          note: 'Invite link failed - profile created only. User must sign up separately.',
          emailSent: false,
        })
      }

      const inviteLink = data?.properties?.action_link
      console.log('[Invite API] 📧 Supabase generateLink response:', {
        hasUser: !!data?.user,
        userId: data?.user?.id,
        userEmail: data?.user?.email,
        hasProperties: !!data?.properties,
        actionLink: inviteLink ? `${inviteLink.substring(0, 100)}...` : null,
        actionLinkFull: inviteLink, // Full link for debugging
        hashedToken: data?.properties?.hashed_token ? 'present' : 'missing',
        emailOtp: data?.properties?.email_otp ? 'present' : 'missing',
        verificationType: data?.properties?.verification_type,
      })
      
      if (!inviteLink) {
        console.error('[Invite API] ❌ Missing invite link in response:', JSON.stringify(data, null, 2))
        return NextResponse.json({
          success: false,
          error: 'Failed to generate invite link.',
        }, { status: 500 })
      }
      
      // Parse the invite link to understand its format
      try {
        const linkUrl = new URL(inviteLink)
        console.log('[Invite API] 🔗 Invite link structure:', {
          origin: linkUrl.origin,
          pathname: linkUrl.pathname,
          search: linkUrl.search,
          hash: linkUrl.hash ? `${linkUrl.hash.substring(0, 50)}...` : '(none)',
          hasHash: !!linkUrl.hash,
          searchParams: Object.fromEntries(linkUrl.searchParams),
        })
      } catch (e) {
        console.log('[Invite API] ⚠️ Could not parse invite link as URL:', e)
      }

      // =============================================
      // PROFILE CREATION / UPDATE
      // =============================================
      // The database trigger `handle_new_user_profile()` fires when generateLink
      // creates a user in auth.users. The updated trigger now populates basic fields
      // (email, name, user_type, is_internal_team) from user metadata.
      // We still UPDATE the profile to ensure company_id and job_role are set
      // (trigger skips these to avoid FK/constraint issues).
      // =============================================
      
      const { firstName, lastName } = parseFullName(name)
      const skipOnboarding = is_internal || false
      
      // generateLink always returns the user object for new users
      const userId = data.user?.id
      console.log('[Invite API] 🔍 User ID from generateLink:', userId || 'NOT RETURNED')
      console.log('[Invite API] 🔍 User email from generateLink:', data.user?.email)

      if (!userId) {
        console.error('[Invite API] ❌ CRITICAL: generateLink did not return a user ID!')
        console.error('[Invite API] ❌ Full generateLink data:', JSON.stringify(data, null, 2))
      }

      // Validate values against database check constraints
      const validUserTypes = ['developer', 'agent', 'broker', 'admin']
      const safeRole = validUserTypes.includes(role) ? role : 'developer'
      const validJobRoles = ['operations', 'marketing', 'sales', 'management', 'other']
      const safeJobRole = job_role && validJobRoles.includes(job_role) ? job_role : null
      
      // The profile data we want to set
      const profileFields = {
        email: email.toLowerCase(),
        first_name: firstName,
        last_name: lastName,
        user_type: safeRole,
        job_role: safeJobRole,
        company_id: company_id || null,
        is_internal_team: is_internal || false,
        membership_status: 'pending' as const,
        onboarding_completed: skipOnboarding,
      }

      console.log('[Invite API] 📝 Profile data to set:', { userId, ...profileFields })

      // Small delay to ensure the database trigger has completed
      await new Promise(resolve => setTimeout(resolve, 500))

      // Strategy: Try UPDATE first (trigger already created the row), then INSERT as fallback
      let profileCreated = false

      if (userId) {
        // STEP 1: Check if trigger created a profile with this ID
        const { data: triggerProfile, error: checkError } = await adminClient
          .from('user_profiles')
          .select('id, email, first_name, membership_status')
          .eq('id', userId)
          .single()

        console.log('[Invite API] 🔍 Trigger-created profile check (by ID):', {
          found: !!triggerProfile,
          profile: triggerProfile,
          error: checkError?.message,
        })

        if (triggerProfile) {
          // STEP 2a: Profile exists from trigger - UPDATE it with our data
          console.log('[Invite API] 🔄 Updating trigger-created profile with invite data...')
          const { data: updateData, error: updateError } = await adminClient
            .from('user_profiles')
            .update(profileFields)
            .eq('id', userId)
            .select()

          console.log('[Invite API] 📝 Update result:', {
            success: !updateError,
            data: updateData,
            error: updateError ? {
              message: updateError.message,
              code: updateError.code,
              details: updateError.details,
              hint: updateError.hint,
            } : null,
          })

          if (!updateError && updateData && updateData.length > 0) {
            profileCreated = true
            console.log('[Invite API] ✅ Profile updated successfully:', {
              id: updateData[0].id,
              email: updateData[0].email,
              first_name: updateData[0].first_name,
              membership_status: updateData[0].membership_status,
            })
          } else if (updateError) {
            console.error('[Invite API] ❌ Update failed, will try upsert...')
          }
        }

        if (!profileCreated) {
          // STEP 2b: No trigger profile found or update failed - try upsert
          console.log('[Invite API] 🔄 Trying upsert (profile may not exist yet)...')
          const { data: upsertData, error: upsertError } = await adminClient
            .from('user_profiles')
            .upsert({
              id: userId,
              ...profileFields,
            }, {
              onConflict: 'id',
              ignoreDuplicates: false, // We want to UPDATE on conflict, not ignore
            })
            .select()

          console.log('[Invite API] 📝 Upsert result:', {
            success: !upsertError,
            data: upsertData,
            error: upsertError ? {
              message: upsertError.message,
              code: upsertError.code,
              details: upsertError.details,
            } : null,
          })

          if (!upsertError && upsertData && upsertData.length > 0) {
            profileCreated = true
          }
        }
      }

      // STEP 3: If nothing worked above (no userId or all operations failed), try by email
      if (!profileCreated) {
        console.log('[Invite API] ⚠️ Profile not created yet, checking by email...')
        
        // Check if there's already a profile with this email (maybe from a previous invite)
        const { data: emailProfile } = await adminClient
          .from('user_profiles')
          .select('id')
          .eq('email', email.toLowerCase())
          .single()

        if (emailProfile) {
          console.log('[Invite API] 🔄 Found existing profile by email, updating...')
          const { data: updateData, error: updateError } = await adminClient
            .from('user_profiles')
            .update(profileFields)
            .eq('email', email.toLowerCase())
            .select()

          if (!updateError) {
            profileCreated = true
            console.log('[Invite API] ✅ Updated profile by email:', updateData)
          }
        } else {
          // Last resort: insert with a generated UUID
          const fallbackId = userId || crypto.randomUUID()
          console.log('[Invite API] 🔄 No profile found at all, inserting new profile with ID:', fallbackId)
          const { data: insertData, error: insertError } = await adminClient
            .from('user_profiles')
            .insert({
              id: fallbackId,
              ...profileFields,
            })
            .select()

          console.log('[Invite API] 📝 Insert result:', {
            success: !insertError,
            data: insertData,
            error: insertError?.message,
          })

          if (!insertError) {
            profileCreated = true
          }
        }
      }

      // FINAL VERIFICATION: Query the profile to confirm it exists with correct data
      const { data: verifyProfile, error: verifyError } = await adminClient
        .from('user_profiles')
        .select('id, email, first_name, last_name, user_type, membership_status, is_internal_team, company_id, onboarding_completed')
        .or(`id.eq.${userId},email.eq.${email.toLowerCase()}`)
        .limit(1)
        .single()
      
      console.log('[Invite API] ✅ Final verification:', {
        profileCreated,
        found: !!verifyProfile,
        profile: verifyProfile,
        error: verifyError?.message,
        hasNullEmail: verifyProfile && !verifyProfile.email,
        hasNullName: verifyProfile && !verifyProfile.first_name,
      })

      if (verifyProfile && !verifyProfile.email) {
        // Profile exists but email is still null - the update didn't work!
        // Force one more update attempt
        console.error('[Invite API] ⚠️ Profile exists but email is NULL - forcing update...')
        const { error: forceError } = await adminClient
          .from('user_profiles')
          .update(profileFields)
          .eq('id', verifyProfile.id)
        
        if (forceError) {
          console.error('[Invite API] ❌ Force update failed:', forceError.message)
        } else {
          console.log('[Invite API] ✅ Force update succeeded')
        }
      }

      // Send branded invite email via Resend
      if (!isEmailConfigured()) {
        return NextResponse.json({
          success: false,
          error: 'RESEND_API_KEY is not configured. Invite email not sent.',
        }, { status: 500 })
      }

      // Get inviter's name (using centralized helper)
      let inviterName: string | undefined
      const supabase = createClient()
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (currentUser) {
        const { data: inviterProfile } = await supabase
          .from('user_profiles')
          .select('first_name, last_name')
          .eq('id', currentUser.id)
          .single()
        const fullName = buildDisplayName(
          inviterProfile?.first_name,
          inviterProfile?.last_name,
          currentUser.email
        )
        inviterName = fullName !== 'User' ? fullName : undefined
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

      const emailResult = await sendInviteEmail({
        recipientName: name,
        recipientEmail: email,
        inviterName,
        role: role || 'developer',
        companyName,
        inviteLink,
      })

      if (!emailResult.success) {
        return NextResponse.json({
          success: false,
          error: `Failed to send invite email: ${emailResult.error || 'Unknown error'}`,
          profileCreated: !!verifyProfile,
        }, { status: 502 })
      }

      console.log('[Invite API] ✅ Invitation complete:', {
        email: email.toLowerCase(),
        profileCreated: !!verifyProfile,
        profileId: verifyProfile?.id,
        membershipStatus: verifyProfile?.membership_status,
        emailSent: true,
      })

      return NextResponse.json({
        success: true,
        message: `Invitation email sent to ${email}`,
        emailSent: true,
        user: data.user,
        profileCreated: !!verifyProfile,
        profile: verifyProfile ? {
          id: verifyProfile.id,
          email: verifyProfile.email,
          membership_status: verifyProfile.membership_status,
          is_internal_team: verifyProfile.is_internal_team,
        } : null,
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
