-- AI Recommendations System Migration
-- Run this in your Supabase SQL Editor

-- AI Scoring fields on buyers
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS ai_quality_score INTEGER;
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS ai_intent_score INTEGER;
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS ai_confidence DECIMAL(3,2);
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS ai_summary TEXT;
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS ai_next_action TEXT;
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS ai_risk_flags TEXT[];
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS ai_scored_at TIMESTAMPTZ;

-- AI Recommendations table (platform-wide)
CREATE TABLE IF NOT EXISTS ai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Context
  page_type TEXT NOT NULL, -- 'dashboard', 'campaign', 'campaign_detail', 'buyer', 'analysis'
  related_buyer_id UUID REFERENCES buyers(id) ON DELETE CASCADE,
  related_campaign_id UUID,
  related_development_id UUID REFERENCES developments(id) ON DELETE CASCADE,

  -- Recommendation
  title TEXT NOT NULL,
  description TEXT,
  action_type TEXT, -- 'call', 'email', 'book_viewing', 'follow_up', 'escalate', 'archive'
  action_url TEXT,
  priority TEXT DEFAULT 'medium', -- 'critical', 'high', 'medium', 'low'

  -- Status
  dismissed BOOLEAN DEFAULT false,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- AI Insights table (dashboard/analysis)
CREATE TABLE IF NOT EXISTS ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  insight_type TEXT NOT NULL, -- 'pipeline', 'campaign', 'performance', 'alert', 'trend'
  title TEXT NOT NULL,
  description TEXT,
  metric_value TEXT,
  metric_change TEXT, -- '+15%', '-3 leads'
  priority TEXT DEFAULT 'medium',

  dismissed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaign AI fields
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS ai_performance_summary TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS ai_recommendations TEXT[];
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS ai_health_score INTEGER;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS ai_analyzed_at TIMESTAMPTZ;

-- Enable RLS on new tables
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_recommendations
CREATE POLICY "Allow public read access to ai_recommendations"
ON ai_recommendations FOR SELECT USING (true);

CREATE POLICY "Allow authenticated insert on ai_recommendations"
ON ai_recommendations FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated update on ai_recommendations"
ON ai_recommendations FOR UPDATE USING (true);

CREATE POLICY "Allow authenticated delete on ai_recommendations"
ON ai_recommendations FOR DELETE USING (true);

-- RLS Policies for ai_insights
CREATE POLICY "Allow public read access to ai_insights"
ON ai_insights FOR SELECT USING (true);

CREATE POLICY "Allow authenticated insert on ai_insights"
ON ai_insights FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated update on ai_insights"
ON ai_insights FOR UPDATE USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_page_type ON ai_recommendations(page_type);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_priority ON ai_recommendations(priority);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_buyer ON ai_recommendations(related_buyer_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_type ON ai_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_buyers_ai_quality ON buyers(ai_quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_buyers_ai_intent ON buyers(ai_intent_score DESC);
CREATE INDEX IF NOT EXISTS idx_campaigns_ai_health ON campaigns(ai_health_score DESC);
