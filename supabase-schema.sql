-- ============================================
-- OPTIMKT - SUPABASE MIGRATION SCHEMA
-- Complete database schema for all migrated features
-- ============================================

-- 1. BRAND VAULT TABLE
-- Stores saved brand information
DROP TABLE IF EXISTS brands CASCADE;

CREATE TABLE brands (
  id TEXT PRIMARY KEY,
  brand_name TEXT NOT NULL,
  industry TEXT NOT NULL,
  description TEXT,
  core_values JSONB,
  target_audience JSONB,
  brand_personality JSONB,
  visual_identity JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on brands" ON brands
FOR ALL USING (true) WITH CHECK (true);


-- 2. SAVED PROMPTS TABLE
-- Stores user's saved AI prompts
DROP TABLE IF EXISTS prompts CASCADE;

CREATE TABLE prompts (
  id TEXT PRIMARY KEY,
  ai_model TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on prompts" ON prompts
FOR ALL USING (true) WITH CHECK (true);


-- 3. CUSTOMER JOURNEY TABLE
-- Stores customer journey maps
DROP TABLE IF EXISTS customer_journeys CASCADE;

CREATE TABLE customer_journeys (
  id TEXT PRIMARY KEY,
  input JSONB NOT NULL,
  journey_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE customer_journeys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on customer_journeys" ON customer_journeys
FOR ALL USING (true) WITH CHECK (true);


-- 4. EMOTION MAPS TABLE
-- Stores audience emotion maps
DROP TABLE IF EXISTS emotion_maps CASCADE;

CREATE TABLE emotion_maps (
  id TEXT PRIMARY KEY,
  input JSONB NOT NULL,
  result JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE emotion_maps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on emotion_maps" ON emotion_maps
FOR ALL USING (true) WITH CHECK (true);


-- 5. AUTO BRIEFS TABLE
-- Stores automatically generated marketing briefs
DROP TABLE IF EXISTS auto_briefs CASCADE;

CREATE TABLE auto_briefs (
  id TEXT PRIMARY KEY,
  input JSONB NOT NULL,
  brief_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE auto_briefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on auto_briefs" ON auto_briefs
FOR ALL USING (true) WITH CHECK (true);


-- ============================================
-- MIGRATION COMPLETE
-- Total tables: 5
-- All RLS policies enabled with permissive access
-- ============================================
