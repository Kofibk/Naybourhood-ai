-- Performance indexes for optimizing common queries
-- Part of database query optimization initiative

-- buyers table indexes
CREATE INDEX IF NOT EXISTS idx_buyers_status ON buyers (status);
CREATE INDEX IF NOT EXISTS idx_buyers_created_at ON buyers (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_buyers_quality_score ON buyers (quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_buyers_assigned_to ON buyers (assigned_to);
CREATE INDEX IF NOT EXISTS idx_buyers_company_id ON buyers (company_id);
CREATE INDEX IF NOT EXISTS idx_buyers_status_created ON buyers (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_buyers_company_created ON buyers (company_id, created_at DESC);

-- borrowers table indexes
CREATE INDEX IF NOT EXISTS idx_borrowers_status ON borrowers (status);
CREATE INDEX IF NOT EXISTS idx_borrowers_created_at ON borrowers (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_borrowers_assigned_agent ON borrowers (assigned_agent);
CREATE INDEX IF NOT EXISTS idx_borrowers_company_id ON borrowers (company_id);
CREATE INDEX IF NOT EXISTS idx_borrowers_company_created ON borrowers (company_id, created_at DESC);

-- campaigns table indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns (delivery_status);
CREATE INDEX IF NOT EXISTS idx_campaigns_company_id ON campaigns (company_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON campaigns (date DESC);
CREATE INDEX IF NOT EXISTS idx_campaigns_company_date ON campaigns (company_id, date DESC);

-- conversations table indexes
CREATE INDEX IF NOT EXISTS idx_conversations_buyer_id ON conversations (buyer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_buyer_created ON conversations (buyer_id, created_at DESC);

-- companies table indexes
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies (name);
