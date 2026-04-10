-- SUPABASE SECURITY & PRIVACY HARDENING PATCH
-- Resolves Security Advisor warnings and fixes the "Public Note Discoverability" bug.

-----------------------------------------------------------
-- 1. FIX SEARCH PATH VULNERABILITY (Security Advisor)
-----------------------------------------------------------
-- Re-defining the update function with a fixed search_path to prevent search path hijacking.
CREATE OR REPLACE FUNCTION public.update_shared_note(
  p_share_slug text,
  p_title text,
  p_content text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public -- FIX: Explicit search path
AS $$
DECLARE
  target_note record;
BEGIN
  SELECT * INTO target_note 
  FROM public.notes 
  WHERE share_slug = p_share_slug AND is_shared = true;

  IF target_note IS NULL THEN
    RAISE EXCEPTION 'Note not found or not shared.';
  END IF;

  IF target_note.share_permission != 'write' THEN
    RAISE EXCEPTION 'This shared note is in View Only mode.';
  END IF;

  UPDATE public.notes 
  SET 
    title = p_title,
    content = p_content,
    updated_at = NOW()
  WHERE share_slug = p_share_slug;

  RETURN true;
END;
$$;

-----------------------------------------------------------
-- 2. SECURE PUBLIC FETCHING (Privacy Fix)
-----------------------------------------------------------
-- This function allows public access by slug without making the notes discoverable via SELECT *
CREATE OR REPLACE FUNCTION public.get_shared_note_by_slug(p_slug text)
RETURNS SETOF public.notes
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM public.notes
  WHERE share_slug = p_slug AND is_shared = true;
END;
$$;

-----------------------------------------------------------
-- 3. HARDEN RLS POLICIES (Privacy Fix)
-----------------------------------------------------------

-- First, ensure RLS is enabled on notes
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Drop permissive policies that might exist
DROP POLICY IF EXISTS "Public shared notes are discoverable" ON public.notes;
DROP POLICY IF EXISTS "Allow public read access to shared notes" ON public.notes;

-- NEW POLICY: Owners & Collaborators ONLY
-- This prevents Account B from seeing Account A's public notes in their dashboard.
DROP POLICY IF EXISTS "Users can view their own and shared notes" ON public.notes;
CREATE POLICY "Users can only see their own or invited notes" 
ON public.notes FOR SELECT 
TO authenticated 
USING (
    user_id = auth.uid() 
    OR id IN (
        SELECT note_id FROM public.note_collaborators 
        WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
);

-- Note: No "is_shared = true" in the SELECT policy above. 
-- Public viewing is now handled EXCLUSIVELY by the get_shared_note_by_slug() RPC.

-----------------------------------------------------------
-- 4. HARDEN NOTE LOGS (Security Advisor)
-----------------------------------------------------------
-- Fix the "Always True" Insert policy
DROP POLICY IF EXISTS "Allow users to insert logs" ON public.note_logs;
CREATE POLICY "Users can only insert logs for their own identity"
ON public.note_logs FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());
