import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield, Plus, Copy, Ban, Loader2, Users, GraduationCap, Wand2, Crown, LogOut, Lock } from "lucide-react";

export const Route = createFileRoute("/admin-dashboard")({
  component: AdminDashboard,
});

const MASTER_PASSWORD = "ADMIN-HAMZA-2026";
const GATE_KEY = "admin_gate_ok";

type Code = {
  id: string;
  code: string;
  used_by: string | null;
  used_at: string | null;
  expires_at: string | null;
  active: boolean;
  revoked_at: string | null;
  max_uses: number;
  use_count: number;
  teacher_name?: string | null;
  created_at: string;
};

type Stats = {
  teachers: number;
  students: number;
  widgets: number;
  premium_rate: number;
};

function AdminDashboard() {
  const [gate, setGate] = useState(false);
  const [pw, setPw] = useState("");
  const [roleOk, setRoleOk] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem(GATE_KEY) === "1") setGate(true);
  }, []);

  useEffect(() => {
    if (!gate) return;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) { navigate({ to: "/admin-login" }); return; }
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id);
      if (!roles?.some((r) => r.role === "admin")) { setRoleOk(false); return; }
      setRoleOk(true);
    })();
  }, [gate, navigate]);

  const unlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw !== MASTER_PASSWORD) return toast.error("كلمة السر الرئيسية خاطئة");
    localStorage.setItem(GATE_KEY, "1");
    setGate(true);
  };

  const lockOut = () => {
    localStorage.removeItem(GATE_KEY);
    setGate(false); setPw("");
  };

  if (!gate) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" dir="rtl" style={{ background: "var(--gradient-hero)" }}>
        <form onSubmit={unlock} className="w-full max-w-sm bg-card rounded-2xl p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white" style={{ background: "var(--gradient-hero)" }}>
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">قفل المدير</h1>
              <p className="text-xs text-muted-foreground">أدخل كلمة السر الرئيسية</p>
            </div>
          </div>
          <input
            type="password" value={pw} onChange={(e) => setPw(e.target.value)}
            placeholder="Master Password"
            className="w-full px-4 py-3 rounded-xl border border-input bg-background font-mono"
            autoFocus
          />
          <button className="w-full py-3 rounded-xl text-white font-semibold" style={{ background: "var(--gradient-hero)" }}>
            فتح
          </button>
          <div className="text-[11px] text-muted-foreground text-center">
            بعد الفتح ستحتاج أيضًا إلى حساب أدمن مسجّل الدخول.
          </div>
        </form>
      </div>
    );
  }

  if (roleOk === null) {
    return <div className="min-h-screen flex items-center justify-center" dir="rtl"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }
  if (!roleOk) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" dir="rtl">
        <div className="max-w-sm text-center space-y-3">
          <div className="text-lg font-bold">لست أدمن</div>
          <p className="text-sm text-muted-foreground">سجّل الدخول بحساب أدمن ثم أعد المحاولة.</p>
          <div className="flex gap-2 justify-center">
            <Link to="/admin-login" className="px-4 py-2 rounded-lg text-white text-sm" style={{ background: "var(--gradient-hero)" }}>دخول الأدمن</Link>
            <button onClick={lockOut} className="px-4 py-2 rounded-lg border text-sm">قفل</button>
          </div>
        </div>
      </div>
    );
  }

  return <AdminInner onLock={lockOut} />;
}

function AdminInner({ onLock }: { onLock: () => void }) {
  const [codes, setCodes] = useState<Code[]>([]);
  const [stats, setStats] = useState<Stats>({ teachers: 0, students: 0, widgets: 0, premium_rate: 0 });
  const [loading, setLoading] = useState(false);
  const [expiresDays, setExpiresDays] = useState<number>(30);
  const [maxUses, setMaxUses] = useState<number>(1);

  const load = async () => {
    const { data: rows } = await supabase.from("teacher_codes").select("*").order("created_at", { ascending: false });
    const userIds = Array.from(new Set((rows ?? []).map((r) => r.used_by).filter(Boolean))) as string[];
    let names: Record<string, string> = {};
    if (userIds.length) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name, email").in("id", userIds);
      names = Object.fromEntries((profs ?? []).map((p) => [p.id, p.full_name || p.email || p.id.slice(0, 8)]));
    }
    setCodes(((rows ?? []) as any).map((r: any) => ({ ...r, teacher_name: r.used_by ? names[r.used_by] : null })));

    const [{ count: teachers }, { count: total }, { count: widgets }, { count: premium }] = await Promise.all([
      supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "teacher"),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("exercises").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_premium", true),
    ]);
    const t = teachers ?? 0;
    const totalUsers = total ?? 0;
    const p = premium ?? 0;
    setStats({
      teachers: t,
      students: Math.max(totalUsers - t, 0),
      widgets: widgets ?? 0,
      premium_rate: totalUsers > 0 ? Math.round((p / totalUsers) * 100) : 0,
    });
  };

  useEffect(() => { load(); }, []);

  const generate = async () => {
    setLoading(true);
    const expires = expiresDays > 0 ? new Date(Date.now() + expiresDays * 24 * 60 * 60 * 1000).toISOString() : null;
    const { data, error } = await supabase.rpc("generate_teacher_code", {
      _expires_at: expires, _max_uses: maxUses, _prefix: "TCH",
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success(`تم إنشاء: ${data}`);
    load();
  };

  const revoke = async (code: string) => {
    if (!confirm(`إبطال الكود ${code}؟`)) return;
    const { error } = await supabase.rpc("revoke_teacher_code", { _code: code });
    if (error) return toast.error(error.message);
    toast.success("تم الإبطال");
    load();
  };

  const status = (c: Code): { l: string; cls: string } => {
    if (c.revoked_at || !c.active) return { l: "مُبطَل", cls: "bg-red-100 text-red-700" };
    if (c.expires_at && new Date(c.expires_at) < new Date()) return { l: "منتهي", cls: "bg-orange-100 text-orange-700" };
    if (c.use_count >= c.max_uses) return { l: "مستهلك", cls: "bg-muted text-muted-foreground" };
    return { l: "فعّال", cls: "bg-green-100 text-green-700" };
  };

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
          <button onClick={onLock} className="p-2 rounded-lg hover:bg-muted" title="قفل"><LogOut className="w-4 h-4" /></button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat icon={<GraduationCap className="w-5 h-5" />} label="المعلمون" value={stats.teachers} />
          <Stat icon={<Users className="w-5 h-5" />} label="الطلاب" value={stats.students} />
          <Stat icon={<Wand2 className="w-5 h-5" />} label="الويدجت" value={stats.widgets} />
          <Stat icon={<Crown className="w-5 h-5" />} label="نسبة البريميوم" value={`${stats.premium_rate}%`} />
        </div>

        <section className="bg-card border rounded-2xl p-6">
          <h2 className="font-bold mb-4">توليد كود دعوة معلم</h2>
          <div className="grid md:grid-cols-4 gap-3 items-end">
            <label className="block">
              <span className="text-xs text-muted-foreground">مدة الصلاحية (يوم — 0 = دائم)</span>
              <input type="number" min={0} value={expiresDays} onChange={(e) => setExpiresDays(+e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background" />
            </label>
            <label className="block">
              <span className="text-xs text-muted-foreground">عدد الاستخدامات المسموحة</span>
              <input type="number" min={1} value={maxUses} onChange={(e) => setMaxUses(+e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background" />
            </label>
            <div className="text-xs text-muted-foreground md:col-span-1">
              الصيغة: <code className="font-mono font-bold">TCH-XXXX</code>
            </div>
            <button onClick={generate} disabled={loading}
              className="py-2 rounded-xl text-white text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: "var(--gradient-hero)" }}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} إنشاء كود
            </button>
          </div>
        </section>

        <section className="bg-card border rounded-2xl p-6">
          <h2 className="font-bold mb-4">أكواد المعلمين</h2>
          {codes.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">لا أكواد بعد</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground border-b">
                  <tr>
                    <th className="text-right p-2">الكود</th>
                    <th className="text-right p-2">الحالة</th>
                    <th className="text-right p-2">المعلم</th>
                    <th className="text-right p-2">الاستخدام</th>
                    <th className="text-right p-2">الصلاحية</th>
                    <th className="text-right p-2">أنشئ</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {codes.map((c) => {
                    const s = status(c);
                    return (
                      <tr key={c.id} className="border-b hover:bg-muted/30">
                        <td className="p-2 font-mono font-bold">{c.code}</td>
                        <td className="p-2"><span className={`text-xs px-2 py-1 rounded-full ${s.cls}`}>{s.l}</span></td>
                        <td className="p-2">{c.teacher_name ?? <span className="text-muted-foreground">—</span>}</td>
                        <td className="p-2">{c.use_count}/{c.max_uses}</td>
                        <td className="p-2 text-xs">{c.expires_at ? new Date(c.expires_at).toLocaleDateString("ar") : "دائم"}</td>
                        <td className="p-2 text-xs">{new Date(c.created_at).toLocaleDateString("ar")}</td>
                        <td className="p-2">
                          <div className="flex items-center gap-1">
                            <button onClick={() => { navigator.clipboard.writeText(c.code); toast.success("نُسخ"); }}
                              className="p-1.5 rounded hover:bg-muted" title="نسخ"><Copy className="w-3.5 h-3.5" /></button>
                            {c.active && !c.revoked_at && (
                              <button onClick={() => revoke(c.code)} className="p-1.5 rounded hover:bg-red-50 text-red-500" title="إبطال">
                                <Ban className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div className="p-5 rounded-2xl bg-card border">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">{icon}<span className="text-xs">{label}</span></div>
      <div className="text-3xl font-bold">{value}</div>
    </div>
  );
}
