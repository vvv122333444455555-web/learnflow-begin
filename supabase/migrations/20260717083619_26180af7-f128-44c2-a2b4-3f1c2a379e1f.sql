CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  meta jsonb := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  _raw_track text := NULLIF(meta->>'track', '');
  _raw_account_type text := NULLIF(meta->>'account_type', '');
  _track text;
  _account_type text;
BEGIN
  _account_type := CASE
    WHEN _raw_account_type IN ('adult', 'child', 'parent') THEN _raw_account_type
    WHEN _raw_track = 'kids' THEN 'child'
    ELSE 'adult'
  END;

  _track := CASE
    WHEN _raw_track IN ('kids', 'adults') THEN _raw_track
    WHEN _account_type IN ('child', 'parent') THEN 'kids'
    ELSE 'adults'
  END;

  INSERT INTO public.profiles (id, full_name, email, track, account_type)
  VALUES (
    NEW.id,
    COALESCE(meta->>'full_name', meta->>'name'),
    NEW.email,
    _track,
    _account_type
  )
  ON CONFLICT (id) DO UPDATE
    SET full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
        email = COALESCE(public.profiles.email, EXCLUDED.email),
        track = COALESCE(public.profiles.track, EXCLUDED.track),
        account_type = CASE
          WHEN public.profiles.account_type = 'adult' AND EXCLUDED.account_type IN ('child', 'parent') THEN EXCLUDED.account_type
          ELSE public.profiles.account_type
        END,
        updated_at = now();

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.profiles (id, full_name, email, track, account_type)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name'),
  u.email,
  CASE
    WHEN u.raw_user_meta_data->>'track' IN ('kids', 'adults') THEN u.raw_user_meta_data->>'track'
    WHEN u.raw_user_meta_data->>'account_type' IN ('child', 'parent') THEN 'kids'
    ELSE 'adults'
  END,
  CASE
    WHEN u.raw_user_meta_data->>'account_type' IN ('adult', 'child', 'parent') THEN u.raw_user_meta_data->>'account_type'
    WHEN u.raw_user_meta_data->>'track' = 'kids' THEN 'child'
    ELSE 'adult'
  END
FROM auth.users u
ON CONFLICT (id) DO UPDATE
  SET full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
      email = COALESCE(public.profiles.email, EXCLUDED.email),
      track = COALESCE(public.profiles.track, EXCLUDED.track),
      account_type = CASE
        WHEN public.profiles.account_type = 'adult' AND EXCLUDED.account_type IN ('child', 'parent') THEN EXCLUDED.account_type
        ELSE public.profiles.account_type
      END,
      updated_at = now();

UPDATE public.profiles
SET track = CASE WHEN account_type IN ('child', 'parent') THEN 'kids' ELSE 'adults' END,
    updated_at = now()
WHERE track IS NULL;