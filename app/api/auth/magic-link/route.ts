import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendMagicLinkEmail, isEmailConfigured } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    console.log('[Magic Link API] 📧 Generating cross-browser magic link for:', email)

    const supabaseAdmin = createAdminClient()

    // Generate a magic link using the admin API
    // This creates a token_hash based link that works cross-browser (no PKCE)
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://naybourhood-ai.vercel.app'}/auth/callback`,
      },
    })

    if (error) {
      console.error('[Magic Link API] ❌ Error generating link:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // The action_link contains the full magic link URL with token_hash
    const magicLink = data.properties?.action_link

    console.log('[Magic Link API] ✅ Link generated:', {
      hasActionLink: !!magicLink,
      linkPreview: magicLink ? magicLink.substring(0, 80) + '...' : 'missing',
      // The link should contain token_hash parameter, not code
      containsTokenHash: magicLink?.includes('token_hash'),
      containsCode: magicLink?.includes('code='),
    })

    if (!magicLink) {
      console.error('[Magic Link API] ❌ No action_link in response')
      return NextResponse.json({ error: 'Failed to generate magic link' }, { status: 500 })
    }

    // Extract name from email for personalization
    const recipientName = email.split('@')[0].replace(/[._-]/g, ' ')

    // Send the magic link via our email service
    if (isEmailConfigured()) {
      console.log('[Magic Link API] 📤 Sending email via Resend...')
      const emailResult = await sendMagicLinkEmail(email, {
        recipientName,
        magicLink,
      })

      if (!emailResult.success) {
        console.error('[Magic Link API] ❌ Email sending failed:', emailResult.error)
        return NextResponse.json({ 
          error: 'Failed to send email. Please try again.' 
        }, { status: 500 })
      }

      console.log('[Magic Link API] ✅ Email sent:', emailResult.messageId)
    } else {
      console.log('[Magic Link API] ⚠️ Email not configured, logging link instead')
      console.log('[Magic Link API] 🔗 Magic Link:', magicLink)
    }

    return NextResponse.json({ 
      success: true,
      message: 'Magic link sent! Check your email.',
    })

  } catch (error) {
    console.error('[Magic Link API] ❌ Unexpected error:', error)
    return NextResponse.json({ error: 'Failed to send magic link' }, { status: 500 })
  }
}
