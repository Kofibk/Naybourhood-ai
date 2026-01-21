-- Naybourhood Scoring API - Seed Data
-- Migration: 008_scoring_api_seed.sql
-- Purpose: Generate API keys for test customers

-- ═══════════════════════════════════════════════════════════════════
-- GENERATE API KEYS FOR EXISTING CUSTOMERS
-- Note: Run this AFTER 007_scoring_api.sql
-- ═══════════════════════════════════════════════════════════════════

-- Generate API key for Mount Anvil (production key)
-- IMPORTANT: The key is only returned once. Store it securely!
DO $$
DECLARE
    v_customer_id UUID;
    v_key TEXT;
BEGIN
    -- Get Mount Anvil customer ID
    SELECT id INTO v_customer_id FROM api_customers WHERE slug = 'mount-anvil';

    IF v_customer_id IS NOT NULL THEN
        -- Check if they already have a key
        IF NOT EXISTS (SELECT 1 FROM api_keys WHERE customer_id = v_customer_id) THEN
            v_key := generate_api_key(v_customer_id, 'Production Key');
            RAISE NOTICE 'Mount Anvil API Key (SAVE THIS): %', v_key;
        ELSE
            RAISE NOTICE 'Mount Anvil already has an API key';
        END IF;
    ELSE
        RAISE NOTICE 'Mount Anvil customer not found - run 007_scoring_api.sql first';
    END IF;
END $$;

-- Generate API key for Naybourhood Platform (internal key)
DO $$
DECLARE
    v_customer_id UUID;
    v_key TEXT;
BEGIN
    -- Get Naybourhood internal customer ID
    SELECT id INTO v_customer_id FROM api_customers WHERE slug = 'naybourhood-internal';

    IF v_customer_id IS NOT NULL THEN
        -- Check if they already have a key
        IF NOT EXISTS (SELECT 1 FROM api_keys WHERE customer_id = v_customer_id) THEN
            v_key := generate_api_key(v_customer_id, 'Internal Platform Key');
            RAISE NOTICE 'Naybourhood Internal API Key (SAVE THIS): %', v_key;
        ELSE
            RAISE NOTICE 'Naybourhood Platform already has an API key';
        END IF;
    ELSE
        RAISE NOTICE 'Naybourhood Platform customer not found - run 007_scoring_api.sql first';
    END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════
-- CREATE TEST CUSTOMER (for development/testing)
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO api_customers (name, slug, tier, monthly_lead_limit)
VALUES ('Test Customer', 'test-customer', 'standard', 100)
ON CONFLICT (slug) DO NOTHING;

-- Generate test API key
DO $$
DECLARE
    v_customer_id UUID;
    v_key TEXT;
BEGIN
    SELECT id INTO v_customer_id FROM api_customers WHERE slug = 'test-customer';

    IF v_customer_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM api_keys WHERE customer_id = v_customer_id) THEN
            v_key := generate_api_key(v_customer_id, 'Test Key');
            RAISE NOTICE 'Test Customer API Key (for development): %', v_key;
        END IF;
    END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════
-- SAMPLE SCORED LEADS (for testing)
-- ═══════════════════════════════════════════════════════════════════

-- Insert sample scored leads for Mount Anvil (only if empty)
DO $$
DECLARE
    v_customer_id UUID;
BEGIN
    SELECT id INTO v_customer_id FROM api_customers WHERE slug = 'mount-anvil';

    IF v_customer_id IS NOT NULL THEN
        -- Hot Lead example
        INSERT INTO scored_leads (
            customer_id, external_id, external_source,
            buyer_country, budget_min, budget_max, bedrooms,
            purchase_purpose, timeline, payment_method,
            connect_to_broker, buying_within_28_days,
            development_name, channel,
            quality_score, intent_score, confidence_score,
            classification, priority, risk_flags,
            next_action, summary, model_version, score_time_ms
        ) VALUES (
            v_customer_id, 'SAMPLE-001', 'salesforce',
            'United Kingdom', 600000, 800000, 2,
            'primary_residence', '28_days', 'cash',
            false, true,
            'Riverside Quarter', 'website',
            85, 90, 100,
            'hot_lead', 'high', ARRAY[]::text[],
            'Schedule viewing within 24 hours',
            'Cash buyer with £600K-£800K budget looking for 2-bed for primary residence. Ready to purchase within 28 days. High proceedability - prioritise for immediate viewing.',
            '1.0', 12
        ) ON CONFLICT (customer_id, external_id, external_source) DO NOTHING;

        -- Qualified Lead example
        INSERT INTO scored_leads (
            customer_id, external_id, external_source,
            buyer_country, budget_min, budget_max, bedrooms,
            purchase_purpose, timeline, payment_method,
            connect_to_broker, buying_within_28_days,
            development_name, channel,
            quality_score, intent_score, confidence_score,
            classification, priority, risk_flags,
            next_action, summary, model_version, score_time_ms
        ) VALUES (
            v_customer_id, 'SAMPLE-002', 'salesforce',
            'Singapore', 1200000, 1500000, 3,
            'investment', '3_months', 'mortgage',
            true, false,
            'Canary Wharf Tower', 'rightmove',
            65, 55, 80,
            'qualified', 'high', ARRAY['no_finance_confirmation']::text[],
            'Send development brochure + follow up in 48 hours',
            'Mortgage buyer with £1.2M-£1.5M budget looking for 3-bed for investment. Timeline: 3_months. Good prospect - schedule follow-up.',
            '1.0', 15
        ) ON CONFLICT (customer_id, external_id, external_source) DO NOTHING;

        -- Needs Qualification example
        INSERT INTO scored_leads (
            customer_id, external_id, external_source,
            buyer_country, budget_min,
            payment_method,
            channel,
            quality_score, intent_score, confidence_score,
            classification, priority, risk_flags,
            next_action, summary, model_version, score_time_ms
        ) VALUES (
            v_customer_id, 'SAMPLE-003', 'salesforce',
            'United Arab Emirates', 500000,
            'cash',
            'whatsapp',
            40, 25, 40,
            'needs_qualification', 'medium', ARRAY['incomplete_profile']::text[],
            'WhatsApp to confirm budget, timeline, and requirements',
            'Cash buyer with £500K budget. Requires qualification - confirm key details.',
            '1.0', 8
        ) ON CONFLICT (customer_id, external_id, external_source) DO NOTHING;

        -- Disqualified example
        INSERT INTO scored_leads (
            customer_id, external_id, external_source,
            budget_min, budget_max, bedrooms,
            payment_method,
            quality_score, intent_score, confidence_score,
            classification, priority, risk_flags,
            next_action, summary, model_version, score_time_ms
        ) VALUES (
            v_customer_id, 'SAMPLE-004', 'salesforce',
            3000000, 5000000, 1,
            'cash',
            0, 20, 60,
            'disqualified', 'none', ARRAY['likely_fake_lead']::text[],
            'Archive - do not pursue',
            'Cash buyer with £3M-£5M budget looking for 1-bed. Disqualified - do not pursue.',
            '1.0', 5
        ) ON CONFLICT (customer_id, external_id, external_source) DO NOTHING;

        RAISE NOTICE 'Sample scored leads created for Mount Anvil';
    END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════
-- VERIFICATION QUERY
-- ═══════════════════════════════════════════════════════════════════

-- Run this to verify the setup:
-- SELECT
--     c.name as customer,
--     c.tier,
--     k.name as key_name,
--     k.key_prefix,
--     k.is_active
-- FROM api_customers c
-- LEFT JOIN api_keys k ON c.id = k.customer_id
-- ORDER BY c.name;
