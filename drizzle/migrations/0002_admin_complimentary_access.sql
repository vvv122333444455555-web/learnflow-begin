CREATE TABLE public.complimentary_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  granted_by uuid NOT NULL,
  plan text NOT NULL CHECK (plan IN ('basic','premium')),
  days integer NOT NULL CHECK (days IN (30,365)),
  valid_until timestamptz NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.complimentary_grants TO authenticated;
GRANT ALL ON public.complimentary_grants TO service_role;
ALTER TABLE public.complimentary_grants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read complimentary grants" ON public.complimentary_grants
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.admin_grant_complimentary_access(_user_id uuid, _plan text, _days integer, _reason text DEFAULT NULL)
RETURNS timestamptz LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _until timestamptz; _cur timestamptz;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Administrator only'; END IF;
  IF _plan NOT IN ('basic','premium') OR _days NOT IN (30,365) THEN RAISE EXCEPTION 'Invalid plan or duration'; END IF;
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id=_user_id) THEN RAISE EXCEPTION 'User not found'; END IF;
  IF _plan='premium' THEN
    SELECT premium_until INTO _cur FROM profiles WHERE id=_user_id;
    _until := greatest(coalesce(_cur,now()),now()) + make_interval(days=>_days);
    UPDATE profiles SET is_premium=true, premium_until=_until WHERE id=_user_id;
  ELSE
    SELECT basic_subscription_until INTO _cur FROM profiles WHERE id=_user_id;
    _until := greatest(coalesce(_cur,now()),now()) + make_interval(days=>_days);
    UPDATE profiles SET has_basic_subscription=true, basic_subscription_until=_until WHERE id=_user_id;
  END IF;
  INSERT INTO complimentary_grants(user_id,granted_by,plan,days,valid_until,reason)
  VALUES (_user_id,auth.uid(),_plan,_days,_until,left(_reason,300));
  RETURN _until;
END $$;
REVOKE ALL ON FUNCTION public.admin_grant_complimentary_access(uuid,text,integer,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_grant_complimentary_access(uuid,text,integer,text) TO authenticated;