export interface ApiKey {
  id: string
  company_id: string
  key_prefix: string
  name: string
  permissions: ApiKeyPermissions
  rate_limit_per_minute: number
  is_active: boolean
  last_used_at: string | null
  created_at: string
}

export interface ApiKeyPermissions {
  score_single: boolean
  score_batch: boolean
  webhook: boolean
}

export interface CreateApiKeyRequest {
  name: string
  permissions?: Partial<ApiKeyPermissions>
  rate_limit_per_minute?: number
}

export interface CreateApiKeyResponse {
  key: ApiKey
  full_key: string
}

export interface ApiUsageLogEntry {
  id: string
  api_key_id: string
  endpoint: string
  method: string
  status_code: number
  response_time_ms: number | null
  created_at: string
}
