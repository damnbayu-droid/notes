-- Discovery Intelligence: Categories, Ratings, and Comments

-- 1. Add Category support to Notes
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'General';

-- 2. Create Ratings Table
CREATE TABLE IF NOT EXISTS public.note_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(note_id, user_id)
);

-- 3. Create Comments Table
CREATE TABLE IF NOT EXISTS public.note_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email TEXT,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES public.note_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. RLS for Ratings
ALTER TABLE public.note_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view ratings" ON public.note_ratings;
CREATE POLICY "Anyone can view ratings"
    ON public.note_ratings FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.notes WHERE id = note_ratings.note_id AND (is_shared = true OR is_discoverable = true)));

DROP POLICY IF EXISTS "Authenticated users can rate once" ON public.note_ratings;
CREATE POLICY "Authenticated users can rate once"
    ON public.note_ratings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own rating" ON public.note_ratings;
CREATE POLICY "Users can update their own rating"
    ON public.note_ratings FOR UPDATE
    USING (auth.uid() = user_id);

-- 5. RLS for Comments
ALTER TABLE public.note_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view comments on shared notes" ON public.note_comments;
CREATE POLICY "Anyone can view comments on shared notes"
    ON public.note_comments FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.notes WHERE id = note_comments.note_id AND (is_shared = true OR is_discoverable = true)));

DROP POLICY IF EXISTS "Authenticated users can comment" ON public.note_comments;
CREATE POLICY "Authenticated users can comment"
    ON public.note_comments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own comments" ON public.note_comments;
CREATE POLICY "Users can delete their own comments"
    ON public.note_comments FOR DELETE
    USING (auth.uid() = user_id);

-- 6. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_ratings_note_id ON public.note_ratings(note_id);
CREATE INDEX IF NOT EXISTS idx_comments_note_id ON public.note_comments(note_id);
CREATE INDEX IF NOT EXISTS idx_notes_category ON public.notes(category) WHERE is_discoverable = true;

-- 7. Secure Search Paths for any potential RPCs or triggers
SET search_path = public;
