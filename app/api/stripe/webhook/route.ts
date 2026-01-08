import { NextRequest, NextResponse } from 'next/server'
import { constructWebhookEvent, getTierFromPriceId, stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

// Lazy-initialize admin client for webhook operations (avoids build-time errors)
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(url, key)
}

// Helper to update company subscription
async function updateCompanySubscription(
  stripeCustomerId: string,
  updates: {
    subscription_tier?: string | null
    subscription_status?: string
    stripe_subscription_id?: string | null
    next_billing_date?: string | null
  }
) {
  const supabase = getSupabaseAdmin()
  const { error } = await supabase
    .from('companies')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', stripeCustomerId)

  if (error) {
    console.error('Failed to update company subscription:', error)
    throw error
  }
}

// Helper to send payment failure email
async function sendPaymentFailureEmail(customerEmail: string, customerName?: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/email/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: customerEmail,
        subject: 'Payment Failed - Action Required',
        body: `
          <p>Hi ${customerName || 'there'},</p>
          <p>We were unable to process your recent payment for your Naybourhood subscription.</p>
          <p>Please update your payment method to avoid any interruption to your service.</p>
          <p>You can update your payment details by logging into your account and visiting the billing section.</p>
          <p>If you have any questions, please contact our support team.</p>
          <p>Best regards,<br>The Naybourhood Team</p>
        `,
      }),
    })
    if (!response.ok) {
      console.error('Failed to send payment failure email')
    }
  } catch (err) {
    console.error('Error sending payment failure email:', err)
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      )
    }

    let event: Stripe.Event

    try {
      event = constructWebhookEvent(payload, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        console.log('Checkout completed:', session.id)

        // Get subscription details from the session
        if (session.subscription && session.customer) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
          const priceId = subscription.items.data[0]?.price.id
          const tier = priceId ? getTierFromPriceId(priceId) : 'starter'

          await updateCompanySubscription(session.customer as string, {
            subscription_tier: tier,
            subscription_status: 'active',
            stripe_subscription_id: subscription.id,
            next_billing_date: subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000).toISOString().split('T')[0]
              : null,
          })
          console.log('Company subscription activated:', tier)
        }
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const priceId = subscription.items.data[0]?.price.id
        const tier = priceId ? getTierFromPriceId(priceId) : null
        const customerId = subscription.customer as string

        // Map Stripe status to our status
        const statusMap: Record<string, string> = {
          active: 'active',
          trialing: 'trialing',
          past_due: 'past_due',
          canceled: 'cancelled',
          unpaid: 'past_due',
          incomplete: 'none',
          incomplete_expired: 'none',
          paused: 'none',
        }

        await updateCompanySubscription(customerId, {
          subscription_tier: tier,
          subscription_status: statusMap[subscription.status] || 'none',
          stripe_subscription_id: subscription.id,
          next_billing_date: subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000).toISOString().split('T')[0]
            : null,
        })
        console.log('Subscription updated:', subscription.id, 'Tier:', tier, 'Status:', subscription.status)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        console.log('Subscription canceled:', subscription.id)

        // Downgrade to no subscription
        await updateCompanySubscription(customerId, {
          subscription_tier: null,
          subscription_status: 'cancelled',
          stripe_subscription_id: null,
          next_billing_date: null,
        })
        console.log('Company downgraded - subscription cancelled')
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        console.log('Payment succeeded:', invoice.id)

        // Update subscription status to active if it was past_due
        if (invoice.customer) {
          await updateCompanySubscription(invoice.customer as string, {
            subscription_status: 'active',
          })
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        console.log('Payment failed:', invoice.id)

        // Update subscription status to past_due
        if (invoice.customer) {
          await updateCompanySubscription(invoice.customer as string, {
            subscription_status: 'past_due',
          })

          // Send notification email
          if (invoice.customer_email) {
            await sendPaymentFailureEmail(invoice.customer_email, invoice.customer_name || undefined)
          }
        }
        break
      }

      default:
        console.log('Unhandled event type:', event.type)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}
