-- Migration: buyer_transactions and scoring_outcomes tables
-- Outcome tracking pipeline for buyer transactions

-- ============================================================
-- 1. buyer_transactions table
-- ============================================================
CREATE TABLE IF NOT EXISTS buyer_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
  development_id UUID REFERENCES developments(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  current_stage TEXT NOT NULL DEFAULT 'enquiry'
    CHECK (current_stage IN (
      'enquiry', 'viewing', 'offer', 'reservation',
      'exchange', 'completion', 'fallen_through'
    )),
  stage_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  fall_through_reason TEXT
    CHECK (fall_through_reason IS NULL OR fall_through_reason IN (
      'changed_mind', 'finance_failed', 'found_elsewhere', 'chain_broke', 'other'
    )),
  fall_through_stage TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for buyer_transactions
CREATE INDEX IF NOT EXISTS idx_buyer_transactions_buyer_id ON buyer_transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_buyer_transactions_current_stage ON buyer_transactions(current_stage);
CREATE INDEX IF NOT EXISTS idx_buyer_transactions_created_at ON buyer_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_buyer_transactions_company_id ON buyer_transactions(company_id);

-- RLS: companies see only their own transactions
ALTER TABLE buyer_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Companies can view own transactions"
  ON buyer_transactions FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Companies can insert own transactions"
  ON buyer_transactions FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Companies can update own transactions"
  ON buyer_transactions FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Companies can delete own transactions"
  ON buyer_transactions FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- ============================================================
-- 2. scoring_outcomes table
-- ============================================================
CREATE TABLE IF NOT EXISTS scoring_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  original_quality_score NUMERIC,
  original_intent_score NUMERIC,
  original_confidence NUMERIC,
  actual_outcome TEXT NOT NULL
    CHECK (actual_outcome IN ('completion', 'fallen_through')),
  stage_reached TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for scoring_outcomes
CREATE INDEX IF NOT EXISTS idx_scoring_outcomes_buyer_id ON scoring_outcomes(buyer_id);
CREATE INDEX IF NOT EXISTS idx_scoring_outcomes_company_id ON scoring_outcomes(company_id);

-- RLS: companies see only their own scoring outcomes
ALTER TABLE scoring_outcomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Companies can view own scoring outcomes"
  ON scoring_outcomes FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Companies can insert own scoring outcomes"
  ON scoring_outcomes FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- ============================================================
-- 3. updated_at trigger for buyer_transactions
-- ============================================================
CREATE OR REPLACE FUNCTION update_buyer_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER buyer_transactions_updated_at
  BEFORE UPDATE ON buyer_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_buyer_transactions_updated_at();
