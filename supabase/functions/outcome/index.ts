/**
 * Naybourhood Scoring API - Outcome Endpoint
 *
 * POST /v1/outcome - Update a lead with its outcome (converted/lost/etc.)
 *
 * Requires Bearer token authentication.
 * Updates the scored_leads record with outcome data.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  validateApiKey,
  logRequest,
  corsHeaders,
  errorResponse,
  successResponse,
} from '../_shared/auth.ts';
import type { OutcomeRequest, OutcomeResponse } from '../_shared/types.ts';

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
      await logRequest(null, '/v1/outcome', 'POST', 401, Date.now() - startTime, 'Invalid API key');
      return errorResponse('INVALID_API_KEY', 'The API key provided is invalid or expired', 401);
    }

    customerId = authResult.customer_id!;

    // ══════════════════════════════════════════════════════════════════
    // PARSE REQUEST BODY
    // ══════════════════════════════════════════════════════════════════

    let body: OutcomeRequest;
    try {
      body = await req.json();
    } catch {
      await logRequest(customerId, '/v1/outcome', 'POST', 400, Date.now() - startTime, 'Invalid JSON');
      return errorResponse('INVALID_REQUEST', 'Invalid JSON in request body', 400);
    }

    // Validate required fields
    if (!body.external_id) {
      await logRequest(customerId, '/v1/outcome', 'POST', 400, Date.now() - startTime, 'Missing external_id');
      return errorResponse('MISSING_EXTERNAL_ID', 'external_id is required', 400);
    }

    if (!body.status) {
      await logRequest(customerId, '/v1/outcome', 'POST', 400, Date.now() - startTime, 'Missing status');
      return errorResponse('INVALID_REQUEST', 'status is required (converted, lost, disqualified, stale)', 400);
    }

    const validStatuses = ['converted', 'lost', 'disqualified', 'stale'];
    if (!validStatuses.includes(body.status)) {
      await logRequest(customerId, '/v1/outcome', 'POST', 400, Date.now() - startTime, 'Invalid status');
      return errorResponse('INVALID_REQUEST', `status must be one of: ${validStatuses.join(', ')}`, 400);
    }

    const source = body.external_source || 'api';

    // ══════════════════════════════════════════════════════════════════
    // FIND AND UPDATE THE LEAD
    // ══════════════════════════════════════════════════════════════════

    const supabase = getSupabaseClient();

    // First, find the lead
    const { data: existingLead, error: findError } = await supabase
      .from('scored_leads')
      .select('id, scored_at')
      .eq('customer_id', customerId)
      .eq('external_id', body.external_id)
      .eq('external_source', source)
      .single();

    if (findError || !existingLead) {
      await logRequest(customerId, '/v1/outcome', 'POST', 404, Date.now() - startTime, 'Lead not found');
      return errorResponse('LEAD_NOT_FOUND', `No score found for external_id: ${body.external_id}`, 404);
    }

    // Calculate days to outcome
    const scoredAt = new Date(existingLead.scored_at);
    const outcomeAt = new Date();
    const daysToOutcome = Math.floor(
      (outcomeAt.getTime() - scoredAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Update the lead with outcome
    const { data: updatedLead, error: updateError } = await supabase
      .from('scored_leads')
      .update({
        outcome_status: body.status,
        outcome_reason: body.reason || null,
        outcome_value: body.value || null,
        outcome_at: outcomeAt.toISOString(),
        days_to_outcome: daysToOutcome,
      })
      .eq('id', existingLead.id)
      .select()
      .single();

    if (updateError) {
      console.error('Database error:', updateError);
      await logRequest(customerId, '/v1/outcome', 'POST', 500, Date.now() - startTime, updateError.message);
      return errorResponse('INTERNAL_ERROR', 'Failed to update outcome', 500);
    }

    // ══════════════════════════════════════════════════════════════════
    // BUILD RESPONSE
    // ══════════════════════════════════════════════════════════════════

    const response: OutcomeResponse = {
      success: true,
      id: updatedLead.id,
      external_id: updatedLead.external_id,
      days_to_outcome: daysToOutcome,
    };

    await logRequest(customerId, '/v1/outcome', 'POST', 200, Date.now() - startTime);
    return successResponse(response);
  } catch (error) {
    console.error('Outcome endpoint error:', error);
    await logRequest(customerId, '/v1/outcome', 'POST', 500, Date.now() - startTime, String(error));
    return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred', 500);
  }
});
