
CREATE TABLE public.languages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  flag TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.languages TO authenticated, anon;
GRANT ALL ON public.languages TO service_role;
ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view languages" ON public.languages FOR SELECT USING (true);

CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  language_id UUID NOT NULL REFERENCES public.languages(id) ON DELETE CASCADE,
  level TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  duration_weeks INT NOT NULL DEFAULT 8,
  lessons_count INT NOT NULL DEFAULT 24,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.courses TO authenticated, anon;
GRANT ALL ON public.courses TO service_role;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active courses" ON public.courses FOR SELECT USING (is_active = true);
CREATE INDEX courses_language_level_idx ON public.courses(language_id, level);

INSERT INTO public.languages (code, name, flag) VALUES
  ('en', 'الإنجليزية', '🇬🇧'),
  ('fr', 'الفرنسية', '🇫🇷'),
  ('es', 'الإسبانية', '🇪🇸'),
  ('de', 'الألمانية', '🇩🇪'),
  ('tr', 'التركية', '🇹🇷'),
  ('ja', 'اليابانية', '🇯🇵');

INSERT INTO public.courses (language_id, level, title, description, duration_weeks, lessons_count, price)
SELECT l.id, lvl.level, l.name || ' - ' || lvl.title, lvl.descr, lvl.weeks, lvl.lessons, lvl.price
FROM public.languages l
CROSS JOIN (VALUES
  ('A1', 'البداية', 'دورة شاملة للمبتدئين من الصفر', 8, 24, 199),
  ('A2', 'ما قبل المتوسط', 'بناء أساس قوي للمحادثات اليومية', 8, 28, 249),
  ('B1', 'المتوسط', 'تحدّث بثقة في معظم المواقف', 10, 32, 299),
  ('B2', 'فوق المتوسط', 'إتقان النقاشات المعقّدة', 10, 36, 349),
  ('C1', 'المتقدّم', 'الطلاقة في السياقات المهنية', 12, 40, 399),
  ('C2', 'الإتقان', 'مستوى قريب من اللغة الأم', 12, 44, 449)
) AS lvl(level, title, descr, weeks, lessons, price);
