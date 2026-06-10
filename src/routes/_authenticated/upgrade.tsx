import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Check, Crown, Sparkles, Video, BookOpen, Zap } from "lucide-react";

export const Route = createFileRoute("/_authenticated/upgrade")({
  head: () => ({ meta: [{ title: "الترقية إلى Premium | منصة اللغات" }] }),
  component: UpgradePage,
});

const PLANS = [
  {
    id: "monthly",
    name: "شهري",
    price: 49,
    period: "شهر",
    highlight: false,
    features: ["جميع الدورات", "جلسات حيّة لا محدودة", "شهادات معتمدة", "دعم خلال 24س"],
  },
  {
    id: "yearly",
    name: "سنوي",
    price: 399,
    period: "سنة",
    highlight: true,
    saving: "وفّر 33%",
    features: ["كل ما في الشهري", "وصول مدى الحياة لمحتوى المبتدئين", "أولوية حجز المعلمين", "ورش حصرية"],
  },
];

function UpgradePage() {
  return (
    <AppShell>
      <div className="max-w-6xl mx-auto p-6 sm:p-10" dir="rtl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/15 text-accent-foreground text-xs font-medium mb-4">
            <Crown className="w-3.5 h-3.5" /> العضوية المميّزة
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-3">افتح كل الإمكانيات</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            الجلسات الحيّة، الفيديوهات المميّزة، الشهادات والمحتوى الحصري — كل ذلك في خطة واحدة.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-5 mb-12">
          {[
            { icon: Video, label: "جلسات Zoom حيّة" },
            { icon: BookOpen, label: "كل الدورات المتقدّمة" },
            { icon: Zap, label: "شهادات وأنشطة حصرية" },
          ].map((b) => {
            const I = b.icon;
            return (
              <div key={b.label} className="rounded-2xl border border-border bg-card p-5 flex items-center gap-3" style={{ boxShadow: "var(--shadow-soft)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-primary-foreground" style={{ background: "var(--gradient-hero)" }}>
                  <I className="w-5 h-5" />
                </div>
                <span className="font-semibold">{b.label}</span>
              </div>
            );
          })}
        </div>

        <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {PLANS.map((p) => (
            <div
              key={p.id}
              className={`relative rounded-3xl border-2 p-8 bg-card ${p.highlight ? "border-primary" : "border-border"}`}
              style={{ boxShadow: p.highlight ? "var(--shadow-elegant)" : "var(--shadow-soft)" }}
            >
              {p.highlight && (
                <div className="absolute -top-3 right-6 px-3 py-1 rounded-full text-xs font-bold text-primary-foreground" style={{ background: "var(--gradient-hero)" }}>
                  <Sparkles className="w-3 h-3 inline ml-1" /> الأكثر شعبية
                </div>
              )}
              <div className="mb-5">
                <div className="text-sm text-muted-foreground mb-1">{p.name}</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold">{p.price}</span>
                  <span className="text-muted-foreground">د.ت / {p.period}</span>
                </div>
                {p.saving && <div className="mt-2 inline-block px-2 py-0.5 rounded-md bg-accent/15 text-accent-foreground text-xs font-medium">{p.saving}</div>}
              </div>
              <ul className="space-y-3 mb-6">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/checkout"
                search={{ plan: p.id }}
                className="block text-center px-6 py-3 rounded-xl font-semibold text-primary-foreground"
                style={{ background: "var(--gradient-hero)" }}
              >
                الاشتراك الآن
              </Link>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
