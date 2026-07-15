
-- Revoke default PUBLIC execute on all SECURITY DEFINER functions
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.generate_zoom_link() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.profiles_block_privileged_updates() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enrollments_block_status_change() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_exercise_assigned_to_user(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_exercise_owner(uuid, uuid) FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.complete_teacher_profile(text, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.complete_enrollment(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.generate_teacher_code(timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.redeem_teacher_code(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.activate_premium(text, numeric, text, text, text, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.submit_exercise(uuid, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_exists() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bootstrap_first_admin() FROM PUBLIC, anon, authenticated;

-- Grant EXECUTE only where needed
-- admin_exists: needed by anon on admin-login bootstrap check
GRANT EXECUTE ON FUNCTION public.admin_exists() TO anon, authenticated;

-- bootstrap_first_admin: only signed-in (checked internally: only works if no admin exists)
GRANT EXECUTE ON FUNCTION public.bootstrap_first_admin() TO authenticated;

-- User-callable RPCs (all validate auth.uid() internally)
GRANT EXECUTE ON FUNCTION public.complete_teacher_profile(text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_enrollment(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_teacher_code(timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_teacher_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.activate_premium(text, numeric, text, text, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_exercise(uuid, jsonb) TO authenticated;

-- Helper functions used inside RLS policies need EXECUTE for the querying role
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_exercise_assigned_to_user(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_exercise_owner(uuid, uuid) TO authenticated;

-- Trigger functions: no user EXECUTE needed (triggers fire as table owner)
-- handle_new_user, set_updated_at, generate_zoom_link, profiles_block_privileged_updates, enrollments_block_status_change
-- Left with no anon/authenticated EXECUTE.
