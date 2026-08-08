-- Additional exercise library seed (batch 2)
DO $$
DECLARE
  col_id uuid;
BEGIN

  INSERT INTO public.exercise_collections (title, description, language, track, level, topic)
  VALUES ('Deutsch für Anfänger - ابتدائي', 'مفردات أساسية', 'German', 'kids', 'primary', 'مفردات أساسية')
  RETURNING id INTO col_id;
  INSERT INTO public.exercise_templates (collection_id, title, type, content)
  VALUES (col_id, 'Tiere', 'flashcards', '{"cards": [{"front": "🐱 Die Katze", "back": "القط"}, {"front": "🐶 Der Hund", "back": "الكلب"}, {"front": "🐦 Der Vogel", "back": "العصفور"}]}'::jsonb);
  INSERT INTO public.exercise_templates (collection_id, title, type, content)
  VALUES (col_id, 'Farben', 'mcq', '{"questions": [{"question": "Welche Farbe hat der Himmel?", "options": ["Rot", "Blau", "Grün", "Schwarz"], "correct": 1}]}'::jsonb);
  INSERT INTO public.exercise_templates (collection_id, title, type, content)
  VALUES (col_id, 'Richtig oder falsch', 'true_false', '{"questions": [{"statement": "Zwei plus zwei ist vier.", "correct": true}]}'::jsonb);

  INSERT INTO public.exercise_collections (title, description, language, track, level, topic)
  VALUES ('Italiano per principianti - ابتدائي', 'vocabolario di base', 'Italian', 'kids', 'primary', 'vocabolario di base')
  RETURNING id INTO col_id;
  INSERT INTO public.exercise_templates (collection_id, title, type, content)
  VALUES (col_id, 'Animali', 'flashcards', '{"cards": [{"front": "🐱 Il gatto", "back": "القط"}, {"front": "🐶 Il cane", "back": "الكلب"}, {"front": "🐦 L''uccello", "back": "العصفور"}]}'::jsonb);
  INSERT INTO public.exercise_templates (collection_id, title, type, content)
  VALUES (col_id, 'Colori', 'mcq', '{"questions": [{"question": "Di che colore è il cielo?", "options": ["Rosso", "Blu", "Verde", "Nero"], "correct": 1}]}'::jsonb);
  INSERT INTO public.exercise_templates (collection_id, title, type, content)
  VALUES (col_id, 'Vero o falso', 'true_false', '{"questions": [{"statement": "Due più due fa quattro.", "correct": true}]}'::jsonb);

  INSERT INTO public.exercise_collections (title, description, language, track, level, topic)
  VALUES ('الفرنسية - ثانوي', 'التعبير والقواعد المتقدمة', 'French', 'kids', 'secondary', 'التعبير والقواعد المتقدمة')
  RETURNING id INTO col_id;
  INSERT INTO public.exercise_templates (collection_id, title, type, content)
  VALUES (col_id, 'أزمنة الأفعال', 'mcq', '{"questions": [{"question": "Demain, je ___ au cinéma.", "options": ["vais", "irai", "allais", "suis allé"], "correct": 1}, {"question": "Si j''avais de l''argent, je ___ un vélo.", "options": ["achète", "achèterais", "achetais", "ai acheté"], "correct": 1}]}'::jsonb);
  INSERT INTO public.exercise_templates (collection_id, title, type, content)
  VALUES (col_id, 'مفردات متقدمة', 'flashcards', '{"cards": [{"front": "L''environnement", "back": "البيئة"}, {"front": "Le développement", "back": "التنمية"}, {"front": "La technologie", "back": "التكنولوجيا"}]}'::jsonb);
  INSERT INTO public.exercise_templates (collection_id, title, type, content)
  VALUES (col_id, 'رتّب الجملة', 'ordering', '{"questions": [{"correct": ["Il", "faut", "protéger", "notre", "planète"]}]}'::jsonb);

  INSERT INTO public.exercise_collections (title, description, language, track, level, topic)
  VALUES ('English - Secondary', 'Advanced expression', 'English', 'kids', 'secondary', 'Advanced expression')
  RETURNING id INTO col_id;
  INSERT INTO public.exercise_templates (collection_id, title, type, content)
  VALUES (col_id, 'Conditionals', 'mcq', '{"questions": [{"question": "If I had more time, I ___ travel more.", "options": ["will", "would", "was", "am"], "correct": 1}, {"question": "Tomorrow, I ___ visit my grandmother.", "options": ["will", "would", "was", "am"], "correct": 0}]}'::jsonb);
  INSERT INTO public.exercise_templates (collection_id, title, type, content)
  VALUES (col_id, 'Advanced vocabulary', 'flashcards', '{"cards": [{"front": "Environment", "back": "البيئة"}, {"front": "Development", "back": "التنمية"}, {"front": "Technology", "back": "التكنولوجيا"}]}'::jsonb);
  INSERT INTO public.exercise_templates (collection_id, title, type, content)
  VALUES (col_id, 'Order the sentence', 'ordering', '{"questions": [{"correct": ["We", "must", "protect", "our", "planet"]}]}'::jsonb);

  INSERT INTO public.exercise_collections (title, description, language, track, level, topic)
  VALUES ('French - B1', 'الطلاقة المتوسطة', 'French', 'adults', 'B1', 'الطلاقة المتوسطة')
  RETURNING id INTO col_id;
  INSERT INTO public.exercise_templates (collection_id, title, type, content)
  VALUES (col_id, 'الشرط', 'mcq', '{"questions": [{"question": "Si j''étais riche, je ___ le monde.", "options": ["voyage", "voyagerais", "voyageais", "ai voyagé"], "correct": 1}]}'::jsonb);
  INSERT INTO public.exercise_templates (collection_id, title, type, content)
  VALUES (col_id, 'التعبير عن الرأي', 'flashcards', '{"cards": [{"front": "À mon avis", "back": "في رأيي"}, {"front": "Je pense que", "back": "أعتقد أن"}, {"front": "Il me semble que", "back": "يبدو لي أن"}]}'::jsonb);
  INSERT INTO public.exercise_templates (collection_id, title, type, content)
  VALUES (col_id, 'ملء الفراغ', 'fill_blank', '{"questions": [{"text": "Bien que ce ___ difficile, j''ai réussi.", "blanks": ["soit"]}]}'::jsonb);

  INSERT INTO public.exercise_collections (title, description, language, track, level, topic)
  VALUES ('English - B1', 'Intermediate fluency', 'English', 'adults', 'B1', 'Intermediate fluency')
  RETURNING id INTO col_id;
  INSERT INTO public.exercise_templates (collection_id, title, type, content)
  VALUES (col_id, 'Conditionals', 'mcq', '{"questions": [{"question": "If I were rich, I ___ the world.", "options": ["travel", "would travel", "traveled", "have traveled"], "correct": 1}]}'::jsonb);
  INSERT INTO public.exercise_templates (collection_id, title, type, content)
  VALUES (col_id, 'Expressing opinions', 'flashcards', '{"cards": [{"front": "In my opinion", "back": "في رأيي"}, {"front": "I believe that", "back": "أعتقد أن"}, {"front": "It seems to me that", "back": "يبدو لي أن"}]}'::jsonb);
  INSERT INTO public.exercise_templates (collection_id, title, type, content)
  VALUES (col_id, 'Fill in the blank', 'fill_blank', '{"questions": [{"text": "Although it ___ difficult, I succeeded.", "blanks": ["was"]}]}'::jsonb);
END $$;
