
-- ============ Phase 1: Teacher codes engine ============
ALTER TABLE public.teacher_codes
  ADD COLUMN IF NOT EXISTS max_uses int NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS use_count int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS revoked_at timestamptz;

-- Backfill use_count from used_by
UPDATE public.teacher_codes SET use_count = 1 WHERE used_by IS NOT NULL AND use_count = 0;

-- New generator with options (TCH-XXXX format, optional multi-use)
CREATE OR REPLACE FUNCTION public.generate_teacher_code(
  _expires_at timestamptz DEFAULT NULL,
  _max_uses int DEFAULT 1,
  _prefix text DEFAULT 'TCH'
)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  new_code text;
  suffix text;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin only'; END IF;
  suffix := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 4));
  new_code := _prefix || '-' || suffix;
  INSERT INTO public.teacher_codes(code, created_by, expires_at, max_uses)
  VALUES (new_code, auth.uid(), _expires_at, GREATEST(_max_uses,1));
  RETURN new_code;
END;
$$;

-- Revoke code
CREATE OR REPLACE FUNCTION public.revoke_teacher_code(_code text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin only'; END IF;
  UPDATE public.teacher_codes
     SET active = false, revoked_at = now()
   WHERE code = _code;
END;
$$;

-- Redeem: support multi-use codes
CREATE OR REPLACE FUNCTION public.redeem_teacher_code(_code text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE tc public.teacher_codes;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO tc FROM public.teacher_codes WHERE code = _code FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invalid code'; END IF;
  IF NOT tc.active OR tc.revoked_at IS NOT NULL THEN RAISE EXCEPTION 'Code inactive'; END IF;
  IF tc.expires_at IS NOT NULL AND tc.expires_at < now() THEN RAISE EXCEPTION 'Code expired'; END IF;
  IF tc.use_count >= tc.max_uses THEN RAISE EXCEPTION 'Code fully used'; END IF;
  UPDATE public.teacher_codes
     SET use_count = use_count + 1,
         used_by = COALESCE(used_by, auth.uid()),
         used_at = COALESCE(used_at, now())
   WHERE id = tc.id;
  INSERT INTO public.user_roles(user_id, role) VALUES (auth.uid(),'teacher') ON CONFLICT DO NOTHING;
END;
$$;

-- ============ Phase 2: Exercises visibility & targeting ============
ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'private' CHECK (visibility IN ('private','public')),
  ADD COLUMN IF NOT EXISTS target_track text CHECK (target_track IN ('kids','adults')),
  ADD COLUMN IF NOT EXISTS target_grade text,
  ADD COLUMN IF NOT EXISTS target_module text,
  ADD COLUMN IF NOT EXISTS target_term text,
  ADD COLUMN IF NOT EXISTS target_language text,
  ADD COLUMN IF NOT EXISTS target_level text;

-- Allow anyone authenticated to read PUBLISHED + PUBLIC exercises
DROP POLICY IF EXISTS "public exercises readable" ON public.exercises;
CREATE POLICY "public exercises readable" ON public.exercises
  FOR SELECT TO authenticated
  USING (published = true AND visibility = 'public');

-- ============ Phase 3: Submissions extras + notifications ============
ALTER TABLE public.exercise_submissions
  ADD COLUMN IF NOT EXISTS time_taken_seconds int,
  ADD COLUMN IF NOT EXISTS teacher_feedback text;

-- Teacher can update feedback on submissions for their exercises
DROP POLICY IF EXISTS "teacher writes feedback" ON public.exercise_submissions;
CREATE POLICY "teacher writes feedback" ON public.exercise_submissions
  FOR UPDATE TO authenticated
  USING (public.is_exercise_owner(exercise_id, auth.uid()))
  WITH CHECK (public.is_exercise_owner(exercise_id, auth.uid()));

-- Update submit_exercise to accept time_taken
CREATE OR REPLACE FUNCTION public.submit_exercise(
  _exercise_id uuid,
  _answers jsonb,
  _time_taken_seconds int DEFAULT NULL
)
RETURNS TABLE(score numeric, max_score numeric)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  ex public.exercises;
  correct_count int := 0;
  total int := 0;
  q jsonb;
  q_idx int := 0;
  sel jsonb;
  attempts int;
  norm_sel text[];
  norm_ans text[];
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO ex FROM public.exercises WHERE id = _exercise_id;
  IF NOT FOUND OR NOT ex.published THEN RAISE EXCEPTION 'Exercise not available'; END IF;

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
    total := COALESCE(jsonb_array_length(ex.content->'cards'), 0);
    correct_count := total;
  ELSE
    total := COALESCE(jsonb_array_length(ex.content->'questions'), 0);
  END IF;

  INSERT INTO public.exercise_submissions(exercise_id, student_id, answers, score, max_score, attempt_number, time_taken_seconds)
  VALUES (_exercise_id, auth.uid(), _answers, correct_count, total, attempts + 1, _time_taken_seconds);

  IF correct_count > 0 THEN
    UPDATE public.profiles SET points = points + (correct_count * 10)
    WHERE id = auth.uid() AND track = 'kids';
  END IF;

  score := correct_count; max_score := total; RETURN NEXT;
END;
$$;

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  payload jsonb DEFAULT '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own notifications read" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own notifications update" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own notifications delete" ON public.notifications
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications(user_id, read_at, created_at DESC);

-- Trigger: notify teacher when a student submits their exercise
CREATE OR REPLACE FUNCTION public.notify_teacher_on_submission()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  teacher uuid;
  ex_title text;
  student_name text;
BEGIN
  SELECT teacher_id, title INTO teacher, ex_title FROM public.exercises WHERE id = NEW.exercise_id;
  IF teacher IS NULL OR teacher = NEW.student_id THEN RETURN NEW; END IF;
  SELECT COALESCE(full_name, email, 'طالب') INTO student_name FROM public.profiles WHERE id = NEW.student_id;
  INSERT INTO public.notifications(user_id, type, title, body, link, payload)
  VALUES (teacher, 'submission',
          'تسليم جديد: ' || ex_title,
          student_name || ' — ' || NEW.score || '/' || NEW.max_score,
          '/teach/exercise/' || NEW.exercise_id,
          jsonb_build_object('exercise_id', NEW.exercise_id, 'submission_id', NEW.id, 'student_id', NEW.student_id));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_teacher_submission ON public.exercise_submissions;
CREATE TRIGGER trg_notify_teacher_submission
  AFTER INSERT ON public.exercise_submissions
  FOR EACH ROW EXECUTE FUNCTION public.notify_teacher_on_submission();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
