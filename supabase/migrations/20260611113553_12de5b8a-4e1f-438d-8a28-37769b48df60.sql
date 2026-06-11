
-- 1) Lock down SECURITY DEFINER helper functions: only the database itself uses them inside policies
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_zoom_link() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

-- 2) Profiles: prevent users from self-granting premium / changing email
CREATE OR REPLACE FUNCTION public.profiles_block_privileged_updates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- service_role bypasses RLS and triggers on its own definer fns; only end-users hit this path
  IF NEW.is_premium IS DISTINCT FROM OLD.is_premium
     OR NEW.premium_until IS DISTINCT FROM OLD.premium_until
     OR NEW.email IS DISTINCT FROM OLD.email
     OR NEW.id IS DISTINCT FROM OLD.id
     OR NEW.account_type IS DISTINCT FROM OLD.account_type THEN
    IF current_setting('request.jwt.claim.role', true) IN ('anon','authenticated') THEN
      RAISE EXCEPTION 'Updating premium, email, account_type or id is not allowed';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.profiles_block_privileged_updates() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_profiles_block_privileged ON public.profiles;
CREATE TRIGGER trg_profiles_block_privileged
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_block_privileged_updates();

-- 3) Enrollments: prevent direct status flipping to 'completed' from the client
CREATE OR REPLACE FUNCTION public.enrollments_block_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF current_setting('request.jwt.claim.role', true) IN ('anon','authenticated') THEN
      RAISE EXCEPTION 'Status can only be changed via complete_enrollment()';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.enrollments_block_status_change() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_enrollments_block_status ON public.enrollments;
CREATE TRIGGER trg_enrollments_block_status
  BEFORE UPDATE ON public.enrollments
  FOR EACH ROW EXECUTE FUNCTION public.enrollments_block_status_change();

-- Controlled completion: marks status=completed only when every lesson is done
CREATE OR REPLACE FUNCTION public.complete_enrollment(_enrollment_id uuid)
RETURNS public.enrollments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  e public.enrollments;
  total int;
BEGIN
  SELECT * INTO e FROM public.enrollments WHERE id = _enrollment_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Enrollment not found'; END IF;
  IF e.user_id <> auth.uid() THEN RAISE EXCEPTION 'Not your enrollment'; END IF;
  SELECT lessons_count INTO total FROM public.courses WHERE id = e.course_id;
  IF e.completed_lessons < total THEN
    RAISE EXCEPTION 'Cannot complete: % of % lessons done', e.completed_lessons, total;
  END IF;
  UPDATE public.enrollments
     SET status = 'completed', updated_at = now()
   WHERE id = _enrollment_id
   RETURNING * INTO e;
  RETURN e;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.complete_enrollment(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_enrollment(uuid) TO authenticated;

-- 4) Live sessions: enforce that booked teacher actually has the teacher role
DROP POLICY IF EXISTS "Students book sessions" ON public.live_sessions;
CREATE POLICY "Students book sessions"
  ON public.live_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = student_id
    AND public.has_role(teacher_id, 'teacher'::public.app_role)
  );

-- 5) user_roles: only admins can grant or revoke roles
DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins delete roles" ON public.user_roles;

CREATE POLICY "Admins insert roles"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins update roles"
  ON public.user_roles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins delete roles"
  ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 6) Controlled premium activation: invoked from checkout instead of direct UPDATE on profiles
CREATE OR REPLACE FUNCTION public.activate_premium(
  _plan text,
  _amount numeric,
  _currency text,
  _provider text,
  _provider_ref text,
  _days integer
)
RETURNS TABLE (invoice_id uuid, premium_until timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  new_until timestamptz := now() + make_interval(days => GREATEST(_days, 1));
  inv_id uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _amount IS NULL OR _amount <= 0 THEN RAISE EXCEPTION 'Invalid amount'; END IF;
  IF _provider NOT IN ('flouci','card','gpg') THEN RAISE EXCEPTION 'Invalid provider'; END IF;

  INSERT INTO public.invoices (user_id, plan, amount, currency, status, provider, provider_ref)
  VALUES (uid, _plan, _amount, COALESCE(_currency,'TND'), 'paid', _provider, _provider_ref)
  RETURNING id INTO inv_id;

  UPDATE public.profiles
     SET is_premium = true,
         premium_until = GREATEST(COALESCE(premium_until, now()), new_until),
         updated_at = now()
   WHERE id = uid;

  invoice_id := inv_id;
  premium_until := new_until;
  RETURN NEXT;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.activate_premium(text, numeric, text, text, text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.activate_premium(text, numeric, text, text, text, integer) TO authenticated;
