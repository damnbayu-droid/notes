-- DATA LIFECYCLE MANAGEMENT IMPLEMENTATION

-----------------------------------------------------------
-- 1. PROFILE PICTURE AUTOMATION
-- Auto-delete old avatar when user updates their profile picture
-----------------------------------------------------------

-- Create a Trigger Function to handle avatar cleanup
CREATE OR REPLACE FUNCTION delete_old_avatar()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_avatar_url TEXT;
  bucket_path TEXT;
BEGIN
  -- Check if avatar_url has changed
  IF OLD.raw_user_meta_data->>'avatar' IS DISTINCT FROM NEW.raw_user_meta_data->>'avatar' THEN
    old_avatar_url := OLD.raw_user_meta_data->>'avatar';
    
    -- Ensure it's not null and belongs to our storage
    IF old_avatar_url IS NOT NULL AND old_avatar_url LIKE '%/storage/v1/object/public/app-files/%' THEN
      -- Extract the path after 'app-files/'
      bucket_path := substring(old_avatar_url from 'app-files/(.*)');
      
      -- Perform deletion (using Supabase Storage API wrapper if available, or just log it)
      -- Note: Direct storage deletion from Auth Trigger is complex due to permissions.
      -- Ideally, this should be an Edge Function. For SQL only, we'll need the pg_net extension or http extension, 
      -- but for safety in this script, we will just mark the logic.
      
      -- For this specific environment (Client-side app), the 'NoteEditor' upload logic 
      -- actually handles the new file. The cleanup is best done via policy or edge function.
      
      -- However, here is the concept if you have the rights:
      -- PERFORM storage.delete('app-files', bucket_path); 
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Bind Trigger to Auth Users Update
DROP TRIGGER IF EXISTS on_auth_user_avatar_change ON auth.users;
CREATE TRIGGER on_auth_user_avatar_change
  BEFORE UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION delete_old_avatar();


-----------------------------------------------------------
-- 2. TRASH AUTO-CLEANUP (30 DAYS)
-----------------------------------------------------------

-- Function to clean up old trash notes
-- This should be called by a Scheduled Cron Job (pg_cron)
CREATE OR REPLACE FUNCTION cleanup_trash_notes()
RETURNS void 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete notes that are marked as deleted and updated more than 30 days ago
  DELETE FROM notes 
  WHERE is_deleted = TRUE 
  AND updated_at < (NOW() - INTERVAL '30 days');
END;
$$ LANGUAGE plpgsql;

-- CRON JOB (Requires pg_cron extension enable in Dashboard > Database > Extensions)
-- select cron.schedule(
--   'cleanup-trash-every-day', -- name
--   '0 0 * * *',               -- every day at midnight
--   'SELECT cleanup_trash_notes()'
-- );


-----------------------------------------------------------
-- 3. INACTIVE USERS MANAGEMENT
-----------------------------------------------------------

-- QUERY TO FIND USERS: Inactive for 1 MONTH (For Email Notification)
-- You would run this via an Edge Function connected to an Email Service (e.g. Resend)
/*
SELECT id, email, last_sign_in_at 
FROM auth.users 
WHERE last_sign_in_at < (NOW() - INTERVAL '1 month')
AND last_sign_in_at > (NOW() - INTERVAL '1 month - 1 day'); -- Run daily to catch just-turned-inactive
*/

-- QUERY TO FIND USERS: Inactive for 3 MONTHS (For Deletion)
-- WARNING: This is destructive.
/*
SELECT id, email, last_sign_in_at 
FROM auth.users 
WHERE last_sign_in_at < (NOW() - INTERVAL '3 months');
*/

-- FUNCTION TO DELETE EXPIRED ACCOUNTS
CREATE OR REPLACE FUNCTION delete_expired_accounts()
RETURNS void 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete users who haven't signed in for 3 months
  -- Note: Cascading deletes should clean up their data (notes, etc) if foreign keys are set to DELETE CASCADE
  DELETE FROM auth.users 
  WHERE last_sign_in_at < (NOW() - INTERVAL '3 months');
END;
$$ LANGUAGE plpgsql;

-- CRON JOB FOR ACCOUNT DELETION
-- select cron.schedule(
--   'delete-inactive-users',   -- name
--   '0 0 * * 0',               -- every Sunday at midnight
--   'SELECT delete_expired_accounts()'
-- );
