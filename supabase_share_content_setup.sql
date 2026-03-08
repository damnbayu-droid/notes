-- Phase 52: Advanced Share Content Schema Update
-- Adding missing columns for encrypted sharing and rich content storage

ALTER TABLE public.notes 
ADD COLUMN IF NOT EXISTS share_type text DEFAULT 'public',
ADD COLUMN IF NOT EXISTS is_password_protected boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS password_salt text,
ADD COLUMN IF NOT EXISTS is_encrypted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS shared_content text;

-- Ensure share_permission exists (from phase 50)
ALTER TABLE public.notes 
ADD COLUMN IF NOT EXISTS share_permission text DEFAULT 'read';

-- Re-verify or create the update_shared_note function if it was missing
CREATE OR REPLACE FUNCTION update_shared_note(
  p_share_slug text,
  p_title text,
  p_content text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
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
