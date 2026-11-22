REVOKE EXECUTE ON FUNCTION public.activate_premium(text,numeric,text,text,text,integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.activate_basic_subscription(numeric,text,text,text,integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.activate_premium(text,numeric,text,text,text,integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.activate_basic_subscription(numeric,text,text,text,integer) TO service_role;
DROP POLICY IF EXISTS "Users create own invoices" ON public.invoices;
REVOKE INSERT, UPDATE, DELETE ON public.invoices FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.set_my_student_track(text,text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.set_my_student_track(text,text,text,integer,text,text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_exists() FROM PUBLIC;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS parental_consent_at timestamptz;

CREATE OR REPLACE FUNCTION public.profiles_block_privileged_updates()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.is_premium IS DISTINCT FROM OLD.is_premium
     OR NEW.premium_until IS DISTINCT FROM OLD.premium_until
     OR NEW.has_basic_subscription IS DISTINCT FROM OLD.has_basic_subscription
     OR NEW.basic_subscription_until IS DISTINCT FROM OLD.basic_subscription_until
     OR NEW.email IS DISTINCT FROM OLD.email
     OR NEW.id IS DISTINCT FROM OLD.id
     OR NEW.account_type IS DISTINCT FROM OLD.account_type
     OR (OLD.track IS NOT NULL AND NEW.track IS DISTINCT FROM OLD.track)
     OR NEW.parent_id IS DISTINCT FROM OLD.parent_id
     OR NEW.parental_consent_at IS DISTINCT FROM OLD.parental_consent_at
     OR NEW.points IS DISTINCT FROM OLD.points
     OR NEW.badges IS DISTINCT FROM OLD.badges THEN
    IF current_setting('request.jwt.claim.role', true) IN ('anon','authenticated') THEN
      RAISE EXCEPTION 'This field cannot be updated directly';
    END IF;
  END IF;
  RETURN NEW;
END $$;

-- Block self-inserting a profile with privileged values
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id AND is_premium = false AND has_basic_subscription = false
              AND points = 0 AND parent_id IS NULL AND parental_consent_at IS NULL);

-- Child sign-up: school name/phone no longer required
CREATE OR REPLACE FUNCTION public.set_my_student_track(_track text, _account_type text DEFAULT NULL, _phone text DEFAULT NULL, _age integer DEFAULT NULL, _school_grade text DEFAULT NULL, _school_name text DEFAULT NULL)
 RETURNS profiles LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE updated_profile public.profiles; next_account_type text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _track NOT IN ('kids','adults') THEN RAISE EXCEPTION 'Invalid track'; END IF;
  IF public.has_role(auth.uid(),'teacher') OR public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'Teacher/admin accounts cannot become student accounts';
  END IF;
  next_account_type := CASE WHEN _track='kids' THEN COALESCE(NULLIF(_account_type,''),'child') ELSE 'adult' END;
  IF next_account_type NOT IN ('adult','child','parent') THEN RAISE EXCEPTION 'Invalid account type'; END IF;
  IF _track='adults' AND next_account_type<>'adult' THEN RAISE EXCEPTION 'Adults track requires adult account type'; END IF;
  IF _age IS NOT NULL AND (_age < 3 OR _age > 18) THEN RAISE EXCEPTION 'Invalid age'; END IF;
  UPDATE public.profiles SET track=_track, account_type=next_account_type,
    phone = CASE WHEN next_account_type='child' THEN phone ELSE COALESCE(_phone, phone) END,
    kid_age = COALESCE(_age, kid_age),
    school_grade = COALESCE(_school_grade, school_grade),
    updated_at = now()
  WHERE id = auth.uid() RETURNING * INTO updated_profile;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profile not found'; END IF;
  RETURN updated_profile;
END $$;

-- Exercise submission: must be assigned, or public for the student's track
CREATE OR REPLACE FUNCTION public.can_student_access_exercise(_exercise_id uuid, _user_id uuid)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.exercises e WHERE e.id = _exercise_id AND e.published
      AND ( public.is_exercise_assigned_to_user(e.id, _user_id)
            OR (e.visibility = 'public' AND (e.target_track IS NULL
                OR e.target_track = (SELECT p.track FROM public.profiles p WHERE p.id = _user_id))) )
  )
$$;
REVOKE EXECUTE ON FUNCTION public.can_student_access_exercise(uuid,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_student_access_exercise(uuid,uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.submit_exercise(_exercise_id uuid, _answers jsonb, _time_taken_seconds integer DEFAULT NULL)
 RETURNS TABLE(score numeric, max_score numeric) LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE ex public.exercises; correct_count int := 0; total int := 0; q jsonb; q_idx int := 0; sel jsonb; attempts int; norm_sel text[]; norm_ans text[];
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO ex FROM public.exercises WHERE id = _exercise_id;
  IF NOT FOUND OR NOT ex.published THEN RAISE EXCEPTION 'Exercise not available'; END IF;
  IF NOT public.can_student_access_exercise(_exercise_id, auth.uid()) THEN RAISE EXCEPTION 'Exercise not assigned to you'; END IF;
  SELECT COUNT(*) INTO attempts FROM public.exercise_submissions WHERE exercise_id = ex.id AND student_id = auth.uid();
  IF attempts >= ex.max_attempts THEN RAISE EXCEPTION 'No attempts left'; END IF;
  IF ex.type = 'mcq' THEN
    FOR q IN SELECT * FROM jsonb_array_elements(ex.content->'questions') LOOP
      sel := _answers -> q_idx::text;
      IF sel IS NOT NULL AND (q->'correct') = sel THEN correct_count := correct_count + 1; END IF;
      q_idx := q_idx + 1; total := total + 1;
    END LOOP;
  ELSIF ex.type = 'true_false' THEN
    FOR q IN SELECT * FROM jsonb_array_elements(ex.content->'questions') LOOP
      sel := _answers -> q_idx::text;
      IF sel IS NOT NULL AND (q->>'correct')::boolean = (sel#>>'{}')::boolean THEN correct_count := correct_count + 1; END IF;
      q_idx := q_idx + 1; total := total + 1;
    END LOOP;
  ELSIF ex.type = 'fill_blank' THEN
    FOR q IN SELECT * FROM jsonb_array_elements(ex.content->'questions') LOOP
      sel := _answers -> q_idx::text;
      IF sel IS NOT NULL THEN
        norm_sel := ARRAY(SELECT lower(trim(x)) FROM jsonb_array_elements_text(sel) x);
        norm_ans := ARRAY(SELECT lower(trim(x)) FROM jsonb_array_elements_text(q->'blanks') x);
        IF norm_sel = norm_ans THEN correct_count := correct_count + 1; END IF;
      END IF;
      q_idx := q_idx + 1; total := total + 1;
    END LOOP;
  ELSIF ex.type IN ('matching','ordering') THEN
    FOR q IN SELECT * FROM jsonb_array_elements(ex.content->'questions') LOOP
      sel := _answers -> q_idx::text;
      IF sel IS NOT NULL AND sel = (q->'correct') THEN correct_count := correct_count + 1; END IF;
      q_idx := q_idx + 1; total := total + 1;
    END LOOP;
  ELSIF ex.type = 'flashcards' THEN
    total := COALESCE(jsonb_array_length(ex.content->'cards'), 0); correct_count := total;
  ELSE
    total := COALESCE(jsonb_array_length(ex.content->'questions'), 0);
  END IF;
  INSERT INTO public.exercise_submissions(exercise_id, student_id, answers, score, max_score, attempt_number, time_taken_seconds)
  VALUES (_exercise_id, auth.uid(), _answers, correct_count, total, attempts + 1, _time_taken_seconds);
  IF correct_count > 0 THEN
    UPDATE public.profiles SET points = points + (correct_count * 10) WHERE id = auth.uid() AND track = 'kids';
  END IF;
  score := correct_count; max_score := total; RETURN NEXT;
END $$;
-- Retire the older 2-arg overload (it had a lenient assignment check)
REVOKE EXECUTE ON FUNCTION public.submit_exercise(uuid,jsonb) FROM PUBLIC, anon, authenticated;

-- Teachers may only change feedback on submissions
CREATE OR REPLACE FUNCTION public.submissions_feedback_only()
 RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $$
BEGIN
  IF current_setting('request.jwt.claim.role', true) IN ('anon','authenticated')
     AND (NEW.score IS DISTINCT FROM OLD.score OR NEW.max_score IS DISTINCT FROM OLD.max_score
       OR NEW.answers IS DISTINCT FROM OLD.answers OR NEW.student_id IS DISTINCT FROM OLD.student_id
       OR NEW.exercise_id IS DISTINCT FROM OLD.exercise_id OR NEW.attempt_number IS DISTINCT FROM OLD.attempt_number
       OR NEW.submitted_at IS DISTINCT FROM OLD.submitted_at OR NEW.time_taken_seconds IS DISTINCT FROM OLD.time_taken_seconds) THEN
    RAISE EXCEPTION 'Only teacher feedback can be changed';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_submissions_feedback_only ON public.exercise_submissions;
CREATE TRIGGER trg_submissions_feedback_only BEFORE UPDATE ON public.exercise_submissions
  FOR EACH ROW EXECUTE FUNCTION public.submissions_feedback_only();

-- Live sessions: participants cannot swap teacher/student
CREATE OR REPLACE FUNCTION public.live_sessions_lock_parties()
 RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $$
BEGIN
  IF current_setting('request.jwt.claim.role', true) IN ('anon','authenticated')
     AND (NEW.teacher_id IS DISTINCT FROM OLD.teacher_id OR NEW.student_id IS DISTINCT FROM OLD.student_id
          OR NEW.zoom_link IS DISTINCT FROM OLD.zoom_link) THEN
    RAISE EXCEPTION 'Session participants cannot be changed';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_live_sessions_lock_parties ON public.live_sessions;
CREATE TRIGGER trg_live_sessions_lock_parties BEFORE UPDATE ON public.live_sessions
  FOR EACH ROW EXECUTE FUNCTION public.live_sessions_lock_parties();

-- Teachers' student visibility also covers students who submitted to their exercises (needed for analytics)
DROP POLICY IF EXISTS "Teachers view submitters" ON public.profiles;
CREATE POLICY "Teachers view submitters" ON public.profiles FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.exercise_submissions s JOIN public.exercises e ON e.id = s.exercise_id
                 WHERE s.student_id = profiles.id AND e.teacher_id = auth.uid()));