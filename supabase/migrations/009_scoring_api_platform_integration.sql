-- Naybourhood Scoring API - Platform Integration
-- Migration: 009_scoring_api_platform_integration.sql
-- Purpose: Wire the Naybourhood platform's buyers table to use the scoring API

-- ═══════════════════════════════════════════════════════════════════
-- ENABLE PG_NET EXTENSION (for HTTP calls from Postgres)
-- ═══════════════════════════════════════════════════════════════════

-- Note: You may need to enable this extension in your Supabase dashboard
-- or contact Supabase support if it's not available
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- ═══════════════════════════════════════════════════════════════════
-- STORE THE INTERNAL API KEY SECURELY
-- ═══════════════════════════════════════════════════════════════════

-- Create a secrets table for storing the internal API key
CREATE TABLE IF NOT EXISTS app_secrets (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grant access to service role only
REVOKE ALL ON app_secrets FROM PUBLIC;
GRANT SELECT ON app_secrets TO service_role;

COMMENT ON TABLE app_secrets IS 'Secure storage for application secrets (API keys, etc.)';

-- Note: After running this migration, manually insert the internal API key:
-- INSERT INTO app_secrets (key, value)
-- VALUES ('naybourhood_scoring_api_key', 'nb_live_xxxxxxxx')
-- ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- ═══════════════════════════════════════════════════════════════════
-- FUNCTION: Call Scoring API when buyer is inserted/updated
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION score_buyer_via_api()
RETURNS TRIGGER AS $$
DECLARE
    v_api_key TEXT;
    v_supabase_url TEXT;
    v_request_body JSONB;
    v_request_id BIGINT;
BEGIN
    -- Get the API key from secrets
    SELECT value INTO v_api_key FROM app_secrets WHERE key = 'naybourhood_scoring_api_key';

    -- If no API key configured, skip scoring
    IF v_api_key IS NULL THEN
        RAISE WARNING 'Scoring API key not configured - skipping API scoring';
        RETURN NEW;
    END IF;

    -- Get Supabase URL from config (set this in your Supabase dashboard)
    v_supabase_url := current_setting('app.settings.supabase_url', true);

    -- If URL not configured, try to construct it from the project ref
    IF v_supabase_url IS NULL OR v_supabase_url = '' THEN
        -- Default to environment variable if available, otherwise skip
        RAISE WARNING 'Supabase URL not configured - skipping API scoring';
        RETURN NEW;
    END IF;

    -- Build the request body matching the API schema
    v_request_body := jsonb_build_object(
        'external_id', NEW.id::TEXT,
        'external_source', 'naybourhood',
        'buyer', jsonb_build_object(
            'country', COALESCE(NEW.country, NEW.nationality),
            'name', COALESCE(NEW.full_name, CONCAT(NEW.first_name, ' ', NEW.last_name)),
            'email', NEW.email,
            'phone', NEW.phone
        ),
        'requirements', jsonb_build_object(
            'budget_min', NEW.budget_min,
            'budget_max', COALESCE(NEW.budget_max, NEW.budget_min, NEW.budget::INTEGER),
            'bedrooms', COALESCE(NEW.preferred_bedrooms, NEW.bedrooms),
            'preferred_location', COALESCE(NEW.location, NEW.area),
            'purchase_purpose', NEW.purchase_purpose,
            'timeline', COALESCE(NEW.timeline, NEW.timeline_to_purchase)
        ),
        'financial', jsonb_build_object(
            'payment_method', NEW.payment_method,
            'connect_to_broker', CASE
                WHEN LOWER(NEW.uk_broker) IN ('no', 'unknown', 'false') THEN true
                WHEN LOWER(NEW.uk_broker) IN ('yes', 'introduced', 'true') THEN false
                ELSE NULL
            END,
            'buying_within_28_days', COALESCE(NEW.ready_within_28_days, NEW.ready_in_28_days)
        ),
        'context', jsonb_build_object(
            'development_name', NEW.development_name,
            'channel', NEW.source,
            'source_campaign', NEW.campaign
        )
    );

    -- Make async HTTP request to scoring API using pg_net
    -- This doesn't block the INSERT/UPDATE operation
    BEGIN
        SELECT extensions.http_post(
            url := v_supabase_url || '/functions/v1/score',
            headers := jsonb_build_object(
                'Authorization', 'Bearer ' || v_api_key,
                'Content-Type', 'application/json'
            )::JSONB,
            body := v_request_body::JSONB
        ) INTO v_request_id;

        -- Log the request for debugging
        RAISE NOTICE 'Scoring API request sent for buyer %: request_id=%', NEW.id, v_request_id;
    EXCEPTION WHEN OTHERS THEN
        -- Don't fail the INSERT/UPDATE if API call fails
        RAISE WARNING 'Scoring API call failed for buyer %: %', NEW.id, SQLERRM;
    END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION score_buyer_via_api IS 'Calls the scoring API when a buyer is inserted or updated';

-- ═══════════════════════════════════════════════════════════════════
-- TRIGGER: Score buyers on INSERT
-- ═══════════════════════════════════════════════════════════════════

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_score_buyer_api ON buyers;

-- Create new trigger
CREATE TRIGGER trigger_score_buyer_api
    AFTER INSERT ON buyers
    FOR EACH ROW
    EXECUTE FUNCTION score_buyer_via_api();

COMMENT ON TRIGGER trigger_score_buyer_api ON buyers IS 'Automatically score new buyers via the scoring API';

-- ═══════════════════════════════════════════════════════════════════
-- FUNCTION: Sync scores back from scored_leads to buyers
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION sync_scores_to_buyers()
RETURNS TRIGGER AS $$
BEGIN
    -- Only sync if this is from the naybourhood platform
    IF NEW.external_source = 'naybourhood' THEN
        UPDATE buyers
        SET
            ai_quality_score = NEW.quality_score,
            ai_intent_score = NEW.intent_score,
            ai_confidence = NEW.confidence_score / 10.0, -- Convert 0-100 to 0-10 scale
            ai_classification = CASE NEW.classification
                WHEN 'hot_lead' THEN 'Hot Lead'
                WHEN 'qualified' THEN 'Qualified'
                WHEN 'needs_qualification' THEN 'Needs Qualification'
                WHEN 'nurture' THEN 'Nurture'
                WHEN 'low_priority' THEN 'Low Priority'
                WHEN 'disqualified' THEN 'Disqualified'
                ELSE NEW.classification
            END,
            ai_priority = CASE NEW.priority
                WHEN 'high' THEN 'P1'
                WHEN 'medium' THEN 'P2'
                WHEN 'low' THEN 'P3'
                WHEN 'none' THEN 'P4'
                ELSE 'P3'
            END,
            ai_summary = NEW.summary,
            ai_next_action = NEW.next_action,
            ai_risk_flags = NEW.risk_flags,
            ai_scored_at = NEW.scored_at,
            -- Also update Naybourhood-specific fields
            call_priority = CASE NEW.priority
                WHEN 'high' THEN 1
                WHEN 'medium' THEN 3
                WHEN 'low' THEN 4
                WHEN 'none' THEN 5
                ELSE 3
            END,
            call_priority_reason = NEW.next_action,
            ready_within_28_days = NEW.buying_within_28_days,
            updated_at = NOW()
        WHERE id::TEXT = NEW.external_id;

        RAISE NOTICE 'Synced scores from scored_leads to buyers for %', NEW.external_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on scored_leads to sync back
DROP TRIGGER IF EXISTS trigger_sync_scores_to_buyers ON scored_leads;

CREATE TRIGGER trigger_sync_scores_to_buyers
    AFTER INSERT OR UPDATE ON scored_leads
    FOR EACH ROW
    WHEN (NEW.external_source = 'naybourhood')
    EXECUTE FUNCTION sync_scores_to_buyers();

COMMENT ON TRIGGER trigger_sync_scores_to_buyers ON scored_leads IS 'Sync scores back to buyers table when scored via API';

-- ═══════════════════════════════════════════════════════════════════
-- UTILITY FUNCTION: Rescore all unscored buyers
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION rescore_all_buyers(p_limit INTEGER DEFAULT 100)
RETURNS TABLE(buyer_id UUID, status TEXT) AS $$
DECLARE
    v_buyer RECORD;
    v_count INTEGER := 0;
BEGIN
    FOR v_buyer IN
        SELECT id, full_name
        FROM buyers
        WHERE ai_scored_at IS NULL
           OR ai_scored_at < NOW() - INTERVAL '7 days'
        ORDER BY created_at DESC
        LIMIT p_limit
    LOOP
        BEGIN
            -- Trigger the scoring by doing a dummy update
            UPDATE buyers
            SET updated_at = NOW()
            WHERE id = v_buyer.id;

            v_count := v_count + 1;
            buyer_id := v_buyer.id;
            status := 'queued';
            RETURN NEXT;
        EXCEPTION WHEN OTHERS THEN
            buyer_id := v_buyer.id;
            status := 'error: ' || SQLERRM;
            RETURN NEXT;
        END;
    END LOOP;

    RAISE NOTICE 'Queued % buyers for rescoring', v_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION rescore_all_buyers IS 'Queue unscored or stale buyers for rescoring';

-- ═══════════════════════════════════════════════════════════════════
-- CLEANUP: Remove old scoring triggers (after verifying API works)
-- ═══════════════════════════════════════════════════════════════════

-- These lines are commented out - run them manually after verifying the API works
-- DROP TRIGGER IF EXISTS trigger_ai_score_buyer ON buyers;
-- DROP FUNCTION IF EXISTS calculate_ai_scores();
-- DROP FUNCTION IF EXISTS score_all_buyers();
