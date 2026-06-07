import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, ArrowLeft, Sprout, Flame, Mountain, Trophy, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/level")({
  head: () => ({
    meta: [
      { title: "اختر مستواك | منصة اللغات" },
      { name: "description", content: "حدّد مستواك في اللغة لنقترح عليك أنسب الدورات والدروس." },
    ],
  }),
  component: LevelPage,
});

const LEVELS = [
  { code: "A1", title: "مبتدئ", desc: "أبدأ من الصفر وأتعلّم الأساسيات.", icon: Sprout },
  { code: "A2", title: "ما قبل المتوسط", desc: "أعرف عبارات يومية وأكوّن جملًا بسيطة.", icon: Flame },
  { code: "B1", title: "متوسط", desc: "أتواصل في معظم المواقف اليومية.", icon: Mountain },
  { code: "B2", title: "فوق المتوسط", desc: "أناقش مواضيع معقّدة بثقة نسبية.", icon: Mountain },
  { code: "C1", title: "متقدّم", desc: "أتحدّث بطلاقة في السياقات المهنية.", icon: Trophy },
  { code: "C2", title: "إتقان", desc: "أصل إلى مستوى قريب من اللغة الأم.", icon: Trophy },
];

function LevelPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase.from("profiles").select("level").eq("id", u.user.id).maybeSingle();
      if (data?.level) setSelected(data.level);
    })();
  }, []);

  const onSave = async () => {
    if (!selected) return;
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) {
      navigate({ to: "/auth" });
      return;
    }
    const { error } = await supabase.from("profiles").update({ level: selected }).eq("id", u.user.id);
    setSaving(false);
    if (error) {
      toast.error("تعذّر الحفظ، حاول مجددًا");
      return;
    }
    toast.success(`تم حفظ مستواك: ${selected}`);
    navigate({ to: "/dashboard" });
  };

  const onSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="h-2 w-full" style={{ background: "var(--gradient-hero)" }} />

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate({ to: "/" })}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition"
          >
            <ArrowLeft className="w-4 h-4" />
            رجوع
          </button>
          <button onClick={onSignOut} className="text-sm text-muted-foreground hover:text-foreground">
            تسجيل الخروج
          </button>
        </div>

        <div className="mb-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/15 text-accent-foreground text-xs font-medium mb-4">
            الخطوة ٢ من ٣
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight">
            ما مستواك في اللغة؟
          </h1>
          <p className="text-muted-foreground mt-3 text-lg">
            اختر المستوى الذي يصفك بدقّة، وسنُجهّز لك مسارًا مخصّصًا يناسبك.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {LEVELS.map((l) => {
            const Icon = l.icon;
            const active = selected === l.code;
            return (
              <button
                key={l.code}
                onClick={() => setSelected(l.code)}
                className={`group relative text-right p-6 rounded-2xl border-2 transition-all bg-card ${
                  active ? "border-primary" : "border-border hover:border-primary/40"
                }`}
                style={active ? { boxShadow: "var(--shadow-elegant)" } : { boxShadow: "var(--shadow-soft)" }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Icon className="w-6 h-6" />
                  </div>
                  {active && (
                    <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-xs font-bold text-accent-foreground bg-accent px-2 py-0.5 rounded-md">{l.code}</span>
                  <h3 className="text-lg font-bold text-foreground">{l.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{l.desc}</p>
              </button>
            );
          })}
        </div>

        <div className="mt-10 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <p className="text-sm text-muted-foreground">
            لست متأكدًا؟{" "}
            <a href="#" className="text-primary font-medium hover:underline">اخضع لاختبار تحديد المستوى</a>
          </p>
          <button
            disabled={!selected || saving}
            onClick={onSave}
            className="px-8 py-3 rounded-xl font-semibold text-primary-foreground transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-95 active:scale-[0.99] inline-flex items-center gap-2"
            style={{ background: "var(--gradient-hero)", boxShadow: "var(--shadow-elegant)" }}
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            حفظ ومتابعة
          </button>
        </div>
      </div>
    </div>
  );
}
