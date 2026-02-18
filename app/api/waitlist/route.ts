import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.name?.trim() || !body.email?.trim()) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    // Use admin client for public waitlist insertions (no user session available)
    const supabase = createAdminClient()

    // Check for duplicate email
    const { data: existing } = await supabase
      .from('waitlist')
      .select('id')
      .eq('email', body.email.toLowerCase().trim())
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json({
        success: true,
        message: "You're already on the waitlist! We'll be in touch soon.",
      })
    }

    const { error } = await supabase.from('waitlist').insert({
      name: body.name.trim(),
      email: body.email.toLowerCase().trim(),
      phone: body.phone?.trim() || null,
      company: body.company?.trim() || null,
      role: body.role || null,
      monthly_lead_volume: body.monthly_lead_volume || null,
      biggest_challenge: body.biggest_challenge?.trim() || null,
      would_pay: body.would_pay ?? null,
      current_spend: body.current_spend || null,
      referral_source: body.referral_source || null,
    })

    if (error) {
      console.error('[Waitlist] Insert error:', error)
      return NextResponse.json({ error: 'Failed to join waitlist' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Welcome to the waitlist! We'll be in touch soon.",
    })
  } catch (error) {
    console.error('[Waitlist] Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
