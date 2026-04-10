-- DISCOVERY FEED SETUP
-- Adds support for an opt-in public discovery library.

-----------------------------------------------------------
-- 1. SCHEMA UPDATE
-----------------------------------------------------------
ALTER TABLE public.notes 
ADD COLUMN IF NOT EXISTS is_discoverable BOOLEAN DEFAULT false;

-----------------------------------------------------------
-- 2. RLS POLICIES FOR DISCOVERY
-----------------------------------------------------------

-- POLICY: Allow anyone (Public/Guests) to SELECT discoverable notes
-- This is what powers the global community feed.
DROP POLICY IF EXISTS "Public Discovery Access" ON public.notes;
CREATE POLICY "Public Discovery Access"
ON public.notes FOR SELECT
TO anon, authenticated
USING (is_discoverable = true);

-- Note: We maintain the "get_shared_note_by_slug" function for direct links,
-- but the Discovery Page will be able to list notes directly via global SELECT.

-----------------------------------------------------------
-- 3. INDEXING FOR PERFORMANCE
-----------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_notes_discoverable ON public.notes(is_discoverable) WHERE is_discoverable = true;
