
-- =============================================================
-- Phase 3: security hardening, RLS fixes, indexes, grants
-- =============================================================

-- 1) Fix exercises "Teacher manages own exercises" — add role check to USING
DROP POLICY IF EXISTS "Teacher manages own exercises" ON public.exercises;
CREATE POLICY "Teacher manages own exercises" ON public.exercises
  FOR ALL
  USING (teacher_id = auth.uid() AND public.has_role(auth.uid(),'teacher'))
  WITH CHECK (teacher_id = auth.uid() AND public.has_role(auth.uid(),'teacher'));

-- 2) Consolidate duplicate teacher_availability SELECT policies
DROP POLICY IF EXISTS "Anyone can view availability" ON public.teacher_availability;
DROP POLICY IF EXISTS "Anyone signed in can view availability" ON public.teacher_availability;
CREATE POLICY "Signed-in users view availability" ON public.teacher_availability
  FOR SELECT TO authenticated USING (true);

-- 3) Revoke EXECUTE from anon on privileged RPCs
REVOKE EXECUTE ON FUNCTION public.generate_teacher_code(timestamptz) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.generate_teacher_code(timestamptz, integer, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.revoke_teacher_code(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.submit_exercise(uuid, jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.submit_exercise(uuid, jsonb, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.notify_teacher_on_submission() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.generate_teacher_code(timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_teacher_code(timestamptz, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_teacher_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_exercise(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_exercise(uuid, jsonb, integer) TO authenticated;

-- 4) Performance indexes
CREATE INDEX IF NOT EXISTS idx_exercises_teacher ON public.exercises(teacher_id);
CREATE INDEX IF NOT EXISTS idx_exercise_submissions_student ON public.exercise_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_exercise_submissions_exercise ON public.exercise_submissions(exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercise_assignments_exercise ON public.exercise_assignments(exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercise_assignments_target ON public.exercise_assignments(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_class_members_class ON public.class_members(class_id);
CREATE INDEX IF NOT EXISTS idx_class_members_student ON public.class_members(student_id);
CREATE INDEX IF NOT EXISTS idx_classes_teacher ON public.classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, read_at);
CREATE INDEX IF NOT EXISTS idx_profiles_parent ON public.profiles(parent_id);

-- =============================================================
-- Phase 1: strict role separation
-- =============================================================

-- Teacher cannot become a student and vice versa in the same account
CREATE OR REPLACE FUNCTION public.user_roles_enforce_exclusivity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.role = 'teacher' AND EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = NEW.user_id AND role = 'student'
  ) THEN
    RAISE EXCEPTION 'Account already has a student role; cannot add teacher';
  END IF;
  IF NEW.role = 'student' AND EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = NEW.user_id AND role = 'teacher'
  ) THEN
    RAISE EXCEPTION 'Account already has a teacher role; cannot add student';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS user_roles_exclusivity ON public.user_roles;
CREATE TRIGGER user_roles_exclusivity
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.user_roles_enforce_exclusivity();

REVOKE EXECUTE ON FUNCTION public.user_roles_enforce_exclusivity() FROM PUBLIC, anon, authenticated;

-- =============================================================
-- Phase 2: exercise content — video_url + collections library
-- =============================================================

-- Optional cover video URL at exercise level (stored on the row for filtering)
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS video_url text;

-- Curriculum-aligned starter collections (templates readable by everyone signed in)
CREATE TABLE IF NOT EXISTS public.exercise_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  language text NOT NULL,           -- 'fr' | 'en' | 'ar' | 'de' | 'it'
  track text NOT NULL,              -- 'kids' | 'adults'
  level text NOT NULL,              -- primary/prep/secondary or A1..C2
  topic text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.exercise_collections TO authenticated;
GRANT ALL ON public.exercise_collections TO service_role;
ALTER TABLE public.exercise_collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "collections readable by signed-in" ON public.exercise_collections
  FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.exercise_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid NOT NULL REFERENCES public.exercise_collections(id) ON DELETE CASCADE,
  title text NOT NULL,
  type text NOT NULL,               -- mcq | true_false | fill_blank | matching | ordering | flashcards
  content jsonb NOT NULL,
  video_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.exercise_templates TO authenticated;
GRANT ALL ON public.exercise_templates TO service_role;
ALTER TABLE public.exercise_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "templates readable by signed-in" ON public.exercise_templates
  FOR SELECT TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_templates_collection ON public.exercise_templates(collection_id);
CREATE INDEX IF NOT EXISTS idx_collections_filters ON public.exercise_collections(language, track, level);

-- RPC: a teacher clones a template into their own exercises
CREATE OR REPLACE FUNCTION public.clone_template_to_exercise(_template_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  t public.exercise_templates;
  new_id uuid;
BEGIN
  IF NOT public.has_role(auth.uid(),'teacher') THEN RAISE EXCEPTION 'Teacher only'; END IF;
  SELECT * INTO t FROM public.exercise_templates WHERE id = _template_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Template not found'; END IF;
  INSERT INTO public.exercises (teacher_id, title, type, content, video_url, published, visibility)
  VALUES (auth.uid(), t.title, t.type, t.content, t.video_url, false, 'private')
  RETURNING id INTO new_id;
  RETURN new_id;
END $$;

REVOKE EXECUTE ON FUNCTION public.clone_template_to_exercise(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.clone_template_to_exercise(uuid) TO authenticated;

-- Reload PostgREST
NOTIFY pgrst, 'reload schema';
