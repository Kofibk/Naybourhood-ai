-- ============================================================
-- Migration: API Keys and Usage Logging
-- Adds api_keys and api_usage_log tables for developer portal
-- ============================================================

-- API Keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL,          -- SHA-256 hash of the full key
  key_prefix TEXT NOT NULL,        -- First 8 chars for display (e.g. nb_live_a)
  name TEXT NOT NULL,              -- Human-readable name
  permissions JSONB NOT NULL DEFAULT '{"score_single": true, "score_batch": true, "webhook": true}'::jsonb,
  rate_limit_per_minute INT NOT NULL DEFAULT 60,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for api_keys
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_company_id ON api_keys(company_id);
CREATE INDEX idx_api_keys_is_active ON api_keys(is_active);

-- API Usage Log table
CREATE TABLE IF NOT EXISTS api_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL DEFAULT 'POST',
  status_code INT NOT NULL,
  response_time_ms INT,
  request_body_size INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for api_usage_log
CREATE INDEX idx_api_usage_log_api_key_id ON api_usage_log(api_key_id);
CREATE INDEX idx_api_usage_log_created_at ON api_usage_log(created_at);

-- Enable Row Level Security
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for api_keys: companies manage own keys only
CREATE POLICY "Users can view their company API keys"
  ON api_keys FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create API keys for their company"
  ON api_keys FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their company API keys"
  ON api_keys FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their company API keys"
  ON api_keys FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- RLS Policies for api_usage_log: viewable via company's keys
CREATE POLICY "Users can view usage logs for their company keys"
  ON api_usage_log FOR SELECT
  USING (
    api_key_id IN (
      SELECT ak.id FROM api_keys ak
      WHERE ak.company_id IN (
        SELECT company_id FROM user_profiles WHERE id = auth.uid()
      )
    )
  );

-- Service role can insert usage logs (from API middleware)
CREATE POLICY "Service role can insert usage logs"
  ON api_usage_log FOR INSERT
  WITH CHECK (true);

-- Rate limiting helper function
CREATE OR REPLACE FUNCTION check_api_rate_limit(p_key_hash TEXT)
RETURNS TABLE(allowed BOOLEAN, current_count BIGINT, limit_per_minute INT) AS $$
DECLARE
  v_key_id UUID;
  v_rate_limit INT;
  v_count BIGINT;
BEGIN
  -- Get the API key and its rate limit
  SELECT ak.id, ak.rate_limit_per_minute
  INTO v_key_id, v_rate_limit
  FROM api_keys ak
  WHERE ak.key_hash = p_key_hash AND ak.is_active = true;

  IF v_key_id IS NULL THEN
    RETURN QUERY SELECT false, 0::BIGINT, 0;
    RETURN;
  END IF;

  -- Count requests in the last minute
  SELECT COUNT(*)
  INTO v_count
  FROM api_usage_log aul
  WHERE aul.api_key_id = v_key_id
    AND aul.created_at > now() - interval '1 minute';

  RETURN QUERY SELECT (v_count < v_rate_limit), v_count, v_rate_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
