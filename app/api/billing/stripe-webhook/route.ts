import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Disable body parsing - Stripe needs the raw body for signature verification
export const runtime = 'nodejs'

function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error('Missing Supabase admin credentials')
  }

  return createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function POST(request: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!stripeKey || !webhookSecret) {
    return NextResponse.json(
      { error: 'Stripe not configured' },
      { status: 400 }
    )
  }

  try {
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' })

    const payload = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    let event: import('stripe').Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret)
    } catch (err) {
      console.error('[stripe-webhook] Signature verification failed:', err)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    const supabase = getAdminSupabase()

    switch (event.type) {
      // ---- Checkout completed: create subscription record ----
      case 'checkout.session.completed': {
        const session = event.data
          .object as import('stripe').Stripe.Checkout.Session

        const companyId = session.metadata?.companyId
        const tier = session.metadata?.tier
        const customerId =
          typeof session.customer === 'string'
            ? session.customer
            : session.customer?.id
        const subscriptionId =
          typeof session.subscription === 'string'
            ? session.subscription
            : (session.subscription as { id: string } | null)?.id

        if (companyId && tier && subscriptionId) {
          // Fetch subscription from Stripe for period info
          const sub = await stripe.subscriptions.retrieve(subscriptionId)

          const { error } = await supabase.from('subscriptions').upsert(
            {
              company_id: companyId,
              stripe_customer_id: customerId || null,
              stripe_subscription_id: subscriptionId,
              plan_tier: tier,
              status: 'active',
              current_period_start: new Date(
                sub.current_period_start * 1000
              ).toISOString(),
              current_period_end: new Date(
                sub.current_period_end * 1000
              ).toISOString(),
            },
            { onConflict: 'company_id' }
          )

          if (error) {
            console.error('[stripe-webhook] Error upserting subscription:', error)
          }

          // Also update the companies table for backwards compatibility
          await supabase
            .from('companies')
            .update({
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              subscription_tier: tier,
              subscription_status: 'active',
            })
            .eq('id', companyId)
        }

        break
      }

      // ---- Invoice payment failed ----
      case 'invoice.payment_failed': {
        const invoice = event.data.object as import('stripe').Stripe.Invoice
        const customerId =
          typeof invoice.customer === 'string'
            ? invoice.customer
            : invoice.customer?.id

        if (customerId) {
          await supabase
            .from('subscriptions')
            .update({ status: 'past_due' })
            .eq('stripe_customer_id', customerId)

          await supabase
            .from('companies')
            .update({ subscription_status: 'past_due' })
            .eq('stripe_customer_id', customerId)
        }

        break
      }

      // ---- Subscription deleted / cancelled ----
      case 'customer.subscription.deleted': {
        const sub = event.data.object as import('stripe').Stripe.Subscription

        await supabase
          .from('subscriptions')
          .update({ status: 'cancelled' })
          .eq('stripe_subscription_id', sub.id)

        await supabase
          .from('companies')
          .update({ subscription_status: 'cancelled' })
          .eq('stripe_subscription_id', sub.id)

        break
      }

      default:
        console.log('[stripe-webhook] Unhandled event:', event.type)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[stripe-webhook] Error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}
