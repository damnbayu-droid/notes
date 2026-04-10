-- RPC for Admin to delete a user (including auth)
-- Note: This requires the service_role key or special permissions if done via API,
-- but from here we can provide a trigger or just cascade delete the profile/notes.

-- For now, deleting from public.profiles will cascade to notes if set up.
-- If you want to delete the actual AUTH user, we'd need a secure Edge Function.
