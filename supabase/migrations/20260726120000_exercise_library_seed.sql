-- Auto-generated starter exercise library seed
DO $$
DECLARE
  col_id uuid;
BEGIN

  INSERT INTO public.exercise_collections (title, description, language, track, level, topic)
  VALUES ('الفرنسية للمبتدئين - ابتدائي', 'مفردات وعبارات أساسية', 'French', 'kids', 'primary', 'مفردات وعبارات أساسية')
  RETURNING id INTO col_id;
  INSERT INTO public.exercise_templates (collection_id, title, type, content)
  VALUES (col_id, 'الحيوانات', 'flashcards', '{"cards": [{"front": "🐱 Le chat", "back": "القط", "image": null}, {"front": "🐶 Le chien", "back": "الكلب", "image": null}, {"front": "🐦 L''oiseau", "back": "العصفور", "image": null}, {"front": "🐟 Le poisson", "back": "السمكة", "image": null}]}'::jsonb);
  INSERT INTO public.exercise_templates (collection_id, title, type, content)
  VALUES (col_id, 'الألوان - اختيار من متعدد', 'mcq', '{"questions": [{"question": "Quelle est la couleur du ciel ?", "options": ["Rouge", "Bleu", "Vert", "Noir"], "correct": 1}, {"question": "Quelle est la couleur d''une banane ?", "options": ["Jaune", "Violet", "Bleu", "Gris"], "correct": 0}]}'::jsonb);
  INSERT INTO public.exercise_templates (collection_id, title, type, content)
  VALUES (col_id, 'صح أو خطأ - الأرقام', 'true_false', '{"questions": [{"statement": "Deux plus deux égale quatre.", "correct": true}, {"statement": "Le mot ''chat'' est un animal.", "correct": true}]}'::jsonb);
  INSERT INTO public.exercise_templates (collection_id, title, type, content)
  VALUES (col_id, 'أكمل الجملة', 'fill_blank', '{"questions": [{"text": "Bonjour, je m''appelle ___.", "blanks": ["Ahmed"]}, {"text": "Le ___ est rouge.", "blanks": ["ballon"]}]}'::jsonb);
  INSERT INTO public.exercise_templates (collection_id, title, type, content)
  VALUES (col_id, 'اربط الكلمة بمعناها', 'matching', '{"questions": [{"left": ["Maman", "Papa", "École"], "right": ["أمي", "بابا", "المدرسة"], "correct": [0, 1, 2]}]}'::jsonb);
  INSERT INTO public.exercise_templates (collection_id, title, type, content)
  VALUES (col_id, 'رتّب الجملة', 'ordering', '{"questions": [{"correct": ["Je", "suis", "content"]}]}'::jsonb);

  INSERT INTO public.exercise_collections (title, description, language, track, level, topic)
  VALUES ('الفرنسية - إعدادي', 'المدرسة والحياة اليومية', 'French', 'kids', 'prep', 'المدرسة والحياة اليومية')
  RETURNING id INTO col_id;
  INSERT INTO public.exercise_templates (collection_id, title, type, content)
  VALUES (col_id, 'أدوات المدرسة', 'flashcards', '{"cards": [{"front": "📚 Le livre", "back": "الكتاب"}, {"front": "✏️ Le crayon", "back": "قلم الرصاص"}, {"front": "🎒 Le sac", "back": "الحقيبة"}, {"front": "📓 Le cahier", "back": "الدفتر"}]}'::jsonb);
  INSERT INTO public.exercise_templates (collection_id, title, type, content)
  VALUES (col_id, 'قواعد بسيطة', 'mcq', '{"questions": [{"question": "Nous ___ à l''école tous les jours.", "options": ["va", "vais", "allons", "vont"], "correct": 2}, {"question": "Elle ___ une pomme.", "options": ["mange", "manges", "mangez", "mangeons"], "correct": 0}]}'::jsonb);
  INSERT INTO public.exercise_templates (collection_id, title, type, content)
  VALUES (col_id, 'صح أو خطأ - المدرسة', 'true_false', '{"questions": [{"statement": "Le professeur enseigne dans la classe.", "correct": true}, {"statement": "On dort à l''école.", "correct": false}]}'::jsonb);
  INSERT INTO public.exercise_templates (collection_id, title, type, content)
  VALUES (col_id, 'أكمل الجملة', 'fill_blank', '{"questions": [{"text": "J''ai ___ ans.", "blanks": ["dix"]}, {"text": "Mon ___ préféré est le français.", "blanks": ["cours"]}]}'::jsonb);
  INSERT INTO public.exercise_templates (collection_id, title, type, content)
  VALUES (col_id, 'اربط الأيام', 'matching', '{"questions": [{"left": ["Lundi", "Mardi", "Dimanche"], "right": ["الإثنين", "الثلاثاء", "الأحد"], "correct": [0, 1, 2]}]}'::jsonb);
  INSERT INTO public.exercise_templates (collection_id, title, type, content)
  VALUES (col_id, 'رتّب السؤال', 'ordering', '{"questions": [{"correct": ["Comment", "tu", "t''appelles"]}]}'::jsonb);

  INSERT INTO public.exercise_collections (title, description, language, track, level, topic)
  VALUES ('English for Beginners - Primary', 'Basic vocabulary', 'English', 'kids', 'primary', 'Basic vocabulary')
  RETURNING id INTO col_id;
  INSERT INTO public.exercise_templates (collection_id, title, type, content)
  VALUES (col_id, 'Animals', 'flashcards', '{"cards": [{"front": "🐱 Cat", "back": "قط"}, {"front": "🐶 Dog", "back": "كلب"}, {"front": "🦁 Lion", "back": "أسد"}, {"front": "🐘 Elephant", "back": "فيل"}]}'::jsonb);
  INSERT INTO public.exercise_templates (collection_id, title, type, content)
  VALUES (col_id, 'Colors quiz', 'mcq', '{"questions": [{"question": "What color is the sun?", "options": ["Blue", "Yellow", "Black", "Green"], "correct": 1}, {"question": "What color is grass?", "options": ["Red", "Purple", "Green", "White"], "correct": 2}]}'::jsonb);
  INSERT INTO public.exercise_templates (collection_id, title, type, content)
  VALUES (col_id, 'True or False - Numbers', 'true_false', '{"questions": [{"statement": "Three plus one equals four.", "correct": true}, {"statement": "A dog can fly.", "correct": false}]}'::jsonb);
  INSERT INTO public.exercise_templates (collection_id, title, type, content)
  VALUES (col_id, 'Fill in the blank', 'fill_blank', '{"questions": [{"text": "My name ___ Sarah.", "blanks": ["is"]}, {"text": "The sky is ___.", "blanks": ["blue"]}]}'::jsonb);
  INSERT INTO public.exercise_templates (collection_id, title, type, content)
  VALUES (col_id, 'Match the words', 'matching', '{"questions": [{"left": ["Mother", "Father", "School"], "right": ["أمي", "أبي", "المدرسة"], "correct": [0, 1, 2]}]}'::jsonb);
  INSERT INTO public.exercise_templates (collection_id, title, type, content)
  VALUES (col_id, 'Order the sentence', 'ordering', '{"questions": [{"correct": ["I", "am", "happy"]}]}'::jsonb);

  INSERT INTO public.exercise_collections (title, description, language, track, level, topic)
  VALUES ('English - Preparatory', 'School life', 'English', 'kids', 'prep', 'School life')
  RETURNING id INTO col_id;
  INSERT INTO public.exercise_templates (collection_id, title, type, content)
  VALUES (col_id, 'School items', 'flashcards', '{"cards": [{"front": "📚 Book", "back": "كتاب"}, {"front": "✏️ Pencil", "back": "قلم رصاص"}, {"front": "🎒 Bag", "back": "حقيبة"}, {"front": "📓 Notebook", "back": "دفتر"}]}'::jsonb);
  INSERT INTO public.exercise_templates (collection_id, title, type, content)
  VALUES (col_id, 'Present simple', 'mcq', '{"questions": [{"question": "She ___ to school every day.", "options": ["go", "goes", "going", "gone"], "correct": 1}, {"question": "They ___ football on Fridays.", "options": ["play", "plays", "playing", "played"], "correct": 0}]}'::jsonb);
  INSERT INTO public.exercise_templates (collection_id, title, type, content)
  VALUES (col_id, 'True or False - School', 'true_false', '{"questions": [{"statement": "Teachers teach students.", "correct": true}, {"statement": "We sleep at school.", "correct": false}]}'::jsonb);
  INSERT INTO public.exercise_templates (collection_id, title, type, content)
  VALUES (col_id, 'Fill in the blank', 'fill_blank', '{"questions": [{"text": "I am ___ years old.", "blanks": ["twelve"]}, {"text": "My favorite ___ is English.", "blanks": ["subject"]}]}'::jsonb);
  INSERT INTO public.exercise_templates (collection_id, title, type, content)
  VALUES (col_id, 'Match the days', 'matching', '{"questions": [{"left": ["Monday", "Tuesday", "Sunday"], "right": ["الإثنين", "الثلاثاء", "الأحد"], "correct": [0, 1, 2]}]}'::jsonb);
  INSERT INTO public.exercise_templates (collection_id, title, type, content)
  VALUES (col_id, 'Order the question', 'ordering', '{"questions": [{"correct": ["What", "is", "your", "name"]}]}'::jsonb);

  INSERT INTO public.exercise_collections (title, description, language, track, level, topic)
  VALUES ('French - A1', 'مهارات أساسية', 'French', 'adults', 'A1', 'مهارات أساسية')
  RETURNING id INTO col_id;
  INSERT INTO public.exercise_templates (collection_id, title, type, content)
  VALUES (col_id, 'المفردات الأساسية', 'flashcards', '{"cards": [{"front": "Bonjour", "back": "مرحبًا"}, {"front": "Merci", "back": "شكرًا"}, {"front": "S''il vous plaît", "back": "من فضلك"}, {"front": "Au revoir", "back": "إلى اللقاء"}]}'::jsonb);
  INSERT INTO public.exercise_templates (collection_id, title, type, content)
  VALUES (col_id, 'التعارف', 'mcq', '{"questions": [{"question": "Comment ___ -vous ?", "options": ["appelez", "appelle", "appellent", "appelons"], "correct": 0}, {"question": "___ suis étudiant.", "options": ["Je", "Tu", "Il", "Nous"], "correct": 0}]}'::jsonb);
  INSERT INTO public.exercise_templates (collection_id, title, type, content)
  VALUES (col_id, 'صح أو خطأ', 'true_false', '{"questions": [{"statement": "''Merci'' veut dire ''شكرًا''.", "correct": true}]}'::jsonb);
  INSERT INTO public.exercise_templates (collection_id, title, type, content)
  VALUES (col_id, 'أكمل الجملة', 'fill_blank', '{"questions": [{"text": "J''habite ___ Tunis.", "blanks": ["à"]}]}'::jsonb);

  INSERT INTO public.exercise_collections (title, description, language, track, level, topic)
  VALUES ('French - A2', 'مهارات أساسية', 'French', 'adults', 'A2', 'مهارات أساسية')
  RETURNING id INTO col_id;
  INSERT INTO public.exercise_templates (collection_id, title, type, content)
  VALUES (col_id, 'الماضي القريب', 'mcq', '{"questions": [{"question": "Hier, je ___ au marché.", "options": ["vais", "suis allé", "irai", "allais"], "correct": 1}]}'::jsonb);
  INSERT INTO public.exercise_templates (collection_id, title, type, content)
  VALUES (col_id, 'مفردات السفر', 'flashcards', '{"cards": [{"front": "L''aéroport", "back": "المطار"}, {"front": "Le billet", "back": "التذكرة"}, {"front": "La valise", "back": "الحقيبة"}]}'::jsonb);
  INSERT INTO public.exercise_templates (collection_id, title, type, content)
  VALUES (col_id, 'رتّب الجملة', 'ordering', '{"questions": [{"correct": ["Je", "voudrais", "réserver", "une", "chambre"]}]}'::jsonb);

  INSERT INTO public.exercise_collections (title, description, language, track, level, topic)
  VALUES ('English - A1', 'مهارات أساسية', 'English', 'adults', 'A1', 'مهارات أساسية')
  RETURNING id INTO col_id;
  INSERT INTO public.exercise_templates (collection_id, title, type, content)
  VALUES (col_id, 'Basic vocabulary', 'flashcards', '{"cards": [{"front": "Hello", "back": "مرحبًا"}, {"front": "Thank you", "back": "شكرًا"}, {"front": "Please", "back": "من فضلك"}, {"front": "Goodbye", "back": "إلى اللقاء"}]}'::jsonb);
  INSERT INTO public.exercise_templates (collection_id, title, type, content)
  VALUES (col_id, 'Introducing yourself', 'mcq', '{"questions": [{"question": "What ___ your name?", "options": ["is", "are", "am", "be"], "correct": 0}, {"question": "I ___ from Tunisia.", "options": ["is", "am", "are", "be"], "correct": 1}]}'::jsonb);
  INSERT INTO public.exercise_templates (collection_id, title, type, content)
  VALUES (col_id, 'True or False', 'true_false', '{"questions": [{"statement": "''Thank you'' means شكرًا.", "correct": true}]}'::jsonb);
  INSERT INTO public.exercise_templates (collection_id, title, type, content)
  VALUES (col_id, 'Fill in the blank', 'fill_blank', '{"questions": [{"text": "I live ___ Sfax.", "blanks": ["in"]}]}'::jsonb);

  INSERT INTO public.exercise_collections (title, description, language, track, level, topic)
  VALUES ('English - A2', 'مهارات أساسية', 'English', 'adults', 'A2', 'مهارات أساسية')
  RETURNING id INTO col_id;
  INSERT INTO public.exercise_templates (collection_id, title, type, content)
  VALUES (col_id, 'Past simple', 'mcq', '{"questions": [{"question": "Yesterday, I ___ to the market.", "options": ["go", "went", "gone", "going"], "correct": 1}]}'::jsonb);
  INSERT INTO public.exercise_templates (collection_id, title, type, content)
  VALUES (col_id, 'Travel vocabulary', 'flashcards', '{"cards": [{"front": "Airport", "back": "المطار"}, {"front": "Ticket", "back": "التذكرة"}, {"front": "Suitcase", "back": "الحقيبة"}]}'::jsonb);
  INSERT INTO public.exercise_templates (collection_id, title, type, content)
  VALUES (col_id, 'Order the sentence', 'ordering', '{"questions": [{"correct": ["I", "would", "like", "to", "book", "a", "room"]}]}'::jsonb);

  INSERT INTO public.exercise_collections (title, description, language, track, level, topic)
  VALUES ('German - A1', 'مهارات أساسية', 'German', 'adults', 'A1', 'مهارات أساسية')
  RETURNING id INTO col_id;
  INSERT INTO public.exercise_templates (collection_id, title, type, content)
  VALUES (col_id, 'Grundwortschatz', 'flashcards', '{"cards": [{"front": "Hallo", "back": "مرحبًا"}, {"front": "Danke", "back": "شكرًا"}, {"front": "Bitte", "back": "من فضلك"}, {"front": "Tschüss", "back": "إلى اللقاء"}]}'::jsonb);
  INSERT INTO public.exercise_templates (collection_id, title, type, content)
  VALUES (col_id, 'Sich vorstellen', 'mcq', '{"questions": [{"question": "Wie ___ du?", "options": ["heißt", "heiße", "heißen", "heißt"], "correct": 0}]}'::jsonb);
  INSERT INTO public.exercise_templates (collection_id, title, type, content)
  VALUES (col_id, 'Richtig oder falsch', 'true_false', '{"questions": [{"statement": "''Danke'' bedeutet شكرًا.", "correct": true}]}'::jsonb);

  INSERT INTO public.exercise_collections (title, description, language, track, level, topic)
  VALUES ('German - A2', 'مهارات أساسية', 'German', 'adults', 'A2', 'مهارات أساسية')
  RETURNING id INTO col_id;
  INSERT INTO public.exercise_templates (collection_id, title, type, content)
  VALUES (col_id, 'Perfekt', 'mcq', '{"questions": [{"question": "Gestern ___ ich ins Kino gegangen.", "options": ["habe", "bin", "war", "hatte"], "correct": 1}]}'::jsonb);
  INSERT INTO public.exercise_templates (collection_id, title, type, content)
  VALUES (col_id, 'Reisewortschatz', 'flashcards', '{"cards": [{"front": "Der Flughafen", "back": "المطار"}, {"front": "Das Ticket", "back": "التذكرة"}]}'::jsonb);

  INSERT INTO public.exercise_collections (title, description, language, track, level, topic)
  VALUES ('Italian - A1', 'مهارات أساسية', 'Italian', 'adults', 'A1', 'مهارات أساسية')
  RETURNING id INTO col_id;
  INSERT INTO public.exercise_templates (collection_id, title, type, content)
  VALUES (col_id, 'Vocabolario di base', 'flashcards', '{"cards": [{"front": "Ciao", "back": "مرحبًا"}, {"front": "Grazie", "back": "شكرًا"}, {"front": "Per favore", "back": "من فضلك"}, {"front": "Arrivederci", "back": "إلى اللقاء"}]}'::jsonb);
  INSERT INTO public.exercise_templates (collection_id, title, type, content)
  VALUES (col_id, 'Presentarsi', 'mcq', '{"questions": [{"question": "Come ti ___?", "options": ["chiami", "chiamo", "chiamano", "chiamiamo"], "correct": 0}]}'::jsonb);
  INSERT INTO public.exercise_templates (collection_id, title, type, content)
  VALUES (col_id, 'Vero o falso', 'true_false', '{"questions": [{"statement": "''Grazie'' significa شكرًا.", "correct": true}]}'::jsonb);

  INSERT INTO public.exercise_collections (title, description, language, track, level, topic)
  VALUES ('Italian - A2', 'مهارات أساسية', 'Italian', 'adults', 'A2', 'مهارات أساسية')
  RETURNING id INTO col_id;
  INSERT INTO public.exercise_templates (collection_id, title, type, content)
  VALUES (col_id, 'Passato prossimo', 'mcq', '{"questions": [{"question": "Ieri ___ andato al cinema.", "options": ["ho", "sono", "ero", "avevo"], "correct": 1}]}'::jsonb);
  INSERT INTO public.exercise_templates (collection_id, title, type, content)
  VALUES (col_id, 'Vocabolario di viaggio', 'flashcards', '{"cards": [{"front": "L''aeroporto", "back": "المطار"}, {"front": "Il biglietto", "back": "التذكرة"}]}'::jsonb);
END $$;
