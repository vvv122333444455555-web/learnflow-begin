-- Teachers now sign up with just email + password (no invite code required).
-- This is a deliberate simplification requested by the platform owner —
-- it trades off admin control over who becomes a teacher for a smoother
-- onboarding flow. The old code-based system (teacher_codes,
-- redeem_teacher_code) is left in place but unused, so nothing breaks and
-- it can be revived later if stricter control is needed again.

CREATE OR REPLACE FUNCTION public.self_register_as_teacher()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'student') THEN
    RAISE EXCEPTION 'Student accounts cannot become teacher accounts';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (auth.uid(), 'teacher')
  ON CONFLICT DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.self_register_as_teacher() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.self_register_as_teacher() TO authenticated;

NOTIFY pgrst, 'reload schema';
