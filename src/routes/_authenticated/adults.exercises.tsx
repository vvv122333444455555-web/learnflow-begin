import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ExercisePlayer, type Exercise } from "@/components/exercise-player";
import { useRoleGuard } from "@/hooks/use-role-guard";

export const Route = createFileRoute("/_authenticated/adults/exercises")({
  component: AdultsExercises,
});

function AdultsExercises() {
  const ready = useRoleGuard(["student"]);
  const [list, setList] = useState<Exercise[]>([]);
  const [active, setActive] = useState<Exercise | null>(null);
  const [result, setResult] = useState<{ score: number; max_score: number } | null>(null);

  useEffect(() => { if (!ready) return; (async () => {
    const { data } = await supabase.from("exercises").select("id, title, type, content, video_url").eq("published", true).order("created_at", { ascending: false });
    setList((data ?? []) as Exercise[]);
  })(); }, [ready]);

  const submit = async (answers: Record<string, any>) => {
    if (!active) return;
    const { data, error } = await supabase.rpc("submit_exercise", { _exercise_id: active.id, _answers: answers });
    if (error) return toast.error(error.message);
    const r = Array.isArray(data) ? data[0] : data;
    setResult(r as any);
  };

  if (active && result) {
    const pct = result.max_score ? Math.round((Number(result.score) / Number(result.max_score)) * 100) : 0;
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center" dir="rtl">
        <div className="bg-card border rounded-2xl p-10 text-center max-w-md">
          <h2 className="text-4xl font-bold mb-2">{pct}%</h2>
          <p className="text-muted-foreground mb-6">{result.score} من {result.max_score} إجابة صحيحة</p>
          <button onClick={() => { setActive(null); setResult(null); }} className="px-6 py-3 rounded-xl text-white font-semibold" style={{ background: "var(--gradient-hero)" }}>عودة للتمارين</button>
        </div>
      </div>
    );
  }

  if (active) {
    return (
      <div className="min-h-screen bg-background p-6" dir="rtl">
        <div className="max-w-2xl mx-auto space-y-4">
          <button onClick={() => setActive(null)} className="text-sm text-muted-foreground">← العودة</button>
          <h1 className="text-2xl font-bold">{active.title}</h1>
          <ExercisePlayer ex={active} onSubmit={submit} palette="adult"/>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6" dir="rtl">
      <div className="max-w-3xl mx-auto space-y-3">
        <Link to="/adults" className="text-sm text-muted-foreground">← لوحة التحكم</Link>
        <h1 className="text-2xl font-bold">التمارين المُسندة</h1>
        {list.length === 0 && <div className="p-8 text-center bg-card border rounded-2xl text-muted-foreground">لا توجد تمارين بعد.</div>}
        {list.map(e => (
          <button key={e.id} onClick={() => { setActive(e); setResult(null); }}
            className="w-full text-right p-5 rounded-2xl bg-card border hover:border-primary transition">
            <div className="font-bold">{e.title}</div>
            <div className="text-sm text-muted-foreground">{typeLabel(e.type)}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function typeLabel(t: string) {
  return ({ mcq: "اختيار من متعدد", true_false: "صح أو خطأ", fill_blank: "ملء الفراغات", matching: "ربط", ordering: "ترتيب", flashcards: "بطاقات" } as any)[t] ?? t;
}
