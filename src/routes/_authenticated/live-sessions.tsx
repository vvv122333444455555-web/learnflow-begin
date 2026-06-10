import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { toast } from "sonner";
import { Calendar, Clock, Video, Loader2, CheckCircle2, ChevronRight, ChevronLeft, Sparkles, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/live-sessions")({
  head: () => ({ meta: [{ title: "الجلسات الحيّة | منصة اللغات" }] }),
  component: LiveSessionsPage,
});

const DAYS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const SHORT_DAYS = ["أحد", "إثن", "ثلا", "أرب", "خمي", "جمع", "سبت"];

type Avail = { id: string; teacher_id: string; weekday: number; start_time: string; end_time: string };
type Booking = {
  id: string;
  teacher_id: string;
  scheduled_at: string;
  duration_minutes: number;
  zoom_link: string;
  status: string;
};

const SLOT_MINUTES = 30;

function fmtTime(d: Date) {
  return d.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
}

function LiveSessionsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [avail, setAvail] = useState<Avail[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState(0);
  const [pending, setPending] = useState<{ teacherId: string; at: Date } | null>(null);
  const [booking, setBooking] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      // RBAC / Premium gate
      const { data: prof } = await supabase
        .from("profiles")
        .select("is_premium, premium_until")
        .eq("id", u.user.id)
        .maybeSingle();
      const premium =
        !!prof?.is_premium &&
        (!prof.premium_until || new Date(prof.premium_until).getTime() > Date.now());
      if (!premium) {
        toast.error("الجلسات الحيّة متاحة لأعضاء Premium فقط");
        navigate({ to: "/upgrade" });
        return;
      }
      setUserId(u.user.id);
      const [{ data: a }, { data: b }] = await Promise.all([
        supabase.from("teacher_availability").select("id, teacher_id, weekday, start_time, end_time"),
        supabase
          .from("live_sessions")
          .select("id, teacher_id, scheduled_at, duration_minutes, zoom_link, status")
          .or(`student_id.eq.${u.user.id},teacher_id.eq.${u.user.id}`),
      ]);
      setAvail((a as Avail[]) ?? []);
      setBookings((b as Booking[]) ?? []);
      setLoading(false);
    })();
  }, [navigate]);

  const weekStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - d.getDay() + weekOffset * 7);
    return d;
  }, [weekOffset]);

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  }), [weekStart]);

  // Generate slots for the selected day
  const slotsForDay = useMemo(() => {
    const date = days[selectedDay];
    if (!date) return [];
    const weekday = date.getDay();
    const dayAvail = avail.filter((a) => a.weekday === weekday);
    const out: { teacherId: string; at: Date; booked: boolean; mine: boolean }[] = [];
    const now = new Date();

    for (const a of dayAvail) {
      const [sh, sm] = a.start_time.split(":").map(Number);
      const [eh, em] = a.end_time.split(":").map(Number);
      const start = new Date(date); start.setHours(sh, sm, 0, 0);
      const end = new Date(date); end.setHours(eh, em, 0, 0);
      for (let t = new Date(start); t.getTime() + SLOT_MINUTES * 60000 <= end.getTime(); t = new Date(t.getTime() + SLOT_MINUTES * 60000)) {
        if (t < now) continue;
        const at = new Date(t);
        const existing = bookings.find((b) => b.teacher_id === a.teacher_id && Math.abs(new Date(b.scheduled_at).getTime() - at.getTime()) < 60000);
        out.push({ teacherId: a.teacher_id, at, booked: !!existing, mine: !!existing });
      }
    }
    return out.sort((x, y) => x.at.getTime() - y.at.getTime());
  }, [avail, bookings, days, selectedDay]);

  const upcoming = useMemo(() => {
    const now = Date.now();
    return bookings
      .filter((b) => new Date(b.scheduled_at).getTime() >= now)
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
  }, [bookings]);

  const confirmBooking = async () => {
    if (!pending || !userId) return;
    setBooking(true);
    const { data, error } = await supabase
      .from("live_sessions")
      .insert({
        teacher_id: pending.teacherId,
        student_id: userId,
        scheduled_at: pending.at.toISOString(),
        duration_minutes: SLOT_MINUTES,
      })
      .select("id, teacher_id, scheduled_at, duration_minutes, zoom_link, status")
      .single();
    setBooking(false);
    if (error || !data) {
      toast.error(error?.message ?? "تعذّر الحجز");
      return;
    }
    setBookings([...bookings, data as Booking]);
    setPending(null);
    toast.success("تم تأكيد حجز جلستك الحيّة!");
  };

  const cancelBooking = async (id: string) => {
    const { error } = await supabase.from("live_sessions").delete().eq("id", id);
    if (error) {
      toast.error("تعذّر الإلغاء");
      return;
    }
    setBookings(bookings.filter((b) => b.id !== id));
    toast.success("تم إلغاء الجلسة");
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

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto p-6 sm:p-10" dir="rtl">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/15 text-accent-foreground text-xs font-medium mb-3">
            <Sparkles className="w-3.5 h-3.5" /> جلسات محادثة مباشرة
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold">احجز جلسة حيّة مع معلّم</h1>
          <p className="text-muted-foreground mt-2">اختر يومًا متاحًا ثم وقتًا يناسبك. مدة الجلسة {SLOT_MINUTES} دقيقة.</p>
        </div>

        {upcoming.length > 0 && (
          <div className="mb-8">
            <h2 className="font-semibold mb-3">جلساتك القادمة</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {upcoming.map((b) => {
                const d = new Date(b.scheduled_at);
                return (
                  <div key={b.id} className="rounded-2xl border border-border bg-card p-5 flex items-center justify-between" style={{ boxShadow: "var(--shadow-soft)" }}>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">{d.toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long" })}</div>
                      <div className="font-bold text-lg">{fmtTime(d)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a href={b.zoom_link} target="_blank" rel="noreferrer" className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center gap-2">
                        <Video className="w-4 h-4" /> انضمام
                      </a>
                      <button onClick={() => cancelBooking(b.id)} className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-muted">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="rounded-3xl border border-border bg-card overflow-hidden" style={{ boxShadow: "var(--shadow-soft)" }}>
          <div className="p-5 border-b border-border flex items-center justify-between">
            <button onClick={() => setWeekOffset(weekOffset - 1)} disabled={weekOffset <= 0} className="p-2 rounded-lg hover:bg-muted disabled:opacity-30">
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="text-center">
              <div className="text-xs text-muted-foreground">الأسبوع</div>
              <div className="font-bold">{days[0].toLocaleDateString("ar-EG", { day: "numeric", month: "long" })} – {days[6].toLocaleDateString("ar-EG", { day: "numeric", month: "long" })}</div>
            </div>
            <button onClick={() => setWeekOffset(weekOffset + 1)} disabled={weekOffset >= 3} className="p-2 rounded-lg hover:bg-muted disabled:opacity-30">
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 border-b border-border">
            {days.map((d, i) => {
              const active = i === selectedDay;
              const isToday = d.toDateString() === new Date().toDateString();
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDay(i)}
                  className={`p-3 text-center transition border-l border-border last:border-l-0 ${active ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                >
                  <div className="text-xs opacity-80">{SHORT_DAYS[i]}</div>
                  <div className={`text-lg font-bold mt-1 ${isToday && !active ? "text-primary" : ""}`}>{d.getDate()}</div>
                </button>
              );
            })}
          </div>

          <div className="p-6 min-h-[200px]">
            {slotsForDay.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>لا توجد فترات متاحة في هذا اليوم.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {slotsForDay.map((s, i) => (
                  <button
                    key={i}
                    disabled={s.booked}
                    onClick={() => setPending({ teacherId: s.teacherId, at: s.at })}
                    className={`p-3 rounded-xl border-2 text-sm font-semibold transition ${
                      s.booked
                        ? "bg-muted text-muted-foreground border-transparent line-through cursor-not-allowed"
                        : "border-border hover:border-primary hover:bg-primary/5"
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5 inline ml-1 opacity-60" />
                    {fmtTime(s.at)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {pending && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => !booking && setPending(null)}>
          <div className="bg-card rounded-3xl max-w-md w-full p-8 border border-border" style={{ boxShadow: "var(--shadow-elegant)" }} onClick={(e) => e.stopPropagation()} dir="rtl">
            <div className="w-14 h-14 rounded-2xl mb-5 flex items-center justify-center text-primary-foreground" style={{ background: "var(--gradient-hero)" }}>
              <Video className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-bold mb-2">تأكيد الحجز</h3>
            <p className="text-muted-foreground mb-5">جلسة محادثة حيّة لمدة {SLOT_MINUTES} دقيقة.</p>

            <div className="rounded-2xl bg-muted p-4 mb-6 space-y-2">
              <div className="flex justify-between"><span className="text-muted-foreground">اليوم</span><span className="font-semibold">{pending.at.toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long" })}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">الوقت</span><span className="font-semibold">{fmtTime(pending.at)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">المنصة</span><span className="font-semibold flex items-center gap-1"><Video className="w-3.5 h-3.5" /> Zoom</span></div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setPending(null)} disabled={booking} className="flex-1 px-4 py-3 rounded-xl border-2 border-border font-semibold hover:bg-muted disabled:opacity-50">
                إلغاء
              </button>
              <button
                onClick={confirmBooking}
                disabled={booking}
                className="flex-1 px-4 py-3 rounded-xl font-semibold text-primary-foreground inline-flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: "var(--gradient-hero)" }}
              >
                {booking ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                تأكيد
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
