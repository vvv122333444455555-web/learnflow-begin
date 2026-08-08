import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GraduationCap, Mail, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/teacher-login")({
  head: () => ({ meta: [{ title: "دخول المعلّم | LearnFlow" }] }),
  component: TeacherLogin,
});

async function goToTeacherHome(navigate: ReturnType<typeof useNavigate>, userId: string) {
  const { data: p } = await supabase.from("profiles").select("teacher_profile_completed").eq("id", userId).maybeSingle();
  navigate({ to: p?.teacher_profile_completed ? "/teach/dashboard" : "/teach/onboarding" });
}

function TeacherLogin() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      await goToTeacherHome(navigate, u.user.id);
    })();
  }, [navigate]);

  const onAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/teacher-login`, data: { full_name: fullName } },
        });
        if (error) throw error;

        if (!data.session) {
          // Email confirmation is required before we have a session to call the RPC with.
          toast.success("تم إنشاء الحساب — تحقق من بريدك الإلكتروني لتأكيده، ثم سجّل الدخول");
          setMode("login");
          return;
        }
        const { error: roleErr } = await supabase.rpc("self_register_as_teacher");
        if (roleErr) throw roleErr;
        toast.success("مرحبًا بك كمعلّم! أكمل ملفك الشخصي");
        navigate({ to: "/teach/onboarding" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        const { data: u } = await supabase.auth.getUser();
        const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", u.user!.id);
        if (!roles?.some((r) => r.role === "teacher")) {
          // First login after confirming email: grant the teacher role now.
          const { error: roleErr } = await supabase.rpc("self_register_as_teacher");
          if (roleErr) throw roleErr;
          navigate({ to: "/teach/onboarding" });
          return;
        }
        await goToTeacherHome(navigate, u.user!.id);
      }
    } catch (e) { toast.error(e instanceof Error ? e.message : "خطأ"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" dir="rtl" style={{ background: "var(--gradient-hero)" }}>
      <div className="w-full max-w-md bg-card rounded-2xl shadow-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white" style={{ background: "var(--gradient-hero)" }}><GraduationCap className="w-6 h-6"/></div>
          <div>
            <h1 className="text-xl font-bold">بوابة المعلّم</h1>
            <p className="text-sm text-muted-foreground">سجّل دخولك أو أنشئ حسابًا جديدًا</p>
          </div>
        </div>

        <div className="grid grid-cols-2 p-1 bg-muted rounded-xl mb-4">
          {(["login", "signup"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)}
              className={`py-2 text-sm font-medium rounded-lg ${mode === m ? "bg-background shadow-sm" : "text-muted-foreground"}`}>
              {m === "login" ? "تسجيل الدخول" : "حساب جديد"}
            </button>
          ))}
        </div>
        <form onSubmit={onAuth} className="space-y-3">
          {mode === "signup" && <TextInput icon={<GraduationCap className="w-4 h-4"/>} placeholder="الاسم الكامل" value={fullName} onChange={setFullName} required/>}
          <TextInput icon={<Mail className="w-4 h-4"/>} placeholder="البريد الإلكتروني" type="email" value={email} onChange={setEmail} required/>
          <TextInput icon={<Lock className="w-4 h-4"/>} placeholder="كلمة المرور" type="password" value={password} onChange={setPassword} required/>
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: "var(--gradient-hero)" }}>
            {loading && <Loader2 className="w-4 h-4 animate-spin"/>}
            {mode === "login" ? "دخول" : "تسجيل"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <Link to="/" className="text-muted-foreground hover:underline">← العودة للرئيسية</Link>
        </div>
      </div>
    </div>
  );
}

function TextInput({ icon, ...p }: { icon: React.ReactNode; placeholder: string; value: string; onChange: (v:string)=>void; type?: string; required?: boolean }) {
  return (
    <div className="relative">
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>
      <input type={p.type || "text"} placeholder={p.placeholder} value={p.value} onChange={(e)=>p.onChange(e.target.value)} required={p.required}
        className="w-full pr-10 pl-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"/>
    </div>
  );
}
