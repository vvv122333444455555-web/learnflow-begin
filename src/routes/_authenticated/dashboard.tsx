import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { BookOpen, TrendingUp, Sparkles, ArrowLeft, Clock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "الرئيسية | منصة اللغات" }] }),
  component: Dashboard,
});

type Course = {
  id: string;
  title: string;
  description: string | null;
  level: string;
  duration_weeks: number;
  lessons_count: number;
  languages: { name: string; flag: string | null } | null;
};

function Dashboard() {
  const [profile, setProfile] = useState<{ full_name: string | null; level: string | null } | null>(null);
  const [recommended, setRecommended] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data: p } = await supabase.from("profiles").select("full_name, level").eq("id", u.user.id).maybeSingle();
      setProfile(p);

      const level = p?.level ?? "A1";
      const { data: courses } = await supabase
        .from("courses")
        .select("id, title, description, level, duration_weeks, lessons_count, languages(name, flag)")
        .eq("level", level)
        .eq("is_active", true)
        .limit(6);
      setRecommended((courses as Course[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const displayName = profile?.full_name?.split(" ")[0] || "بك";

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto p-6 sm:p-10">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl p-8 sm:p-10 mb-10 text-white" style={{ background: "var(--gradient-hero)" }}>
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: "radial-gradient(circle at 80% 20%, white 1px, transparent 1px)",
            backgroundSize: "50px 50px",
          }} />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-xs font-medium mb-4">
              <Sparkles className="w-3 h-3" />
              أهلًا بك في منصتك
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">مرحبًا، {displayName} 👋</h1>
            <p className="text-white/85 max-w-xl">
              {profile?.level
                ? `مستواك الحالي ${profile.level}. اخترنا لك أنسب الدورات للبدء.`
                : "حدّد مستواك أولًا لنُجهّز لك مسارًا مخصّصًا."}
            </p>
            {!profile?.level && (
              <Link to="/level" className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-xl bg-white text-foreground font-semibold hover:bg-white/90 transition">
                اختر مستواك
                <ArrowLeft className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4 mb-10">
          <Stat icon={<TrendingUp className="w-5 h-5" />} label="مستواك" value={profile?.level ?? "—"} />
          <Stat icon={<BookOpen className="w-5 h-5" />} label="دورات مقترحة" value={String(recommended.length)} />
          <Stat icon={<Clock className="w-5 h-5" />} label="ساعات تعلّم" value="0" />
        </div>

        {/* Recommended */}
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="text-2xl font-bold text-foreground">دورات مقترحة لمستواك</h2>
            <p className="text-sm text-muted-foreground mt-1">مختارة بعناية لتناسب مرحلتك الحالية.</p>
          </div>
          <Link to="/courses" className="text-sm text-primary font-medium hover:underline">عرض الكل</Link>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : recommended.length === 0 ? (
          <div className="p-10 text-center rounded-2xl border border-dashed border-border bg-card">
            <p className="text-muted-foreground">لا توجد دورات متاحة لمستواك الحالي بعد.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommended.map((c) => <CourseCard key={c.id} course={c} />)}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="p-5 rounded-2xl bg-card border border-border" style={{ boxShadow: "var(--shadow-soft)" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">{icon}</div>
      </div>
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold text-foreground mt-1">{value}</div>
    </div>
  );
}

export function CourseCard({ course }: { course: Course }) {
  return (
    <Link
      to="/courses/$id"
      params={{ id: course.id }}
      className="group block p-5 rounded-2xl bg-card border border-border hover:border-primary/40 hover:-translate-y-0.5 transition-all"
      style={{ boxShadow: "var(--shadow-soft)" }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="text-3xl">{course.languages?.flag ?? "🌍"}</div>
        <span className="text-xs font-bold text-accent-foreground bg-accent px-2 py-1 rounded-md">{course.level}</span>
      </div>
      <h3 className="font-bold text-foreground mb-1.5 group-hover:text-primary transition">{course.title}</h3>
      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{course.description}</p>
      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-3 border-t border-border">
        <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />{course.lessons_count} درس</span>
        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{course.duration_weeks} أسبوع</span>
      </div>
    </Link>
  );
}
