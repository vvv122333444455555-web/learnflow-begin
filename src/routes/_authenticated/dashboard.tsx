import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { BookOpen, TrendingUp, Sparkles, ArrowLeft, Clock, Star, Trophy, Rocket, Heart, Zap } from "lucide-react";

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

type Profile = {
  full_name: string | null;
  level: string | null;
  account_type: "adult" | "parent";
  kid_name: string | null;
  kid_age: number | null;
  track: string | null;
};

function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [recommended, setRecommended] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data: p } = await supabase
        .from("profiles")
        .select("full_name, level, account_type, kid_name, kid_age, track")
        .eq("id", u.user.id)
        .maybeSingle();
      if (p?.track === "kids") {
        navigate({ to: "/kids" });
        return;
      }
      if (p?.track === "adults") {
        navigate({ to: "/adults" });
        return;
      }
      setProfile(p as Profile);

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
  }, [navigate]);

  if (profile?.account_type === "parent") {
    return <KidDashboard profile={profile} recommended={recommended} loading={loading} />;
  }
  return <AdultDashboard profile={profile} recommended={recommended} loading={loading} />;
}

/* ===================== ADULT ===================== */

function AdultDashboard({ profile, recommended, loading }: { profile: Profile | null; recommended: Course[]; loading: boolean }) {
  const displayName = profile?.full_name?.split(" ")[0] || "بك";

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto p-6 sm:p-10">
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

        <div className="grid sm:grid-cols-3 gap-4 mb-10">
          <Stat icon={<TrendingUp className="w-5 h-5" />} label="مستواك" value={profile?.level ?? "—"} />
          <Stat icon={<BookOpen className="w-5 h-5" />} label="دورات مقترحة" value={String(recommended.length)} />
          <Stat icon={<Clock className="w-5 h-5" />} label="ساعات تعلّم" value="0" />
        </div>

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

/* ===================== KID ===================== */

function KidDashboard({ profile, recommended, loading }: { profile: Profile; recommended: Course[]; loading: boolean }) {
  const kid = profile.kid_name || "بطلنا";

  return (
    <AppShell>
      <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #FFF6E5 0%, #FFE5F1 50%, #E5F4FF 100%)" }}>
        <div className="max-w-6xl mx-auto p-6 sm:p-10">
          {/* Hero */}
          <div className="relative overflow-hidden rounded-[2rem] p-8 sm:p-10 mb-8 text-white"
               style={{ background: "linear-gradient(135deg, #FF6BCB 0%, #FFB84D 50%, #4DD0E1 100%)" }}>
            <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/20 blur-2xl" />
            <div className="absolute -bottom-12 -left-6 w-52 h-52 rounded-full bg-white/15 blur-3xl" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/25 backdrop-blur text-sm font-bold mb-4">
                <Sparkles className="w-4 h-4" /> أهلًا أهلًا!
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold mb-2 drop-shadow">
                مرحبًا {kid} 🎉
              </h1>
              <p className="text-white/95 text-lg max-w-xl">
                هيّا نلعب ونتعلّم لغات جديدة اليوم! كل درس = نجمة جديدة ⭐️
              </p>
              {!profile.level && (
                <Link to="/level" className="inline-flex items-center gap-2 mt-5 px-6 py-3 rounded-2xl bg-white text-pink-600 font-extrabold hover:scale-105 transition shadow-lg">
                  ابدأ المغامرة 🚀
                </Link>
              )}
            </div>
          </div>

          {/* Gamified stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <KidStat icon={<Star className="w-6 h-6" />} value="0" label="نجوم" color="from-yellow-400 to-orange-400" />
            <KidStat icon={<Trophy className="w-6 h-6" />} value="0" label="جوائز" color="from-pink-400 to-rose-500" />
            <KidStat icon={<Zap className="w-6 h-6" />} value="0" label="أيام متتالية" color="from-violet-400 to-purple-500" />
            <KidStat icon={<Heart className="w-6 h-6" />} value="5" label="قلوب" color="from-red-400 to-pink-500" />
          </div>

          {/* Today's mission */}
          <div className="rounded-3xl p-6 mb-8 bg-white/80 backdrop-blur border-4 border-white shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white shadow-lg">
                <Rocket className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-bold text-cyan-600 uppercase tracking-wide">مهمة اليوم</div>
                <h2 className="text-2xl font-extrabold text-slate-800">أكمل درسًا واحدًا!</h2>
              </div>
            </div>
            <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full w-1/4 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" />
            </div>
            <div className="mt-2 text-sm text-slate-600 font-semibold">1 / 4 ⭐</div>
          </div>

          {/* Courses */}
          <div className="flex items-end justify-between mb-5">
            <h2 className="text-2xl font-extrabold text-slate-800">دروسك السحرية ✨</h2>
            <Link to="/courses" className="text-sm font-bold text-pink-600 hover:underline">عرض الكل</Link>
          </div>

          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-44 rounded-3xl bg-white/60 animate-pulse" />
              ))}
            </div>
          ) : recommended.length === 0 ? (
            <div className="p-10 text-center rounded-3xl bg-white/70 border-4 border-dashed border-white">
              <p className="text-slate-700 font-semibold">لا توجد ألعاب بعد. اختر مستوى طفلك لنبدأ! 🌈</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommended.map((c, i) => <KidCourseCard key={c.id} course={c} index={i} />)}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function KidStat({ icon, value, label, color }: { icon: React.ReactNode; value: string; label: string; color: string }) {
  return (
    <div className="rounded-3xl p-4 bg-white/80 backdrop-blur border-4 border-white shadow-lg hover:-translate-y-1 transition">
      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} text-white flex items-center justify-center shadow-md mb-3`}>
        {icon}
      </div>
      <div className="text-3xl font-extrabold text-slate-800">{value}</div>
      <div className="text-xs font-bold text-slate-500">{label}</div>
    </div>
  );
}

function KidCourseCard({ course, index }: { course: Course; index: number }) {
  const palettes = [
    "from-pink-400 to-rose-500",
    "from-amber-400 to-orange-500",
    "from-cyan-400 to-sky-500",
    "from-violet-400 to-purple-500",
    "from-emerald-400 to-teal-500",
    "from-fuchsia-400 to-pink-500",
  ];
  const color = palettes[index % palettes.length];

  return (
    <Link
      to="/courses/$id"
      params={{ id: course.id }}
      className="group block rounded-3xl p-5 bg-white/85 backdrop-blur border-4 border-white shadow-lg hover:-translate-y-1 hover:rotate-1 transition-all"
    >
      <div className={`w-full h-28 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 shadow-inner`}>
        <span className="text-6xl drop-shadow-lg">{course.languages?.flag ?? "🌍"}</span>
      </div>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-extrabold text-white bg-pink-500 px-2 py-0.5 rounded-full">{course.level}</span>
        <span className="text-xs font-bold text-amber-500 flex items-center gap-0.5">
          <Star className="w-3 h-3 fill-amber-400" />
          <Star className="w-3 h-3 fill-amber-400" />
          <Star className="w-3 h-3 fill-amber-400" />
        </span>
      </div>
      <h3 className="font-extrabold text-slate-800 text-lg mb-1">{course.title}</h3>
      <p className="text-xs text-slate-500 font-medium">{course.lessons_count} مغامرة 🎯</p>
    </Link>
  );
}
