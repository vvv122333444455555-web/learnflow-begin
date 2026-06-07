import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Check, ArrowLeft, Sprout, Flame, Mountain, Trophy } from "lucide-react";

export const Route = createFileRoute("/level")({
  head: () => ({
    meta: [
      { title: "اختر مستواك | منصة اللغات" },
      { name: "description", content: "حدّد مستواك في اللغة لنقترح عليك أنسب الدورات والدروس." },
    ],
  }),
  component: LevelPage,
});

const LEVELS = [
  { code: "A1", title: "مبتدئ", desc: "أبدأ من الصفر وأتعلّم الأساسيات.", icon: Sprout, tone: "from-emerald-400/20 to-emerald-600/10" },
  { code: "A2", title: "ما قبل المتوسط", desc: "أعرف عبارات يومية وأكوّن جملًا بسيطة.", icon: Flame, tone: "from-amber-400/20 to-amber-600/10" },
  { code: "B1", title: "متوسط", desc: "أتواصل في معظم المواقف اليومية.", icon: Mountain, tone: "from-sky-400/20 to-sky-600/10" },
  { code: "B2", title: "فوق المتوسط", desc: "أناقش مواضيع معقّدة بثقة نسبية.", icon: Mountain, tone: "from-indigo-400/20 to-indigo-600/10" },
  { code: "C1", title: "متقدّم", desc: "أتحدّث بطلاقة في السياقات المهنية.", icon: Trophy, tone: "from-rose-400/20 to-rose-600/10" },
  { code: "C2", title: "إتقان", desc: "أصل إلى مستوى قريب من اللغة الأم.", icon: Trophy, tone: "from-fuchsia-400/20 to-fuchsia-600/10" },
];

function LevelPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Top accent */}
      <div className="h-2 w-full" style={{ background: "var(--gradient-hero)" }} />

      <div className="max-w-5xl mx-auto px-6 py-12">
        <button
          onClick={() => navigate({ to: "/auth" })}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          رجوع
        </button>

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
                className={`group relative text-right p-6 rounded-2xl border-2 transition-all ${
                  active
                    ? "border-primary bg-card"
                    : "border-border bg-card hover:border-primary/40"
                }`}
                style={active ? { boxShadow: "var(--shadow-elegant)" } : { boxShadow: "var(--shadow-soft)" }}
              >
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${l.tone} opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none`} />
                <div className="relative">
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
                </div>
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
            disabled={!selected}
            onClick={() => alert(`تم اختيار المستوى: ${selected}`)}
            className="px-8 py-3 rounded-xl font-semibold text-primary-foreground transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-95 active:scale-[0.99]"
            style={{ background: "var(--gradient-hero)", boxShadow: "var(--shadow-elegant)" }}
          >
            متابعة
          </button>
        </div>
      </div>
    </div>
  );
}
