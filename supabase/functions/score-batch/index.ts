/**
 * Naybourhood Scoring API - Batch Score Endpoint
 *
 * POST /v1/score/batch - Score multiple leads (max 100)
 *
 * Requires Bearer token authentication.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  validateApiKey,
  logRequest,
  corsHeaders,
  errorResponse,
  successResponse,
} from '../_shared/auth.ts';
import { scoreLead, scoringResultToDbRow } from '../_shared/scoring.ts';
import type {
  BatchScoreRequest,
  BatchScoreResponse,
  ScoreResponse,
  BatchError,
  MAX_BATCH_SIZE,
} from '../_shared/types.ts';

const MAX_BATCH = 100;

function getSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}

Deno.serve(async (req) => {
  const startTime = Date.now();
  let customerId: string | null = null;

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // ══════════════════════════════════════════════════════════════════
    // AUTHENTICATION
    // ══════════════════════════════════════════════════════════════════

    const authHeader = req.headers.get('authorization');
    const authResult = await validateApiKey(authHeader);

    if (!authResult.valid) {
      await logRequest(null, '/v1/score/batch', 'POST', 401, Date.now() - startTime, 'Invalid API key');
      return errorResponse('INVALID_API_KEY', 'The API key provided is invalid or expired', 401);
    }

    customerId = authResult.customer_id!;

    // ══════════════════════════════════════════════════════════════════
    // PARSE REQUEST BODY
    // ══════════════════════════════════════════════════════════════════

    let body: BatchScoreRequest;
    try {
      body = await req.json();
    } catch {
      await logRequest(customerId, '/v1/score/batch', 'POST', 400, Date.now() - startTime, 'Invalid JSON');
      return errorResponse('INVALID_REQUEST', 'Invalid JSON in request body', 400);
    }

    // Validate leads array
    if (!body.leads || !Array.isArray(body.leads)) {
      await logRequest(customerId, '/v1/score/batch', 'POST', 400, Date.now() - startTime, 'Missing leads array');
      return errorResponse('INVALID_REQUEST', 'leads array is required', 400);
    }

    if (body.leads.length === 0) {
      await logRequest(customerId, '/v1/score/batch', 'POST', 400, Date.now() - startTime, 'Empty leads array');
      return errorResponse('INVALID_REQUEST', 'leads array cannot be empty', 400);
    }

    if (body.leads.length > MAX_BATCH) {
      await logRequest(customerId, '/v1/score/batch', 'POST', 400, Date.now() - startTime, 'Batch too large');
      return errorResponse('BATCH_TOO_LARGE', `Maximum batch size is ${MAX_BATCH} leads`, 400);
    }

    // ══════════════════════════════════════════════════════════════════
    // SCORE ALL LEADS
    // ══════════════════════════════════════════════════════════════════

    const results: ScoreResponse[] = [];
    const errors: BatchError[] = [];
    const dbRows: ReturnType<typeof scoringResultToDbRow>[] = [];

    for (const lead of body.leads) {
      try {
        // Validate external_id
        if (!lead.external_id) {
          errors.push({
            external_id: lead.external_id || 'unknown',
            error: 'Missing external_id',
          });
          continue;
        }

        // Score the lead
        const scoreStartTime = Date.now();
        const scoringResult = scoreLead(lead);
        const scoreTimeMs = Date.now() - scoreStartTime;

        // Prepare DB row
        const dbRow = scoringResultToDbRow(lead, scoringResult, customerId, scoreTimeMs);
        dbRows.push(dbRow);

        // Prepare response (ID will be filled after DB insert)
        results.push({
          id: '', // Will be filled after upsert
          external_id: lead.external_id,
          scores: {
            quality_score: scoringResult.quality.total,
            intent_score: scoringResult.intent.total,
            confidence_score: scoringResult.confidence.total,
          },
          classification: scoringResult.classification,
          priority: scoringResult.priority,
          risk_flags: scoringResult.riskFlags,
          next_action: scoringResult.nextAction,
          summary: scoringResult.summary,
          model_version: '1.0',
          scored_at: new Date().toISOString(),
        });
      } catch (err) {
        errors.push({
          external_id: lead.external_id || 'unknown',
          error: String(err),
        });
      }
    }

    // ══════════════════════════════════════════════════════════════════
    // BATCH UPSERT TO DATABASE
    // ══════════════════════════════════════════════════════════════════

    if (dbRows.length > 0) {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('scored_leads')
        .upsert(dbRows, {
          onConflict: 'customer_id,external_id,external_source',
          ignoreDuplicates: false,
        })
        .select();

      if (error) {
        console.error('Database error:', error);
        await logRequest(customerId, '/v1/score/batch', 'POST', 500, Date.now() - startTime, error.message);
        return errorResponse('INTERNAL_ERROR', 'Failed to save scores', 500);
      }

      // Map IDs back to results
      if (data) {
        for (const row of data) {
          const result = results.find((r) => r.external_id === row.external_id);
          if (result) {
            result.id = row.id;
            result.scored_at = row.scored_at;
          }
        }
      }
    }

    // ══════════════════════════════════════════════════════════════════
    // BUILD RESPONSE
    // ══════════════════════════════════════════════════════════════════

    const response: BatchScoreResponse = {
      results,
      processed: results.length,
      errors,
    };

    await logRequest(customerId, '/v1/score/batch', 'POST', 200, Date.now() - startTime);
    return successResponse(response);
  } catch (error) {
    console.error('Batch score endpoint error:', error);
    await logRequest(customerId, '/v1/score/batch', 'POST', 500, Date.now() - startTime, String(error));
    return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred', 500);
  }
});
