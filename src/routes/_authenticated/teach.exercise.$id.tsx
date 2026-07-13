import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/teach/exercise/$id")({
  component: ExerciseResults,
});

function ExerciseResults() {
  const { id } = Route.useParams();
  const [subs, setSubs] = useState<any[]>([]);
  const [ex, setEx] = useState<any>(null);

  useEffect(() => { (async () => {
    const { data: e } = await supabase.from("exercises").select("*").eq("id", id).maybeSingle();
    setEx(e);
    const { data: s } = await supabase.from("exercise_submissions").select("*").eq("exercise_id", id).order("submitted_at", { ascending: false });
    setSubs(s ?? []);
  })(); }, [id]);

  return (
    <div className="min-h-screen bg-background p-6" dir="rtl">
      <div className="max-w-3xl mx-auto space-y-4">
        <Link to="/teach/dashboard" className="text-sm text-muted-foreground">← لوحة المعلّم</Link>
        <h1 className="text-2xl font-bold">{ex?.title || "نتائج التمرين"}</h1>
        <div className="space-y-2">
          {subs.length === 0 && <div className="p-8 text-center text-muted-foreground bg-card border rounded-2xl">لا تسليمات بعد.</div>}
          {subs.map(s => (
            <div key={s.id} className="p-4 rounded-xl border bg-card flex items-center justify-between">
              <div className="text-sm">
                <div className="font-mono text-xs text-muted-foreground">{s.student_id.slice(0,8)}…</div>
                <div className="text-xs">{new Date(s.submitted_at).toLocaleString("ar")}</div>
              </div>
              <div className="font-bold text-lg">{s.score} / {s.max_score}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
