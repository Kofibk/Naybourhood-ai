/**
 * Naybourhood Email Service
 *
 * Centralized email sending via Resend with branded templates
 */

import { Resend } from 'resend'
import {
  generateInviteEmail,
  generatePasswordResetEmail,
  generateMagicLinkEmail,
  generateWelcomeEmail,
  generateConfirmEmail,
  type InviteEmailParams,
  type PasswordResetParams,
  type MagicLinkParams,
  type WelcomeEmailParams,
  type ConfirmEmailParams,
} from './templates'

// Initialize Resend
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

// Default sender
const DEFAULT_FROM = process.env.EMAIL_FROM || 'Naybourhood <noreply@naybourhood.ai>'

export interface SendEmailResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Check if email service is configured
 */
export function isEmailConfigured(): boolean {
  return !!resend
}

/**
 * Send an email via Resend
 */
async function sendEmail(
  to: string,
  subject: string,
  html: string,
  from: string = DEFAULT_FROM
): Promise<SendEmailResult> {
  if (!resend) {
    console.log('[Email Service] Resend not configured. Email would be sent to:', to)
    console.log('[Email Service] Subject:', subject)
    return {
      success: true,
      messageId: 'dev-mode-' + Date.now(),
      error: 'RESEND_API_KEY not configured - email logged only',
    }
  }

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: [to],
      subject,
      html,
    })

    if (error) {
      console.error('[Email Service] Resend error:', error)
      return { success: false, error: error.message }
    }

    console.log('[Email Service] Email sent successfully:', data?.id)
    return { success: true, messageId: data?.id }
  } catch (err: any) {
    console.error('[Email Service] Exception:', err)
    return { success: false, error: err.message }
  }
}

// ═══════════════════════════════════════════════════════════════════
// EMAIL SENDING FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Send user invite email
 */
export async function sendInviteEmail(params: InviteEmailParams): Promise<SendEmailResult> {
  const { subject, html } = generateInviteEmail(params)
  return sendEmail(params.recipientEmail, subject, html)
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  params: PasswordResetParams
): Promise<SendEmailResult> {
  const { subject, html } = generatePasswordResetEmail(params)
  return sendEmail(email, subject, html)
}

/**
 * Send magic link email
 */
export async function sendMagicLinkEmail(
  email: string,
  params: MagicLinkParams
): Promise<SendEmailResult> {
  const { subject, html } = generateMagicLinkEmail(params)
  return sendEmail(email, subject, html)
}

/**
 * Send welcome email
 */
export async function sendWelcomeEmail(
  email: string,
  params: WelcomeEmailParams
): Promise<SendEmailResult> {
  const { subject, html } = generateWelcomeEmail(params)
  return sendEmail(email, subject, html)
}

/**
 * Send email confirmation email
 */
export async function sendConfirmEmail(
  email: string,
  params: ConfirmEmailParams
): Promise<SendEmailResult> {
  const { subject, html } = generateConfirmEmail(params)
  return sendEmail(email, subject, html)
}

/**
 * Send a custom email with Naybourhood branding
 */
export async function sendCustomEmail(
  to: string,
  subject: string,
  message: string,
  senderName?: string
): Promise<SendEmailResult> {
  // Use the Naybourhood dark monochrome branding
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0d0d0d;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0d0d0d;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #141414; border-radius: 12px; border: 1px solid #2e2e2e;">
          <tr>
            <td style="padding: 32px 40px; text-align: center; border-bottom: 1px solid #2e2e2e;">
              <h1 style="margin: 0; color: #f5f5f5; font-size: 24px; font-weight: 600; letter-spacing: 1px;">NAYBOURHOOD</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0; color: #999999; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">${message}</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px; border-top: 1px solid #2e2e2e; text-align: center;">
              <p style="margin: 0; color: #999999; font-size: 12px;">
                Sent via Naybourhood${senderName ? ` by ${senderName}` : ''}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  return sendEmail(to, subject, html)
}
