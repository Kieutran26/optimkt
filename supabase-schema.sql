-- =============================================
-- OptiMKT Database Schema for Supabase - V2
-- Run this in Supabase SQL Editor
-- =============================================

-- Drop existing brands table if needed (CAREFUL!)
-- DROP TABLE IF EXISTS brands CASCADE;

-- 1. Brands Table (Brand Vault) - Enhanced Structure
CREATE TABLE IF NOT EXISTS brands (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  logos JSONB DEFAULT '[]',
  colors JSONB DEFAULT '[]',
  font_family TEXT DEFAULT 'Inter',
  vision TEXT,
  mission TEXT,
  core_values JSONB DEFAULT '[]',
  tone_of_voice TEXT,
  short_term_goals JSONB DEFAULT '[]',
  long_term_goals JSONB DEFAULT '[]',
  target_objectives JSONB DEFAULT '[]',
  demographics JSONB DEFAULT '[]',
  psychographics JSONB DEFAULT '[]',
  pain_points JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Saved Prompts Table
CREATE TABLE IF NOT EXISTS prompts (
  id TEXT PRIMARY KEY,
  ai_model TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Customer Journeys Table
CREATE TABLE IF NOT EXISTS customer_journeys (
  id TEXT PRIMARY KEY,
  input JSONB NOT NULL,
  result JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Emotion Maps Table
CREATE TABLE IF NOT EXISTS emotion_maps (
  id TEXT PRIMARY KEY,
  input JSONB NOT NULL,
  result JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Auto Briefs Table
CREATE TABLE IF NOT EXISTS auto_briefs (
  id TEXT PRIMARY KEY,
  input JSONB NOT NULL,
  result JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. SOPs Table
CREATE TABLE IF NOT EXISTS sops (
  id TEXT PRIMARY KEY,
  input JSONB NOT NULL,
  result JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Hooks Table
CREATE TABLE IF NOT EXISTS hooks (
  id TEXT PRIMARY KEY,
  input JSONB NOT NULL,
  result JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Insights Table
CREATE TABLE IF NOT EXISTS insights (
  id TEXT PRIMARY KEY,
  input JSONB NOT NULL,
  result JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Pricing Analyses Table
CREATE TABLE IF NOT EXISTS pricing_analyses (
  id TEXT PRIMARY KEY,
  input JSONB NOT NULL,
  result JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Personas Table
CREATE TABLE IF NOT EXISTS personas (
  id TEXT PRIMARY KEY,
  brand_id TEXT REFERENCES brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- If tables already exist, add missing columns:
ALTER TABLE brands ADD COLUMN IF NOT EXISTS logos JSONB DEFAULT '[]';
ALTER TABLE brands ADD COLUMN IF NOT EXISTS core_values JSONB DEFAULT '[]';
ALTER TABLE brands ADD COLUMN IF NOT EXISTS short_term_goals JSONB DEFAULT '[]';
ALTER TABLE brands ADD COLUMN IF NOT EXISTS long_term_goals JSONB DEFAULT '[]';
ALTER TABLE brands ADD COLUMN IF NOT EXISTS target_objectives JSONB DEFAULT '[]';
ALTER TABLE brands ADD COLUMN IF NOT EXISTS demographics JSONB DEFAULT '[]';
ALTER TABLE brands ADD COLUMN IF NOT EXISTS psychographics JSONB DEFAULT '[]';
ALTER TABLE brands ADD COLUMN IF NOT EXISTS pain_points JSONB DEFAULT '[]';
ALTER TABLE brands ADD COLUMN IF NOT EXISTS font_family TEXT DEFAULT 'Inter';
ALTER TABLE brands ADD COLUMN IF NOT EXISTS vision TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS mission TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS tone_of_voice TEXT;

-- Success message
SELECT 'All tables updated successfully! ✅' as message;
