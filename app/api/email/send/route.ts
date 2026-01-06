import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'

// Initialize Resend if API key exists
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to, subject, message, leadId, templateType } = body

    // Validate required fields
    if (!to || !subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, message' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    // Get sender info from authenticated user
    let senderName = 'Naybourhood Team'
    let senderEmail = process.env.EMAIL_FROM || 'noreply@naybourhood.com'
    let userId: string | null = null

    if (isSupabaseConfigured()) {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        userId = user.id
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', user.id)
          .single()

        if (profile?.full_name) {
          senderName = profile.full_name
        }
      }
    }

    // Prepare email content
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Naybourhood</h1>
        </div>
        <div style="padding: 30px; background: #ffffff;">
          <p style="color: #333; line-height: 1.6; white-space: pre-wrap;">${message}</p>
        </div>
        <div style="background: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
          <p>Sent via Naybourhood Property Platform</p>
          ${senderName !== 'Naybourhood Team' ? `<p>Contact: ${senderName}</p>` : ''}
        </div>
      </div>
    `

    let emailSent = false
    let emailError: string | null = null

    // Send via Resend if configured
    if (resend) {
      try {
        const { data, error } = await resend.emails.send({
          from: `${senderName} <${senderEmail}>`,
          to: [to],
          subject: subject,
          html: htmlContent,
        })

        if (error) {
          console.error('[Email API] Resend error:', error)
          emailError = error.message
        } else {
          emailSent = true
          console.log('[Email API] Email sent successfully:', data?.id)
        }
      } catch (err: any) {
        console.error('[Email API] Resend exception:', err)
        emailError = err.message
      }
    } else {
      // Dev mode - log instead of sending
      console.log('[Email API] Dev mode - Email would be sent:')
      console.log('  To:', to)
      console.log('  Subject:', subject)
      console.log('  Message:', message.substring(0, 100) + '...')
      emailSent = true // Consider dev mode as success for testing
      emailError = 'RESEND_API_KEY not configured - email logged only'
    }

    // Log email to database for tracking
    if (isSupabaseConfigured() && leadId) {
      try {
        const supabase = createClient()

        // Log to email_logs table (create if needed)
        await supabase.from('email_logs').insert({
          lead_id: leadId,
          sender_id: userId,
          recipient_email: to,
          subject: subject,
          body: message,
          template_type: templateType || 'custom',
          status: emailSent ? 'sent' : 'failed',
          error_message: emailError,
          sent_at: new Date().toISOString(),
        })

        // Update lead's last contact timestamp
        await supabase
          .from('buyers')
          .update({
            last_wa_message: `Email sent: ${subject}`,
            updated_at: new Date().toISOString(),
          })
          .eq('id', leadId)

      } catch (logError) {
        console.error('[Email API] Failed to log email:', logError)
        // Don't fail the request if logging fails
      }
    }

    if (!emailSent && emailError && resend) {
      return NextResponse.json({
        success: false,
        error: `Failed to send email: ${emailError}`,
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: emailSent ? 'Email sent successfully' : 'Email logged (dev mode)',
      devMode: !resend,
    })

  } catch (error: any) {
    console.error('[Email API] Server error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error',
    }, { status: 500 })
  }
}

// GET endpoint for email templates
export async function GET() {
  const templates = [
    {
      id: 'introduction',
      name: 'Introduction',
      subject: 'Your Property Search - Naybourhood',
      body: `Hi {{name}},

Thank you for your interest in finding your perfect property. I'm reaching out to help you with your property search.

Based on your requirements, I'd love to discuss some options that might be perfect for you.

Would you be available for a quick call this week?

Best regards`,
    },
    {
      id: 'viewing_invite',
      name: 'Viewing Invitation',
      subject: 'Property Viewing Invitation - {{development}}',
      body: `Hi {{name}},

I'm excited to invite you for a viewing at {{development}}.

This property matches your criteria and I believe you'll love it.

Please let me know your availability and I'll arrange a convenient time for you.

Looking forward to showing you around!

Best regards`,
    },
    {
      id: 'follow_up',
      name: 'Follow Up',
      subject: 'Following Up - Your Property Search',
      body: `Hi {{name}},

I wanted to check in and see how your property search is going.

Have you had any thoughts on the properties we discussed? I'm here to answer any questions you might have.

Feel free to reach out whenever convenient.

Best regards`,
    },
    {
      id: 'documents_request',
      name: 'Documents Request',
      subject: 'Document Request - Next Steps',
      body: `Hi {{name}},

Thank you for your interest in proceeding with the property.

To move forward, we'll need the following documents:
- Proof of funds / Mortgage agreement in principle
- Photo ID
- Proof of address

Please send these at your earliest convenience so we can secure your position.

Best regards`,
    },
  ]

  return NextResponse.json({ templates })
}
