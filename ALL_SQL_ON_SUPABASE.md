-- SMART NOTES STABILIZATION PATCH v15.0.4
-- Target: Resolve RLS Recursion & Synchronize Discovery Metrics

-- 1. CLEANUP RECURSIVE POLICIES
DROP POLICY IF EXISTS "Profiles: Admin Intelligence" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: Admin Superiority" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;

-- 2. REDEFINE NON-RECURSIVE ADMIN CHECK
-- Using SECURITY DEFINER and ensuring search_path is set to public
CREATE OR REPLACE FUNCTION public.is_admin_check()
RETURNS boolean AS $$
BEGIN
  -- FAST PATH: Check JWT Metadata (Safe from recursion)
  IF (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' THEN
    RETURN TRUE;
  END IF;

  -- FALLBACK: Check hardcoded admin email (Safe from recursion)
  IF (auth.jwt() ->> 'email') = 'damnbayu@gmail.com' THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. RE-IMPLEMENT POLICIES USING FAST-PATH CHECKS
-- Profiles: Absolute Admin & Self access
CREATE POLICY "Profiles: Admin & Self Access" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (
  auth.uid() = id 
  OR public.is_admin_check()
);

CREATE POLICY "Profiles: Admin Full Access" 
ON public.profiles 
FOR ALL 
TO authenticated 
USING ( public.is_admin_check() )
WITH CHECK ( public.is_admin_check() );

-- Orders: Admin Visibility
CREATE POLICY "Orders: Admin Visibility" 
ON public.orders 
FOR SELECT 
TO authenticated 
USING ( public.is_admin_check() );

CREATE POLICY "Orders: Admin Full Access" 
ON public.orders 
FOR ALL 
TO authenticated 
USING ( public.is_admin_check() )
WITH CHECK ( public.is_admin_check() );

-- 4. DISCOVERY METRICS SYNCHRONIZATION
-- Add view_count to discovery_notes if missing
ALTER TABLE public.discovery_notes ADD COLUMN IF NOT EXISTS view_count BIGINT DEFAULT 0;

-- Update the sync trigger to propagate metrics
CREATE OR REPLACE FUNCTION public.sync_discovery_note()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.is_shared = true AND NEW.is_discoverable = true) THEN
        INSERT INTO public.discovery_notes (
          id, user_id, title, content, category, tags, share_slug, updated_at, view_count
        )
        VALUES (
          NEW.id, NEW.user_id, NEW.title, NEW.content, NEW.category, NEW.tags, NEW.share_slug, NEW.updated_at, NEW.view_count
        )
        ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            content = EXCLUDED.content,
            category = EXCLUDED.category,
            tags = EXCLUDED.tags,
            share_slug = EXCLUDED.share_slug,
            updated_at = EXCLUDED.updated_at,
            view_count = EXCLUDED.view_count;
    ELSE
        DELETE FROM public.discovery_notes WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RPC FOR INCREMENTING METRICS (Ensuring consistency)
CREATE OR REPLACE FUNCTION public.increment_note_metric(target_note_id UUID, metric_name TEXT)
RETURNS VOID AS $$
BEGIN
    IF metric_name = 'view' THEN
        -- Update the main table
        UPDATE public.notes SET view_count = COALESCE(view_count, 0) + 1 WHERE id = target_note_id;
        
        -- The trigger 'tr_sync_discovery_note' will automatically propagate this to discovery_notes
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. GRANT PERMISSIONS
GRANT EXECUTE ON FUNCTION public.is_admin_check() TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_note_metric(UUID, TEXT) TO authenticated, anon;

-- 7. RECURSIVE KNOWLEDGE GRAPH FETCHER (v20.0.0-PROD)
-- Target: High-performance single-query cluster traversal for AI agents and SSR.
CREATE OR REPLACE FUNCTION public.get_note_graph(p_slug TEXT, p_max_depth INT DEFAULT 3)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSONB;
BEGIN
    WITH RECURSIVE note_tree AS (
        -- Anchor: Find the root note
        SELECT 
            id, title, content, share_slug, tags, color, updated_at, is_shared, 
            published_log_id, is_premium, domain, user_id, parent_id,
            0 as depth
        FROM public.notes
        WHERE share_slug = p_slug AND is_shared = true

        UNION ALL

        -- Recursive Step: Find children
        SELECT 
            n.id, n.title, n.content, n.share_slug, n.tags, n.color, n.updated_at, n.is_shared, 
            n.published_log_id, n.is_premium, n.domain, n.user_id, n.parent_id,
            nt.depth + 1
        FROM public.notes n
        INNER JOIN note_tree nt ON n.parent_id = nt.id
        WHERE n.is_shared = true AND nt.depth < p_max_depth
    )
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', nt.id,
            'title', nt.title,
            'content', nt.content,
            'share_slug', nt.share_slug,
            'tags', nt.tags,
            'color', nt.color,
            'updated_at', nt.updated_at,
            'is_shared', nt.is_shared,
            'published_log_id', nt.published_log_id,
            'is_premium', nt.is_premium,
            'domain', nt.domain,
            'user_id', nt.user_id,
            'parent_id', nt.parent_id,
            'depth', nt.depth,
            'profiles', (
                SELECT jsonb_build_object(
                    'full_name', p.full_name,
                    'avatar_url', p.avatar_url
                )
                FROM public.profiles p
                WHERE p.id = nt.user_id
            )
        )
    ) INTO result
    FROM note_tree nt;

    RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_note_graph(TEXT, INT) TO authenticated, anon;
