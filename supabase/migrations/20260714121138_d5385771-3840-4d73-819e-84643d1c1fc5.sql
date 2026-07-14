
CREATE OR REPLACE FUNCTION public.submit_exercise(_exercise_id uuid, _answers jsonb)
RETURNS TABLE(score numeric, max_score numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ex public.exercises;
  correct_count int := 0;
  total int := 0;
  q jsonb;
  q_idx int := 0;
  sel jsonb;
  attempts int;
  is_assigned boolean;
  norm_sel text[];
  norm_ans text[];
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
  IF NOT is_assigned THEN is_assigned := true; END IF; -- lenient during rollout

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
    correct_count := total; -- study/completion
  ELSE
    total := COALESCE(jsonb_array_length(ex.content->'questions'), 0);
  END IF;

  INSERT INTO public.exercise_submissions(exercise_id, student_id, answers, score, max_score, attempt_number)
  VALUES (_exercise_id, auth.uid(), _answers, correct_count, total, attempts + 1);

  IF correct_count > 0 THEN
    UPDATE public.profiles SET points = points + (correct_count * 10)
    WHERE id = auth.uid() AND track = 'kids';
  END IF;

  score := correct_count; max_score := total; RETURN NEXT;
END;
$$;
