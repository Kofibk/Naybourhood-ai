import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is configured
    const stripeKey = process.env.STRIPE_SECRET_KEY
    if (!stripeKey) {
      return NextResponse.json({ mode: 'pre_launch' })
    }

    const body = await request.json()
    const { tier } = body

    if (!tier || !['starter', 'growth'].includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid plan tier' },
        { status: 400 }
      )
    }

    // Get the authenticated user
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user profile with company
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('company_id, email, first_name, last_name')
      .eq('id', user.id)
      .single()

    if (!profile?.company_id) {
      return NextResponse.json(
        { error: 'No company found. Complete sign-up first.' },
        { status: 400 }
      )
    }

    // Dynamically import Stripe (only when key is available)
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' })

    // Look up price IDs from env
    const priceId =
      tier === 'starter'
        ? process.env.STRIPE_STARTER_PRICE_ID
        : process.env.STRIPE_GROWTH_PRICE_ID

    if (!priceId) {
      return NextResponse.json(
        { error: `Price not configured for ${tier} plan` },
        { status: 400 }
      )
    }

    // Find or create Stripe customer
    const customerEmail = profile.email || user.email || ''
    const customerName = [profile.first_name, profile.last_name]
      .filter(Boolean)
      .join(' ')

    let customerId: string | undefined

    const existing = await stripe.customers.list({
      email: customerEmail,
      limit: 1,
    })

    if (existing.data.length > 0) {
      customerId = existing.data[0].id
    } else {
      const customer = await stripe.customers.create({
        email: customerEmail,
        name: customerName || undefined,
        metadata: {
          userId: user.id,
          companyId: profile.company_id,
        },
      })
      customerId = customer.id
    }

    // Store the Stripe customer ID on the company
    await supabase
      .from('companies')
      .update({ stripe_customer_id: customerId })
      .eq('id', profile.company_id)

    // Create Checkout Session
    const origin = request.headers.get('origin') || 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/onboarding/setup?checkout=success`,
      cancel_url: `${origin}/select-plan?checkout=cancelled`,
      metadata: {
        userId: user.id,
        companyId: profile.company_id,
        tier,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('[create-checkout] Error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
