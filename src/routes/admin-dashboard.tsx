import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Loader2, Users, GraduationCap, Wand2, Crown, LogOut, BookOpen } from "lucide-react";

export const Route = createFileRoute("/admin-dashboard")({
  component: AdminDashboard,
});

type Stats = {
  teachers: number;
  students: number;
  kids: number;
  adults: number;
  exercises: number;
  submissions: number;
  classes: number;
  premium_rate: number;
};

type TeacherRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  specialty_language: string | null;
  created_at: string;
  classCount: number;
  studentCount: number;
  exerciseCount: number;
};

type StudentRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  track: string | null;
  account_type: string | null;
  level: string | null;
  kid_age: number | null;
  school_name: string | null;
  created_at: string;
};

type ExerciseRow = {
  id: string;
  title: string;
  type: string;
  published: boolean;
  teacher_name: string | null;
  created_at: string;
  assignmentCount: number;
  submissionCount: number;
  avgScore: number | null;
};

// Security note: this dashboard's ONLY real protection is Supabase auth + the
// has_role(auth.uid(), 'admin') check below, enforced both here and by RLS
// policies on every table. There is no separate client-side password gate —
// a hardcoded password would be visible to anyone inspecting the JS bundle
// and would add no real security on top of the role check.
function AdminDashboard() {
  const [roleOk, setRoleOk] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) { navigate({ to: "/admin-login" }); return; }
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id);
      setRoleOk(!!roles?.some((r) => r.role === "admin"));
    })();
  }, [navigate]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/admin-login" });
  };

  if (roleOk === null) {
    return <div className="min-h-screen flex items-center justify-center" dir="rtl"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }
  if (!roleOk) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" dir="rtl">
        <div className="max-w-sm text-center space-y-3">
          <div className="text-lg font-bold">لست أدمن</div>
          <p className="text-sm text-muted-foreground">سجّل الدخول بحساب أدمن ثم أعد المحاولة.</p>
          <Link to="/admin-login" className="inline-block px-4 py-2 rounded-lg text-white text-sm" style={{ background: "var(--gradient-hero)" }}>دخول الأدمن</Link>
        </div>
      </div>
    );
  }

  return <AdminInner onLogout={signOut} />;
}

function AdminInner({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<"overview" | "teachers" | "students" | "exercises">("overview");
  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [studentFilter, setStudentFilter] = useState<"all" | "kids" | "adults">("all");
  const [exercises, setExercises] = useState<ExerciseRow[]>([]);
  const [stats, setStats] = useState<Stats>({ teachers: 0, students: 0, kids: 0, adults: 0, exercises: 0, submissions: 0, classes: 0, premium_rate: 0 });

  const loadOverview = async () => {
    const [{ count: teacherCount }, { count: total }, { count: kids }, { count: adults }, { count: exerciseCount }, { count: submissionCount }, { count: classCount }, { count: premium }] = await Promise.all([
      supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "teacher"),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("track", "kids"),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("track", "adults"),
      supabase.from("exercises").select("*", { count: "exact", head: true }),
      supabase.from("exercise_submissions").select("*", { count: "exact", head: true }),
      supabase.from("classes").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_premium", true),
    ]);
    const t = teacherCount ?? 0;
    const totalUsers = total ?? 0;
    const p = premium ?? 0;
    setStats({
      teachers: t,
      students: Math.max(totalUsers - t, 0),
      kids: kids ?? 0,
      adults: adults ?? 0,
      exercises: exerciseCount ?? 0,
      submissions: submissionCount ?? 0,
      classes: classCount ?? 0,
      premium_rate: totalUsers > 0 ? Math.round((p / totalUsers) * 100) : 0,
    });
  };

  const loadTeachers = async () => {
    const { data: roleRows } = await supabase.from("user_roles").select("user_id").eq("role", "teacher");
    const ids = (roleRows ?? []).map((r) => r.user_id);
    if (!ids.length) { setTeachers([]); return; }
    const [{ data: profs }, { data: classes }, { data: members }, { data: exs }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email, specialty_language, created_at").in("id", ids),
      supabase.from("classes").select("id, teacher_id").in("teacher_id", ids),
      supabase.from("class_members").select("class_id"),
      supabase.from("exercises").select("id, teacher_id").in("teacher_id", ids),
    ]);
    const classByTeacher: Record<string, string[]> = {};
    (classes ?? []).forEach((c: any) => { (classByTeacher[c.teacher_id] ??= []).push(c.id); });
    const memberCountByClass: Record<string, number> = {};
    (members ?? []).forEach((m: any) => { memberCountByClass[m.class_id] = (memberCountByClass[m.class_id] ?? 0) + 1; });
    const exerciseCountByTeacher: Record<string, number> = {};
    (exs ?? []).forEach((e: any) => { exerciseCountByTeacher[e.teacher_id] = (exerciseCountByTeacher[e.teacher_id] ?? 0) + 1; });

    setTeachers((profs ?? []).map((p: any) => {
      const classIds = classByTeacher[p.id] ?? [];
      const studentCount = classIds.reduce((sum, cid) => sum + (memberCountByClass[cid] ?? 0), 0);
      return {
        id: p.id, full_name: p.full_name, email: p.email, specialty_language: p.specialty_language,
        created_at: p.created_at, classCount: classIds.length, studentCount, exerciseCount: exerciseCountByTeacher[p.id] ?? 0,
      };
    }));
  };

  const loadStudents = async () => {
    const { data: teacherIds } = await supabase.from("user_roles").select("user_id").eq("role", "teacher");
    const { data: adminIds } = await supabase.from("user_roles").select("user_id").eq("role", "admin");
    const excluded = new Set([...(teacherIds ?? []).map((r) => r.user_id), ...(adminIds ?? []).map((r) => r.user_id)]);
    const { data: profs } = await supabase.from("profiles")
      .select("id, full_name, email, track, account_type, level, kid_age, school_name, created_at")
      .order("created_at", { ascending: false });
    setStudents((profs ?? []).filter((p: any) => !excluded.has(p.id)));
  };

  const loadExercises = async () => {
    const { data: exs } = await supabase.from("exercises").select("id, title, type, published, teacher_id, created_at").order("created_at", { ascending: false }).limit(200);
    const teacherIds = Array.from(new Set((exs ?? []).map((e: any) => e.teacher_id).filter(Boolean)));
    let names: Record<string, string> = {};
    if (teacherIds.length) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name, email").in("id", teacherIds);
      names = Object.fromEntries((profs ?? []).map((p) => [p.id, p.full_name || p.email || p.id.slice(0, 8)]));
    }
    const exIds = (exs ?? []).map((e: any) => e.id);
    let assignByEx: Record<string, number> = {};
    let subsByEx: Record<string, { count: number; scoreSum: number }> = {};
    if (exIds.length) {
      const [{ data: assigns }, { data: subs }] = await Promise.all([
        supabase.from("exercise_assignments").select("exercise_id").in("exercise_id", exIds),
        supabase.from("exercise_submissions").select("exercise_id, score").in("exercise_id", exIds),
      ]);
      (assigns ?? []).forEach((a: any) => { assignByEx[a.exercise_id] = (assignByEx[a.exercise_id] ?? 0) + 1; });
      (subs ?? []).forEach((s: any) => {
        const cur = subsByEx[s.exercise_id] ?? { count: 0, scoreSum: 0 };
        cur.count += 1; cur.scoreSum += typeof s.score === "number" ? s.score : 0;
        subsByEx[s.exercise_id] = cur;
      });
    }
    setExercises((exs ?? []).map((e: any) => {
      const sub = subsByEx[e.id];
      return {
        id: e.id, title: e.title, type: e.type, published: e.published,
        teacher_name: e.teacher_id ? names[e.teacher_id] ?? null : null,
        created_at: e.created_at,
        assignmentCount: assignByEx[e.id] ?? 0,
        submissionCount: sub?.count ?? 0,
        avgScore: sub && sub.count > 0 ? Math.round(sub.scoreSum / sub.count) : null,
      };
    }));
  };

  useEffect(() => {
    loadOverview();
    loadTeachers();
    loadStudents();
    loadExercises();
  }, []);

  const filteredStudents = students.filter((s) => studentFilter === "all" || s.track === studentFilter);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <header className="border-b bg-card px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-primary" />
          <div>
            <h1 className="font-bold">لوحة الإدارة</h1>
            <div className="text-xs text-muted-foreground">Admin Control Center</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/" className="text-sm text-muted-foreground">الرئيسية</Link>
          <button onClick={onLogout} className="p-2 rounded-lg hover:bg-muted" title="تسجيل الخروج"><LogOut className="w-4 h-4" /></button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat icon={<GraduationCap className="w-5 h-5" />} label="المعلمون" value={stats.teachers} />
          <Stat icon={<Users className="w-5 h-5" />} label="الطلاب (أطفال/كبار)" value={`${stats.kids}/${stats.adults}`} />
          <Stat icon={<Wand2 className="w-5 h-5" />} label="التمارين" value={stats.exercises} />
          <Stat icon={<BookOpen className="w-5 h-5" />} label="الفصول" value={stats.classes} />
          <Stat icon={<Crown className="w-5 h-5" />} label="نسبة البريميوم" value={`${stats.premium_rate}%`} />
          <Stat icon={<Wand2 className="w-5 h-5" />} label="محاولات التمارين" value={stats.submissions} />
        </div>

        <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit">
          {([
            ["overview", "نظرة عامة"],
            ["teachers", "المعلمون"],
            ["students", "الطلاب"],
            ["exercises", "التمارين"],
          ] as const).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg ${tab === id ? "bg-background shadow-sm" : "text-muted-foreground"}`}>
              {label}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <section className="bg-card border rounded-2xl p-6">
            <h2 className="font-bold mb-2">تسجيل المعلمين</h2>
            <p className="text-sm text-muted-foreground">
              المعلمون يسجّلون حسابًا مباشرة من صفحة «بوابة المعلّم» بالبريد الإلكتروني وكلمة المرور، بلا حاجة لرمز دعوة.
              راقب الحسابات الجديدة من تبويب «المعلمون».
            </p>
          </section>
        )}

        {tab === "teachers" && (
          <section className="bg-card border rounded-2xl p-6">
            <h2 className="font-bold mb-4">المعلمون ({teachers.length})</h2>
            {teachers.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-8">لا يوجد معلمون بعد</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-muted-foreground border-b">
                    <tr>
                      <th className="text-right p-2">الاسم</th>
                      <th className="text-right p-2">البريد</th>
                      <th className="text-right p-2">اللغة</th>
                      <th className="text-right p-2">الفصول</th>
                      <th className="text-right p-2">الطلاب</th>
                      <th className="text-right p-2">التمارين</th>
                      <th className="text-right p-2">الانضمام</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teachers.map((t) => (
                      <tr key={t.id} className="border-b hover:bg-muted/30">
                        <td className="p-2 font-medium">{t.full_name ?? "—"}</td>
                        <td className="p-2 text-xs">{t.email ?? "—"}</td>
                        <td className="p-2">{t.specialty_language ?? "—"}</td>
                        <td className="p-2">{t.classCount}</td>
                        <td className="p-2">{t.studentCount}</td>
                        <td className="p-2">{t.exerciseCount}</td>
                        <td className="p-2 text-xs">{new Date(t.created_at).toLocaleDateString("ar")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {tab === "students" && (
          <section className="bg-card border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold">الطلاب ({filteredStudents.length})</h2>
              <div className="flex gap-1 p-1 bg-muted rounded-xl">
                {([["all", "الكل"], ["kids", "أطفال"], ["adults", "كبار"]] as const).map(([id, label]) => (
                  <button key={id} onClick={() => setStudentFilter(id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg ${studentFilter === id ? "bg-background shadow-sm" : "text-muted-foreground"}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {filteredStudents.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-8">لا يوجد طلاب</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-muted-foreground border-b">
                    <tr>
                      <th className="text-right p-2">الاسم</th>
                      <th className="text-right p-2">البريد</th>
                      <th className="text-right p-2">المسار</th>
                      <th className="text-right p-2">النوع</th>
                      <th className="text-right p-2">التفاصيل</th>
                      <th className="text-right p-2">الانضمام</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((s) => (
                      <tr key={s.id} className="border-b hover:bg-muted/30">
                        <td className="p-2 font-medium">{s.full_name ?? "—"}</td>
                        <td className="p-2 text-xs">{s.email ?? "—"}</td>
                        <td className="p-2">{s.track === "kids" ? "أطفال" : s.track === "adults" ? "كبار" : "—"}</td>
                        <td className="p-2 text-xs">{s.account_type ?? "—"}</td>
                        <td className="p-2 text-xs">
                          {s.track === "kids"
                            ? [s.kid_age ? `${s.kid_age} سنة` : null, s.school_name].filter(Boolean).join(" · ") || "—"
                            : (s.level ?? "—")}
                        </td>
                        <td className="p-2 text-xs">{new Date(s.created_at).toLocaleDateString("ar")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {tab === "exercises" && (
          <section className="bg-card border rounded-2xl p-6">
            <h2 className="font-bold mb-4">التمارين ({exercises.length})</h2>
            {exercises.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-8">لا توجد تمارين بعد</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-muted-foreground border-b">
                    <tr>
                      <th className="text-right p-2">العنوان</th>
                      <th className="text-right p-2">النوع</th>
                      <th className="text-right p-2">المعلم</th>
                      <th className="text-right p-2">الحالة</th>
                      <th className="text-right p-2">التعيينات</th>
                      <th className="text-right p-2">المحاولات</th>
                      <th className="text-right p-2">متوسط النتيجة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exercises.map((e) => (
                      <tr key={e.id} className="border-b hover:bg-muted/30">
                        <td className="p-2 font-medium">{e.title}</td>
                        <td className="p-2 text-xs">{e.type}</td>
                        <td className="p-2 text-xs">{e.teacher_name ?? "—"}</td>
                        <td className="p-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${e.published ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                            {e.published ? "منشور" : "مسودة"}
                          </span>
                        </td>
                        <td className="p-2">{e.assignmentCount}</td>
                        <td className="p-2">{e.submissionCount}</td>
                        <td className="p-2">{e.avgScore !== null ? `${e.avgScore}%` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div className="p-5 rounded-2xl bg-card border">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">{icon}<span className="text-xs">{label}</span></div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
