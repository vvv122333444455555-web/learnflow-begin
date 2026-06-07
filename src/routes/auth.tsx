import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mail, Lock, User, Languages, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول | منصة اللغات" },
      { name: "description", content: "سجّل الدخول إلى منصتك لتعلّم اللغات بأسلوب تفاعلي وممتع." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/level" });
    });
  }, [navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/level`,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        toast.success("تم إنشاء حسابك! تحقّق من بريدك لتأكيد التسجيل.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/level" });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "حدث خطأ ما";
      toast.error(
        message.includes("Invalid login") ? "بيانات الدخول غير صحيحة" :
        message.includes("already registered") ? "هذا البريد مسجّل مسبقًا" :
        message
      );
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/level`,
    });
    if (result.error) {
      toast.error("تعذّر تسجيل الدخول عبر Google");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/level" });
  };

  return (
    <div className="min-h-screen flex" dir="rtl">
      <div className="hidden lg:flex relative w-1/2 overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: "radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 80% 70%, white 1px, transparent 1px)",
          backgroundSize: "60px 60px, 90px 90px",
        }} />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
              <Languages className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold">لغات</span>
          </div>
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur text-sm">
              <Sparkles className="w-4 h-4" />
              تعلّم بذكاء، تحدّث بثقة
            </div>
            <h1 className="text-5xl font-bold leading-tight">
              ابدأ رحلتك<br />نحو إتقان لغة جديدة
            </h1>
            <p className="text-white/85 text-lg max-w-md leading-relaxed">
              دروس تفاعلية، معلّمون مختصّون، وجلسات مباشرة — كل ما تحتاجه للوصول إلى مستوى الطلاقة.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-6 text-white/90">
            {[{ n: "+12", l: "لغة" }, { n: "+300", l: "دورة" }, { n: "+50k", l: "متعلّم" }].map((s) => (
              <div key={s.l}>
                <div className="text-3xl font-bold">{s.n}</div>
                <div className="text-sm text-white/70">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground">
              <Languages className="w-5 h-5" />
            </div>
            <span className="text-lg font-bold">لغات</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground">
              {mode === "login" ? "مرحبًا بعودتك" : "أنشئ حسابك"}
            </h2>
            <p className="text-muted-foreground mt-2">
              {mode === "login" ? "سجّل الدخول لمتابعة دروسك وتقدّمك." : "خطوات قليلة وتبدأ التعلّم اليوم."}
            </p>
          </div>

          <div className="grid grid-cols-2 p-1 bg-muted rounded-xl mb-6">
            {(["login", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`py-2.5 text-sm font-medium rounded-lg transition-all ${
                  mode === m ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m === "login" ? "تسجيل الدخول" : "حساب جديد"}
              </button>
            ))}
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {mode === "signup" && (
              <Field icon={<User className="w-4 h-4" />} label="الاسم الكامل" type="text" placeholder="محمد أحمد" value={fullName} onChange={setFullName} required />
            )}
            <Field icon={<Mail className="w-4 h-4" />} label="البريد الإلكتروني" type="email" placeholder="you@example.com" value={email} onChange={setEmail} required />
            <Field icon={<Lock className="w-4 h-4" />} label="كلمة المرور" type="password" placeholder="••••••••" value={password} onChange={setPassword} required />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-primary-foreground transition-all hover:opacity-95 active:scale-[0.99] disabled:opacity-60 inline-flex items-center justify-center gap-2"
              style={{ background: "var(--gradient-hero)", boxShadow: "var(--shadow-elegant)" }}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === "login" ? "دخول" : "إنشاء الحساب"}
            </button>
          </form>

          <div className="my-6 flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex-1 h-px bg-border" /> أو <div className="flex-1 h-px bg-border" />
          </div>

          <button
            onClick={onGoogle}
            className="w-full py-3 rounded-xl border border-border bg-card hover:bg-muted transition-colors flex items-center justify-center gap-3 font-medium"
          >
            <GoogleIcon />
            المتابعة عبر Google
          </button>

          <p className="text-center text-sm text-muted-foreground mt-8">
            بالمتابعة فأنت توافق على{" "}
            <Link to="/auth" className="text-primary hover:underline">الشروط والأحكام</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ icon, label, type, placeholder, value, onChange, required }: {
  icon: React.ReactNode; label: string; type: string; placeholder: string;
  value: string; onChange: (v: string) => void; required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-foreground mb-1.5 block">{label}</span>
      <div className="relative">
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className="w-full pr-10 pl-4 py-3 rounded-xl border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
        />
      </div>
    </label>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.5 29.5 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.4-.3-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 7 29.5 5 24 5 16.3 5 9.7 9 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 43.5c5.4 0 10.3-2 13.9-5.3l-6.4-5.2c-2 1.5-4.6 2.5-7.5 2.5-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.6 39.4 16.3 43.5 24 43.5z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.4-2.3 4.4-4.3 5.9l6.4 5.2c-.4.4 7.1-5.2 7.1-15.1 0-1.2-.1-2.4-.3-3.5z"/>
    </svg>
  );
}
