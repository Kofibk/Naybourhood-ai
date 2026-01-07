/**
 * Naybourhood Branded Email Templates
 *
 * All auth and transactional emails with consistent branding
 */

// Brand colors
const BRAND = {
  primary: '#6366f1', // Indigo
  primaryDark: '#4f46e5',
  secondary: '#8b5cf6', // Purple
  gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
  text: '#1f2937',
  textLight: '#6b7280',
  background: '#ffffff',
  backgroundAlt: '#f9fafb',
  border: '#e5e7eb',
  success: '#10b981',
  warning: '#f59e0b',
}

// Base email wrapper
function emailWrapper(content: string, previewText?: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Naybourhood</title>
  ${previewText ? `<!--[if !mso]><!--><meta name="x-apple-disable-message-reformatting"><!--<![endif]--><style>@media only screen{.preview-text{display:none!important}}</style><span class="preview-text" style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all">${previewText}</span>` : ''}
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
    .button { display: inline-block; padding: 14px 32px; background: ${BRAND.gradient}; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; }
    .button:hover { opacity: 0.9; }
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; padding: 20px !important; }
      .button { display: block !important; text-align: center !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${BRAND.backgroundAlt};">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: ${BRAND.backgroundAlt};">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" class="container" width="600" cellspacing="0" cellpadding="0" style="background-color: ${BRAND.background}; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: ${BRAND.gradient}; padding: 32px 40px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Naybourhood</h1>
              <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Property Sales Intelligence</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: ${BRAND.backgroundAlt}; border-radius: 0 0 12px 12px; border-top: 1px solid ${BRAND.border};">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0 0 8px 0; color: ${BRAND.textLight}; font-size: 13px;">
                      Naybourhood Ltd · London, UK
                    </p>
                    <p style="margin: 0; color: ${BRAND.textLight}; font-size: 12px;">
                      You're receiving this email because you have an account with Naybourhood.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ═══════════════════════════════════════════════════════════════════
// USER INVITE EMAIL
// ═══════════════════════════════════════════════════════════════════

export interface InviteEmailParams {
  recipientName: string
  recipientEmail: string
  inviterName?: string
  role: string
  companyName?: string
  inviteLink: string
}

export function generateInviteEmail(params: InviteEmailParams): { subject: string; html: string } {
  const { recipientName, inviterName, role, companyName, inviteLink } = params

  const roleDisplay = role === 'super_admin' ? 'Super Admin' :
                      role === 'admin' ? 'Admin' :
                      role.charAt(0).toUpperCase() + role.slice(1)

  const content = `
    <h2 style="margin: 0 0 16px 0; color: ${BRAND.text}; font-size: 24px; font-weight: 600;">
      You're invited to join Naybourhood
    </h2>
    <p style="margin: 0 0 24px 0; color: ${BRAND.textLight}; font-size: 16px; line-height: 1.6;">
      Hi ${recipientName},
    </p>
    <p style="margin: 0 0 24px 0; color: ${BRAND.textLight}; font-size: 16px; line-height: 1.6;">
      ${inviterName ? `${inviterName} has invited you` : "You've been invited"} to join Naybourhood as a <strong style="color: ${BRAND.text};">${roleDisplay}</strong>${companyName ? ` for <strong style="color: ${BRAND.text};">${companyName}</strong>` : ''}.
    </p>

    <div style="background-color: ${BRAND.backgroundAlt}; border-radius: 8px; padding: 20px; margin: 0 0 24px 0;">
      <p style="margin: 0 0 8px 0; color: ${BRAND.textLight}; font-size: 14px;">Your access includes:</p>
      <ul style="margin: 0; padding: 0 0 0 20px; color: ${BRAND.text}; font-size: 14px; line-height: 1.8;">
        <li>Lead management dashboard</li>
        <li>AI-powered lead scoring</li>
        <li>Campaign analytics</li>
        ${role === 'admin' || role === 'super_admin' ? '<li>Team management</li>' : ''}
        ${role === 'super_admin' ? '<li>Billing & subscription</li>' : ''}
      </ul>
    </div>

    <p style="margin: 0 0 32px 0; text-align: center;">
      <a href="${inviteLink}" class="button" style="display: inline-block; padding: 14px 32px; background: ${BRAND.gradient}; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Accept Invitation
      </a>
    </p>

    <p style="margin: 0 0 8px 0; color: ${BRAND.textLight}; font-size: 14px;">
      Or copy and paste this link into your browser:
    </p>
    <p style="margin: 0; color: ${BRAND.primary}; font-size: 13px; word-break: break-all;">
      ${inviteLink}
    </p>

    <hr style="margin: 32px 0; border: none; border-top: 1px solid ${BRAND.border};">

    <p style="margin: 0; color: ${BRAND.textLight}; font-size: 13px;">
      This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.
    </p>
  `

  return {
    subject: `${inviterName || 'Naybourhood'} invited you to join Naybourhood`,
    html: emailWrapper(content, `You've been invited to join Naybourhood as a ${roleDisplay}`)
  }
}

// ═══════════════════════════════════════════════════════════════════
// PASSWORD RESET EMAIL
// ═══════════════════════════════════════════════════════════════════

export interface PasswordResetParams {
  recipientName: string
  resetLink: string
}

export function generatePasswordResetEmail(params: PasswordResetParams): { subject: string; html: string } {
  const { recipientName, resetLink } = params

  const content = `
    <h2 style="margin: 0 0 16px 0; color: ${BRAND.text}; font-size: 24px; font-weight: 600;">
      Reset your password
    </h2>
    <p style="margin: 0 0 24px 0; color: ${BRAND.textLight}; font-size: 16px; line-height: 1.6;">
      Hi ${recipientName},
    </p>
    <p style="margin: 0 0 24px 0; color: ${BRAND.textLight}; font-size: 16px; line-height: 1.6;">
      We received a request to reset your Naybourhood password. Click the button below to choose a new password.
    </p>

    <p style="margin: 0 0 32px 0; text-align: center;">
      <a href="${resetLink}" class="button" style="display: inline-block; padding: 14px 32px; background: ${BRAND.gradient}; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Reset Password
      </a>
    </p>

    <p style="margin: 0 0 8px 0; color: ${BRAND.textLight}; font-size: 14px;">
      Or copy and paste this link into your browser:
    </p>
    <p style="margin: 0 0 24px 0; color: ${BRAND.primary}; font-size: 13px; word-break: break-all;">
      ${resetLink}
    </p>

    <div style="background-color: #fef3c7; border-radius: 8px; padding: 16px; margin: 0 0 24px 0; border-left: 4px solid ${BRAND.warning};">
      <p style="margin: 0; color: #92400e; font-size: 14px;">
        <strong>Security tip:</strong> This link will expire in 1 hour. If you didn't request a password reset, please ignore this email or contact support if you're concerned.
      </p>
    </div>

    <hr style="margin: 32px 0; border: none; border-top: 1px solid ${BRAND.border};">

    <p style="margin: 0; color: ${BRAND.textLight}; font-size: 13px;">
      If you didn't request this password reset, no action is needed. Your password will remain unchanged.
    </p>
  `

  return {
    subject: 'Reset your Naybourhood password',
    html: emailWrapper(content, 'Reset your Naybourhood password')
  }
}

// ═══════════════════════════════════════════════════════════════════
// MAGIC LINK EMAIL
// ═══════════════════════════════════════════════════════════════════

export interface MagicLinkParams {
  recipientName: string
  magicLink: string
}

export function generateMagicLinkEmail(params: MagicLinkParams): { subject: string; html: string } {
  const { recipientName, magicLink } = params

  const content = `
    <h2 style="margin: 0 0 16px 0; color: ${BRAND.text}; font-size: 24px; font-weight: 600;">
      Sign in to Naybourhood
    </h2>
    <p style="margin: 0 0 24px 0; color: ${BRAND.textLight}; font-size: 16px; line-height: 1.6;">
      Hi ${recipientName},
    </p>
    <p style="margin: 0 0 24px 0; color: ${BRAND.textLight}; font-size: 16px; line-height: 1.6;">
      Click the button below to sign in to your Naybourhood account. No password needed!
    </p>

    <p style="margin: 0 0 32px 0; text-align: center;">
      <a href="${magicLink}" class="button" style="display: inline-block; padding: 14px 32px; background: ${BRAND.gradient}; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Sign In to Naybourhood
      </a>
    </p>

    <p style="margin: 0 0 8px 0; color: ${BRAND.textLight}; font-size: 14px;">
      Or copy and paste this link into your browser:
    </p>
    <p style="margin: 0 0 24px 0; color: ${BRAND.primary}; font-size: 13px; word-break: break-all;">
      ${magicLink}
    </p>

    <hr style="margin: 32px 0; border: none; border-top: 1px solid ${BRAND.border};">

    <p style="margin: 0; color: ${BRAND.textLight}; font-size: 13px;">
      This magic link will expire in 1 hour. If you didn't request this, you can safely ignore this email.
    </p>
  `

  return {
    subject: 'Sign in to Naybourhood',
    html: emailWrapper(content, 'Your magic link to sign in to Naybourhood')
  }
}

// ═══════════════════════════════════════════════════════════════════
// WELCOME EMAIL (After signup/onboarding)
// ═══════════════════════════════════════════════════════════════════

export interface WelcomeEmailParams {
  recipientName: string
  role: string
  companyName?: string
  loginLink: string
}

export function generateWelcomeEmail(params: WelcomeEmailParams): { subject: string; html: string } {
  const { recipientName, role, companyName, loginLink } = params

  const roleDisplay = role === 'super_admin' ? 'Super Admin' :
                      role === 'admin' ? 'Admin' :
                      role.charAt(0).toUpperCase() + role.slice(1)

  const content = `
    <h2 style="margin: 0 0 16px 0; color: ${BRAND.text}; font-size: 24px; font-weight: 600;">
      Welcome to Naybourhood! 🎉
    </h2>
    <p style="margin: 0 0 24px 0; color: ${BRAND.textLight}; font-size: 16px; line-height: 1.6;">
      Hi ${recipientName},
    </p>
    <p style="margin: 0 0 24px 0; color: ${BRAND.textLight}; font-size: 16px; line-height: 1.6;">
      Your account is all set up! You're now a <strong style="color: ${BRAND.text};">${roleDisplay}</strong>${companyName ? ` at <strong style="color: ${BRAND.text};">${companyName}</strong>` : ''}.
    </p>

    <div style="background-color: ${BRAND.backgroundAlt}; border-radius: 8px; padding: 24px; margin: 0 0 24px 0;">
      <h3 style="margin: 0 0 16px 0; color: ${BRAND.text}; font-size: 16px; font-weight: 600;">
        Getting started:
      </h3>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="padding: 8px 0;">
            <table role="presentation" cellspacing="0" cellpadding="0">
              <tr>
                <td style="width: 32px; vertical-align: top;">
                  <div style="width: 24px; height: 24px; background: ${BRAND.gradient}; border-radius: 50%; color: #fff; text-align: center; line-height: 24px; font-size: 12px; font-weight: 600;">1</div>
                </td>
                <td style="color: ${BRAND.text}; font-size: 14px; padding-left: 12px;">
                  <strong>Explore your dashboard</strong> - View leads, analytics, and AI insights
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0;">
            <table role="presentation" cellspacing="0" cellpadding="0">
              <tr>
                <td style="width: 32px; vertical-align: top;">
                  <div style="width: 24px; height: 24px; background: ${BRAND.gradient}; border-radius: 50%; color: #fff; text-align: center; line-height: 24px; font-size: 12px; font-weight: 600;">2</div>
                </td>
                <td style="color: ${BRAND.text}; font-size: 14px; padding-left: 12px;">
                  <strong>Import your leads</strong> - Upload CSV or connect integrations
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0;">
            <table role="presentation" cellspacing="0" cellpadding="0">
              <tr>
                <td style="width: 32px; vertical-align: top;">
                  <div style="width: 24px; height: 24px; background: ${BRAND.gradient}; border-radius: 50%; color: #fff; text-align: center; line-height: 24px; font-size: 12px; font-weight: 600;">3</div>
                </td>
                <td style="color: ${BRAND.text}; font-size: 14px; padding-left: 12px;">
                  <strong>Let AI score your leads</strong> - Prioritize hot prospects automatically
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>

    <p style="margin: 0 0 32px 0; text-align: center;">
      <a href="${loginLink}" class="button" style="display: inline-block; padding: 14px 32px; background: ${BRAND.gradient}; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Go to Dashboard
      </a>
    </p>

    <hr style="margin: 32px 0; border: none; border-top: 1px solid ${BRAND.border};">

    <p style="margin: 0; color: ${BRAND.textLight}; font-size: 13px; text-align: center;">
      Need help? Contact us at <a href="mailto:support@naybourhood.ai" style="color: ${BRAND.primary};">support@naybourhood.ai</a>
    </p>
  `

  return {
    subject: 'Welcome to Naybourhood! 🎉',
    html: emailWrapper(content, `Welcome to Naybourhood, ${recipientName}! Your account is ready.`)
  }
}

// ═══════════════════════════════════════════════════════════════════
// EMAIL CONFIRMATION
// ═══════════════════════════════════════════════════════════════════

export interface ConfirmEmailParams {
  recipientName: string
  confirmLink: string
}

export function generateConfirmEmail(params: ConfirmEmailParams): { subject: string; html: string } {
  const { recipientName, confirmLink } = params

  const content = `
    <h2 style="margin: 0 0 16px 0; color: ${BRAND.text}; font-size: 24px; font-weight: 600;">
      Confirm your email address
    </h2>
    <p style="margin: 0 0 24px 0; color: ${BRAND.textLight}; font-size: 16px; line-height: 1.6;">
      Hi ${recipientName},
    </p>
    <p style="margin: 0 0 24px 0; color: ${BRAND.textLight}; font-size: 16px; line-height: 1.6;">
      Thanks for signing up for Naybourhood! Please confirm your email address by clicking the button below.
    </p>

    <p style="margin: 0 0 32px 0; text-align: center;">
      <a href="${confirmLink}" class="button" style="display: inline-block; padding: 14px 32px; background: ${BRAND.gradient}; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Confirm Email Address
      </a>
    </p>

    <p style="margin: 0 0 8px 0; color: ${BRAND.textLight}; font-size: 14px;">
      Or copy and paste this link into your browser:
    </p>
    <p style="margin: 0 0 24px 0; color: ${BRAND.primary}; font-size: 13px; word-break: break-all;">
      ${confirmLink}
    </p>

    <hr style="margin: 32px 0; border: none; border-top: 1px solid ${BRAND.border};">

    <p style="margin: 0; color: ${BRAND.textLight}; font-size: 13px;">
      If you didn't create an account with Naybourhood, you can safely ignore this email.
    </p>
  `

  return {
    subject: 'Confirm your Naybourhood email',
    html: emailWrapper(content, 'Please confirm your email address to get started with Naybourhood')
  }
}
