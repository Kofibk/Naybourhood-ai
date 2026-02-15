/**
 * Centralized Auth Configuration
 *
 * Single source of truth for all auth-related constants and helpers.
 * This file consolidates scattered auth logic from across the codebase.
 */

// ============================================================================
// MASTER ADMIN CONFIGURATION
// ============================================================================

/**
 * Master admin emails - these users have full access to all companies and features
 */
export const MASTER_ADMIN_EMAILS = [
  'kofi@naybourhood.ai',
] as const

/**
 * Additional admin emails that get elevated permissions
 */
export const ELEVATED_ADMIN_EMAILS = [
  'kofi@millionpound.homes',
] as const

/**
 * Internal team email domain - users with this domain get internal team access
 */
export const INTERNAL_TEAM_DOMAIN = '@naybourhood.ai'

/**
 * Check if email belongs to a master admin
 */
export function isMasterAdmin(email: string | null | undefined): boolean {
  if (!email) return false
  const normalizedEmail = email.toLowerCase().trim()
  return MASTER_ADMIN_EMAILS.includes(normalizedEmail as typeof MASTER_ADMIN_EMAILS[number])
}

/**
 * Check if email has elevated admin permissions
 */
export function hasElevatedPermissions(email: string | null | undefined): boolean {
  if (!email) return false
  const normalizedEmail = email.toLowerCase().trim()
  return (
    isMasterAdmin(normalizedEmail) ||
    ELEVATED_ADMIN_EMAILS.includes(normalizedEmail as typeof ELEVATED_ADMIN_EMAILS[number])
  )
}

/**
 * Check if email belongs to internal Naybourhood team
 */
export function isInternalTeamEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return email.toLowerCase().trim().endsWith(INTERNAL_TEAM_DOMAIN)
}

/**
 * Check if user should have full system access (master admin or internal team)
 */
export function hasFullAccess(email: string | null | undefined, isInternalTeam?: boolean): boolean {
  if (isInternalTeam) return true
  if (!email) return false
  return isMasterAdmin(email) || isInternalTeamEmail(email)
}

// ============================================================================
// URL CONFIGURATION
// ============================================================================

/**
 * Get the application base URL
 * Priority:
 * 1. NEXT_PUBLIC_APP_URL environment variable
 * 2. Request origin (passed in)
 * 3. Window origin (client-side)
 * 4. Default based on environment
 */
export function getAppUrl(requestOrigin?: string): string {
  // Server-side: use env var or request origin
  if (typeof window === 'undefined') {
    if (process.env.NEXT_PUBLIC_APP_URL) {
      return process.env.NEXT_PUBLIC_APP_URL
    }
    if (requestOrigin) {
      // Don't use localhost in production
      if (!requestOrigin.includes('localhost')) {
        return requestOrigin
      }
    }
    // Fallback for local development
    return process.env.NODE_ENV === 'production'
      ? 'https://naybourhood.ai'
      : 'http://localhost:3000'
  }

  // Client-side: use env var or window origin
  return process.env.NEXT_PUBLIC_APP_URL || window.location.origin
}

/**
 * Get the auth callback URL
 */
export function getAuthCallbackUrl(requestOrigin?: string): string {
  return `${getAppUrl(requestOrigin)}/auth/callback`
}

/**
 * Get the login URL
 */
export function getLoginUrl(requestOrigin?: string): string {
  return `${getAppUrl(requestOrigin)}/login`
}

/**
 * Get the reset password URL
 */
export function getResetPasswordUrl(requestOrigin?: string): string {
  return `${getAppUrl(requestOrigin)}/reset-password`
}

// ============================================================================
// AUTH CALLBACK ROUTES
// ============================================================================

/**
 * Public routes that don't require authentication
 */
export const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/auth',
  '/onboarding',
  '/signup',
  '/select-plan',
  '/api/auth',
  '/api/billing/stripe-webhook',
  '/api/stripe/webhook',
  '/api/kyc/webhook',
  '/api/v1',
  '/api/waitlist',
] as const

/**
 * Protected route prefixes that require authentication
 */
export const PROTECTED_ROUTES = ['/admin', '/developer', '/agent', '/broker'] as const

/**
 * Get the dashboard path for a given user role
 */
export function getDashboardPathForRole(role: string | null | undefined): string {
  if (!role) return '/developer'

  const paths: Record<string, string> = {
    admin: '/admin',
    super_admin: '/admin',
    developer: '/developer',
    agent: '/agent',
    broker: '/broker',
  }

  return paths[role.toLowerCase()] || '/developer'
}

// ============================================================================
// USER ROLE HELPERS
// ============================================================================

/**
 * Check if a role is an admin role
 */
export function isAdminRole(role: string | null | undefined): boolean {
  if (!role) return false
  return ['admin', 'super_admin'].includes(role.toLowerCase())
}

/**
 * Check if a role can access a specific dashboard
 */
export function canAccessDashboard(
  userRole: string | null | undefined,
  dashboardType: 'admin' | 'developer' | 'agent' | 'broker'
): boolean {
  if (!userRole) return false

  const role = userRole.toLowerCase()

  // Admins can access any dashboard
  if (isAdminRole(role)) return true

  // Other roles can only access their specific dashboard
  return role === dashboardType
}

// ============================================================================
// NAME PARSING HELPERS
// ============================================================================

/**
 * Parse a full name into first and last name
 */
export function parseFullName(fullName: string | null | undefined): {
  firstName: string
  lastName: string
} {
  if (!fullName) {
    return { firstName: '', lastName: '' }
  }

  const trimmed = fullName.trim()
  const parts = trimmed.split(/\s+/)

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' }
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  }
}

/**
 * Build a display name from first and last name or email
 */
export function buildDisplayName(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  email: string | null | undefined
): string {
  if (firstName) {
    return lastName ? `${firstName} ${lastName}`.trim() : firstName
  }
  if (email) {
    return email.split('@')[0]
  }
  return 'User'
}

// ============================================================================
// BILLING ACCESS (for sidebar)
// ============================================================================

/**
 * Emails with billing access
 */
export const BILLING_ACCESS_EMAILS = [
  'kofi@naybourhood.ai',
] as const

/**
 * Check if user has billing access
 */
export function hasBillingAccess(
  email: string | null | undefined,
  permissions?: {
    isInternalTeam?: boolean
    isMasterAdmin?: boolean
    permissions?: { billing?: { canRead?: boolean } }
  }
): boolean {
  // Check explicit billing permission
  if (permissions?.permissions?.billing?.canRead) return true

  // Check internal team / master admin
  if (permissions?.isInternalTeam || permissions?.isMasterAdmin) return true

  // Check email whitelist
  if (email && BILLING_ACCESS_EMAILS.includes(email.toLowerCase() as typeof BILLING_ACCESS_EMAILS[number])) {
    return true
  }

  return false
}
