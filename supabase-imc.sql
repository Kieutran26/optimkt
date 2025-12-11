-- IMC Planner Feature Migration
-- Table: imc_plans

DROP TABLE IF EXISTS imc_plans CASCADE;

CREATE TABLE imc_plans (
  id TEXT PRIMARY KEY,
  campaign_name TEXT NOT NULL,
  big_idea TEXT NOT NULL,
  key_message TEXT NOT NULL,
  brand TEXT NOT NULL,
  product TEXT NOT NULL,
  total_budget BIGINT NOT NULL,
  timeline_weeks INTEGER NOT NULL,
  phases JSONB NOT NULL,
  channel_matrix JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_imc_brand ON imc_plans(brand);
CREATE INDEX idx_imc_budget ON imc_plans(total_budget);
CREATE INDEX idx_imc_created ON imc_plans(created_at DESC);

-- Disable RLS (no auth yet)
ALTER TABLE imc_plans DISABLE ROW LEVEL SECURITY;
