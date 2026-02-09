-- ============================================================
-- Migration: KYC/AML Verification Checks
-- Adds kyc_checks table for Checkboard integration
-- ============================================================

-- KYC Checks table
CREATE TABLE IF NOT EXISTS kyc_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
  check_type TEXT NOT NULL CHECK (check_type IN ('aml', 'kyc', 'both')),
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'pending', 'passed', 'failed', 'review', 'not_available')),
  checkboard_reference TEXT,
  result_data JSONB,
  initiated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_kyc_checks_buyer_id ON kyc_checks(buyer_id);
CREATE INDEX idx_kyc_checks_status ON kyc_checks(status);
CREATE INDEX idx_kyc_checks_checkboard_reference ON kyc_checks(checkboard_reference);

-- Enable Row Level Security
ALTER TABLE kyc_checks ENABLE ROW LEVEL SECURITY;

-- RLS Policies: companies see own checks via buyer ownership
CREATE POLICY "Users can view KYC checks for their company buyers"
  ON kyc_checks FOR SELECT
  USING (
    buyer_id IN (
      SELECT b.id FROM buyers b
      WHERE b.company_id IN (
        SELECT company_id FROM user_profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create KYC checks for their company buyers"
  ON kyc_checks FOR INSERT
  WITH CHECK (
    buyer_id IN (
      SELECT b.id FROM buyers b
      WHERE b.company_id IN (
        SELECT company_id FROM user_profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update KYC checks for their company buyers"
  ON kyc_checks FOR UPDATE
  USING (
    buyer_id IN (
      SELECT b.id FROM buyers b
      WHERE b.company_id IN (
        SELECT company_id FROM user_profiles WHERE id = auth.uid()
      )
    )
  );

-- Service role can manage all KYC checks (for webhook processing)
CREATE POLICY "Service role can manage all KYC checks"
  ON kyc_checks FOR ALL
  USING (true)
  WITH CHECK (true);

-- Trigger for updated_at on completion
CREATE OR REPLACE FUNCTION handle_kyc_check_completed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('passed', 'failed', 'review') AND OLD.status = 'pending' THEN
    NEW.completed_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_kyc_check_status_change
  BEFORE UPDATE ON kyc_checks
  FOR EACH ROW
  EXECUTE FUNCTION handle_kyc_check_completed();
