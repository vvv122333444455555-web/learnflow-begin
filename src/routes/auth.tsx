import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Mail, Lock, User, Languages, Sparkles, Loader2, Baby, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

const search = z.object({
  track: z.enum(["kids", "adults"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: search,
  head: () => ({
    meta: [
      { title: "تسجيل الدخول | LearnFlow" },
      { name: "description", content: "سجّل الدخول أو أنشئ حسابك في LearnFlow." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { track: trackParam } = Route.useSearch();
  const [mode, setMode] = useState<"login" | "signup">(trackParam ? "signup" : "login");
  const [track, setTrack] = useState<"kids" | "adults">(trackParam ?? "adults");
  const [trackExplicit, setTrackExplicit] = useState(!!trackParam);
  const [isParent, setIsParent] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const goToTrack = (profileTrack?: string | null) => {
    navigate({ to: profileTrack === "kids" ? "/kids" : "/adults" });
  };

  const applySelectedStudentTrack = async () => {
    const accountType = track === "kids" ? (isParent ? "parent" : "child") : "adult";
    const { data, error } = await supabase.rpc("set_my_student_track" as never, {
      _track: track,
      _account_type: accountType,
    } as never);

    if (error) throw error;
    return data as Database["public"]["Tables"]["profiles"]["Row"] | null;
  };

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      if (trackParam) {
        try {
          const updatedProfile = await applySelectedStudentTrack();
          goToTrack(updatedProfile?.track ?? trackParam);
          return;
        } catch {
          // Teacher/admin accounts cannot be converted here; fall back to their saved workspace.
        }
      }
      const { data: p } = await supabase.from("profiles").select("track").eq("id", data.user.id).maybeSingle();
      goToTrack(p?.track);
    });
  }, [navigate, trackParam]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const account_type = track === "kids" ? (isParent ? "parent" : "child") : "adult";
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { full_name: fullName, track, account_type },
          },
        });
        if (error) throw error;
        toast.success("تم إنشاء الحساب!");
        if (data.session) {
          const updatedProfile = await applySelectedStudentTrack();
          goToTrack(updatedProfile?.track ?? track);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (trackExplicit) {
          const updatedProfile = await applySelectedStudentTrack();
          goToTrack(updatedProfile?.track ?? track);
        } else {
          const { data: u } = await supabase.auth.getUser();
          const { data: p } = await supabase.from("profiles").select("track").eq("id", u.user!.id).maybeSingle();
          goToTrack(p?.track);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "خطأ";
      toast.error(
        message.includes("Invalid login") ? "بيانات الدخول غير صحيحة" :
        message.includes("already registered") ? "هذا البريد مسجّل مسبقًا" : message
      );
    } finally { setLoading(false); }
  };

  const onGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: `${window.location.origin}/` });
    if (result.error) toast.error("تعذّر الدخول عبر Google");
  };

  const kidsUI = track === "kids";

  return (
    <div className="min-h-screen flex" dir="rtl">
      <div className="hidden lg:flex relative w-1/2" style={{ background: kidsUI ? "linear-gradient(135deg, #FF6B9D, #FEC260)" : "var(--gradient-hero)" }}>
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
              <Languages className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold">LearnFlow</span>
          </div>
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur text-sm">
              <Sparkles className="w-4 h-4" /> {kidsUI ? "لنلعب ونتعلّم معًا!" : "تعلّم بذكاء، تحدّث بثقة"}
            </div>
            <h1 className="text-5xl font-bold leading-tight">
              {kidsUI ? <>مغامرة لغوية<br/>ممتعة لطفلك</> : <>ابدأ رحلتك<br/>نحو إتقان لغة جديدة</>}
            </h1>
            <p className="text-white/85 text-lg max-w-md">
              {kidsUI ? "نقاط، شارات، وشخصيات مرحة تجعل التعلّم متعة." : "مسارات موجّهة، تقييم CEFR دقيق، ومعلّمون متخصصون."}
            </p>
          </div>
          <div className="text-white/70 text-sm">© LearnFlow · تونس</div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-md">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-foreground">
              {mode === "login" ? "مرحبًا بعودتك" : (kidsUI ? "هيا نبدأ! 🚀" : "أنشئ حسابك")}
            </h2>
            <p className="text-muted-foreground mt-2">
              {mode === "login" ? "سجّل الدخول للمتابعة" : `أنت تنشئ حساب ${kidsUI ? "الأطفال 🎨" : "الكبار 💼"}`}
            </p>
          </div>

          <div className="grid grid-cols-2 p-1 bg-muted rounded-xl mb-4">
            {(["login", "signup"] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)}
                className={`py-2.5 text-sm font-medium rounded-lg ${mode === m ? "bg-background shadow-sm" : "text-muted-foreground"}`}>
                {m === "login" ? "تسجيل الدخول" : "حساب جديد"}
              </button>
            ))}
          </div>

          <div className="mb-4">
            <div className="text-sm font-medium mb-2">
              {mode === "login" ? "أريد الدخول إلى" : "اختر المسار"}
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <TrackBtn active={track === "adults"} onClick={() => { setTrack("adults"); setIsParent(false); setTrackExplicit(true); }}
                icon="💼" label="كبار" />
              <TrackBtn active={track === "kids"} onClick={() => { setTrack("kids"); setTrackExplicit(true); }}
                icon="🎨" label="أطفال" />
            </div>
          </div>

          {mode === "signup" && track === "kids" && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              <SubType active={!isParent} onClick={() => setIsParent(false)} icon={<Baby className="w-4 h-4"/>} label="حساب طفل" />
              <SubType active={isParent} onClick={() => setIsParent(true)} icon={<Users className="w-4 h-4"/>} label="حساب ولي أمر" />
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-3">
            {mode === "signup" && (
              <Field icon={<User className="w-4 h-4"/>} label="الاسم الكامل" type="text" placeholder="محمد أحمد" value={fullName} onChange={setFullName} required />
            )}
            <Field icon={<Mail className="w-4 h-4"/>} label="البريد الإلكتروني" type="email" placeholder="you@example.com" value={email} onChange={setEmail} required />
            <Field icon={<Lock className="w-4 h-4"/>} label="كلمة المرور" type="password" placeholder="••••••••" value={password} onChange={setPassword} required />

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: kidsUI ? "linear-gradient(135deg, #FF6B9D, #FEC260)" : "var(--gradient-hero)" }}>
              {loading && <Loader2 className="w-4 h-4 animate-spin"/>}
              {mode === "login" ? "دخول" : "إنشاء الحساب"}
            </button>
          </form>

          <div className="my-5 flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex-1 h-px bg-border"/> أو <div className="flex-1 h-px bg-border"/>
          </div>

          <button onClick={onGoogle} className="w-full py-3 rounded-xl border border-border bg-card hover:bg-muted flex items-center justify-center gap-3 font-medium">
            المتابعة عبر Google
          </button>

          <div className="mt-6 text-center text-sm space-y-2">
            <Link to="/teacher-login" className="text-primary hover:underline">هل أنت معلّم؟ ادخل هنا</Link>
            <div><Link to="/" className="text-muted-foreground hover:underline">← العودة للرئيسية</Link></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TrackBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: string; label: string }) {
  return (
    <button type="button" onClick={onClick}
      className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 font-semibold text-sm ${active ? "border-primary bg-primary/5" : "border-border"}`}>
      <span className="text-2xl">{icon}</span> {label}
    </button>
  );
}
function SubType({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button type="button" onClick={onClick}
      className={`p-2.5 rounded-lg border flex items-center justify-center gap-2 text-sm ${active ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>
      {icon} {label}
    </button>
  );
}
function Field({ icon, label, type, placeholder, value, onChange, required }: {
  icon: React.ReactNode; label: string; type: string; placeholder: string;
  value: string; onChange: (v: string) => void; required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium mb-1.5 block">{label}</span>
      <div className="relative">
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>
        <input type={type} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} required={required}
          className="w-full pr-10 pl-4 py-3 rounded-xl border border-input bg-card focus:outline-none focus:ring-2 focus:ring-ring"/>
      </div>
    </label>
  );
}
