import { NextRequest, NextResponse } from 'next/server'
import { createPortalSession, getCustomerByEmail } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const customer = await getCustomerByEmail(email)

    if (!customer) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      )
    }

    const session = await createPortalSession({
      customerId: customer.id,
      returnUrl: `${request.headers.get('origin')}/billing`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Portal error:', error)
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    )
  }
}
