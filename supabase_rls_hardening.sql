-- SUPABASE RLS HARDENING SCRIPT
-- This script fixes the "RLS Disabled" warnings for the Job and JobSession tables.

-----------------------------------------------------------
-- 1. ENABLE ROW LEVEL SECURITY
-----------------------------------------------------------
ALTER TABLE IF EXISTS public."Job" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."JobSession" ENABLE ROW LEVEL SECURITY;

-----------------------------------------------------------
-- 2. DEFINE POLICIES for "Job"
-----------------------------------------------------------

-- Remove any existing permissive policies to ensure clean state
-- DROP POLICY IF EXISTS "Users can view their own jobs" ON public."Job";
-- DROP POLICY IF EXISTS "Users can create their own jobs" ON public."Job";

-- Assuming the table has a 'user_id' column for ownership
-- If the column name is different, please adjust 'user_id' below.

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Job' AND column_name = 'user_id') THEN
        
        -- Policy: Allow users to see only their own jobs
        CREATE POLICY "Users can view their own jobs" 
        ON public."Job" FOR SELECT 
        TO authenticated 
        USING (user_id = auth.uid());

        -- Policy: Allow users to insert their own jobs
        CREATE POLICY "Users can create their own jobs" 
        ON public."Job" FOR INSERT 
        TO authenticated 
        WITH CHECK (user_id = auth.uid());

        -- Policy: Allow users to update their own jobs
        CREATE POLICY "Users can update their own jobs" 
        ON public."Job" FOR UPDATE 
        TO authenticated 
        USING (user_id = auth.uid())
        WITH CHECK (user_id = auth.uid());

        -- Policy: Allow users to delete their own jobs
        CREATE POLICY "Users can delete their own jobs" 
        ON public."Job" FOR DELETE 
        TO authenticated 
        USING (user_id = auth.uid());

    ELSE
        -- Fallback: If no user_id, at least restrict to authenticated users only if that's the goal
        -- Or just enable RLS without policies (which defaults to deny-all) for maximum safety until policies are defined.
        RAISE NOTICE 'Column user_id not found in table Job. RLS enabled but no user-specific policies added.';
    END IF;
END $$;


-----------------------------------------------------------
-- 3. DEFINE POLICIES for "JobSession"
-----------------------------------------------------------

-- Assuming JobSession relates to a Job. 
-- Usually, we want users to access sessions of jobs they own.

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'JobSession' AND column_name = 'user_id') THEN
        
        CREATE POLICY "Users can manage their own job sessions" 
        ON public."JobSession" FOR ALL 
        TO authenticated 
        USING (user_id = auth.uid());

    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Job' AND column_name = 'user_id') 
          AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'JobSession' AND column_name = 'job_id') THEN
        
        -- If JobSession only has job_id, we check the Job table for ownership
        CREATE POLICY "Users can access sessions of their jobs" 
        ON public."JobSession" FOR ALL 
        TO authenticated 
        USING (
            job_id IN (SELECT id FROM public."Job" WHERE user_id = auth.uid())
        );
    ELSE
        RAISE NOTICE 'Could not determine ownership relationship for JobSession. RLS enabled with default deny.';
    END IF;
END $$;

-----------------------------------------------------------
-- 4. SERVICE ROLE BYPASS (Optional but Recommended)
-----------------------------------------------------------
-- Allows your Edge Functions or Admin scripts to always work
-- CREATE POLICY "Service role has full access" ON public."Job" FOR ALL TO service_role USING (true) WITH CHECK (true);
-- CREATE POLICY "Service role has full access" ON public."JobSession" FOR ALL TO service_role USING (true) WITH CHECK (true);
