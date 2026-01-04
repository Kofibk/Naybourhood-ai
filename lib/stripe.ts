import Stripe from 'stripe'
import { SUBSCRIPTION_TIERS, type SubscriptionTier } from './subscriptionTiers'

// Server-side Stripe client
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
})

// Create a checkout session for subscription
export async function createCheckoutSession({
  priceId,
  customerId,
  successUrl,
  cancelUrl,
}: {
  priceId: string
  customerId?: string
  successUrl: string
  cancelUrl: string
}) {
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    customer: customerId,
    success_url: successUrl,
    cancel_url: cancelUrl,
  })

  return session
}

// Create a customer portal session
export async function createPortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string
  returnUrl: string
}) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })

  return session
}

// Get subscription by customer ID
export async function getSubscription(customerId: string) {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'active',
    limit: 1,
  })

  return subscriptions.data[0] || null
}

// Cancel subscription
export async function cancelSubscription(subscriptionId: string) {
  const subscription = await stripe.subscriptions.cancel(subscriptionId)
  return subscription
}

// Get tier from price ID
export function getTierFromPriceId(priceId: string): SubscriptionTier | null {
  for (const [tierId, tier] of Object.entries(SUBSCRIPTION_TIERS)) {
    if (tier.stripePriceId === priceId) {
      return tierId as SubscriptionTier
    }
  }
  return null
}

// Create Stripe customer
export async function createCustomer({
  email,
  name,
  metadata,
}: {
  email: string
  name?: string
  metadata?: Record<string, string>
}) {
  const customer = await stripe.customers.create({
    email,
    name,
    metadata,
  })

  return customer
}

// Get Stripe customer by email
export async function getCustomerByEmail(email: string) {
  const customers = await stripe.customers.list({
    email,
    limit: 1,
  })

  return customers.data[0] || null
}

// Webhook event types we handle
export type StripeWebhookEvent =
  | 'checkout.session.completed'
  | 'customer.subscription.created'
  | 'customer.subscription.updated'
  | 'customer.subscription.deleted'
  | 'invoice.payment_succeeded'
  | 'invoice.payment_failed'

// Verify webhook signature
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
) {
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret)
}
