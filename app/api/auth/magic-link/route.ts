import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendMagicLinkEmail, isEmailConfigured } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Get the correct app URL from multiple sources (in order of preference):
    // 1. NEXT_PUBLIC_APP_URL environment variable
    // 2. Request origin header
    // 3. Fallback to production URL
    const requestOrigin = request.headers.get('origin') || request.headers.get('referer')?.split('/').slice(0, 3).join('/')
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || requestOrigin || 'https://naybourhood-ai.vercel.app'
    const correctRedirectUrl = `${appUrl}/auth/callback`
    
    console.log('[Magic Link API] 🌐 URL detection:', {
      envVar: process.env.NEXT_PUBLIC_APP_URL,
      requestOrigin,
      finalAppUrl: appUrl,
    })

    console.log('[Magic Link API] 📧 Generating cross-browser magic link for:', email)
    console.log('[Magic Link API] 🔗 Target redirect URL:', correctRedirectUrl)

    const supabaseAdmin = createAdminClient()

    // Generate a magic link using the admin API
    // This creates a token_hash based link that works cross-browser (no PKCE)
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: {
        redirectTo: correctRedirectUrl,
      },
    })

    if (error) {
      console.error('[Magic Link API] ❌ Error generating link:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // The action_link contains the full magic link URL with token_hash
    let magicLink = data.properties?.action_link

    console.log('[Magic Link API] 📋 Original link from Supabase:', {
      hasActionLink: !!magicLink,
      linkPreview: magicLink ? magicLink.substring(0, 120) + '...' : 'missing',
      containsTokenHash: magicLink?.includes('token_hash'),
      containsCode: magicLink?.includes('code='),
    })

    if (!magicLink) {
      console.error('[Magic Link API] ❌ No action_link in response')
      return NextResponse.json({ error: 'Failed to generate magic link' }, { status: 500 })
    }

    // Fix the redirect URL in the magic link
    // Supabase might use its configured Site URL instead of our redirectTo
    // We need to ensure it points to our correct callback URL
    try {
      const linkUrl = new URL(magicLink)
      const currentRedirect = linkUrl.searchParams.get('redirect_to')
      
      console.log('[Magic Link API] 🔍 Current redirect_to in link:', currentRedirect)
      
      if (currentRedirect !== correctRedirectUrl) {
        console.log('[Magic Link API] 🔧 Fixing redirect URL in magic link')
        linkUrl.searchParams.set('redirect_to', correctRedirectUrl)
        magicLink = linkUrl.toString()
        console.log('[Magic Link API] ✅ Fixed redirect URL to:', correctRedirectUrl)
      }
    } catch (urlError) {
      console.error('[Magic Link API] ⚠️ Could not parse/fix magic link URL:', urlError)
    }

    console.log('[Magic Link API] ✅ Final magic link:', {
      linkPreview: magicLink.substring(0, 120) + '...',
    })

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
