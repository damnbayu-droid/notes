-- Secure RPC for Admin to purge user data
-- This handles deletion from public tables. Auth deletion remains manual in Supabase Dashboard.
CREATE OR REPLACE FUNCTION public.delete_user_data_admin(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of creator
SET search_path = public
AS $$
DECLARE
    admin_email TEXT;
BEGIN
    -- 1. Verify requester is an admin
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Access Denied: Administrative privileges required.';
    END IF;

    -- Get admin email for logging
    SELECT email INTO admin_email FROM public.profiles WHERE id = auth.uid();

    -- 2. Delete user data from public tables
    -- discovery_notes will delete due to CASCADE
    DELETE FROM public.notes WHERE user_id = target_user_id;
    DELETE FROM public.support_messages WHERE id IN (SELECT id FROM public.support_messages WHERE email = (SELECT email FROM public.profiles WHERE id = target_user_id));
    DELETE FROM public.profiles WHERE id = target_user_id;

    -- 3. Log the action
    INSERT INTO public.admin_logs (admin_email, action, details)
    VALUES (admin_email, 'PURGE_USER_DATA', jsonb_build_object('target_id', target_user_id));

END;
$$;

-- Grant execution to authenticated users (internal check handles role)
GRANT EXECUTE ON FUNCTION public.delete_user_data_admin(UUID) TO authenticated;
