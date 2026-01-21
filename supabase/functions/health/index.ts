/**
 * Naybourhood Scoring API - Health Check Endpoint
 *
 * GET /v1/health
 *
 * No authentication required.
 * Returns API status and version.
 */

import { corsHeaders, successResponse } from '../_shared/auth.ts';
import { API_VERSION } from '../_shared/types.ts';

Deno.serve(async (req) => {
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

  return successResponse({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: API_VERSION,
  });
});
