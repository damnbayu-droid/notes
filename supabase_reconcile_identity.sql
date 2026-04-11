-- MASTER IDENTITY RECOVERY (ID-SPECIFIC)
-- This version uses the EXACT ID found in your database records to ensure recovery
-- even if your email/auth records are out of sync.

CREATE OR REPLACE FUNCTION public.reconcile_by_master_id(p_legacy_id UUID)
RETURNS TABLE (updated_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_new_id UUID := auth.uid();
    v_updated INTEGER := 0;
BEGIN
    -- Security Check: Caller must be authenticated
    IF v_new_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Transfer all notes owned by the legacy ID to the current user
    UPDATE public.notes 
    SET user_id = v_new_id,
        updated_at = NOW()
    WHERE user_id = p_legacy_id;
    
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    
    -- Transfer Related Data
    UPDATE public.note_logs SET user_id = v_new_id WHERE user_id = p_legacy_id;
    UPDATE public.note_comments SET user_id = v_new_id WHERE user_id = p_legacy_id;
    UPDATE public.note_ratings SET user_id = v_new_id WHERE user_id = p_legacy_id;

    RETURN QUERY SELECT v_updated;
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.reconcile_by_master_id(UUID) TO authenticated;
