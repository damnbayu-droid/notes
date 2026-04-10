-- 1. Add External Source columns to Notes
ALTER TABLE public.notes 
ADD COLUMN IF NOT EXISTS external_source_url TEXT,
ADD COLUMN IF NOT EXISTS external_source_type TEXT,
ADD COLUMN IF NOT EXISTS external_source_title TEXT;

-- 2. Update RLS (Optional, but ensures clear access)
-- Since users can already update notes they own, this just confirms it.
DROP POLICY IF EXISTS "Users can update their own notes" ON public.notes;
CREATE POLICY "Users can update their own notes" 
ON public.notes FOR UPDATE 
USING (auth.uid() = user_id);

-- 3. Indexing for performance if we eventually want to find notes by source
CREATE INDEX IF NOT EXISTS idx_notes_external_url ON public.notes(external_source_url) WHERE external_source_url IS NOT NULL;
