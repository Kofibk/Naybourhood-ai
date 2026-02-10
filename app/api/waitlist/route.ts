import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// POST /api/waitlist — public endpoint, no auth required
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      name,
      email,
      phone,
      company,
      role,
      monthly_lead_volume,
      biggest_challenge,
      would_pay,
      current_spend,
      referral_source,
    } = body

    // Validate required fields
    if (!name || !email || !company || !role || !monthly_lead_volume || !biggest_challenge || !would_pay || !current_spend || !referral_source) {
      return NextResponse.json(
        { error: 'Please fill in all required fields.' },
        { status: 400 }
      )
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    const { error } = await supabase
      .from('waitlist_signups')
      .insert({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        company: company.trim(),
        role: role.trim(),
        monthly_lead_volume: monthly_lead_volume.trim(),
        biggest_challenge: biggest_challenge.trim(),
        would_pay: would_pay.trim(),
        current_spend: current_spend.trim(),
        referral_source: referral_source.trim(),
      })

    if (error) {
      // Duplicate email
      if (error.code === '23505') {
        return NextResponse.json({
          success: true,
          message: "You're already on the waitlist! We'll be in touch soon.",
        })
      }
      console.error('[Waitlist API] Insert error:', error)
      return NextResponse.json(
        { error: 'Something went wrong. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "You're on the list! We'll be in touch soon.",
    })
  } catch (error) {
    console.error('[Waitlist API] Server error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
