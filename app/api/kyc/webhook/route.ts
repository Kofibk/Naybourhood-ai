import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// Checkboard webhook - receives verification results
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate webhook payload
    const reference = body.reference || body.check_id || body.id
    if (!reference) {
      return NextResponse.json({ error: 'Missing reference' }, { status: 400 })
    }

    // Use admin client to bypass RLS for webhook processing
    let supabase
    try {
      supabase = createAdminClient()
    } catch {
      console.error('[KYC Webhook] Admin client not available')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // Find the KYC check by reference
    const { data: kycCheck, error: findError } = await supabase
      .from('kyc_checks')
      .select('id, buyer_id, status')
      .eq('checkboard_reference', reference)
      .single()

    if (findError || !kycCheck) {
      console.error('[KYC Webhook] Check not found for reference:', reference)
      return NextResponse.json({ error: 'Check not found' }, { status: 404 })
    }

    // Map Checkboard status to our status
    const checkboardStatus = (body.status || body.result || '').toLowerCase()
    let newStatus: string
    if (checkboardStatus === 'passed' || checkboardStatus === 'clear' || checkboardStatus === 'approved') {
      newStatus = 'passed'
    } else if (checkboardStatus === 'failed' || checkboardStatus === 'rejected' || checkboardStatus === 'declined') {
      newStatus = 'failed'
    } else if (checkboardStatus === 'review' || checkboardStatus === 'refer' || checkboardStatus === 'pending_review') {
      newStatus = 'review'
    } else {
      newStatus = 'review' // Default uncertain results to review
    }

    // Update the KYC check record
    const { error: updateKycError } = await supabase
      .from('kyc_checks')
      .update({
        status: newStatus,
        result_data: body,
        completed_at: new Date().toISOString(),
      })
      .eq('id', kycCheck.id)

    if (updateKycError) {
      console.error('[KYC Webhook] Update error:', updateKycError)
      return NextResponse.json({ error: 'Failed to update check' }, { status: 500 })
    }

    // Update buyer scoring based on verification result
    const buyerId = kycCheck.buyer_id

    if (newStatus === 'passed') {
      // Passed: confidence +10
      const { data: buyer } = await supabase
        .from('buyers')
        .select('ai_confidence, ai_risk_flags, ai_recommendations')
        .eq('id', buyerId)
        .single()

      if (buyer) {
        const currentConfidence = buyer.ai_confidence ?? 0
        const newConfidence = Math.min(10, currentConfidence + 1) // ai_confidence is 0-10 scale
        const currentFlags = Array.isArray(buyer.ai_risk_flags) ? buyer.ai_risk_flags : []
        const updatedFlags = currentFlags.filter(
          (f: string) => !f.toLowerCase().includes('verification') && !f.toLowerCase().includes('kyc')
        )
        const currentRecs = Array.isArray(buyer.ai_recommendations) ? buyer.ai_recommendations : []
        const updatedRecs = currentRecs.filter(
          (r: string) => !r.toLowerCase().includes('verification') && !r.toLowerCase().includes('kyc')
        )
        updatedRecs.push('Buyer verified - AML/KYC checks passed')

        await supabase
          .from('buyers')
          .update({
            ai_confidence: newConfidence,
            ai_risk_flags: updatedFlags,
            ai_recommendations: updatedRecs.slice(0, 5),
          })
          .eq('id', buyerId)
      }
    } else if (newStatus === 'failed') {
      // Failed: risk flag + confidence -15
      const { data: buyer } = await supabase
        .from('buyers')
        .select('ai_confidence, ai_risk_flags')
        .eq('id', buyerId)
        .single()

      if (buyer) {
        const currentConfidence = buyer.ai_confidence ?? 5
        const newConfidence = Math.max(0, currentConfidence - 1.5) // -15 on 0-100 = -1.5 on 0-10
        const currentFlags = Array.isArray(buyer.ai_risk_flags) ? buyer.ai_risk_flags : []
        const reason = body.failure_reason || body.reason || 'Verification did not pass'
        if (!currentFlags.some((f: string) => f.toLowerCase().includes('kyc failed'))) {
          currentFlags.push(`KYC/AML verification failed: ${reason}`)
        }

        await supabase
          .from('buyers')
          .update({
            ai_confidence: newConfidence,
            ai_risk_flags: currentFlags.slice(0, 5),
          })
          .eq('id', buyerId)
      }
    }

    return NextResponse.json({ success: true, status: newStatus })
  } catch (error) {
    console.error('[KYC Webhook] Error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
