import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { scoreLead } from '@/lib/scoring'
import { normalizeLead } from '@/lib/lead-normalizer'

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

    // Require authentication
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Verify user is admin or super_admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

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
        // Use the normalizer to ensure consistent data format
        // This handles: field name mapping, status normalization, date parsing, etc.
        const mappedLead: any = normalizeLead(lead)

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
