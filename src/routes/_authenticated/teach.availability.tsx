import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { toast } from "sonner";
import { Calendar, Plus, Trash2, GraduationCap, Loader2, CheckCircle2, Video, Copy, Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/teach/availability")({
  head: () => ({ meta: [{ title: "إدارة المواعيد | المعلّم" }] }),
  component: TeacherAvailability,
});

const DAYS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

type Slot = { id: string; weekday: number; start_time: string; end_time: string };
type Booking = {
  id: string;
  student_id: string;
  scheduled_at: string;
  duration_minutes: number;
  zoom_link: string;
  status: string;
  student?: { full_name: string | null; email: string | null } | null;
};

function TeacherAvailability() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isTeacher, setIsTeacher] = useState(false);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekday, setWeekday] = useState(1);
  const [startTime, setStartTime] = useState("17:00");
  const [endTime, setEndTime] = useState("18:00");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      setUserId(u.user.id);
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id);
      const teacher = !!roles?.some((r) => r.role === "teacher");
      setIsTeacher(teacher);
      const [{ data: s }, { data: b }] = await Promise.all([
        supabase
          .from("teacher_availability")
          .select("id, weekday, start_time, end_time")
          .eq("teacher_id", u.user.id)
          .order("weekday")
          .order("start_time"),
        teacher
          ? supabase
              .from("live_sessions")
              .select("id, student_id, scheduled_at, duration_minutes, zoom_link, status")
              .eq("teacher_id", u.user.id)
              .order("scheduled_at", { ascending: true })
          : Promise.resolve({ data: [] as Booking[] }),
      ]);
      setSlots((s as Slot[]) ?? []);
      const rawBookings = (b as Booking[]) ?? [];
      // Hydrate student profile names in a second query (FK is to auth.users, no embed available)
      const studentIds = Array.from(new Set(rawBookings.map((x) => x.student_id)));
      if (studentIds.length > 0) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", studentIds);
        const map = new Map((profs ?? []).map((p) => [p.id, p]));
        for (const bk of rawBookings) bk.student = map.get(bk.student_id) as Booking["student"];
      }
      setBookings(rawBookings);
      setLoading(false);
    })();
  }, []);

  // Self-promotion disabled — teacher role must be granted by an admin (RBAC enforced via RLS).

  const addSlot = async () => {
    if (!userId) return;
    if (endTime <= startTime) {
      toast.error("وقت النهاية يجب أن يكون بعد البداية");
      return;
    }
    setSaving(true);
    const { data, error } = await supabase
      .from("teacher_availability")
      .insert({ teacher_id: userId, weekday, start_time: startTime, end_time: endTime })
      .select("id, weekday, start_time, end_time")
      .single();
    setSaving(false);
    if (error || !data) {
      toast.error(error?.message ?? "تعذّر الإضافة");
      return;
    }
    setSlots([...slots, data as Slot].sort((a, b) => a.weekday - b.weekday || a.start_time.localeCompare(b.start_time)));
    toast.success("تمت إضافة الفترة");
  };

  const removeSlot = async (id: string) => {
    const { error } = await supabase.from("teacher_availability").delete().eq("id", id);
    if (error) {
      toast.error("تعذّر الحذف");
      return;
    }
    setSlots(slots.filter((s) => s.id !== id));
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  if (!isTeacher) {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto p-10">
          <div className="rounded-3xl border border-border bg-card p-10 text-center" style={{ boxShadow: "var(--shadow-soft)" }}>
            <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center text-primary-foreground" style={{ background: "var(--gradient-hero)" }}>
              <GraduationCap className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold mb-2">الوصول مقيّد</h1>
            <p className="text-muted-foreground mb-6">
              لوحة المعلّم متاحة فقط للأعضاء الحاصلين على صلاحية «معلّم». يرجى التواصل مع إدارة المنصة لطلب التفعيل.
            </p>
            <a
              href="mailto:support@learnflow.app?subject=طلب%20تفعيل%20حساب%20معلّم"
              className="px-8 py-3 rounded-xl font-semibold text-primary-foreground inline-flex items-center gap-2"
              style={{ background: "var(--gradient-hero)", boxShadow: "var(--shadow-elegant)" }}
            >
              <CheckCircle2 className="w-4 h-4" />
              تواصل مع الإدارة
            </a>
          </div>
        </div>
      </AppShell>
    );
  }

  const byDay = DAYS.map((_, i) => slots.filter((s) => s.weekday === i));
  const now = Date.now();
  const upcomingBookings = bookings.filter((b) => new Date(b.scheduled_at).getTime() >= now);

  const copyLink = (url: string) => {
    navigator.clipboard?.writeText(url).then(
      () => toast.success("تم نسخ الرابط"),
      () => toast.error("تعذّر النسخ"),
    );
  };

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto p-6 sm:p-10" dir="rtl">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/15 text-accent-foreground text-xs font-medium mb-3">
            <Calendar className="w-3.5 h-3.5" /> لوحة المعلّم
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold">مواعيدك الأسبوعية</h1>
          <p className="text-muted-foreground mt-2">حدد الأوقات التي يمكن للطلاب حجز جلسات حيّة معك خلالها.</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 mb-8" style={{ boxShadow: "var(--shadow-soft)" }}>
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" /> الحجوزات القادمة
            <span className="text-xs font-normal text-muted-foreground">({upcomingBookings.length})</span>
          </h2>
          {upcomingBookings.length === 0 ? (
            <p className="text-sm text-muted-foreground">لا توجد حجوزات قادمة بعد. سيظهر الطلاب هنا فور حجزهم.</p>
          ) : (
            <ul className="space-y-3">
              {upcomingBookings.map((b) => {
                const d = new Date(b.scheduled_at);
                return (
                  <li key={b.id} className="flex flex-wrap items-center gap-3 justify-between p-4 rounded-xl bg-muted/60 border border-border">
                    <div className="min-w-0">
                      <div className="font-semibold text-sm truncate">
                        {b.student?.full_name || b.student?.email || "طالب"}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {d.toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long" })} • {d.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })} • {b.duration_minutes} د
                      </div>
                      <div className="text-[11px] font-mono text-muted-foreground/80 truncate mt-1" dir="ltr">{b.zoom_link}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => copyLink(b.zoom_link)} className="p-2 rounded-lg border border-border hover:bg-background" title="نسخ الرابط">
                        <Copy className="w-4 h-4" />
                      </button>
                      <a href={b.zoom_link} target="_blank" rel="noreferrer" className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center gap-2">
                        <Video className="w-4 h-4" /> بدء الجلسة
                      </a>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 mb-8" style={{ boxShadow: "var(--shadow-soft)" }}>
          <h2 className="font-semibold mb-4">إضافة فترة جديدة</h2>
          <div className="grid sm:grid-cols-4 gap-3">
            <select value={weekday} onChange={(e) => setWeekday(Number(e.target.value))} className="px-3 py-2.5 rounded-xl border border-border bg-background">
              {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="px-3 py-2.5 rounded-xl border border-border bg-background" />
            <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="px-3 py-2.5 rounded-xl border border-border bg-background" />
            <button
              onClick={addSlot}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl font-semibold text-primary-foreground inline-flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background: "var(--gradient-hero)" }}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              إضافة
            </button>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {DAYS.map((day, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-5" style={{ boxShadow: "var(--shadow-soft)" }}>
              <h3 className="font-bold mb-3 flex items-center justify-between">
                <span>{day}</span>
                <span className="text-xs font-normal text-muted-foreground">{byDay[i].length} فترة</span>
              </h3>
              {byDay[i].length === 0 ? (
                <p className="text-sm text-muted-foreground">لا توجد فترات.</p>
              ) : (
                <ul className="space-y-2">
                  {byDay[i].map((s) => (
                    <li key={s.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted">
                      <span className="font-medium text-sm">{s.start_time.slice(0, 5)} – {s.end_time.slice(0, 5)}</span>
                      <button onClick={() => removeSlot(s.id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
