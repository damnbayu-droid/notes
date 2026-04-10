-- SMART NOTES: COLLABORATIVE WORKSPACE MIGRATION
-- This script sets up the infrastructure for immutable logs, email sharing, and multi-format support.

-----------------------------------------------------------
-- 1. TABLES DEFINITION
-----------------------------------------------------------

-- NOTE COLLABORATORS (EMAIL SHARING)
CREATE TABLE IF NOT EXISTS public.note_collaborators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    permission TEXT DEFAULT 'read' CHECK (permission IN ('read', 'write')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(note_id, email)
);

-- NOTE LOGS (IMMUTABLE AUDIT TRAIL)
CREATE TABLE IF NOT EXISTS public.note_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    user_email TEXT, -- Flat store email for easy display in logs
    action TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-----------------------------------------------------------
-- 2. SECURITY & POLICIES
-----------------------------------------------------------

-- Enable RLS
ALTER TABLE public.note_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_collaborators ENABLE ROW LEVEL SECURITY;

-- Note Logs Policies
CREATE POLICY "Allow users to insert logs"
ON public.note_logs FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow users to view logs for accessible notes"
ON public.note_logs FOR SELECT
TO authenticated
USING (
    note_id IN (
        SELECT id FROM public.notes WHERE user_id = auth.uid()
        OR id IN (SELECT note_id FROM public.note_collaborators WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()))
    )
);

CREATE POLICY "No updates on logs" ON public.note_logs FOR UPDATE TO public USING (false);
CREATE POLICY "No deletes on logs" ON public.note_logs FOR DELETE TO public USING (false);

-- Note Collaborators Policies
CREATE POLICY "Owners can manage collaborators"
ON public.note_collaborators FOR ALL
TO authenticated
USING (
    note_id IN (SELECT id FROM public.notes WHERE user_id = auth.uid())
);

CREATE POLICY "Collaborators can view fellow participants"
ON public.note_collaborators FOR SELECT
TO authenticated
USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR note_id IN (
        SELECT note_id FROM public.note_collaborators 
        WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
);


-----------------------------------------------------------
-- 3. SCHEMA UPDATES FOR NOTES TABLE
-----------------------------------------------------------
ALTER TABLE public.notes 
ADD COLUMN IF NOT EXISTS note_type TEXT DEFAULT 'text' CHECK (note_type IN ('text', 'pdf', 'spreadsheet', 'google_doc', 'github_clone')),
ADD COLUMN IF NOT EXISTS external_meta JSONB DEFAULT '{}'::jsonb;

-- Update update_shared_note to handle logging if needed (though app logic might be better)

-----------------------------------------------------------
-- 4. REALTIME ENABLEMENT
-----------------------------------------------------------
-- Ensure notes and collaborators are in the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.notes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.note_collaborators;
-- Add note_logs to realtime if you want live audit feed
ALTER PUBLICATION supabase_realtime ADD TABLE public.note_logs;
