import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { scoreLead } from '@/lib/scoring'

// Import leads data directly (works on Vercel)
import leadsData from '@/leads_transformed.json'

/**
 * Import Leads API
 *
 * POST /api/import/leads
 * Body: { mode: 'replace' | 'upsert' | 'append', batchSize?: number }
 *
 * Modes:
 * - replace: Delete all existing leads, insert new ones
 * - upsert: Update existing leads (by email), insert new ones
 * - append: Only insert new leads (skip duplicates)
 */

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication - get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      console.error('Auth error:', authError)
      // Continue anyway for now - the admin layout already protects this page
    }

    // If we have a user, verify they're admin
    if (user) {
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'admin') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
      }
    }

    // Note: In production, uncomment this to require auth:
    // if (!user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const body = await request.json()
    const mode = body.mode || 'upsert'
    const batchSize = body.batchSize || 100
    const skipScoring = body.skipScoring || false

    // Use imported leads data
    const leads = leadsData as any[]

    if (!Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json({ error: 'No leads found in imported data' }, { status: 400 })
    }

    let inserted = 0
    let updated = 0
    let skipped = 0
    let errors: string[] = []

    // If replace mode, delete all existing leads first
    if (mode === 'replace') {
      const { error: deleteError } = await supabase
        .from('buyers')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all (dummy condition)

      if (deleteError) {
        console.error('Delete error:', deleteError)
        errors.push(`Failed to clear existing leads: ${deleteError.message}`)
      }
    }

    // Process leads in batches
    for (let i = 0; i < leads.length; i += batchSize) {
      const batch = leads.slice(i, i + batchSize)

      const processedBatch = batch.map((lead: any) => {
        // Parse date_added - handles formats like "6/1/2026 1:20pm"
        let parsedDate = new Date().toISOString()
        if (lead.date_added) {
          try {
            // Parse UK date format: "6/1/2026 1:20pm" = 6th Jan 2026
            const dateMatch = lead.date_added.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s*(\d{1,2}):(\d{2})(am|pm)?/i)
            if (dateMatch) {
              const [, day, month, year, hours, minutes, ampm] = dateMatch
              let hour = parseInt(hours)
              if (ampm?.toLowerCase() === 'pm' && hour < 12) hour += 12
              if (ampm?.toLowerCase() === 'am' && hour === 12) hour = 0
              parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), hour, parseInt(minutes)).toISOString()
            } else {
              parsedDate = new Date(lead.date_added).toISOString()
            }
          } catch {
            parsedDate = new Date().toISOString()
          }
        }

        // Map JSON fields to actual Supabase column names
        const mappedLead: any = {
          // Name fields
          full_name: lead.full_name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || null,
          first_name: lead.first_name || null,
          last_name: lead.last_name || null,
          // Contact
          email: lead.email || null,
          phone: lead.phone || null,
          country: lead.country || null,
          // Budget
          budget_range: lead.budget_range || null,
          budget_min: lead.budget_min || null,
          budget_max: lead.budget_max || null,
          // Property preferences - map to Supabase column names
          preferred_bedrooms: lead.preferred_bedrooms || null,
          preferred_location: lead.location || lead.area || null,
          // Timeline & Purpose - map to Supabase column names
          timeline_to_purchase: lead.timeline || null,
          purchase_purpose: lead.purpose || null,
          ready_within_28_days: lead.ready_in_28_days || false,
          // Source & Campaign - map to Supabase column names
          source_platform: lead.source || null,
          source_campaign: lead.campaign || null,
          development_name: lead.development || null,
          enquiry_type: lead.enquiry_type || null,
          // Status
          status: lead.status || 'Contact Pending',
          // Financial qualification
          payment_method: lead.payment_method || null,
          proof_of_funds: lead.proof_of_funds || false,
          mortgage_status: lead.mortgage_status || null,
          uk_broker: lead.uk_broker || false,
          uk_solicitor: lead.uk_solicitor || false,
          // Notes & Transcript
          notes: lead.notes || null,
          agent_transcript: lead.transcript || null,
          // Viewing
          viewing_intent_confirmed: lead.viewing_intent_confirmed || false,
          viewing_booked: lead.viewing_booked || false,
          viewing_date: lead.viewing_date || null,
          // Communication flags - map to Supabase column names
          replied: lead.replied || false,
          stop_agent_communication: lead.stop_comms || false,
          connect_to_broker: lead.broker_connected || false,
          // Timestamps
          date_added: parsedDate,
        }

        // Score the lead if not skipping
        if (!skipScoring) {
          try {
            const scoreResult = scoreLead(mappedLead)
            mappedLead.ai_quality_score = scoreResult.qualityScore.total
            mappedLead.ai_intent_score = scoreResult.intentScore.total
            mappedLead.ai_confidence = scoreResult.confidenceScore.total
            mappedLead.ai_classification = scoreResult.classification
            mappedLead.ai_priority = scoreResult.priority.priority
            mappedLead.ai_risk_flags = scoreResult.riskFlags
            mappedLead.ai_scored_at = new Date().toISOString()
          } catch (scoreError) {
            console.error('Scoring error for lead:', lead.email, scoreError)
          }
        }

        return mappedLead
      })

      if (mode === 'upsert') {
        // Upsert by email
        const { data, error } = await supabase
          .from('buyers')
          .upsert(processedBatch, {
            onConflict: 'email',
            ignoreDuplicates: false
          })
          .select('id')

        if (error) {
          console.error('Upsert batch error:', error)
          errors.push(`Batch ${i/batchSize + 1}: ${error.message}`)
        } else {
          // Count as updated/inserted (can't easily distinguish with upsert)
          inserted += processedBatch.length
        }
      } else if (mode === 'append') {
        // Insert only, skip duplicates
        const { data, error } = await supabase
          .from('buyers')
          .insert(processedBatch)
          .select('id')

        if (error) {
          if (error.code === '23505') {
            // Duplicate key - try one by one
            for (const lead of processedBatch) {
              const { error: singleError } = await supabase
                .from('buyers')
                .insert(lead)

              if (singleError?.code === '23505') {
                skipped++
              } else if (singleError) {
                errors.push(`${lead.email}: ${singleError.message}`)
              } else {
                inserted++
              }
            }
          } else {
            errors.push(`Batch ${i/batchSize + 1}: ${error.message}`)
          }
        } else {
          inserted += processedBatch.length
        }
      } else {
        // Replace mode - just insert (already deleted all)
        const { data, error } = await supabase
          .from('buyers')
          .insert(processedBatch)
          .select('id')

        if (error) {
          console.error('Insert batch error:', error)
          errors.push(`Batch ${i/batchSize + 1}: ${error.message}`)
        } else {
          inserted += processedBatch.length
        }
      }
    }

    return NextResponse.json({
      success: true,
      mode,
      totalLeads: leads.length,
      inserted,
      updated,
      skipped,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
      message: `Import complete: ${inserted} leads processed`
    })

  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json({
      error: 'Import failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET - Check import status / preview
export async function GET(request: NextRequest) {
  try {
    // Use imported leads data
    const leads = leadsData as any[]

    // Get current count from Supabase
    const supabase = await createClient()
    const { count } = await supabase
      .from('buyers')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      exists: true,
      fileLeadCount: leads.length,
      currentDbCount: count || 0,
      sampleLead: leads[0],
      fields: Object.keys(leads[0] || {})
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to read file',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
