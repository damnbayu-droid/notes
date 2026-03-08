-- SMART NOTES STORAGE POLICY SETUP
-- Run this script in your Supabase SQL Editor to instantly fix the Profile Photo Upload issues!
-- (Photo 1 Issue)

-- 1. Ensure the 'public' bucket exists and is actually public
INSERT INTO storage.buckets (id, name, public)
VALUES ('public', 'public', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Create Policy: Allow anyone (anon and authenticated) to VIEW (SELECT) photos
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'public' );

-- 3. Create Policy: Allow logged-in users to UPLOAD (INSERT) their own photos
DROP POLICY IF EXISTS "Users can upload avatars" ON storage.objects;
CREATE POLICY "Users can upload avatars" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK ( bucket_id = 'public' AND (auth.uid()::text = (storage.foldername(name))[1]) );

-- 4. Create Policy: Allow logged-in users to UPDATE their own photos
DROP POLICY IF EXISTS "Users can update avatars" ON storage.objects;
CREATE POLICY "Users can update avatars" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING ( bucket_id = 'public' AND (auth.uid()::text = (storage.foldername(name))[1]) );

-- 5. Create Policy: Allow logged-in users to DELETE their old photos
DROP POLICY IF EXISTS "Users can delete avatars" ON storage.objects;
CREATE POLICY "Users can delete avatars" 
ON storage.objects FOR DELETE 
TO authenticated 
USING ( bucket_id = 'public' AND (auth.uid()::text = (storage.foldername(name))[1]) );
