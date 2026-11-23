-- No unverified activation, even by the legacy service endpoint.
CREATE OR REPLACE FUNCTION public.activate_premium(_plan text, _amount numeric, _currency text, _provider text, _provider_ref text, _days integer)
RETURNS TABLE(invoice_id uuid, premium_until timestamptz) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$ BEGIN RAISE EXCEPTION 'Payments are not enabled. Verified payment integration is required.'; END $$;
CREATE OR REPLACE FUNCTION public.activate_basic_subscription(_amount numeric, _currency text, _provider text, _provider_ref text, _days integer)
RETURNS TABLE(invoice_id uuid, subscription_until timestamptz) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$ BEGIN RAISE EXCEPTION 'Payments are not enabled. Verified payment integration is required.'; END $$;
REVOKE EXECUTE ON FUNCTION public.activate_premium(text,numeric,text,text,text,integer), public.activate_basic_subscription(numeric,text,text,text,integer) FROM PUBLIC,anon,authenticated;

-- Column permissions also protect requests whose JWT settings differ from legacy requests.
REVOKE INSERT, UPDATE ON public.profiles FROM anon,authenticated;
GRANT UPDATE(full_name,level,learning_goal,cefr_level,kid_name,kid_age,bio,avatar_url,specialty_language,teacher_profile_completed,phone,school_grade,school_name) ON public.profiles TO authenticated;
CREATE OR REPLACE FUNCTION public.profiles_block_privileged_updates()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
BEGIN
 IF current_user IN ('anon','authenticated') AND (
   NEW.id IS DISTINCT FROM OLD.id OR NEW.email IS DISTINCT FROM OLD.email
   OR NEW.is_premium IS DISTINCT FROM OLD.is_premium OR NEW.premium_until IS DISTINCT FROM OLD.premium_until
   OR NEW.has_basic_subscription IS DISTINCT FROM OLD.has_basic_subscription
   OR NEW.basic_subscription_until IS DISTINCT FROM OLD.basic_subscription_until
   OR NEW.account_type IS DISTINCT FROM OLD.account_type OR NEW.track IS DISTINCT FROM OLD.track
   OR NEW.parent_id IS DISTINCT FROM OLD.parent_id OR NEW.parental_consent_at IS DISTINCT FROM OLD.parental_consent_at
   OR NEW.points IS DISTINCT FROM OLD.points OR NEW.badges IS DISTINCT FROM OLD.badges
   OR (OLD.account_type='child' AND (NEW.phone IS DISTINCT FROM OLD.phone OR NEW.school_name IS DISTINCT FROM OLD.school_name))
 ) THEN RAISE EXCEPTION 'Protected profile field'; END IF;
 RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.set_my_student_track(_track text, _account_type text DEFAULT NULL, _phone text DEFAULT NULL, _age integer DEFAULT NULL, _school_grade text DEFAULT NULL, _school_name text DEFAULT NULL)
RETURNS profiles LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p public.profiles; next_type text;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
 IF _track IS NULL OR _track NOT IN ('kids','adults') THEN RAISE EXCEPTION 'Invalid track'; END IF;
 IF public.has_role(auth.uid(),'teacher') OR public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Not a student account'; END IF;
 SELECT * INTO p FROM public.profiles WHERE id=auth.uid() FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Profile not found'; END IF;
 IF p.account_type='child' THEN
   IF _track<>'kids' OR (_account_type IS NOT NULL AND _account_type<>'child') THEN RAISE EXCEPTION 'Child accounts cannot change account type'; END IF;
   RETURN p;
 END IF;
 next_type := CASE WHEN _track='kids' THEN 'parent' ELSE 'adult' END;
 IF _account_type IS NOT NULL AND _account_type<>next_type THEN RAISE EXCEPTION 'New kids accounts must be parent accounts'; END IF;
 IF p.account_type='parent' AND next_type<>'parent' THEN RAISE EXCEPTION 'Parent accounts cannot change account type'; END IF;
 UPDATE public.profiles SET track=_track,account_type=next_type,updated_at=now() WHERE id=auth.uid() RETURNING * INTO p;
 RETURN p;
END $$;
-- Compatible two-argument wrapper: no alternate unsafe path.
CREATE OR REPLACE FUNCTION public.set_my_student_track(_track text, _account_type text DEFAULT NULL)
RETURNS profiles LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
 SELECT public.set_my_student_track(_track,_account_type,NULL::text,NULL::integer,NULL::text,NULL::text)
$$;
REVOKE EXECUTE ON FUNCTION public.set_my_student_track(text,text),public.set_my_student_track(text,text,text,integer,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.set_my_student_track(text,text),public.set_my_student_track(text,text,text,integer,text,text) TO authenticated,service_role;

-- Signup never consumes a child email as the new kids-product identity.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE meta jsonb := COALESCE(NEW.raw_user_meta_data,'{}'::jsonb); next_type text; next_track text;
BEGIN
 IF meta->>'account_type'='child' THEN RAISE EXCEPTION 'Please register a parent account for the kids product'; END IF;
 next_type := CASE WHEN meta->>'track'='kids' OR meta->>'account_type'='parent' THEN 'parent' ELSE 'adult' END;
 next_track := CASE WHEN next_type='parent' THEN 'kids' ELSE 'adults' END;
 INSERT INTO public.profiles(id,full_name,email,track,account_type)
 VALUES(NEW.id,COALESCE(meta->>'full_name',meta->>'name'),NEW.email,next_track,next_type)
 ON CONFLICT(id) DO NOTHING;
 RETURN NEW;
END $$;

-- Verified parent relationships, not user-editable metadata.
CREATE OR REPLACE FUNCTION public.is_linked_parent(_child_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT EXISTS(SELECT 1 FROM public.profiles c JOIN public.profiles p ON p.id=c.parent_id
 WHERE c.id=_child_id AND c.account_type='child' AND p.id=auth.uid() AND p.account_type='parent')
$$;
REVOKE ALL ON FUNCTION public.is_linked_parent(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.is_linked_parent(uuid) TO authenticated,service_role;
CREATE OR REPLACE FUNCTION public.admin_link_existing_child(_child_id uuid,_parent_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin only'; END IF;
 IF _child_id=_parent_id OR NOT EXISTS(SELECT 1 FROM profiles WHERE id=_child_id AND account_type='child')
 OR NOT EXISTS(SELECT 1 FROM profiles WHERE id=_parent_id AND account_type='parent') THEN RAISE EXCEPTION 'Invalid parent or child'; END IF;
 UPDATE public.profiles SET parent_id=_parent_id,parental_consent_at=NULL,updated_at=now() WHERE id=_child_id;
END $$;
REVOKE ALL ON FUNCTION public.admin_link_existing_child(uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.admin_link_existing_child(uuid,uuid) TO authenticated,service_role;
DROP POLICY IF EXISTS "Parents view their children" ON public.profiles;
CREATE POLICY "Parents view their children" ON public.profiles FOR SELECT TO authenticated USING(public.is_linked_parent(id));
DROP POLICY IF EXISTS "Parent sees own children submissions" ON public.exercise_submissions;
CREATE POLICY "Parent sees own children submissions" ON public.exercise_submissions FOR SELECT TO authenticated USING(public.is_linked_parent(student_id));
DROP POLICY IF EXISTS "Parent sees children progress" ON public.progress;
CREATE POLICY "Parent sees children progress" ON public.progress FOR SELECT TO authenticated USING(public.is_linked_parent(student_id));
CREATE POLICY "Parents view linked child enrollments" ON public.enrollments FOR SELECT TO authenticated USING(public.is_linked_parent(user_id));

-- A teacher's roster is an existing assignment or class membership, not a guessed UUID.
CREATE OR REPLACE FUNCTION public.is_authorized_student(_student_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT public.has_role(auth.uid(),'teacher') AND EXISTS(SELECT 1 FROM public.profiles p
 WHERE p.id=_student_id AND NOT public.has_role(p.id,'teacher') AND NOT public.has_role(p.id,'admin'))
 AND (EXISTS(SELECT 1 FROM public.class_members cm JOIN public.classes c ON c.id=cm.class_id
             WHERE cm.student_id=_student_id AND c.teacher_id=auth.uid())
 OR EXISTS(SELECT 1 FROM public.exercise_assignments ea JOIN public.exercises e ON e.id=ea.exercise_id
           WHERE ea.target_type='student' AND ea.target_id=_student_id AND e.teacher_id=auth.uid()))
$$;
REVOKE ALL ON FUNCTION public.is_authorized_student(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.is_authorized_student(uuid) TO authenticated,service_role;
DROP POLICY IF EXISTS "Teachers view submitters" ON public.profiles;
DROP POLICY IF EXISTS "Teachers view their students" ON public.profiles;
CREATE POLICY "Teachers view their students" ON public.profiles FOR SELECT TO authenticated USING(public.is_authorized_student(id));
DROP POLICY IF EXISTS "Teacher manages class_members" ON public.class_members;
CREATE POLICY "Teacher reads own class members" ON public.class_members FOR SELECT TO authenticated
 USING(public.has_role(auth.uid(),'teacher') AND EXISTS(SELECT 1 FROM classes c WHERE c.id=class_id AND c.teacher_id=auth.uid()));
CREATE POLICY "Teacher adds authorized class members" ON public.class_members FOR INSERT TO authenticated
 WITH CHECK(public.is_authorized_student(student_id) AND EXISTS(SELECT 1 FROM classes c WHERE c.id=class_id AND c.teacher_id=auth.uid()));
CREATE POLICY "Teacher removes own class members" ON public.class_members FOR DELETE TO authenticated
 USING(public.has_role(auth.uid(),'teacher') AND EXISTS(SELECT 1 FROM classes c WHERE c.id=class_id AND c.teacher_id=auth.uid()));
CREATE POLICY "Admins manage class membership" ON public.class_members FOR ALL TO authenticated
 USING(public.has_role(auth.uid(),'admin')) WITH CHECK(public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "Teacher manages assignments for own exercises" ON public.exercise_assignments;
CREATE POLICY "Teacher manages assignments for own exercises" ON public.exercise_assignments FOR ALL TO authenticated
 USING(public.has_role(auth.uid(),'teacher') AND public.is_exercise_owner(exercise_id,auth.uid()))
 WITH CHECK(public.has_role(auth.uid(),'teacher') AND public.is_exercise_owner(exercise_id,auth.uid()) AND
 ((target_type='student' AND public.is_authorized_student(target_id)) OR
 (target_type='class' AND EXISTS(SELECT 1 FROM classes c WHERE c.id=target_id AND c.teacher_id=auth.uid()))));
CREATE POLICY "Admins manage assignments" ON public.exercise_assignments FOR ALL TO authenticated
 USING(public.has_role(auth.uid(),'admin')) WITH CHECK(public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.can_student_access_exercise(_exercise_id uuid,_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT _user_id=auth.uid() AND NOT public.has_role(_user_id,'teacher') AND NOT public.has_role(_user_id,'admin')
 AND EXISTS(SELECT 1 FROM public.profiles p JOIN public.exercises e ON e.id=_exercise_id
 WHERE p.id=_user_id AND e.published AND (public.is_exercise_assigned_to_user(e.id,_user_id)
 OR (e.visibility='public' AND (e.target_track IS NULL OR e.target_track=p.track))))
$$;
DROP POLICY IF EXISTS "Assigned students view published exercises" ON public.exercises;
DROP POLICY IF EXISTS "public exercises readable" ON public.exercises;
CREATE POLICY "Students view accessible published exercises" ON public.exercises FOR SELECT TO authenticated
 USING(public.can_student_access_exercise(id,auth.uid()));
CREATE POLICY "Admins manage exercises" ON public.exercises FOR ALL TO authenticated
 USING(public.has_role(auth.uid(),'admin')) WITH CHECK(public.has_role(auth.uid(),'admin'));
-- Legacy submission now delegates to the checked 3-argument version.
CREATE OR REPLACE FUNCTION public.submit_exercise(_exercise_id uuid,_answers jsonb)
RETURNS TABLE(score numeric,max_score numeric) LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$
 SELECT * FROM public.submit_exercise(_exercise_id,_answers,NULL::integer)
$$;
REVOKE ALL ON FUNCTION public.submit_exercise(uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.submit_exercise(uuid,jsonb) TO authenticated,service_role;
-- Only feedback is writable: scores, identities and answers remain immutable.
REVOKE UPDATE ON public.exercise_submissions FROM anon,authenticated;
GRANT UPDATE(teacher_feedback) ON public.exercise_submissions TO authenticated;
DROP POLICY IF EXISTS "Teacher sees submissions for own exercises" ON public.exercise_submissions;
CREATE POLICY "Teacher sees submissions for own exercises" ON public.exercise_submissions FOR SELECT TO authenticated
 USING(public.has_role(auth.uid(),'teacher') AND public.is_exercise_owner(exercise_id,auth.uid()) AND public.is_authorized_student(student_id));
DROP POLICY IF EXISTS "teacher writes feedback" ON public.exercise_submissions;
CREATE POLICY "teacher writes feedback" ON public.exercise_submissions FOR UPDATE TO authenticated
 USING(public.has_role(auth.uid(),'teacher') AND public.is_exercise_owner(exercise_id,auth.uid()) AND public.is_authorized_student(student_id))
 WITH CHECK(public.has_role(auth.uid(),'teacher') AND public.is_exercise_owner(exercise_id,auth.uid()) AND public.is_authorized_student(student_id));

-- No child conversation retention; no assumed consent for existing users.
DROP POLICY IF EXISTS "Users manage own chat messages" ON public.ai_chat_messages;
CREATE POLICY "Adults manage own chat messages" ON public.ai_chat_messages FOR ALL TO authenticated
 USING(user_id=auth.uid() AND EXISTS(SELECT 1 FROM profiles p WHERE p.id=auth.uid() AND p.account_type='adult' AND p.track='adults'))
 WITH CHECK(user_id=auth.uid() AND EXISTS(SELECT 1 FROM profiles p WHERE p.id=auth.uid() AND p.account_type='adult' AND p.track='adults'));

-- Prevent editing progress directly while preserving lesson completion.
REVOKE UPDATE ON public.enrollments FROM anon,authenticated;
CREATE OR REPLACE FUNCTION public.enrollment_initial_state()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
BEGIN
 IF current_user IN ('anon','authenticated') AND (NEW.status<>'active' OR NEW.progress<>0 OR NEW.completed_lessons<>0
 OR public.has_role(auth.uid(),'teacher') OR public.has_role(auth.uid(),'admin')) THEN RAISE EXCEPTION 'Invalid initial enrollment'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER trg_enrollment_initial_state BEFORE INSERT ON public.enrollments FOR EACH ROW EXECUTE FUNCTION public.enrollment_initial_state();
CREATE OR REPLACE FUNCTION public.enrollments_block_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
BEGIN
 IF current_user IN ('anon','authenticated') AND (NEW.status IS DISTINCT FROM OLD.status OR NEW.progress IS DISTINCT FROM OLD.progress
 OR NEW.completed_lessons IS DISTINCT FROM OLD.completed_lessons OR NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.course_id IS DISTINCT FROM OLD.course_id)
 THEN RAISE EXCEPTION 'Use the lesson completion action'; END IF;
 RETURN NEW;
END $$;
CREATE OR REPLACE FUNCTION public.mark_lesson_complete(_enrollment_id uuid,_lesson integer)
RETURNS enrollments LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE e public.enrollments; total integer;
BEGIN
 IF auth.uid() IS NULL OR public.has_role(auth.uid(),'teacher') OR public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Student only'; END IF;
 SELECT * INTO e FROM public.enrollments WHERE id=_enrollment_id AND user_id=auth.uid() FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Enrollment not found'; END IF;
 SELECT lessons_count INTO total FROM public.courses WHERE id=e.course_id;
 IF _lesson IS NULL OR _lesson<1 OR _lesson>total OR _lesson>e.completed_lessons+1 THEN RAISE EXCEPTION 'Complete lessons in order'; END IF;
 IF _lesson<=e.completed_lessons THEN RETURN e; END IF;
 UPDATE public.enrollments SET completed_lessons=_lesson,progress=round(100.0*_lesson/total),
 status=CASE WHEN _lesson=total THEN 'completed' ELSE 'active' END,updated_at=now()
 WHERE id=e.id RETURNING * INTO e;
 RETURN e;
END $$;
REVOKE ALL ON FUNCTION public.mark_lesson_complete(uuid,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.mark_lesson_complete(uuid,integer) TO authenticated,service_role;
REVOKE UPDATE ON public.live_sessions FROM anon,authenticated;
GRANT UPDATE(scheduled_at,duration_minutes,status,notes) ON public.live_sessions TO authenticated;
REVOKE ALL ON FUNCTION public.enrollment_initial_state(),public.submissions_feedback_only(),public.live_sessions_lock_parties(),public.profiles_block_privileged_updates(),public.enrollments_block_status_change() FROM PUBLIC,anon,authenticated;
