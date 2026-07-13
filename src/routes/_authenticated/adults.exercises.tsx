import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/adults/exercises")({
  component: AdultsExercises,
});

type Ex = { id: string; title: string; type: string; content: any };

function AdultsExercises() {
  const [list, setList] = useState<Ex[]>([]);
  const [active, setActive] = useState<Ex | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<{ score: number; max_score: number } | null>(null);

  useEffect(() => { (async () => {
    const { data } = await supabase.from("exercises").select("id, title, type, content").eq("published", true);
    setList(data ?? []);
  })(); }, []);

  const submit = async () => {
    if (!active) return;
    const { data, error } = await supabase.rpc("submit_exercise", { _exercise_id: active.id, _answers: answers });
    if (error) return toast.error(error.message);
    const r = Array.isArray(data) ? data[0] : data;
    setResult(r as any);
  };

  if (active && result) {
    const pct = result.max_score ? Math.round((result.score / result.max_score) * 100) : 0;
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center" dir="rtl">
        <div className="bg-card border rounded-2xl p-10 text-center max-w-md">
          <h2 className="text-4xl font-bold mb-2">{pct}%</h2>
          <p className="text-muted-foreground mb-6">{result.score} من {result.max_score} إجابة صحيحة</p>
          <Link to="/adults" className="px-6 py-3 rounded-xl text-white font-semibold inline-block" style={{ background: "var(--gradient-hero)" }}>العودة</Link>
        </div>
      </div>
    );
  }

  if (active) {
    const qs = (active.content?.questions ?? []) as { question: string; options: string[] }[];
    return (
      <div className="min-h-screen bg-background p-6" dir="rtl">
        <div className="max-w-2xl mx-auto space-y-4">
          <h1 className="text-2xl font-bold">{active.title}</h1>
          {qs.map((q, i) => (
            <div key={i} className="bg-card border p-5 rounded-2xl">
              <div className="font-semibold mb-3">{i + 1}. {q.question}</div>
              <div className="space-y-2">
                {q.options.map((o, oi) => (
                  <label key={oi} className={`block p-3 rounded-lg border-2 cursor-pointer ${answers[String(i)] === oi ? "border-primary bg-primary/5" : "border-border"}`}>
                    <input type="radio" className="ml-2" checked={answers[String(i)] === oi} onChange={() => setAnswers({ ...answers, [String(i)]: oi })}/>
                    {o}
                  </label>
                ))}
              </div>
            </div>
          ))}
          <button onClick={submit} className="w-full py-3 rounded-xl text-white font-semibold" style={{ background: "var(--gradient-hero)" }}>إرسال الإجابات</button>
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
          <button key={e.id} onClick={() => { setActive(e); setAnswers({}); setResult(null); }}
            className="w-full text-right p-5 rounded-2xl bg-card border hover:border-primary transition">
            <div className="font-bold">{e.title}</div>
            <div className="text-sm text-muted-foreground">{(e.content?.questions?.length ?? 0)} أسئلة</div>
          </button>
        ))}
      </div>
    </div>
  );
}
