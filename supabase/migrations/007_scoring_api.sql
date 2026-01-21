-- Naybourhood Universal Scoring API
-- Migration: 007_scoring_api.sql
-- Purpose: Create tables for the universal scoring API that serves all clients (platform + external CRMs)

-- ═══════════════════════════════════════════════════════════════════
-- TABLE: api_customers
-- API customers (developers, CRMs, etc.)
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS api_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    tier TEXT DEFAULT 'standard' CHECK (tier IN ('standard', 'plus', 'enterprise')),
    monthly_lead_limit INTEGER DEFAULT 1000,
    is_active BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE api_customers IS 'API customers using the scoring API (Naybourhood platform, Salesforce, Reapit, etc.)';
COMMENT ON COLUMN api_customers.tier IS 'Service tier: standard (1000/mo), plus (5000/mo), enterprise (unlimited)';
COMMENT ON COLUMN api_customers.settings IS 'Customer-specific settings (custom thresholds, webhooks, etc.)';

-- ═══════════════════════════════════════════════════════════════════
-- TABLE: api_keys
-- API authentication keys
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES api_customers(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    key_prefix TEXT NOT NULL,
    key_hash TEXT NOT NULL UNIQUE,
    rate_limit_per_minute INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_api_keys_customer ON api_keys(customer_id);

COMMENT ON TABLE api_keys IS 'API keys for authentication - keys are stored as SHA256 hashes';
COMMENT ON COLUMN api_keys.key_prefix IS 'First 16 chars of key for identification (e.g., nb_live_xxxxxxxx)';
COMMENT ON COLUMN api_keys.key_hash IS 'SHA256 hash of the full API key';

-- ═══════════════════════════════════════════════════════════════════
-- TABLE: scored_leads
-- Central scoring results table - all scores from all sources
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS scored_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES api_customers(id) ON DELETE CASCADE NOT NULL,

    -- External reference
    external_id TEXT NOT NULL,
    external_source TEXT DEFAULT 'api',
    UNIQUE(customer_id, external_id, external_source),

    -- Input: Buyer
    buyer_country TEXT,
    buyer_region TEXT,

    -- Input: Requirements
    budget_min INTEGER,
    budget_max INTEGER,
    bedrooms INTEGER,
    preferred_location TEXT,
    purchase_purpose TEXT,
    timeline TEXT,

    -- Input: Financial
    payment_method TEXT,
    connect_to_broker BOOLEAN,
    buying_within_28_days BOOLEAN,

    -- Input: Context
    development_id TEXT,
    development_name TEXT,
    channel TEXT,
    source_campaign TEXT,
    input_payload JSONB,

    -- Output: Scores
    quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 100),
    intent_score INTEGER CHECK (intent_score >= 0 AND intent_score <= 100),
    confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
    classification TEXT CHECK (classification IN (
        'hot_lead', 'qualified', 'needs_qualification',
        'nurture', 'low_priority', 'disqualified'
    )),
    priority TEXT CHECK (priority IN ('high', 'medium', 'low', 'none')),
    risk_flags TEXT[],
    next_action TEXT,
    summary TEXT,

    -- Metadata
    model_version TEXT DEFAULT '1.0',
    score_time_ms INTEGER,
    scored_at TIMESTAMPTZ DEFAULT NOW(),

    -- Outcome (updated later via /v1/outcome)
    outcome_status TEXT CHECK (outcome_status IN ('converted', 'lost', 'disqualified', 'stale')),
    outcome_reason TEXT,
    outcome_value INTEGER,
    outcome_at TIMESTAMPTZ,
    days_to_outcome INTEGER,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scored_leads_customer ON scored_leads(customer_id, scored_at DESC);
CREATE INDEX IF NOT EXISTS idx_scored_leads_classification ON scored_leads(customer_id, classification);
CREATE INDEX IF NOT EXISTS idx_scored_leads_external ON scored_leads(external_source, external_id);
CREATE INDEX IF NOT EXISTS idx_scored_leads_outcome ON scored_leads(customer_id, outcome_status) WHERE outcome_status IS NOT NULL;

COMMENT ON TABLE scored_leads IS 'Universal scoring results - all scores from all sources (platform, Salesforce, Reapit, etc.)';
COMMENT ON COLUMN scored_leads.external_id IS 'Lead ID in the source system (e.g., Salesforce Lead ID)';
COMMENT ON COLUMN scored_leads.external_source IS 'Source system: salesforce, reapit, naybourhood, api';
COMMENT ON COLUMN scored_leads.input_payload IS 'Original request payload for audit/debugging';

-- ═══════════════════════════════════════════════════════════════════
-- TABLE: api_request_log
-- Request logging for analytics and debugging
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS api_request_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES api_customers(id),
    endpoint TEXT,
    method TEXT,
    status_code INTEGER,
    response_time_ms INTEGER,
    error_message TEXT,
    request_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_request_log_customer ON api_request_log(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_request_log_created ON api_request_log(created_at DESC);

COMMENT ON TABLE api_request_log IS 'API request logging for analytics, debugging, and rate limiting';

-- ═══════════════════════════════════════════════════════════════════
-- FUNCTION: generate_api_key
-- Generate a new API key for a customer
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION generate_api_key(p_customer_id UUID, p_name TEXT DEFAULT 'Default Key')
RETURNS TEXT AS $$
DECLARE
    v_key TEXT;
    v_prefix TEXT;
    v_hash TEXT;
BEGIN
    -- Generate a secure random key with prefix
    v_key := 'nb_live_' || encode(gen_random_bytes(24), 'hex');
    v_prefix := substring(v_key from 1 for 16);
    v_hash := encode(sha256(v_key::bytea), 'hex');

    -- Insert the key record (hash only, never store plain key)
    INSERT INTO api_keys (customer_id, name, key_prefix, key_hash)
    VALUES (p_customer_id, p_name, v_prefix, v_hash);

    -- Return the plain key (only time it's visible)
    RETURN v_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION generate_api_key IS 'Generate a new API key - returns the plain key (only visible once)';

-- ═══════════════════════════════════════════════════════════════════
-- FUNCTION: validate_api_key
-- Validate an API key and return customer_id
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION validate_api_key(p_key TEXT)
RETURNS TABLE(customer_id UUID, customer_name TEXT, tier TEXT, rate_limit INTEGER) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id as customer_id,
        c.name as customer_name,
        c.tier,
        k.rate_limit_per_minute as rate_limit
    FROM api_keys k
    JOIN api_customers c ON k.customer_id = c.id
    WHERE k.key_hash = encode(sha256(p_key::bytea), 'hex')
      AND k.is_active = true
      AND c.is_active = true
      AND (k.expires_at IS NULL OR k.expires_at > NOW());

    -- Update last_used_at
    UPDATE api_keys
    SET last_used_at = NOW()
    WHERE key_hash = encode(sha256(p_key::bytea), 'hex');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION validate_api_key IS 'Validate API key and return customer details';

-- ═══════════════════════════════════════════════════════════════════
-- FUNCTION: update_scored_lead_timestamp
-- Auto-update updated_at timestamp
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_scored_lead_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_scored_leads_updated ON scored_leads;
CREATE TRIGGER trigger_scored_leads_updated
    BEFORE UPDATE ON scored_leads
    FOR EACH ROW
    EXECUTE FUNCTION update_scored_lead_timestamp();

-- ═══════════════════════════════════════════════════════════════════
-- VIEW: v_api_customer_usage
-- Customer usage analytics
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW v_api_customer_usage AS
SELECT
    c.id as customer_id,
    c.name as customer_name,
    c.slug,
    c.tier,
    c.monthly_lead_limit,
    COUNT(DISTINCT s.id) FILTER (WHERE s.scored_at >= date_trunc('month', NOW())) as leads_this_month,
    COUNT(DISTINCT s.id) FILTER (WHERE s.scored_at >= NOW() - INTERVAL '24 hours') as leads_last_24h,
    COUNT(DISTINCT s.id) FILTER (WHERE s.scored_at >= NOW() - INTERVAL '7 days') as leads_last_7d,
    ROUND(AVG(s.quality_score)::numeric, 1) as avg_quality_score,
    ROUND(AVG(s.intent_score)::numeric, 1) as avg_intent_score,
    COUNT(*) FILTER (WHERE s.classification = 'hot_lead') as hot_leads_count,
    COUNT(*) FILTER (WHERE s.classification = 'qualified') as qualified_count,
    COUNT(*) FILTER (WHERE s.outcome_status = 'converted') as conversions,
    c.is_active
FROM api_customers c
LEFT JOIN scored_leads s ON c.id = s.customer_id
GROUP BY c.id, c.name, c.slug, c.tier, c.monthly_lead_limit, c.is_active;

COMMENT ON VIEW v_api_customer_usage IS 'Customer usage statistics and conversion metrics';

-- ═══════════════════════════════════════════════════════════════════
-- VIEW: v_scoring_api_analytics
-- Overall API analytics
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW v_scoring_api_analytics AS
SELECT
    date_trunc('day', scored_at) as date,
    COUNT(*) as total_scores,
    COUNT(*) FILTER (WHERE classification = 'hot_lead') as hot_leads,
    COUNT(*) FILTER (WHERE classification = 'qualified') as qualified,
    COUNT(*) FILTER (WHERE classification = 'needs_qualification') as needs_qualification,
    COUNT(*) FILTER (WHERE classification = 'nurture') as nurture,
    COUNT(*) FILTER (WHERE classification = 'low_priority') as low_priority,
    COUNT(*) FILTER (WHERE classification = 'disqualified') as disqualified,
    ROUND(AVG(quality_score)::numeric, 1) as avg_quality,
    ROUND(AVG(intent_score)::numeric, 1) as avg_intent,
    ROUND(AVG(confidence_score)::numeric, 1) as avg_confidence,
    ROUND(AVG(score_time_ms)::numeric, 0) as avg_score_time_ms
FROM scored_leads
WHERE scored_at >= NOW() - INTERVAL '30 days'
GROUP BY date_trunc('day', scored_at)
ORDER BY date DESC;

COMMENT ON VIEW v_scoring_api_analytics IS 'Daily scoring API analytics for the last 30 days';

-- ═══════════════════════════════════════════════════════════════════
-- GRANT PERMISSIONS
-- ═══════════════════════════════════════════════════════════════════

-- Grant access to authenticated users (for admin dashboard)
GRANT SELECT ON api_customers TO authenticated;
GRANT SELECT ON api_keys TO authenticated;
GRANT SELECT ON scored_leads TO authenticated;
GRANT SELECT ON api_request_log TO authenticated;
GRANT SELECT ON v_api_customer_usage TO authenticated;
GRANT SELECT ON v_scoring_api_analytics TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION generate_api_key TO authenticated;
GRANT EXECUTE ON FUNCTION validate_api_key TO authenticated;

-- ═══════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE api_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE scored_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_request_log ENABLE ROW LEVEL SECURITY;

-- Policies for api_customers (admins only can manage)
CREATE POLICY "Admins can view all customers" ON api_customers
    FOR SELECT TO authenticated
    USING (true);

-- Policies for api_keys (admins only)
CREATE POLICY "Admins can view all keys" ON api_keys
    FOR SELECT TO authenticated
    USING (true);

-- Policies for scored_leads (view all for authenticated users)
CREATE POLICY "Authenticated users can view scored leads" ON scored_leads
    FOR SELECT TO authenticated
    USING (true);

-- Policies for api_request_log
CREATE POLICY "Authenticated users can view request logs" ON api_request_log
    FOR SELECT TO authenticated
    USING (true);

-- ═══════════════════════════════════════════════════════════════════
-- SEED DATA: Test Customers
-- ═══════════════════════════════════════════════════════════════════

-- Insert Naybourhood Platform as internal customer
INSERT INTO api_customers (name, slug, tier, monthly_lead_limit)
VALUES ('Naybourhood Platform', 'naybourhood-internal', 'enterprise', 999999)
ON CONFLICT (slug) DO NOTHING;

-- Insert Mount Anvil as enterprise customer
INSERT INTO api_customers (name, slug, tier, monthly_lead_limit)
VALUES ('Mount Anvil', 'mount-anvil', 'enterprise', 999999)
ON CONFLICT (slug) DO NOTHING;

-- Note: API keys should be generated manually after migration
-- Use: SELECT generate_api_key((SELECT id FROM api_customers WHERE slug = 'mount-anvil'), 'Production Key');
