/**
 * Naybourhood Scoring API - Get Score Endpoint
 *
 * GET /v1/score/{external_id}?source=salesforce
 *
 * Requires Bearer token authentication.
 * Retrieves an existing score by external_id.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  validateApiKey,
  logRequest,
  corsHeaders,
  errorResponse,
  successResponse,
} from '../_shared/auth.ts';
import type { ScoreResponse } from '../_shared/types.ts';

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

  // Only allow GET
  if (req.method !== 'GET') {
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
      await logRequest(null, '/v1/score/{id}', 'GET', 401, Date.now() - startTime, 'Invalid API key');
      return errorResponse('INVALID_API_KEY', 'The API key provided is invalid or expired', 401);
    }

    customerId = authResult.customer_id!;

    // ══════════════════════════════════════════════════════════════════
    // PARSE URL PARAMETERS
    // ══════════════════════════════════════════════════════════════════

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);

    // Expected path: /score-get/{external_id} or similar
    // The external_id is passed as the last path segment
    const externalId = pathParts[pathParts.length - 1];

    if (!externalId || externalId === 'score-get') {
      await logRequest(customerId, '/v1/score/{id}', 'GET', 400, Date.now() - startTime, 'Missing external_id');
      return errorResponse('MISSING_EXTERNAL_ID', 'external_id is required in URL path', 400);
    }

    // Get source from query params (defaults to 'api')
    const source = url.searchParams.get('source') || 'api';

    // ══════════════════════════════════════════════════════════════════
    // FETCH FROM DATABASE
    // ══════════════════════════════════════════════════════════════════

    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('scored_leads')
      .select('*')
      .eq('customer_id', customerId)
      .eq('external_id', externalId)
      .eq('external_source', source)
      .single();

    if (error || !data) {
      await logRequest(customerId, '/v1/score/{id}', 'GET', 404, Date.now() - startTime, 'Lead not found');
      return errorResponse('LEAD_NOT_FOUND', `No score found for external_id: ${externalId}`, 404);
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

    await logRequest(customerId, '/v1/score/{id}', 'GET', 200, Date.now() - startTime);
    return successResponse(response);
  } catch (error) {
    console.error('Score get endpoint error:', error);
    await logRequest(customerId, '/v1/score/{id}', 'GET', 500, Date.now() - startTime, String(error));
    return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred', 500);
  }
});
