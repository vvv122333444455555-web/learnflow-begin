import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, Wand2, ClipboardList, LogOut, Plus } from "lucide-react";
import { NotificationsBell } from "@/components/notifications-bell";
import { useRoleGuard } from "@/hooks/use-role-guard";

export const Route = createFileRoute("/_authenticated/teach/dashboard")({
  component: TeacherDashboard,
});

type Exercise = { id: string; title: string; type: string; published: boolean; created_at: string };

function TeacherDashboard() {
  const ready = useRoleGuard(["teacher", "admin"]);
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ full_name: string; specialty_language: string; teacher_profile_completed: boolean } | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [stats, setStats] = useState({ classes: 0, students: 0, submissions: 0 });

  useEffect(() => { if (!ready) return; (async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id);
    if (!roles?.some((r) => r.role === "teacher")) { navigate({ to: "/teacher-login" }); return; }
    const { data: p } = await supabase.from("profiles").select("full_name, specialty_language, teacher_profile_completed").eq("id", u.user.id).maybeSingle();
    if (p && !p.teacher_profile_completed) { navigate({ to: "/teach/onboarding" }); return; }
    setProfile(p as any);
    const { data: ex } = await supabase.from("exercises").select("id, title, type, published, created_at").order("created_at", { ascending: false });
    setExercises(ex ?? []);
    const [{ count: c }, { count: s }, { count: sub }] = await Promise.all([
      supabase.from("classes").select("*", { count: "exact", head: true }).eq("teacher_id", u.user.id),
      supabase.from("class_members").select("*", { count: "exact", head: true }),
      supabase.from("exercise_submissions").select("*", { count: "exact", head: true }),
    ]);
    setStats({ classes: c ?? 0, students: s ?? 0, submissions: sub ?? 0 });
  })(); }, [navigate, ready]);

  const signOut = async () => { await supabase.auth.signOut(); navigate({ to: "/" }); };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <header className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground">بوابة المعلّم</div>
            <div className="font-bold">{profile?.full_name} · {profile?.specialty_language}</div>
          </div>
          <div className="flex items-center gap-1">
            <NotificationsBell />
            <button onClick={signOut} className="p-2 rounded-lg hover:bg-muted"><LogOut className="w-4 h-4"/></button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div className="grid grid-cols-3 gap-3">
          <Card icon={<Users className="w-5 h-5"/>} label="فصولي" value={stats.classes}/>
          <Card icon={<Users className="w-5 h-5"/>} label="طلابي" value={stats.students}/>
          <Card icon={<ClipboardList className="w-5 h-5"/>} label="التسليمات" value={stats.submissions}/>
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          <Link to="/teach/builder" className="p-5 rounded-2xl bg-card border hover:border-primary transition">
            <Wand2 className="w-6 h-6 text-primary mb-2"/>
            <div className="font-bold">منشئ التمارين</div>
            <div className="text-sm text-muted-foreground">أنشئ اختبارات وتمارين تفاعلية</div>
          </Link>
          <Link to="/teach/classes" className="p-5 rounded-2xl bg-card border hover:border-primary transition">
            <Users className="w-6 h-6 text-primary mb-2"/>
            <div className="font-bold">فصولي وطلابي</div>
            <div className="text-sm text-muted-foreground">إدارة الفصول وإضافة الطلاب</div>
          </Link>
          <Link to="/teach/availability" className="p-5 rounded-2xl bg-card border hover:border-primary transition">
            <ClipboardList className="w-6 h-6 text-primary mb-2"/>
            <div className="font-bold">حصصي المباشرة</div>
            <div className="text-sm text-muted-foreground">جدولة وأوقات التوافر</div>
          </Link>
        </div>

        <section className="rounded-2xl bg-card border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">تماريني</h3>
            <Link to="/teach/builder" className="text-sm inline-flex items-center gap-1 text-primary hover:underline"><Plus className="w-4 h-4"/> تمرين جديد</Link>
          </div>
          {exercises.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">لا توجد تمارين بعد.</div>
          ) : (
            <div className="space-y-2">
              {exercises.map((e) => (
                <div key={e.id} className="flex items-center justify-between p-3 rounded-xl border hover:bg-muted/50">
                  <div>
                    <div className="font-semibold">{e.title}</div>
                    <div className="text-xs text-muted-foreground">{e.type} · {e.published ? "منشور" : "مسودة"}</div>
                  </div>
                  <Link to="/teach/exercise/$id" params={{ id: e.id }} className="text-sm text-primary hover:underline">النتائج ←</Link>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function Card({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="p-5 rounded-2xl bg-card border">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">{icon}<span className="text-xs">{label}</span></div>
      <div className="text-3xl font-bold">{value}</div>
    </div>
  );
}
