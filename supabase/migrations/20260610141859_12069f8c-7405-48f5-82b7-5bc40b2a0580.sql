
-- 1) Premium fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_premium boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS premium_until timestamptz;

-- 2) Invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text NOT NULL,
  amount numeric(10,2) NOT NULL,
  currency text NOT NULL DEFAULT 'TND',
  status text NOT NULL DEFAULT 'paid',
  provider text NOT NULL DEFAULT 'flouci',
  provider_ref text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.invoices TO authenticated;
GRANT ALL ON public.invoices TO service_role;

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own invoices" ON public.invoices;
CREATE POLICY "Users view own invoices" ON public.invoices
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users create own invoices" ON public.invoices;
CREATE POLICY "Users create own invoices" ON public.invoices
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 3) Auto Zoom link trigger
CREATE OR REPLACE FUNCTION public.generate_zoom_link()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.zoom_link IS NULL
     OR NEW.zoom_link = ''
     OR NEW.zoom_link LIKE '%placeholder%' THEN
    NEW.zoom_link := 'https://zoom.us/j/'
      || (1000000000 + floor(random()*8999999999))::bigint::text
      || '?pwd=' || substr(md5(NEW.id::text || random()::text), 1, 12);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_live_sessions_zoom ON public.live_sessions;
CREATE TRIGGER trg_live_sessions_zoom
  BEFORE INSERT ON public.live_sessions
  FOR EACH ROW EXECUTE FUNCTION public.generate_zoom_link();

-- 4) Tighten teacher_availability: only users with 'teacher' role can write
DROP POLICY IF EXISTS "Teachers manage own availability" ON public.teacher_availability;
DROP POLICY IF EXISTS "Anyone can view availability" ON public.teacher_availability;
DROP POLICY IF EXISTS "Teachers insert own availability" ON public.teacher_availability;
DROP POLICY IF EXISTS "Teachers update own availability" ON public.teacher_availability;
DROP POLICY IF EXISTS "Teachers delete own availability" ON public.teacher_availability;

CREATE POLICY "Anyone can view availability" ON public.teacher_availability
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Teachers insert own availability" ON public.teacher_availability
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = teacher_id AND public.has_role(auth.uid(), 'teacher'));

CREATE POLICY "Teachers update own availability" ON public.teacher_availability
  FOR UPDATE TO authenticated
  USING (auth.uid() = teacher_id AND public.has_role(auth.uid(), 'teacher'))
  WITH CHECK (auth.uid() = teacher_id AND public.has_role(auth.uid(), 'teacher'));

CREATE POLICY "Teachers delete own availability" ON public.teacher_availability
  FOR DELETE TO authenticated
  USING (auth.uid() = teacher_id AND public.has_role(auth.uid(), 'teacher'));

-- 5) Allow users to see their own role rows (needed for client-side RBAC checks)
DROP POLICY IF EXISTS "Users view own roles" ON public.user_roles;
CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
