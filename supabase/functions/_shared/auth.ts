/**
 * Naybourhood Scoring API - Authentication
 *
 * API key validation using SHA256 hash lookup.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { AuthResult, ErrorCode } from './types.ts';

// ═══════════════════════════════════════════════════════════════════
// SUPABASE CLIENT
// ═══════════════════════════════════════════════════════════════════

function getSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

// ═══════════════════════════════════════════════════════════════════
// SHA256 HASHING
// ═══════════════════════════════════════════════════════════════════

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ═══════════════════════════════════════════════════════════════════
// VALIDATE API KEY
// ═══════════════════════════════════════════════════════════════════

export async function validateApiKey(
  authHeader: string | null
): Promise<AuthResult> {
  // Check header exists
  if (!authHeader) {
    return {
      valid: false,
      error: 'INVALID_API_KEY' as ErrorCode,
    };
  }

  // Extract key from Bearer token
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return {
      valid: false,
      error: 'INVALID_API_KEY' as ErrorCode,
    };
  }

  const apiKey = match[1].trim();

  // Validate key format (nb_live_ prefix)
  if (!apiKey.startsWith('nb_live_')) {
    return {
      valid: false,
      error: 'INVALID_API_KEY' as ErrorCode,
    };
  }

  try {
    const supabase = getSupabaseClient();
    const keyHash = await sha256(apiKey);

    // Look up the key hash
    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .select(
        `
        id,
        customer_id,
        rate_limit_per_minute,
        is_active,
        expires_at,
        api_customers!inner (
          id,
          name,
          tier,
          is_active
        )
      `
      )
      .eq('key_hash', keyHash)
      .single();

    if (keyError || !keyData) {
      return {
        valid: false,
        error: 'INVALID_API_KEY' as ErrorCode,
      };
    }

    // Check if key is active
    if (!keyData.is_active) {
      return {
        valid: false,
        error: 'INVALID_API_KEY' as ErrorCode,
      };
    }

    // Check if key is expired
    if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
      return {
        valid: false,
        error: 'INVALID_API_KEY' as ErrorCode,
      };
    }

    // Check if customer is active
    const customer = keyData.api_customers as {
      id: string;
      name: string;
      tier: string;
      is_active: boolean;
    };
    if (!customer.is_active) {
      return {
        valid: false,
        error: 'INVALID_API_KEY' as ErrorCode,
      };
    }

    // Update last_used_at (fire and forget)
    supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', keyData.id)
      .then(() => {});

    return {
      valid: true,
      customer_id: keyData.customer_id,
      customer_name: customer.name,
      tier: customer.tier,
      rate_limit: keyData.rate_limit_per_minute,
    };
  } catch (error) {
    console.error('Auth error:', error);
    return {
      valid: false,
      error: 'INVALID_API_KEY' as ErrorCode,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════
// LOG REQUEST
// ═══════════════════════════════════════════════════════════════════

export async function logRequest(
  customerId: string | null,
  endpoint: string,
  method: string,
  statusCode: number,
  responseTimeMs: number,
  errorMessage?: string
): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    const requestId = crypto.randomUUID();

    await supabase.from('api_request_log').insert({
      customer_id: customerId,
      endpoint,
      method,
      status_code: statusCode,
      response_time_ms: responseTimeMs,
      error_message: errorMessage,
      request_id: requestId,
    });
  } catch (error) {
    console.error('Failed to log request:', error);
  }
}

// ═══════════════════════════════════════════════════════════════════
// CORS HEADERS
// ═══════════════════════════════════════════════════════════════════

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

// ═══════════════════════════════════════════════════════════════════
// ERROR RESPONSE HELPER
// ═══════════════════════════════════════════════════════════════════

export function errorResponse(
  code: ErrorCode,
  message: string,
  status: number = 400
): Response {
  return new Response(
    JSON.stringify({
      error: {
        code,
        message,
      },
    }),
    {
      status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    }
  );
}

// ═══════════════════════════════════════════════════════════════════
// SUCCESS RESPONSE HELPER
// ═══════════════════════════════════════════════════════════════════

export function successResponse(data: unknown, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}
