
CREATE TABLE IF NOT EXISTS public.teacher_widgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  language_id UUID REFERENCES public.languages(id) ON DELETE SET NULL,
  widget_type TEXT NOT NULL CHECK (widget_type IN ('multiple_choice','fill_blanks','matching_pairs')),
  title TEXT NOT NULL,
  description TEXT,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.teacher_widgets TO authenticated;
GRANT ALL ON public.teacher_widgets TO service_role;

ALTER TABLE public.teacher_widgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers manage own widgets"
  ON public.teacher_widgets FOR ALL TO authenticated
  USING (auth.uid() = teacher_id AND public.has_role(auth.uid(), 'teacher'))
  WITH CHECK (auth.uid() = teacher_id AND public.has_role(auth.uid(), 'teacher'));

CREATE POLICY "Anyone authenticated can view published widgets"
  ON public.teacher_widgets FOR SELECT TO authenticated
  USING (is_published = true);

CREATE TRIGGER trg_teacher_widgets_updated
  BEFORE UPDATE ON public.teacher_widgets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_teacher_widgets_teacher ON public.teacher_widgets(teacher_id);
CREATE INDEX idx_teacher_widgets_lang ON public.teacher_widgets(language_id);
