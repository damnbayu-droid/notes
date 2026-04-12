-- Create discovery_notes table to mirror shared intelligence
CREATE TABLE IF NOT EXISTS public.discovery_notes (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    category TEXT DEFAULT 'Uncategorized',
    tags TEXT[] DEFAULT '{}',
    thumbnail_url TEXT,
    likes_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Search Optimization
    fts tsvector GENERATED ALWAYS AS (
        to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, ''))
    ) STORED
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS discovery_notes_fts_idx ON public.discovery_notes USING GIN (fts);
CREATE INDEX IF NOT EXISTS discovery_notes_category_idx ON public.discovery_notes (category);
CREATE INDEX IF NOT EXISTS discovery_notes_user_id_idx ON public.discovery_notes (user_id);

-- Enable RLS
ALTER TABLE public.discovery_notes ENABLE ROW LEVEL SECURITY;

-- Policies
-- 1. Everyone can read discovery notes
CREATE POLICY "Public Discovery Access" 
ON public.discovery_notes FOR SELECT 
USING (true);

-- 2. Only the owner can insert/update/delete (via sync logic)
-- Note: In production, we might restrict this further to only be callable via a secure function or specific app triggers,
-- but for now, we'll allow the owner to manage their own mirrored data.
CREATE POLICY "Users can manage their discovery mirror" 
ON public.discovery_notes FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.discovery_notes TO authenticated;
GRANT SELECT ON public.discovery_notes TO anon;
