-- 1. Add ads_disabled to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ads_disabled BOOLEAN DEFAULT FALSE;

-- 2. Add phone to support_messages (renaming/adding for WhatsApp/Telegram)
ALTER TABLE public.support_messages ADD COLUMN IF NOT EXISTS phone TEXT;

-- 3. Update RLS for support_messages to allow insertion with phone
DROP POLICY IF EXISTS "Anyone can insert messages" ON public.support_messages;
CREATE POLICY "Anyone can insert messages" 
ON public.support_messages FOR INSERT 
WITH CHECK (length(message) > 0);

-- 4. Ensure Admin can see all profiles and messages (already exists but reinforcing)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" 
ON public.profiles FOR UPDATE 
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Admins can view all messages" ON public.support_messages;
CREATE POLICY "Admins can view all messages" 
ON public.support_messages FOR SELECT 
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
