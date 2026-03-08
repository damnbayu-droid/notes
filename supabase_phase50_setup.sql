-- Phase 50: Advanced Share System & Link Detection
-- Run this script in your Supabase SQL Editor to enable 'Write' access for shared notes.

-- 1. Add the share_permission column to the notes table
-- Permissions can be 'read' (view only) or 'write' (can edit)
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS share_permission text DEFAULT 'read';

-- 2. Create a secure RPC (Remote Procedure Call) function to allow guests to update writable notes
-- This bypasses Row Level Security (RLS) safely because the function uses 'SECURITY DEFINER'.
-- It only updates the note if `is_shared` is true and `share_permission` is 'write'.
CREATE OR REPLACE FUNCTION update_shared_note(
  p_share_slug text,
  p_title text,
  p_content text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- This allows the function to bypass normal RLS and execute with creator privileges
AS $$
DECLARE
  target_note record;
BEGIN
  -- Find the shared note by its public slug
  SELECT * INTO target_note 
  FROM public.notes 
  WHERE share_slug = p_share_slug AND is_shared = true;

  -- If the note doesn't exist, isn't shared, or is entirely locked down, reject.
  IF target_note IS NULL THEN
    RAISE EXCEPTION 'Note not found or not shared.';
  END IF;

  -- Security Check: The note MUST explicitly grant 'write' permission
  IF target_note.share_permission != 'write' THEN
    RAISE EXCEPTION 'This shared note is in View Only mode and cannot be edited by guests.';
  END IF;

  -- If validation passes, update the note
  UPDATE public.notes 
  SET 
    title = p_title,
    content = p_content,
    updated_at = NOW()
  WHERE share_slug = p_share_slug;

  RETURN true;
END;
$$;
