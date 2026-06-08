import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { ArrowRight, ArrowLeft, CheckCircle2, Loader2, PlayCircle, BookOpen } from "lucide-react";

export const Route = createFileRoute("/_authenticated/courses/$id/lessons/$n")({
  head: () => ({ meta: [{ title: "درس | منصة اللغات" }] }),
  component: LessonPage,
});

type Course = {
  id: string;
  title: string;
  lessons_count: number;
  level: string;
  languages: { name: string; flag: string | null } | null;
};

function LessonPage() {
  const { id, n } = Route.useParams();
  const navigate = useNavigate();
  const lessonNum = Math.max(1, parseInt(n, 10) || 1);

  const [course, setCourse] = useState<Course | null>(null);
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);
  const [completed, setCompleted] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: c } = await supabase
        .from("courses")
        .select("id, title, lessons_count, level, languages(name, flag)")
        .eq("id", id)
        .maybeSingle();
      setCourse((c as Course) ?? null);

      const { data: u } = await supabase.auth.getUser();
      if (u.user) {
        const { data: e } = await supabase
          .from("enrollments")
          .select("id, completed_lessons")
          .eq("user_id", u.user.id)
          .eq("course_id", id)
          .maybeSingle();
        if (e) {
          setEnrollmentId(e.id);
          setCompleted(e.completed_lessons ?? 0);
        }
      }
      setLoading(false);
    })();
  }, [id]);

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
        </div>
      </AppShell>
    );
  }

  if (!enrollmentId) {
    return (
      <AppShell>
        <div className="p-10 max-w-4xl mx-auto text-center">
          <p className="text-muted-foreground mb-4">يجب التسجيل في الدورة أولًا.</p>
          <Link to="/courses/$id" params={{ id }} className="text-primary hover:underline">العودة لصفحة الدورة</Link>
        </div>
      </AppShell>
    );
  }

  const total = course.lessons_count;
  const isDone = lessonNum <= completed;
  const isLast = lessonNum >= total;

  const markComplete = async () => {
    setSaving(true);
    const newCompleted = Math.max(completed, lessonNum);
    const progress = Math.round((newCompleted / total) * 100);
    const status = newCompleted >= total ? "completed" : "active";
    await supabase
      .from("enrollments")
      .update({ completed_lessons: newCompleted, progress, status })
      .eq("id", enrollmentId);
    setCompleted(newCompleted);
    setSaving(false);
    if (!isLast) {
      navigate({ to: "/courses/$id/lessons/$n", params: { id, n: String(lessonNum + 1) } });
    } else {
      navigate({ to: "/my-courses" });
    }
  };

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto p-6 sm:p-10">
        <Link to="/courses/$id" params={{ id }} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowRight className="w-4 h-4" />
          العودة للدورة
        </Link>

        <div className="grid lg:grid-cols-[1fr_280px] gap-6">
          {/* Main */}
          <div>
            <div className="relative overflow-hidden rounded-3xl p-8 mb-6 text-white" style={{ background: "var(--gradient-hero)" }}>
              <div className="text-sm text-white/80 mb-2">
                {course.languages?.flag} {course.languages?.name} • {course.title}
              </div>
              <h1 className="text-3xl font-bold mb-2">الدرس {lessonNum} من {total}</h1>
              <div className="flex items-center gap-3 text-sm text-white/85">
                <PlayCircle className="w-4 h-4" />
                ~30 دقيقة
                {isDone && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/20 text-xs"><CheckCircle2 className="w-3 h-3" /> مكتمل</span>}
              </div>
            </div>

            <section className="p-6 rounded-2xl bg-card border border-border mb-6" style={{ boxShadow: "var(--shadow-soft)" }}>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                محتوى الدرس
              </h2>
              <div className="prose prose-sm max-w-none text-foreground/90 leading-relaxed space-y-3">
                <p>
                  مرحبًا بك في الدرس {lessonNum}. سنتعرّف في هذا الدرس على مفردات وعبارات
                  أساسية ضمن المستوى <strong>{course.level}</strong>، مع أمثلة عملية وتمارين قصيرة لتثبيت
                  المعلومة.
                </p>
                <ul className="list-disc pr-5 space-y-1">
                  <li>المفردات الرئيسية للدرس</li>
                  <li>القاعدة النحوية المستهدفة</li>
                  <li>أمثلة من الحياة اليومية</li>
                  <li>تمرين تطبيقي قصير</li>
                </ul>
                <p className="text-muted-foreground text-sm">
                  (المحتوى التفصيلي قيد الإعداد — اضغط "إكمال الدرس" للمتابعة وحفظ تقدّمك.)
                </p>
              </div>
            </section>

            <div className="flex items-center justify-between gap-3">
              {lessonNum > 1 ? (
                <Link
                  to="/courses/$id/lessons/$n"
                  params={{ id, n: String(lessonNum - 1) }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground transition"
                >
                  <ArrowRight className="w-4 h-4" />
                  السابق
                </Link>
              ) : <div />}

              <button
                onClick={markComplete}
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold disabled:opacity-60 transition"
                style={{ background: "var(--gradient-hero)" }}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {isLast ? "إنهاء الدورة" : "إكمال الدرس والتالي"}
                {!isLast && <ArrowLeft className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:sticky lg:top-6 h-fit">
            <div className="p-5 rounded-2xl bg-card border border-border" style={{ boxShadow: "var(--shadow-soft)" }}>
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                  <span>تقدّمك</span>
                  <span>{Math.round((completed / total) * 100)}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${(completed / total) * 100}%`, background: "var(--gradient-hero)" }} />
                </div>
              </div>

              <div className="text-xs font-semibold text-muted-foreground mb-2">جميع الدروس</div>
              <div className="space-y-1 max-h-[400px] overflow-auto pl-1">
                {Array.from({ length: total }).map((_, i) => {
                  const num = i + 1;
                  const done = num <= completed;
                  const current = num === lessonNum;
                  return (
                    <Link
                      key={num}
                      to="/courses/$id/lessons/$n"
                      params={{ id, n: String(num) }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition ${
                        current ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        done ? "bg-emerald-500 text-white" : current ? "bg-white/20" : "bg-muted-foreground/15"
                      }`}>
                        {done ? "✓" : num}
                      </div>
                      <span className="flex-1 truncate">الدرس {num}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
