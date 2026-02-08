/**
 * Stripe configuration helpers.
 *
 * When NEXT_PUBLIC_STRIPE_ENABLED is 'true', the billing system is live.
 * Otherwise the app runs in pre-launch mode:
 *   - Plan cards show pricing but CTAs link to a booking page.
 *   - Billing page shows a placeholder message.
 */

export function isStripeEnabled(): boolean {
  return process.env.NEXT_PUBLIC_STRIPE_ENABLED === 'true'
}

/**
 * Server-side only: check if the secret key is configured.
 * This should never be called from client components.
 */
export function hasStripeSecretKey(): boolean {
  return !!process.env.STRIPE_SECRET_KEY
}
