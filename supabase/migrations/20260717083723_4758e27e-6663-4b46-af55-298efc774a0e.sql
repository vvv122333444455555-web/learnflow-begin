CREATE OR REPLACE FUNCTION public.set_my_student_track(_track text, _account_type text DEFAULT NULL)
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

  UPDATE public.profiles
     SET track = _track,
         account_type = next_account_type,
         updated_at = now()
   WHERE id = auth.uid()
   RETURNING * INTO updated_profile;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  RETURN updated_profile;
END;
$function$;

REVOKE ALL ON FUNCTION public.set_my_student_track(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_my_student_track(text, text) TO authenticated;