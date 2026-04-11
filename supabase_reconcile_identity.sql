-- UNIVERSAL IDENTITY RECONCILIATION (EMAIL-BASED)
-- This version is more robust than ID-based matching as it recovers any notes 
-- tied to accounts matching your current verified email address.

CREATE OR REPLACE FUNCTION public.reconcile_user_notes_by_email()
RETURNS TABLE (updated_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_new_id UUID := auth.uid();
    v_new_email TEXT;
    v_updated INTEGER := 0;
BEGIN
    -- Get current authenticated user's email
    SELECT email INTO v_new_email FROM auth.users WHERE id = v_new_id;
    
    IF v_new_email IS NULL THEN
        RAISE EXCEPTION 'Not authenticated or local user';
    END IF;

    -- Transfer all notes that belong to ANY account (ID) with this same email
    -- excluding the current ID 
    UPDATE public.notes 
    SET user_id = v_new_id,
        updated_at = NOW()
    WHERE user_id IN (
        SELECT id FROM auth.users WHERE email = v_new_email
    ) AND user_id != v_new_id;
    
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    
    -- Transfer Related Data
    UPDATE public.note_logs SET user_id = v_new_id WHERE user_id IN (SELECT id FROM auth.users WHERE email = v_new_email) AND user_id != v_new_id;
    UPDATE public.note_comments SET user_id = v_new_id WHERE user_id IN (SELECT id FROM auth.users WHERE email = v_new_email) AND user_id != v_new_id;
    UPDATE public.note_ratings SET user_id = v_new_id WHERE user_id IN (SELECT id FROM auth.users WHERE email = v_new_email) AND user_id != v_new_id;

    RETURN QUERY SELECT v_updated;
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.reconcile_user_notes_by_email() TO authenticated;
