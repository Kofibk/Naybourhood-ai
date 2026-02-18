import { NextRequest, NextResponse } from 'next/server'
import { createCheckoutSession, createCustomer, getCustomerByEmail } from '@/lib/stripe'
import { SUBSCRIPTION_TIERS } from '@/lib/subscriptionTiers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tier, email, userId } = body

    if (!tier || !SUBSCRIPTION_TIERS[tier as keyof typeof SUBSCRIPTION_TIERS]) {
      return NextResponse.json(
        { error: 'Invalid subscription tier' },
        { status: 400 }
      )
    }

    const tierConfig = SUBSCRIPTION_TIERS[tier as keyof typeof SUBSCRIPTION_TIERS]

    if (!tierConfig.stripePriceId) {
      return NextResponse.json(
        { error: 'Stripe not configured for this tier' },
        { status: 400 }
      )
    }

    // Get or create Stripe customer
    let customer = await getCustomerByEmail(email)
    if (!customer) {
      customer = await createCustomer({
        email,
        metadata: { userId },
      })
    }

    // Create checkout session
    const session = await createCheckoutSession({
      priceId: tierConfig.stripePriceId,
      customerId: customer.id,
      successUrl: `${request.headers.get('origin')}/billing?success=true`,
      cancelUrl: `${request.headers.get('origin')}/billing?canceled=true`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
