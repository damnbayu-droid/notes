-- RECONCILE IDENTITY & RESTORE LOST DATA
-- This function transfers ownership of notes from a legacy ID to the current authenticated user.
-- It uses SECURITY DEFINER to bypass RLS for this specific administrative reconciliation.

CREATE OR REPLACE FUNCTION public.reconcile_user_notes(p_legacy_id UUID)
RETURNS TABLE (updated_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_new_id UUID := auth.uid();
    v_updated INTEGER := 0;
BEGIN
    -- Security Check: Only allow if caller is authenticated
    IF v_new_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Transfer Notes
    UPDATE public.notes 
    SET user_id = v_new_id,
        updated_at = NOW()
    WHERE user_id = p_legacy_id;
    
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    
    -- Transfer Related Data
    UPDATE public.note_logs SET user_id = v_new_id WHERE user_id = p_legacy_id;
    UPDATE public.note_comments SET user_id = v_new_id WHERE user_id = p_legacy_id;
    UPDATE public.note_ratings SET user_id = v_new_id WHERE user_id = p_legacy_id;
    UPDATE public.note_collaborators SET email = (SELECT email FROM auth.users WHERE id = v_new_id) WHERE note_id IN (SELECT id FROM public.notes WHERE user_id = v_new_id);

    RETURN QUERY SELECT v_updated;
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.reconcile_user_notes(UUID) TO authenticated;
