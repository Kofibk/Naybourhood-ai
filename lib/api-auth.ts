import { createHash } from 'crypto'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export interface ApiAuthResult {
  valid: boolean
  status: number
  error?: string
  keyId?: string
  companyId?: string
  permissions?: Record<string, boolean>
  rateLimitRemaining?: number
}

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase admin credentials')
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

function hashKey(key: string): string {
  return createHash('sha256').update(key).digest('hex')
}

/**
 * Validate an API key from a Bearer token.
 * Returns auth result with key details or error status.
 */
export async function validateApiKey(authHeader: string | null): Promise<ApiAuthResult> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      valid: false,
      status: 401,
      error: 'Missing or invalid Authorization header. Use: Bearer <api_key>',
    }
  }

  const token = authHeader.slice(7).trim()

  if (!token || !token.startsWith('nb_live_')) {
    return {
      valid: false,
      status: 401,
      error: 'Invalid API key format. Keys start with nb_live_',
    }
  }

  const keyHash = hashKey(token)

  try {
    const supabase = getAdminClient()

    // Look up the key by hash
    const { data: apiKey, error } = await supabase
      .from('api_keys')
      .select('id, company_id, permissions, rate_limit_per_minute, is_active')
      .eq('key_hash', keyHash)
      .single()

    if (error || !apiKey) {
      return {
        valid: false,
        status: 401,
        error: 'Invalid API key',
      }
    }

    if (!apiKey.is_active) {
      return {
        valid: false,
        status: 401,
        error: 'API key has been revoked',
      }
    }

    // Check rate limit: count requests in the last minute
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString()
    const { count } = await supabase
      .from('api_usage_log')
      .select('id', { count: 'exact', head: true })
      .eq('api_key_id', apiKey.id)
      .gte('created_at', oneMinuteAgo)

    const currentCount = count || 0

    if (currentCount >= apiKey.rate_limit_per_minute) {
      return {
        valid: false,
        status: 429,
        error: `Rate limit exceeded. Limit: ${apiKey.rate_limit_per_minute} requests/minute`,
        keyId: apiKey.id,
        rateLimitRemaining: 0,
      }
    }

    // Update last_used_at
    await supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', apiKey.id)

    return {
      valid: true,
      status: 200,
      keyId: apiKey.id,
      companyId: apiKey.company_id,
      permissions: apiKey.permissions as Record<string, boolean>,
      rateLimitRemaining: apiKey.rate_limit_per_minute - currentCount - 1,
    }
  } catch (error) {
    console.error('[API Auth] Error validating key:', error)
    return {
      valid: false,
      status: 500,
      error: 'Internal authentication error',
    }
  }
}

/**
 * Log an API usage event
 */
export async function logApiUsage(params: {
  apiKeyId: string
  endpoint: string
  method: string
  statusCode: number
  responseTimeMs: number
  requestBodySize?: number
}): Promise<void> {
  try {
    const supabase = getAdminClient()

    await supabase.from('api_usage_log').insert({
      api_key_id: params.apiKeyId,
      endpoint: params.endpoint,
      method: params.method,
      status_code: params.statusCode,
      response_time_ms: params.responseTimeMs,
      request_body_size: params.requestBodySize,
    })
  } catch (error) {
    // Don't fail the request if logging fails
    console.error('[API Auth] Error logging usage:', error)
  }
}
