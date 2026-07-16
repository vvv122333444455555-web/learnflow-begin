import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type Role = "admin" | "teacher" | "student";

/**
 * Guards a route by user role. If the user's role doesn't match `allow`,
 * redirects to the appropriate home and shows a message.
 *
 * - Teachers trying to open a student page → /teach/dashboard
 * - Students trying to open a teacher page → /adults or /kids
 */
export function useRoleGuard(allow: Role[]) {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) {
        navigate({ to: "/auth" });
        return;
      }
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", u.user.id);

      const set = new Set((roles ?? []).map((r) => r.role as Role));
      const isTeacher = set.has("teacher");
      const isAdmin = set.has("admin");
      const isStudent = set.has("student") || (!isTeacher && !isAdmin); // default: student

      const roleForCheck: Role = isAdmin ? "admin" : isTeacher ? "teacher" : "student";
      if (!allow.includes(roleForCheck)) {
        if (isTeacher) {
          toast.error("هذا القسم مخصّص للطلاب فقط");
          navigate({ to: "/teach/dashboard" });
        } else if (isStudent) {
          const { data: p } = await supabase
            .from("profiles")
            .select("track")
            .eq("id", u.user.id)
            .maybeSingle();
          toast.error("هذا القسم مخصّص للمعلّمين فقط");
          navigate({ to: p?.track === "kids" ? "/kids" : "/adults" });
        } else {
          navigate({ to: "/" });
        }
        return;
      }
      setReady(true);
    })();
  }, [allow, navigate]);

  return ready;
}
