import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Briefcase, BookOpen, Target, TrendingUp, LogOut, GraduationCap } from "lucide-react";

const CEFR = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
const GOALS = [
  { id: "travel", label: "سفر ✈️" },
  { id: "work", label: "عمل 💼" },
  { id: "exam", label: "امتحان 📜" },
  { id: "general", label: "عام 🌍" },
] as const;

export const Route = createFileRoute("/_authenticated/adults/")({
  component: AdultsDashboard,
});

function AdultsDashboard() {
  const [profile, setProfile] = useState<{ full_name: string; cefr_level: string | null; learning_goal: string | null; track: string | null } | null>(null);
  const [count, setCount] = useState({ assigned: 0, done: 0 });
  const navigate = useNavigate();

  const load = async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { data: p } = await supabase.from("profiles").select("full_name, cefr_level, learning_goal, track").eq("id", u.user.id).maybeSingle();
    if (p && p.track === "kids") { navigate({ to: "/kids" }); return; }
    setProfile(p as any);
    const [{ count: a }, { count: d }] = await Promise.all([
      supabase.from("exercise_assignments").select("*", { count: "exact", head: true }),
      supabase.from("exercise_submissions").select("*", { count: "exact", head: true }).eq("student_id", u.user.id),
    ]);
    setCount({ assigned: a ?? 0, done: d ?? 0 });
  };

  useEffect(() => { load(); }, []);

  const setGoal = async (goal: string) => {
    const { data: u } = await supabase.auth.getUser();
    await supabase.from("profiles").update({ learning_goal: goal }).eq("id", u.user!.id);
    load();
  };
  const setLevel = async (level: string) => {
    const { data: u } = await supabase.auth.getUser();
    await supabase.from("profiles").update({ cefr_level: level }).eq("id", u.user!.id);
    load();
  };
  const signOut = async () => { await supabase.auth.signOut(); navigate({ to: "/" }); };

  const levelIdx = profile?.cefr_level ? CEFR.indexOf(profile.cefr_level as any) : -1;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <header className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: "var(--gradient-hero)" }}><Briefcase className="w-5 h-5"/></div>
            <div>
              <div className="text-xs text-muted-foreground">أهلاً</div>
              <div className="font-bold">{profile?.full_name || "طالب LearnFlow"}</div>
            </div>
          </div>
          <button onClick={signOut} className="p-2 rounded-lg hover:bg-muted"><LogOut className="w-4 h-4"/></button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <section className="p-6 rounded-2xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-4"><Target className="w-5 h-5 text-primary"/><h3 className="font-bold">هدفك التعليمي</h3></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {GOALS.map((g) => (
              <button key={g.id} onClick={() => setGoal(g.id)}
                className={`p-3 rounded-xl border-2 text-sm font-semibold ${profile?.learning_goal === g.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                {g.label}
              </button>
            ))}
          </div>
        </section>

        <section className="p-6 rounded-2xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-4"><TrendingUp className="w-5 h-5 text-primary"/><h3 className="font-bold">مستواي (CEFR)</h3></div>
          <div className="flex gap-2 mb-3">
            {CEFR.map((l, i) => (
              <button key={l} onClick={() => setLevel(l)}
                className={`flex-1 py-2 rounded-lg text-sm font-bold border-2 ${
                  levelIdx >= i ? "bg-primary text-primary-foreground border-primary" :
                  "border-border text-muted-foreground"
                }`}>{l}</button>
            ))}
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${((levelIdx + 1) / 6) * 100}%` }}/>
          </div>
        </section>

        <div className="grid md:grid-cols-2 gap-4">
          <Link to="/adults/exercises" className="p-6 rounded-2xl bg-card border border-border hover:border-primary transition">
            <BookOpen className="w-8 h-8 text-primary mb-3"/>
            <div className="font-bold text-lg mb-1">التمارين المُسندة</div>
            <div className="text-sm text-muted-foreground">{count.assigned} تمرين · {count.done} مكتمل</div>
          </Link>
          <Link to="/placement-test" className="p-6 rounded-2xl bg-card border border-border hover:border-primary transition">
            <GraduationCap className="w-8 h-8 text-primary mb-3"/>
            <div className="font-bold text-lg mb-1">اختبار المستوى</div>
            <div className="text-sm text-muted-foreground">حدّد مستواك الحقيقي بدقة</div>
          </Link>
        </div>
      </main>
    </div>
  );
}
