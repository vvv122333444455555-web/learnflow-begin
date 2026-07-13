import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/teach/classes")({
  component: Classes,
});

type Cls = { id: string; name: string; language: string | null; level: string | null };

function Classes() {
  const [list, setList] = useState<Cls[]>([]);
  const [name, setName] = useState("");
  const [lang, setLang] = useState("English");

  const load = async () => {
    const { data: u } = await supabase.auth.getUser();
    const { data } = await supabase.from("classes").select("id, name, language, level").eq("teacher_id", u.user!.id);
    setList(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!name.trim()) return;
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("classes").insert({ teacher_id: u.user!.id, name, language: lang });
    if (error) return toast.error(error.message);
    setName(""); load();
  };

  return (
    <div className="min-h-screen bg-background p-6" dir="rtl">
      <div className="max-w-3xl mx-auto space-y-4">
        <Link to="/teach/dashboard" className="text-sm text-muted-foreground">← لوحة المعلّم</Link>
        <h1 className="text-2xl font-bold">فصولي</h1>

        <div className="bg-card border rounded-2xl p-5 flex gap-2">
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="اسم الفصل"
            className="flex-1 px-4 py-2 rounded-lg border border-input bg-background"/>
          <select value={lang} onChange={e=>setLang(e.target.value)} className="px-3 py-2 rounded-lg border border-input bg-background">
            {["English","French","German","Italian"].map(l=><option key={l}>{l}</option>)}
          </select>
          <button onClick={create} className="px-4 py-2 rounded-lg text-white inline-flex items-center gap-1" style={{ background: "var(--gradient-hero)" }}>
            <Plus className="w-4 h-4"/> إنشاء
          </button>
        </div>

        <div className="space-y-2">
          {list.map(c => (
            <div key={c.id} className="p-4 rounded-xl border bg-card">
              <div className="font-bold">{c.name}</div>
              <div className="text-xs text-muted-foreground">{c.language}</div>
            </div>
          ))}
          {list.length === 0 && <div className="p-8 text-center text-muted-foreground bg-card border rounded-2xl">لا فصول بعد.</div>}
        </div>
      </div>
    </div>
  );
}
