import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Shield, Copy } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminDash,
});

type Code = { id: string; code: string; used_by: string | null; used_at: string | null; expires_at: string | null; active: boolean; teacher_name?: string | null };

function AdminDash() {
  const navigate = useNavigate();
  const [ok, setOk] = useState(false);
  const [codes, setCodes] = useState<Code[]>([]);
  const [stats, setStats] = useState({ users: 0, teachers: 0, exercises: 0 });

  const load = async () => {
    const { data: rows } = await supabase.from("teacher_codes").select("*").order("created_at", { ascending: false });
    const userIds = Array.from(new Set((rows ?? []).map(r => r.used_by).filter(Boolean))) as string[];
    let names: Record<string,string> = {};
    if (userIds.length) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name, email").in("id", userIds);
      names = Object.fromEntries((profs ?? []).map(p => [p.id, p.full_name || p.email || p.id.slice(0,8)]));
    }
    setCodes((rows ?? []).map(r => ({ ...r, teacher_name: r.used_by ? names[r.used_by] : null })));
    const [{ count: u }, { count: t }, { count: e }] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "teacher"),
      supabase.from("exercises").select("*", { count: "exact", head: true }),
    ]);
    setStats({ users: u ?? 0, teachers: t ?? 0, exercises: e ?? 0 });
  };


  useEffect(() => { (async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return navigate({ to: "/auth" });
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id);
    if (!roles?.some(r => r.role === "admin")) { toast.error("لست مشرفًا"); navigate({ to: "/" }); return; }
    setOk(true); load();
  })(); }, [navigate]);

  const generate = async () => {
    const { data, error } = await supabase.rpc("generate_teacher_code", {});
    if (error) return toast.error(error.message);
    toast.success(`تم إنشاء: ${data}`); load();
  };

  if (!ok) return <div className="min-h-screen flex items-center justify-center" dir="rtl">…</div>;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <header className="border-b bg-card px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-primary"/>
          <h1 className="font-bold">لوحة الإدارة</h1>
        </div>
        <Link to="/" className="text-sm text-muted-foreground">الرئيسية ←</Link>
      </header>

      <main className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="grid grid-cols-3 gap-3">
          <Stat label="المستخدمون" value={stats.users}/>
          <Stat label="المعلمون" value={stats.teachers}/>
          <Stat label="التمارين" value={stats.exercises}/>
        </div>

        <section className="bg-card border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold">رموز المعلمين</h2>
            <button onClick={generate} className="px-4 py-2 rounded-xl text-white text-sm inline-flex items-center gap-2" style={{ background: "var(--gradient-hero)" }}>
              <Plus className="w-4 h-4"/> إنشاء رمز جديد
            </button>
          </div>
          <div className="space-y-2">
            {codes.length === 0 && <div className="text-sm text-muted-foreground text-center py-6">لم يُنشأ أي رمز بعد.</div>}
            {codes.map(c => (
              <div key={c.id} className="flex items-center justify-between p-3 rounded-xl border">
                <div>
                  <code className="font-mono font-bold">{c.code}</code>
                  <div className="text-xs text-muted-foreground">{c.used_at ? `مستخدم في ${new Date(c.used_at).toLocaleDateString("ar")}` : "غير مستخدم"}</div>
                </div>
                <button onClick={() => { navigator.clipboard.writeText(c.code); toast.success("نُسخ"); }}
                  className="p-2 rounded-lg hover:bg-muted"><Copy className="w-4 h-4"/></button>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="p-5 rounded-2xl bg-card border"><div className="text-xs text-muted-foreground">{label}</div><div className="text-3xl font-bold">{value}</div></div>;
}
