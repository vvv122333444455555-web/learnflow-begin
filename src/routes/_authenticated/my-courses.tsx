import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { BookOpen, Clock, Trash2, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/my-courses")({
  head: () => ({ meta: [{ title: "دوراتي | منصة اللغات" }] }),
  component: MyCourses,
});

type Row = {
  id: string;
  progress: number;
  status: string;
  created_at: string;
  courses: {
    id: string;
    title: string;
    level: string;
    duration_weeks: number;
    lessons_count: number;
    languages: { name: string; flag: string | null } | null;
  } | null;
};

function MyCourses() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { data } = await supabase
      .from("enrollments")
      .select("id, progress, status, created_at, courses(id, title, level, duration_weeks, lessons_count, languages(name, flag))")
      .eq("user_id", u.user.id)
      .order("created_at", { ascending: false });
    setRows((data as Row[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const unenroll = async (id: string) => {
    await supabase.from("enrollments").delete().eq("id", id);
    setRows((r) => r.filter((x) => x.id !== id));
  };

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto p-6 sm:p-10">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">دوراتي</h1>
          <p className="text-muted-foreground mt-2">تابع تقدّمك في الدورات التي سجّلت فيها.</p>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-40 rounded-2xl bg-muted animate-pulse" />)}
          </div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center rounded-2xl border border-dashed border-border bg-card">
            <p className="text-muted-foreground mb-4">لم تسجّل في أي دورة بعد.</p>
            <Link to="/courses" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition">
              تصفّح الدورات
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {rows.map((r) => r.courses && (
              <div key={r.id} className="p-5 rounded-2xl bg-card border border-border" style={{ boxShadow: "var(--shadow-soft)" }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{r.courses.languages?.flag ?? "🌍"}</div>
                    <div>
                      <div className="text-xs text-muted-foreground">{r.courses.languages?.name}</div>
                      <Link to="/courses/$id" params={{ id: r.courses.id }} className="font-bold text-foreground hover:text-primary transition">
                        {r.courses.title}
                      </Link>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-accent-foreground bg-accent px-2 py-1 rounded-md">{r.courses.level}</span>
                </div>

                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                    <span>التقدّم</span>
                    <span>{r.progress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${r.progress}%`, background: "var(--gradient-hero)" }} />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border gap-2">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />{r.courses.lessons_count} درس</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{r.courses.duration_weeks} أسبوع</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Link
                      to="/courses/$id/lessons/$n"
                      params={{ id: r.courses.id, n: "1" }}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-primary-foreground hover:opacity-90 transition"
                      style={{ background: "var(--gradient-hero)" }}
                    >
                      متابعة
                    </Link>
                    <button onClick={() => unenroll(r.id)} className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition" title="إلغاء التسجيل">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
