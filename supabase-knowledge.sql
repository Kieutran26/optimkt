-- Table: marketing_knowledge
-- Stores marketing knowledge entries

CREATE TABLE IF NOT EXISTS marketing_knowledge (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    term TEXT NOT NULL,
    definition TEXT NOT NULL,
    example TEXT DEFAULT '',
    comparison TEXT DEFAULT '',
    category TEXT DEFAULT 'Chung',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns if table already exists
ALTER TABLE marketing_knowledge ADD COLUMN IF NOT EXISTS example TEXT DEFAULT '';
ALTER TABLE marketing_knowledge ADD COLUMN IF NOT EXISTS comparison TEXT DEFAULT '';

-- Create indexes for search
CREATE INDEX IF NOT EXISTS idx_knowledge_term ON marketing_knowledge USING gin(to_tsvector('simple', term));
CREATE INDEX IF NOT EXISTS idx_knowledge_definition ON marketing_knowledge USING gin(to_tsvector('simple', definition));
CREATE INDEX IF NOT EXISTS idx_knowledge_category ON marketing_knowledge(category);

-- Enable RLS
ALTER TABLE marketing_knowledge ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all for now (can be scoped to authenticated users later)
CREATE POLICY "Allow all" ON marketing_knowledge FOR ALL USING (true);
