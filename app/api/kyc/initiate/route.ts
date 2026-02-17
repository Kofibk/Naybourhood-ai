import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { isEffectiveAdmin } from '@/lib/auth'

function getSupabaseClient() {
  try {
    return createAdminClient()
  } catch {
    return createClient()
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const authClient = createClient()
    const { data: { user }, error: authError } = await authClient.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get user profile for company scoping
    const { data: userProfile } = await authClient
      .from('user_profiles')
      .select('company_id, is_internal_team')
      .eq('id', user.id)
      .single()

    const { buyerId, checkType = 'both' } = await request.json()

    if (!buyerId) {
      return NextResponse.json({ error: 'Buyer ID required' }, { status: 400 })
    }

    if (!['aml', 'kyc', 'both'].includes(checkType)) {
      return NextResponse.json({ error: 'Invalid check type' }, { status: 400 })
    }

    // Check if Checkboard API key is configured
    const checkboardApiKey = process.env.CHECKBOARD_API_KEY
    if (!checkboardApiKey) {
      // Return not available - UI will show "Coming Soon"
      return NextResponse.json({ available: false, status: 'not_available' })
    }

    const supabase = getSupabaseClient()

    // Verify buyer exists and belongs to user's company
    let buyerQuery = supabase
      .from('buyers')
      .select('id, full_name, first_name, last_name, email, phone, country, company_id')
      .eq('id', buyerId)

    // Non-admin users can only access their own company's buyers
    if (!isEffectiveAdmin(user.email, userProfile) && userProfile?.company_id) {
      buyerQuery = buyerQuery.eq('company_id', userProfile.company_id)
    }

    const { data: buyer, error: buyerError } = await buyerQuery.single()

    if (buyerError || !buyer) {
      return NextResponse.json({ error: 'Buyer not found' }, { status: 404 })
    }

    // Check for existing pending check
    const { data: existingCheck } = await supabase
      .from('kyc_checks')
      .select('id, status')
      .eq('buyer_id', buyerId)
      .eq('status', 'pending')
      .range(0, 0)

    if (existingCheck && existingCheck.length > 0) {
      return NextResponse.json({
        available: true,
        status: 'pending',
        message: 'A verification check is already in progress',
        checkId: existingCheck[0].id,
      })
    }

    // Call Checkboard API
    const buyerName = buyer.full_name || `${buyer.first_name || ''} ${buyer.last_name || ''}`.trim()

    const checkboardPayload = {
      reference: `nb-${buyerId}-${Date.now()}`,
      check_type: checkType,
      subject: {
        full_name: buyerName,
        email: buyer.email,
        phone: buyer.phone,
        country: buyer.country || 'GB',
      },
      webhook_url: `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/kyc/webhook`,
    }

    let checkboardReference: string | null = null

    try {
      const checkboardResponse = await fetch('https://api.checkboard.com/v1/checks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${checkboardApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(checkboardPayload),
      })

      if (checkboardResponse.ok) {
        const checkboardData = await checkboardResponse.json()
        checkboardReference = checkboardData.id || checkboardData.reference || checkboardPayload.reference
      } else {
        console.error('[KYC] Checkboard API error:', checkboardResponse.status)
        // Still create the check record with pending status for retry
        checkboardReference = checkboardPayload.reference
      }
    } catch (apiError) {
      console.error('[KYC] Checkboard API call failed:', apiError)
      checkboardReference = checkboardPayload.reference
    }

    // Use already-authenticated user for initiated_by
    const initiatedBy = user.id

    // Insert kyc_checks record
    const { data: kycCheck, error: insertError } = await supabase
      .from('kyc_checks')
      .insert({
        buyer_id: buyerId,
        check_type: checkType,
        status: 'pending',
        checkboard_reference: checkboardReference,
        initiated_by: initiatedBy,
      })
      .select('id, buyer_id, check_type, status, checkboard_reference, created_at')
      .single()

    if (insertError) {
      console.error('[KYC] Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to create verification record' }, { status: 500 })
    }

    return NextResponse.json({
      available: true,
      status: 'pending',
      check: kycCheck,
    })
  } catch (error) {
    console.error('[KYC] Initiate error:', error)
    return NextResponse.json({ error: 'Failed to initiate verification' }, { status: 500 })
  }
}
