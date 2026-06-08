import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { ArrowRight, BookOpen, Clock, CheckCircle2, GraduationCap, Loader2, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/courses/$id")({
  head: () => ({ meta: [{ title: "تفاصيل الدورة | منصة اللغات" }] }),
  component: CourseDetails,
});

type Course = {
  id: string;
  title: string;
  description: string | null;
  level: string;
  duration_weeks: number;
  lessons_count: number;
  price: number;
  languages: { name: string; flag: string | null } | null;
};

function CourseDetails() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: c } = await supabase
        .from("courses")
        .select("id, title, description, level, duration_weeks, lessons_count, price, languages(name, flag)")
        .eq("id", id)
        .maybeSingle();
      setCourse((c as Course) ?? null);

      const { data: u } = await supabase.auth.getUser();
      if (u.user) {
        const { data: e } = await supabase
          .from("enrollments")
          .select("id")
          .eq("user_id", u.user.id)
          .eq("course_id", id)
          .maybeSingle();
        setEnrolled(!!e);
      }
      setLoading(false);
    })();
  }, [id]);

  const enroll = async () => {
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    await supabase.from("enrollments").insert({ user_id: u.user.id, course_id: id });
    setEnrolled(true);
    setSaving(false);
    navigate({ to: "/courses/$id/lessons/$n", params: { id, n: "1" } });
  };

  if (loading) {
    return (
      <AppShell>
        <div className="p-10 max-w-4xl mx-auto">
          <div className="h-64 rounded-3xl bg-muted animate-pulse" />
        </div>
      </AppShell>
    );
  }

  if (!course) {
    return (
      <AppShell>
        <div className="p-10 max-w-4xl mx-auto text-center">
          <p className="text-muted-foreground">لم يتم العثور على الدورة.</p>
          <Link to="/courses" className="text-primary hover:underline mt-3 inline-block">العودة للدورات</Link>
        </div>
      </AppShell>
    );
  }

  const highlights = [
    "محتوى مُحدّث يواكب الاستخدام الحقيقي للغة",
    "تمارين تفاعلية بعد كل درس لتثبيت المعلومة",
    "مراجعات دورية ومحادثات تطبيقية",
    "شهادة إتمام عند إنهاء جميع الدروس",
  ];

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto p-6 sm:p-10">
        <Link to="/courses" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowRight className="w-4 h-4" />
          العودة للدورات
        </Link>

        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl p-8 sm:p-10 mb-8 text-white" style={{ background: "var(--gradient-hero)" }}>
          <div className="absolute inset-0 opacity-15" style={{
            backgroundImage: "radial-gradient(circle at 20% 80%, white 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }} />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-5xl">{course.languages?.flag ?? "🌍"}</div>
              <div>
                <div className="text-sm text-white/80">{course.languages?.name}</div>
                <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md bg-white/15 text-xs font-bold">
                  المستوى {course.level}
                </div>
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">{course.title}</h1>
            <p className="text-white/85 max-w-2xl leading-relaxed">{course.description}</p>

            <div className="flex flex-wrap gap-6 mt-6 text-sm">
              <span className="flex items-center gap-2"><BookOpen className="w-4 h-4" />{course.lessons_count} درس</span>
              <span className="flex items-center gap-2"><Clock className="w-4 h-4" />{course.duration_weeks} أسبوع</span>
              <span className="flex items-center gap-2"><GraduationCap className="w-4 h-4" />شهادة معتمدة</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: content */}
          <div className="lg:col-span-2 space-y-6">
            <section className="p-6 rounded-2xl bg-card border border-border" style={{ boxShadow: "var(--shadow-soft)" }}>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent-foreground" />
                ماذا ستتعلّم؟
              </h2>
              <ul className="space-y-3">
                {highlights.map((h) => (
                  <li key={h} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <span className="text-foreground/90">{h}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="p-6 rounded-2xl bg-card border border-border" style={{ boxShadow: "var(--shadow-soft)" }}>
              <h2 className="text-xl font-bold mb-4">منهج الدورة</h2>
              <div className="space-y-2">
                {Array.from({ length: Math.min(6, course.lessons_count) }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/60 transition">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">الدرس {i + 1}</div>
                      <div className="text-xs text-muted-foreground">~30 دقيقة</div>
                    </div>
                  </div>
                ))}
                {course.lessons_count > 6 && (
                  <div className="text-center text-sm text-muted-foreground pt-2">
                    و{course.lessons_count - 6} دروس أخرى…
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Right: enroll card */}
          <aside className="lg:sticky lg:top-6 h-fit">
            <div className="p-6 rounded-2xl bg-card border border-border" style={{ boxShadow: "var(--shadow-elegant)" }}>
              <div className="mb-5">
                <div className="text-xs text-muted-foreground mb-1">السعر</div>
                <div className="text-3xl font-bold text-foreground">
                  {course.price > 0 ? `${course.price} ر.س` : "مجانًا"}
                </div>
              </div>

              {enrolled ? (
                <Link
                  to="/courses/$id/lessons/$n"
                  params={{ id: course.id, n: "1" }}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-white font-semibold transition"
                  style={{ background: "var(--gradient-hero)" }}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  ابدأ التعلّم
                </Link>
              ) : (
                <button
                  onClick={enroll}
                  disabled={saving}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-white font-semibold disabled:opacity-60 transition"
                  style={{ background: "var(--gradient-hero)" }}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <GraduationCap className="w-4 h-4" />}
                  سجّل الآن
                </button>
              )}

              <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> وصول مدى الحياة</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> شهادة عند الإتمام</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> دعم من المدرّبين</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
