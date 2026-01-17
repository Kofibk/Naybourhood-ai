import { NextRequest, NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { sendPasswordResetEmail, isEmailConfigured } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        success: false,
        error: 'Supabase is not configured',
      }, { status: 500 })
    }

    const supabase = createClient()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Get user's name for personalized email
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('first_name, last_name')
      .eq('email', email)
      .single()

    const fullName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : ''
    const recipientName = fullName || email.split('@')[0]

    // Request password reset via Supabase
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${appUrl}/reset-password`,
    })

    if (error) {
      console.error('[Reset Password API] Supabase error:', error)
      // Don't reveal if email exists or not for security
      return NextResponse.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      })
    }

    // Send branded email via Resend (in addition to Supabase's email)
    if (isEmailConfigured()) {
      await sendPasswordResetEmail(email, {
        recipientName,
        resetLink: `${appUrl}/reset-password?email=${encodeURIComponent(email)}`,
      })
    }

    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
    })

  } catch (error: any) {
    console.error('[Reset Password API] Server error:', error)
    return NextResponse.json({
      success: false,
      error: 'An error occurred. Please try again.',
    }, { status: 500 })
  }
}
