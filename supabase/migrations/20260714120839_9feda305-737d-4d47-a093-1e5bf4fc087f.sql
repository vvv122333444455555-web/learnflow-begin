
-- Public helper: does any admin exist?
CREATE OR REPLACE FUNCTION public.admin_exists()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin')
$$;

GRANT EXECUTE ON FUNCTION public.admin_exists() TO anon, authenticated;

-- Bootstrap first admin (only if none exists). Race-safe via advisory lock.
CREATE OR REPLACE FUNCTION public.bootstrap_first_admin()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext('bootstrap_first_admin'));
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    RAISE EXCEPTION 'Admin already exists';
  END IF;
  INSERT INTO public.user_roles(user_id, role) VALUES (auth.uid(), 'admin')
  ON CONFLICT DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION public.bootstrap_first_admin() TO authenticated;

-- New teacher-code format TN-XXXX-XXXX
CREATE OR REPLACE FUNCTION public.generate_teacher_code(_expires_at timestamptz DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code text;
  p1 text;
  p2 text;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin only'; END IF;
  p1 := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 4));
  p2 := upper(substr(md5(random()::text || clock_timestamp()::text), 5, 4));
  new_code := 'TN-' || p1 || '-' || p2;
  INSERT INTO public.teacher_codes(code, created_by, expires_at) VALUES (new_code, auth.uid(), _expires_at);
  RETURN new_code;
END;
$$;

-- Allow admins to read profiles of teachers who used codes (for name display in admin dashboard)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='Admins can view all profiles'
  ) THEN
    CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;
