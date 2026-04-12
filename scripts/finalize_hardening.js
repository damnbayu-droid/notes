import pg from 'pg';
const { Client } = pg;

const client = new Client({
    user: 'postgres.uxukdfbqynnlkcykqozu',
    host: 'aws-1-ap-southeast-1.pooler.supabase.com',
    database: 'postgres',
    password: '40%Lacunacoilflames',
    port: 6543,
});

const sql = `
-- 1. Discovery Sync Table Hardening
CREATE TABLE IF NOT EXISTS public.discovery_notes (
    id UUID PRIMARY KEY REFERENCES public.notes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    title TEXT,
    content TEXT,
    category TEXT,
    tags TEXT[],
    share_slug TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure share_slug exists if table already existed
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='discovery_notes' AND column_name='share_slug') THEN
        ALTER TABLE public.discovery_notes ADD COLUMN share_slug TEXT;
    END IF;
END $$;

-- 2. Performance: GIN Indexes
CREATE INDEX IF NOT EXISTS idx_discovery_notes_content_gin ON public.discovery_notes USING GIN (to_tsvector('english', title || ' ' || content));
CREATE INDEX IF NOT EXISTS idx_discovery_notes_tags_gin ON public.discovery_notes USING GIN (tags);

-- 3. Security: RLS for Discovery
ALTER TABLE public.discovery_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Discovery is public" ON public.discovery_notes;
CREATE POLICY "Discovery is public" ON public.discovery_notes
    FOR SELECT USING (true);

-- 4. Admin Operations: Secure RPC
CREATE OR REPLACE FUNCTION public.delete_user_data_admin(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    admin_email TEXT;
BEGIN
    -- Verify requester is an admin
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Access Denied: Administrative privileges required.';
    END IF;

    -- Get admin email for logging
    SELECT email INTO admin_email FROM public.profiles WHERE id = auth.uid();

    -- Delete user data
    DELETE FROM public.notes WHERE user_id = target_user_id;
    DELETE FROM public.profiles WHERE id = target_user_id;

    -- Log the action
    INSERT INTO public.admin_logs (admin_email, action, details)
    VALUES (admin_email, 'PURGE_USER_DATA', jsonb_build_object('target_id', target_user_id));
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_user_data_admin(UUID) TO authenticated;

-- 5. Role & Subscription Management RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    ) WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );
`;

async function main() {
    try {
        console.log('Connecting to Supabase (via Session Pooler)...');
        await client.connect();
        console.log('Executing Hardening SQL...');
        await client.query(sql);
        console.log('✅ Hardening Complete.');
    } catch (err) {
        console.error('❌ SQL Execution Failed:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

main();
