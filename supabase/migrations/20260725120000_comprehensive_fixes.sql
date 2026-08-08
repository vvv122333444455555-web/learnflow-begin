-- ============================================================
-- 1) Additional profile fields for child registration
-- ============================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS school_grade text,
  ADD COLUMN IF NOT EXISTS school_name text;
-- Note: age reuses the existing kid_age column (added 2026-06-08) to avoid duplication.

-- ============================================================
-- 2) Extend set_my_student_track to accept the new fields
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_my_student_track(
  _track text,
  _account_type text DEFAULT NULL,
  _phone text DEFAULT NULL,
  _age integer DEFAULT NULL,
  _school_grade text DEFAULT NULL,
  _school_name text DEFAULT NULL
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  updated_profile public.profiles;
  next_account_type text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF _track NOT IN ('kids', 'adults') THEN
    RAISE EXCEPTION 'Invalid track';
  END IF;

  IF public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Teacher/admin accounts cannot become student accounts';
  END IF;

  next_account_type := CASE
    WHEN _track = 'kids' THEN COALESCE(NULLIF(_account_type, ''), 'child')
    ELSE 'adult'
  END;

  IF next_account_type NOT IN ('adult', 'child', 'parent') THEN
    RAISE EXCEPTION 'Invalid account type';
  END IF;

  IF _track = 'adults' AND next_account_type <> 'adult' THEN
    RAISE EXCEPTION 'Adults track requires adult account type';
  END IF;

  IF _track = 'kids' AND next_account_type NOT IN ('child', 'parent') THEN
    RAISE EXCEPTION 'Kids track requires child or parent account type';
  END IF;

  -- Required fields for a direct child account
  IF next_account_type = 'child' THEN
    IF _age IS NULL OR _age < 3 OR _age > 18 THEN
      RAISE EXCEPTION 'Valid age (3-18) is required for a child account';
    END IF;
    IF _school_grade IS NULL OR length(trim(_school_grade)) = 0 THEN
      RAISE EXCEPTION 'School grade is required for a child account';
    END IF;
    IF _school_name IS NULL OR length(trim(_school_name)) = 0 THEN
      RAISE EXCEPTION 'School name is required for a child account';
    END IF;
  END IF;

  UPDATE public.profiles
     SET track = _track,
         account_type = next_account_type,
         phone = COALESCE(_phone, phone),
         kid_age = COALESCE(_age, kid_age),
         school_grade = COALESCE(_school_grade, school_grade),
         school_name = COALESCE(_school_name, school_name),
         updated_at = now()
   WHERE id = auth.uid()
   RETURNING * INTO updated_profile;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  RETURN updated_profile;
END;
$function$;

REVOKE ALL ON FUNCTION public.set_my_student_track(text, text, text, integer, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_my_student_track(text, text, text, integer, text, text) TO authenticated;

-- ============================================================
-- 3) Admin-wide read access across the platform
-- ============================================================
DROP POLICY IF EXISTS "Admins view all profiles" ON public.profiles;
CREATE POLICY "Admins view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins view all exercises" ON public.exercises;
CREATE POLICY "Admins view all exercises" ON public.exercises
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins view all exercise_assignments" ON public.exercise_assignments;
CREATE POLICY "Admins view all exercise_assignments" ON public.exercise_assignments
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins view all exercise_submissions" ON public.exercise_submissions;
CREATE POLICY "Admins view all exercise_submissions" ON public.exercise_submissions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins view all classes" ON public.classes;
CREATE POLICY "Admins view all classes" ON public.classes
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins view all class_members" ON public.class_members;
CREATE POLICY "Admins view all class_members" ON public.class_members
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins view all progress" ON public.progress;
CREATE POLICY "Admins view all progress" ON public.progress
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins view all teacher_availability" ON public.teacher_availability;
CREATE POLICY "Admins view all teacher_availability" ON public.teacher_availability
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins view all live_sessions" ON public.live_sessions;
CREATE POLICY "Admins view all live_sessions" ON public.live_sessions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

NOTIFY pgrst, 'reload schema';
