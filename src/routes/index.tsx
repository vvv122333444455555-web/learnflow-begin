import { createFileRoute, Link } from "@tanstack/react-router";
import { Languages, Sparkles, Rocket, Briefcase, GraduationCap, Shield } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LearnFlow — منصة تعلّم اللغات في تونس" },
      { name: "description", content: "اختر مسارك: مسار الأطفال المرح، أو مسار الكبار المهني. لغات، تمارين تفاعلية، ومعلّمون متخصصون." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen" dir="rtl" style={{ background: "var(--gradient-hero)" }}>
      <header className="px-6 py-6 flex items-center justify-between max-w-6xl mx-auto text-white">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
            <Languages className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold">LearnFlow</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Link to="/teacher-login" className="px-4 py-2 rounded-xl border border-white/30 hover:bg-white/10 flex items-center gap-2">
            <GraduationCap className="w-4 h-4" /> دخول المعلّم
          </Link>
          <Link to="/admin-login" className="px-4 py-2 rounded-xl hover:bg-white/10 flex items-center gap-2">
            <Shield className="w-4 h-4" /> الإدارة
          </Link>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 pt-8 pb-16 text-white text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur text-sm mb-6">
          <Sparkles className="w-4 h-4" />
          منصّة تعليمية تونسية شاملة
        </div>
        <h1 className="text-4xl sm:text-6xl font-bold leading-tight mb-4">
          اختر مسارك التعليمي
        </h1>
        <p className="text-white/85 text-lg max-w-2xl mx-auto mb-12">
          تجربة تعلّم مصمّمة خصيصًا لكل فئة عمرية — ألوان مرحة للأطفال، وواجهة احترافية للكبار.
        </p>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Kids track */}
          <Link
            to="/auth"
            search={{ track: "kids" }}
            className="group relative overflow-hidden rounded-3xl p-8 text-right bg-white text-foreground shadow-2xl transition-transform hover:-translate-y-1"
          >
            <div className="absolute -top-8 -left-8 w-40 h-40 rounded-full opacity-30" style={{ background: "linear-gradient(135deg, #FF6B9D, #FEC260)" }} />
            <div className="absolute -bottom-10 -right-10 w-52 h-52 rounded-full opacity-20" style={{ background: "linear-gradient(135deg, #7EE8FA, #EEC0C6)" }} />
            <div className="relative">
              <div className="text-6xl mb-4">🎨</div>
              <h2 className="text-3xl font-bold mb-2" style={{ color: "#FF6B9D" }}>مسار الأطفال</h2>
              <p className="text-muted-foreground mb-6">
                ألعاب، نقاط، شارات، ومعلّمة مرحة. حساب ولي الأمر يتابع تقدّم أطفاله.
              </p>
              <div className="flex flex-wrap gap-2 text-xs">
                {["نقاط وشارات 🏅", "تصميم مرح 🌈", "متابعة الأهل 👨‍👩‍👧"].map((t) => (
                  <span key={t} className="px-3 py-1.5 rounded-full bg-pink-100 text-pink-700 font-semibold">{t}</span>
                ))}
              </div>
              <div className="mt-6 inline-flex items-center gap-2 font-bold" style={{ color: "#FF6B9D" }}>
                <Rocket className="w-5 h-5" /> ابدأ رحلة طفلك
              </div>
            </div>
          </Link>

          {/* Adults track */}
          <Link
            to="/auth"
            search={{ track: "adults" }}
            className="group relative overflow-hidden rounded-3xl p-8 text-right bg-card text-foreground border-2 border-primary/20 shadow-2xl transition-transform hover:-translate-y-1"
          >
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 text-white" style={{ background: "var(--gradient-hero)" }}>
                <Briefcase className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-bold mb-2 text-primary">مسار الكبار</h2>
              <p className="text-muted-foreground mb-6">
                مسارات موجّهة (سفر / عمل / امتحانات) مع تتبّع دقيق للمستوى الأوروبي CEFR.
              </p>
              <div className="flex flex-wrap gap-2 text-xs">
                {["CEFR A1 → C2", "أهداف مهنية 💼", "تقارير تفصيلية 📊"].map((t) => (
                  <span key={t} className="px-3 py-1.5 rounded-full bg-primary/10 text-primary font-semibold">{t}</span>
                ))}
              </div>
              <div className="mt-6 inline-flex items-center gap-2 font-bold text-primary">
                <GraduationCap className="w-5 h-5" /> ابدأ الآن
              </div>
            </div>
          </Link>
        </div>

        <p className="mt-10 text-white/70 text-sm">
          لديك حساب؟ <Link to="/auth" className="underline font-semibold">سجّل الدخول</Link>
        </p>
      </section>
    </div>
  );
}
