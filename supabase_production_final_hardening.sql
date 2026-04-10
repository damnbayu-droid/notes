-- SMART NOTES PRODUCTION HARDENING V3 (FINAL)
-- Focus: Intelligent Discovery, Security RPCs, and Performance Indexing

SET search_path = public;

-----------------------------------------------------------
-- 1. SECURE PUBLIC ACCESS RPCs
-----------------------------------------------------------

-- RPC: get_shared_note_by_slug
-- Purpose: Allows public/guest access to a note via slug ONLY if shared.
-- Security: SECURITY DEFINER allows access without exposing the entire table to anon SELECT.
CREATE OR REPLACE FUNCTION get_shared_note_by_slug(p_slug text)
RETURNS SETOF public.notes
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.notes
  WHERE share_slug = p_slug AND is_shared = true;
END;
$$;

-- Grant permission to execute to everyone (anon and authenticated)
GRANT EXECUTE ON FUNCTION get_shared_note_by_slug(text) TO anon, authenticated;

-----------------------------------------------------------
-- 2. DISCOVERY PERFORMANCE INDEXING
-----------------------------------------------------------

-- Index for optimized discovery searching
CREATE INDEX IF NOT EXISTS idx_notes_discovery_full_search 
ON public.notes USING GIN (
  to_tsvector('english', title || ' ' || COALESCE(content, '') || ' ' || array_to_string(tags, ' '))
) WHERE is_discoverable = true;

-- Index for categorized browsing
CREATE INDEX IF NOT EXISTS idx_notes_discovery_category 
ON public.notes (category) 
WHERE is_discoverable = true;

-----------------------------------------------------------
-- 3. CRM & CONTACT INTEGRATION (Ensuring tables exist)
-----------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.user_inquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL,
    name TEXT,
    platform TEXT, -- Whatsapp, Telegram, Email
    platform_handle TEXT,
    subject TEXT,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, reviewed, archived
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for inquiries (Only inserting allowed for public, full access for admin)
ALTER TABLE public.user_inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit inquiry" ON public.user_inquiries;
CREATE POLICY "Anyone can submit inquiry"
    ON public.user_inquiries FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Only admin can view inquiries" ON public.user_inquiries;
CREATE POLICY "Only admin can view inquiries"
    ON public.user_inquiries FOR SELECT
    USING (auth.jwt() ->> 'email' = 'damnbayu@gmail.com');

-----------------------------------------------------------
-- 4. TRASH CLEANUP POLICIES (Server-side safety)
-----------------------------------------------------------

-- While we handle 7-day cleanup in the frontend hook for immediate UX,
-- we ensure the database allows the cleanup action.
DROP POLICY IF EXISTS "Users can purge their own trash" ON public.notes;
CREATE POLICY "Users can purge their own trash"
    ON public.notes FOR DELETE
    USING (auth.uid() = user_id AND folder = 'Trash');

-----------------------------------------------------------
-- 5. SEO & DISCOVERY ENHANCEMENTS
-----------------------------------------------------------

-- Ensure notes have categories and slugs by default if missing
UPDATE public.notes SET category = 'General' WHERE category IS NULL;
UPDATE public.notes SET is_discoverable = false WHERE is_discoverable IS NULL;
