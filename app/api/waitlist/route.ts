import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// POST /api/waitlist — public endpoint, no auth required
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { full_name, email, company, role } = body

    if (!full_name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      )
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    const { error } = await supabase
      .from('waitlist_signups')
      .insert({
        full_name: full_name.trim(),
        email: email.trim().toLowerCase(),
        company: company?.trim() || null,
        role: role?.trim() || null,
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
