import { redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { getWorkspaceRole, workspaceHome, type WorkspaceRole } from "./security-rules";

// Auth is already enforced by the managed pathless layout; this is only a role check.
export async function authorizeWorkspace(allow: readonly WorkspaceRole[]) {
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) throw new Error("سجّل الدخول للمتابعة");
  const [roles, profile] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", auth.user.id),
    supabase.from("profiles").select("track").eq("id", auth.user.id).maybeSingle(),
  ]);
  if (roles.error || profile.error || !profile.data) throw new Error("تعذّر التحقق من صلاحيات الحساب");
  const role = getWorkspaceRole((roles.data ?? []).map((r) => r.role));
  if (!allow.includes(role)) throw redirect({ to: workspaceHome(role, profile.data.track) });
}