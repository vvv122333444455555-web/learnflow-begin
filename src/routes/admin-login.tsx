import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield, Loader2, Sparkles } from "lucide-react";

export const Route = createFileRoute("/admin-login")({
  component: AdminLogin,
});

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [adminExists, setAdminExists] = useState<boolean | null>(null);
  const [mode, setMode] = useState<"login" | "bootstrap">("login");
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc("admin_exists");
      if (error) { setAdminExists(true); return; }
      setAdminExists(!!data);
      if (!data) setMode("bootstrap");
    })();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "bootstrap") {
        // Re-check server-side before signup
        const { data: exists } = await supabase.rpc("admin_exists");
        if (exists) { toast.error("يوجد أدمن مسبقًا — استخدم تسجيل الدخول"); setMode("login"); setAdminExists(true); return; }
        const { error: sErr } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/admin-login`, data: { full_name: fullName } },
        });
        if (sErr) throw sErr;
        // If email confirmations enabled, session may be null
        const { data: sess } = await supabase.auth.getSession();
        if (!sess.session) {
          const { error: pErr } = await supabase.auth.signInWithPassword({ email, password });
          if (pErr) { toast.success("أنشئ الحساب — أكّد بريدك ثم عد وسجّل الدخول"); return; }
        }
        const { error: bErr } = await supabase.rpc("bootstrap_first_admin");
        if (bErr) throw bErr;
        toast.success("تم إنشاء أول حساب أدمن");
        navigate({ to: "/admin" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        const { data: u } = await supabase.auth.getUser();
        const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", u.user!.id);
        if (!roles?.some(r => r.role === "admin")) { await supabase.auth.signOut(); throw new Error("هذا الحساب ليس أدمن"); }
        navigate({ to: "/admin" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطأ");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" dir="rtl" style={{ background: "var(--gradient-hero)" }}>
      <form onSubmit={submit} className="w-full max-w-sm bg-card rounded-2xl p-8 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white" style={{ background: "var(--gradient-hero)" }}>
            {mode === "bootstrap" ? <Sparkles className="w-6 h-6"/> : <Shield className="w-6 h-6"/>}
          </div>
          <div>
            <h1 className="text-xl font-bold">{mode === "bootstrap" ? "إنشاء أول أدمن" : "دخول الإدارة"}</h1>
            {mode === "bootstrap" && <p className="text-xs text-muted-foreground">إعداد أولي (يختفي بعد أول حساب)</p>}
          </div>
        </div>

        {adminExists === null ? (
          <div className="py-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin"/></div>
        ) : (
          <>
            {mode === "bootstrap" && (
              <input required placeholder="الاسم الكامل" value={fullName} onChange={e=>setFullName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-input bg-background"/>
            )}
            <input required type="email" placeholder="البريد" value={email} onChange={e=>setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-input bg-background"/>
            <input required type="password" placeholder="كلمة المرور (٦ أحرف على الأقل)" minLength={6} value={password} onChange={e=>setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-input bg-background"/>
            <button disabled={loading} className="w-full py-3 rounded-xl text-white font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60" style={{ background: "var(--gradient-hero)" }}>
              {loading && <Loader2 className="w-4 h-4 animate-spin"/>}
              {mode === "bootstrap" ? "إنشاء الحساب" : "دخول"}
            </button>
          </>
        )}
      </form>
    </div>
  );
}
