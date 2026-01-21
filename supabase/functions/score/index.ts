/**
 * Naybourhood Scoring API - Score Endpoint
 *
 * POST /v1/score - Score a single lead
 *
 * Requires Bearer token authentication.
 * Upserts the score result (if external_id exists, updates it).
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
import type { ScoreRequest, ScoreResponse, MODEL_VERSION } from '../_shared/types.ts';

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
      await logRequest(null, '/v1/score', 'POST', 401, Date.now() - startTime, 'Invalid API key');
      return errorResponse('INVALID_API_KEY', 'The API key provided is invalid or expired', 401);
    }

    customerId = authResult.customer_id!;

    // ══════════════════════════════════════════════════════════════════
    // PARSE REQUEST BODY
    // ══════════════════════════════════════════════════════════════════

    let body: ScoreRequest;
    try {
      body = await req.json();
    } catch {
      await logRequest(customerId, '/v1/score', 'POST', 400, Date.now() - startTime, 'Invalid JSON');
      return errorResponse('INVALID_REQUEST', 'Invalid JSON in request body', 400);
    }

    // Validate external_id
    if (!body.external_id) {
      await logRequest(customerId, '/v1/score', 'POST', 400, Date.now() - startTime, 'Missing external_id');
      return errorResponse('MISSING_EXTERNAL_ID', 'external_id is required', 400);
    }

    // ══════════════════════════════════════════════════════════════════
    // SCORE THE LEAD
    // ══════════════════════════════════════════════════════════════════

    const scoreStartTime = Date.now();
    const scoringResult = scoreLead(body);
    const scoreTimeMs = Date.now() - scoreStartTime;

    // ══════════════════════════════════════════════════════════════════
    // UPSERT TO DATABASE
    // ══════════════════════════════════════════════════════════════════

    const supabase = getSupabaseClient();
    const dbRow = scoringResultToDbRow(body, scoringResult, customerId, scoreTimeMs);

    // Upsert based on customer_id + external_id + external_source
    const { data, error } = await supabase
      .from('scored_leads')
      .upsert(dbRow, {
        onConflict: 'customer_id,external_id,external_source',
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      await logRequest(customerId, '/v1/score', 'POST', 500, Date.now() - startTime, error.message);
      return errorResponse('INTERNAL_ERROR', 'Failed to save score', 500);
    }

    // ══════════════════════════════════════════════════════════════════
    // BUILD RESPONSE
    // ══════════════════════════════════════════════════════════════════

    const response: ScoreResponse = {
      id: data.id,
      external_id: data.external_id,
      scores: {
        quality_score: data.quality_score,
        intent_score: data.intent_score,
        confidence_score: data.confidence_score,
      },
      classification: data.classification,
      priority: data.priority,
      risk_flags: data.risk_flags || [],
      next_action: data.next_action,
      summary: data.summary,
      model_version: data.model_version,
      scored_at: data.scored_at,
    };

    await logRequest(customerId, '/v1/score', 'POST', 200, Date.now() - startTime);
    return successResponse(response);
  } catch (error) {
    console.error('Score endpoint error:', error);
    await logRequest(customerId, '/v1/score', 'POST', 500, Date.now() - startTime, String(error));
    return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred', 500);
  }
});
