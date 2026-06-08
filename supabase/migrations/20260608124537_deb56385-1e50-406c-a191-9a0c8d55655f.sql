ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_type text NOT NULL DEFAULT 'adult' CHECK (account_type IN ('adult','parent')),
  ADD COLUMN IF NOT EXISTS kid_name text,
  ADD COLUMN IF NOT EXISTS kid_age integer;