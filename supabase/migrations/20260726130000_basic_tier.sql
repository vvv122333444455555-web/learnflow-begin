-- ============================================================
-- Two-tier subscription model: cheap "basic" (exercise library
-- access) vs. expensive "premium" (live sessions, certificates,
-- everything). Premium already existed via is_premium/premium_until;
-- this adds the basic tier alongside it.
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS has_basic_subscription boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS basic_subscription_until timestamptz;

-- Extend the privileged-fields guard to cover the new subscription fields too,
-- so they can only change through the trusted activate_* RPCs below.
CREATE OR REPLACE FUNCTION public.profiles_block_privileged_updates()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.is_premium IS DISTINCT FROM OLD.is_premium
     OR NEW.premium_until IS DISTINCT FROM OLD.premium_until
     OR NEW.has_basic_subscription IS DISTINCT FROM OLD.has_basic_subscription
     OR NEW.basic_subscription_until IS DISTINCT FROM OLD.basic_subscription_until
     OR NEW.email IS DISTINCT FROM OLD.email
     OR NEW.id IS DISTINCT FROM OLD.id
     OR NEW.account_type IS DISTINCT FROM OLD.account_type
     OR (OLD.track IS NOT NULL AND NEW.track IS DISTINCT FROM OLD.track)
     OR (OLD.parent_id IS NOT NULL AND NEW.parent_id IS DISTINCT FROM OLD.parent_id)
     OR NEW.points IS DISTINCT FROM OLD.points
     OR NEW.badges IS DISTINCT FROM OLD.badges THEN
    IF current_setting('request.jwt.claim.role', true) IN ('anon','authenticated') THEN
      RAISE EXCEPTION 'This field cannot be updated directly';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Basic tier activation (cheap, exercises-focused subscription).
CREATE OR REPLACE FUNCTION public.activate_basic_subscription(
  _amount numeric,
  _currency text,
  _provider text,
  _provider_ref text,
  _days integer
)
RETURNS TABLE (invoice_id uuid, subscription_until timestamptz)
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
  VALUES (uid, 'basic', _amount, COALESCE(_currency,'TND'), 'paid', _provider, _provider_ref)
  RETURNING id INTO inv_id;

  UPDATE public.profiles
     SET has_basic_subscription = true,
         basic_subscription_until = GREATEST(COALESCE(basic_subscription_until, now()), new_until),
         updated_at = now()
   WHERE id = uid;

  invoice_id := inv_id;
  subscription_until := new_until;
  RETURN NEXT;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.activate_basic_subscription(numeric, text, text, text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.activate_basic_subscription(numeric, text, text, text, integer) TO authenticated;

NOTIFY pgrst, 'reload schema';
