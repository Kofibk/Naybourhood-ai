import { NextRequest, NextResponse } from 'next/server'
import { createPortalSession, getCustomerByEmail } from '@/lib/stripe'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Authentication check - billing is super_admin only
    if (isSupabaseConfigured()) {
      const supabase = createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }

      // Check if user is super_admin (billing access)
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'super_admin') {
        return NextResponse.json(
          { error: 'Only Super Admins can access billing' },
          { status: 403 }
        )
      }
    }

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
