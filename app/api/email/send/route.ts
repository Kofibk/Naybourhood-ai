import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { EMAIL_TEMPLATES, getTemplatesByStage, STAGES } from '@/lib/templates/messages'

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
          .from('user_profiles')
          .select('first_name, last_name, email')
          .eq('id', user.id)
          .single()

        if (profile?.first_name) {
          senderName = `${profile.first_name} ${profile.last_name || ''}`.trim()
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

// GET endpoint for email templates - grouped by stage
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const stage = searchParams.get('stage')

  // If stage specified, return templates for that stage
  if (stage) {
    const templates = getTemplatesByStage(stage)
    return NextResponse.json({
      stage,
      templates: templates.map(t => ({
        id: t.id,
        name: t.name,
        subject: t.subject || '',
        body: t.body,
        placeholders: t.placeholders,
      }))
    })
  }

  // Return all email templates grouped by stage
  const templatesByStage: Record<string, any[]> = {}

  for (const stageName of STAGES) {
    const stageTemplates = EMAIL_TEMPLATES.filter(t => t.stage === stageName)
    if (stageTemplates.length > 0) {
      templatesByStage[stageName] = stageTemplates.map(t => ({
        id: t.id,
        name: t.name,
        stage: t.stage,
        subject: t.subject || '',
        body: t.body,
        placeholders: t.placeholders,
      }))
    }
  }

  return NextResponse.json({
    stages: STAGES,
    templatesByStage,
    totalTemplates: EMAIL_TEMPLATES.length,
  })
}
