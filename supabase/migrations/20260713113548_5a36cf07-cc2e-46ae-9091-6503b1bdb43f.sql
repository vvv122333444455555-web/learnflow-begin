
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS track text CHECK (track IN ('kids','adults')),
  ADD COLUMN IF NOT EXISTS learning_goal text CHECK (learning_goal IN ('travel','work','exam','general')),
  ADD COLUMN IF NOT EXISTS cefr_level text,
  ADD COLUMN IF NOT EXISTS points integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS badges jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS teacher_profile_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS specialty_language text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS avatar_url text;

DROP POLICY IF EXISTS "Parents view their children" ON public.profiles;
CREATE POLICY "Parents view their children" ON public.profiles
  FOR SELECT TO authenticated USING (parent_id = auth.uid());

CREATE OR REPLACE FUNCTION public.profiles_block_privileged_updates()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.is_premium IS DISTINCT FROM OLD.is_premium
     OR NEW.premium_until IS DISTINCT FROM OLD.premium_until
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

CREATE TABLE IF NOT EXISTS public.teacher_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  used_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at timestamptz,
  expires_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teacher_codes TO authenticated;
GRANT ALL ON public.teacher_codes TO service_role;
ALTER TABLE public.teacher_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage teacher_codes" ON public.teacher_codes;
CREATE POLICY "Admins manage teacher_codes" ON public.teacher_codes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "Teachers view their code" ON public.teacher_codes;
CREATE POLICY "Teachers view their code" ON public.teacher_codes
  FOR SELECT TO authenticated USING (used_by = auth.uid());

CREATE TABLE IF NOT EXISTS public.classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  language text,
  level text,
  track text CHECK (track IN ('kids','adults')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.classes TO authenticated;
GRANT ALL ON public.classes TO service_role;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Teachers manage own classes" ON public.classes;
CREATE POLICY "Teachers manage own classes" ON public.classes
  FOR ALL TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid() AND public.has_role(auth.uid(),'teacher'));
DROP TRIGGER IF EXISTS classes_updated_at ON public.classes;
CREATE TRIGGER classes_updated_at BEFORE UPDATE ON public.classes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.class_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (class_id, student_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_members TO authenticated;
GRANT ALL ON public.class_members TO service_role;
ALTER TABLE public.class_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Teacher manages class_members" ON public.class_members;
CREATE POLICY "Teacher manages class_members" ON public.class_members
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.classes c WHERE c.id = class_id AND c.teacher_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.classes c WHERE c.id = class_id AND c.teacher_id = auth.uid()));
DROP POLICY IF EXISTS "Student sees own memberships" ON public.class_members;
CREATE POLICY "Student sees own memberships" ON public.class_members
  FOR SELECT TO authenticated USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Teachers view their students" ON public.profiles;
CREATE POLICY "Teachers view their students" ON public.profiles
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.class_members cm
    JOIN public.classes c ON c.id = cm.class_id
    WHERE cm.student_id = profiles.id AND c.teacher_id = auth.uid()
  ));

CREATE TABLE IF NOT EXISTS public.exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  type text NOT NULL CHECK (type IN ('mcq','fill_blank','matching','ordering','true_false','flashcards')),
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  time_limit_sec integer,
  max_attempts integer NOT NULL DEFAULT 1,
  published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exercises TO authenticated;
GRANT ALL ON public.exercises TO service_role;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.exercise_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id uuid NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('class','student')),
  target_id uuid NOT NULL,
  due_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exercise_assignments TO authenticated;
GRANT ALL ON public.exercise_assignments TO service_role;
ALTER TABLE public.exercise_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teacher manages own exercises" ON public.exercises;
CREATE POLICY "Teacher manages own exercises" ON public.exercises
  FOR ALL TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid() AND public.has_role(auth.uid(),'teacher'));
DROP POLICY IF EXISTS "Assigned students view published exercises" ON public.exercises;
CREATE POLICY "Assigned students view published exercises" ON public.exercises
  FOR SELECT TO authenticated USING (
    published = true AND EXISTS (
      SELECT 1 FROM public.exercise_assignments ea
      WHERE ea.exercise_id = exercises.id
      AND (
        (ea.target_type='student' AND ea.target_id = auth.uid())
        OR (ea.target_type='class' AND EXISTS (
          SELECT 1 FROM public.class_members cm WHERE cm.class_id = ea.target_id AND cm.student_id = auth.uid()
        ))
      )
    )
  );
DROP TRIGGER IF EXISTS exercises_updated_at ON public.exercises;
CREATE TRIGGER exercises_updated_at BEFORE UPDATE ON public.exercises
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP POLICY IF EXISTS "Teacher manages assignments for own exercises" ON public.exercise_assignments;
CREATE POLICY "Teacher manages assignments for own exercises" ON public.exercise_assignments
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.exercises e WHERE e.id = exercise_id AND e.teacher_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.exercises e WHERE e.id = exercise_id AND e.teacher_id = auth.uid()));
DROP POLICY IF EXISTS "Students view own assignments" ON public.exercise_assignments;
CREATE POLICY "Students view own assignments" ON public.exercise_assignments
  FOR SELECT TO authenticated USING (
    (target_type='student' AND target_id = auth.uid())
    OR (target_type='class' AND EXISTS (
      SELECT 1 FROM public.class_members cm WHERE cm.class_id = target_id AND cm.student_id = auth.uid()
    ))
  );

CREATE TABLE IF NOT EXISTS public.exercise_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id uuid NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  score numeric NOT NULL DEFAULT 0,
  max_score numeric NOT NULL DEFAULT 0,
  attempt_number integer NOT NULL DEFAULT 1,
  submitted_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exercise_submissions TO authenticated;
GRANT ALL ON public.exercise_submissions TO service_role;
ALTER TABLE public.exercise_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Student sees own submissions" ON public.exercise_submissions;
CREATE POLICY "Student sees own submissions" ON public.exercise_submissions
  FOR SELECT TO authenticated USING (student_id = auth.uid());
DROP POLICY IF EXISTS "Teacher sees submissions for own exercises" ON public.exercise_submissions;
CREATE POLICY "Teacher sees submissions for own exercises" ON public.exercise_submissions
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.exercises e WHERE e.id = exercise_id AND e.teacher_id = auth.uid()));
DROP POLICY IF EXISTS "Parent sees own children submissions" ON public.exercise_submissions;
CREATE POLICY "Parent sees own children submissions" ON public.exercise_submissions
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = student_id AND p.parent_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Participants read messages" ON public.messages;
CREATE POLICY "Participants read messages" ON public.messages
  FOR SELECT TO authenticated USING (sender_id = auth.uid() OR recipient_id = auth.uid());
DROP POLICY IF EXISTS "Users send messages" ON public.messages;
CREATE POLICY "Users send messages" ON public.messages
  FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());
DROP POLICY IF EXISTS "Recipient marks read" ON public.messages;
CREATE POLICY "Recipient marks read" ON public.messages
  FOR UPDATE TO authenticated USING (recipient_id = auth.uid()) WITH CHECK (recipient_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  language text,
  skill text NOT NULL CHECK (skill IN ('reading','listening','writing','speaking','vocab','grammar')),
  score numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, language, skill)
);
GRANT SELECT, INSERT, UPDATE ON public.progress TO authenticated;
GRANT ALL ON public.progress TO service_role;
ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Student sees own progress" ON public.progress;
CREATE POLICY "Student sees own progress" ON public.progress
  FOR SELECT TO authenticated USING (student_id = auth.uid());
DROP POLICY IF EXISTS "Parent sees children progress" ON public.progress;
CREATE POLICY "Parent sees children progress" ON public.progress
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = student_id AND p.parent_id = auth.uid()));
DROP POLICY IF EXISTS "Teacher sees own students progress" ON public.progress;
CREATE POLICY "Teacher sees own students progress" ON public.progress
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.class_members cm
    JOIN public.classes c ON c.id = cm.class_id
    WHERE cm.student_id = progress.student_id AND c.teacher_id = auth.uid()
  ));

CREATE OR REPLACE FUNCTION public.generate_teacher_code(_expires_at timestamptz DEFAULT NULL)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE new_code text;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin only'; END IF;
  new_code := 'TCH-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
  INSERT INTO public.teacher_codes(code, created_by, expires_at) VALUES (new_code, auth.uid(), _expires_at);
  RETURN new_code;
END;
$$;

CREATE OR REPLACE FUNCTION public.redeem_teacher_code(_code text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE tc public.teacher_codes;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO tc FROM public.teacher_codes WHERE code = _code FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invalid code'; END IF;
  IF NOT tc.active THEN RAISE EXCEPTION 'Code inactive'; END IF;
  IF tc.used_by IS NOT NULL AND tc.used_by <> auth.uid() THEN RAISE EXCEPTION 'Code already used'; END IF;
  IF tc.expires_at IS NOT NULL AND tc.expires_at < now() THEN RAISE EXCEPTION 'Code expired'; END IF;
  UPDATE public.teacher_codes SET used_by = auth.uid(), used_at = COALESCE(used_at, now()) WHERE id = tc.id;
  INSERT INTO public.user_roles(user_id, role) VALUES (auth.uid(),'teacher') ON CONFLICT DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_teacher_profile(_full_name text, _specialty text, _bio text, _avatar text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'teacher') THEN RAISE EXCEPTION 'Teacher only'; END IF;
  UPDATE public.profiles SET
    full_name = COALESCE(NULLIF(_full_name,''), full_name),
    specialty_language = _specialty,
    bio = _bio,
    avatar_url = _avatar,
    teacher_profile_completed = true,
    updated_at = now()
  WHERE id = auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_exercise(_exercise_id uuid, _answers jsonb)
RETURNS TABLE(score numeric, max_score numeric) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  ex public.exercises;
  correct_count int := 0;
  total int := 0;
  q jsonb;
  q_idx int := 0;
  sel jsonb;
  attempts int;
  is_assigned boolean;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO ex FROM public.exercises WHERE id = _exercise_id;
  IF NOT FOUND OR NOT ex.published THEN RAISE EXCEPTION 'Exercise not available'; END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.exercise_assignments ea WHERE ea.exercise_id = ex.id AND (
      (ea.target_type='student' AND ea.target_id = auth.uid())
      OR (ea.target_type='class' AND EXISTS (SELECT 1 FROM public.class_members cm WHERE cm.class_id = ea.target_id AND cm.student_id = auth.uid()))
    )
  ) INTO is_assigned;
  IF NOT is_assigned THEN RAISE EXCEPTION 'Not assigned'; END IF;

  SELECT COUNT(*) INTO attempts FROM public.exercise_submissions WHERE exercise_id = ex.id AND student_id = auth.uid();
  IF attempts >= ex.max_attempts THEN RAISE EXCEPTION 'No attempts left'; END IF;

  IF ex.type = 'mcq' THEN
    FOR q IN SELECT * FROM jsonb_array_elements(ex.content->'questions') LOOP
      sel := _answers -> q_idx::text;
      IF sel IS NOT NULL AND (q->'correct') = sel THEN correct_count := correct_count + 1; END IF;
      q_idx := q_idx + 1;
      total := total + 1;
    END LOOP;
  ELSIF ex.type = 'true_false' THEN
    FOR q IN SELECT * FROM jsonb_array_elements(ex.content->'questions') LOOP
      sel := _answers -> q_idx::text;
      IF sel IS NOT NULL AND (q->>'correct')::boolean = (sel#>>'{}')::boolean THEN correct_count := correct_count + 1; END IF;
      q_idx := q_idx + 1;
      total := total + 1;
    END LOOP;
  ELSE
    total := COALESCE(jsonb_array_length(ex.content->'questions'), 0);
  END IF;

  INSERT INTO public.exercise_submissions(exercise_id, student_id, answers, score, max_score, attempt_number)
  VALUES (_exercise_id, auth.uid(), _answers, correct_count, total, attempts + 1);

  IF correct_count > 0 THEN
    UPDATE public.profiles SET points = points + (correct_count * 10)
    WHERE id = auth.uid() AND track = 'kids';
  END IF;

  score := correct_count;
  max_score := total;
  RETURN NEXT;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.generate_teacher_code(timestamptz) FROM public;
GRANT EXECUTE ON FUNCTION public.generate_teacher_code(timestamptz) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.redeem_teacher_code(text) FROM public;
GRANT EXECUTE ON FUNCTION public.redeem_teacher_code(text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.complete_teacher_profile(text,text,text,text) FROM public;
GRANT EXECUTE ON FUNCTION public.complete_teacher_profile(text,text,text,text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.submit_exercise(uuid,jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.submit_exercise(uuid,jsonb) TO authenticated;
