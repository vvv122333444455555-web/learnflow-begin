
-- Update handle_new_user to read track/account_type from auth metadata,
-- so signup can atomically flag Kids vs Adults without hitting the
-- privileged-updates block trigger from the client.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  meta jsonb := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  _track text := NULLIF(meta->>'track', '');
  _account_type text := NULLIF(meta->>'account_type', '');
BEGIN
  INSERT INTO public.profiles (id, full_name, email, track, account_type)
  VALUES (
    NEW.id,
    COALESCE(meta->>'full_name', meta->>'name'),
    NEW.email,
    _track,
    COALESCE(_account_type, 'adult')
  );
  RETURN NEW;
END;
$function$;
