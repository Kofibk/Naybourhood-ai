import { NextRequest, NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { sendMagicLinkEmail, isEmailConfigured } from '@/lib/email'

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

    // Send magic link via Supabase
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${appUrl}/auth/callback`,
      },
    })

    if (error) {
      console.error('[Magic Link API] Supabase error:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
      }, { status: 400 })
    }

    // Send branded email via Resend (in addition to Supabase's email)
    if (isEmailConfigured()) {
      await sendMagicLinkEmail(email, {
        recipientName,
        magicLink: `${appUrl}/login?email=${encodeURIComponent(email)}&magic=true`,
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Magic link sent! Check your email to sign in.',
    })

  } catch (error: any) {
    console.error('[Magic Link API] Server error:', error)
    return NextResponse.json({
      success: false,
      error: 'An error occurred. Please try again.',
    }, { status: 500 })
  }
}
