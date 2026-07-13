import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/kids/exercises")({
  component: KidsExercises,
});

type Ex = { id: string; title: string; type: string; content: any };

function KidsExercises() {
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
    if (error) { toast.error(error.message); return; }
    const r = Array.isArray(data) ? data[0] : data;
    setResult(r as any);
  };

  if (active && result) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center" dir="rtl" style={{ background: "linear-gradient(180deg, #FFF1F5, #FFF8E7)" }}>
        <div className="bg-white p-10 rounded-3xl text-center shadow-2xl max-w-md">
          <div className="text-6xl mb-4">{result.score === result.max_score ? "🏆" : result.score >= result.max_score / 2 ? "🎉" : "💪"}</div>
          <h2 className="text-3xl font-bold mb-2">{result.score} / {result.max_score}</h2>
          <p className="text-muted-foreground mb-6">+{result.score * 10} نقطة!</p>
          <Link to="/kids" className="px-6 py-3 rounded-xl text-white font-semibold inline-block" style={{ background: "linear-gradient(135deg,#FF6B9D,#FEC260)" }}>عودة</Link>
        </div>
      </div>
    );
  }

  if (active) {
    const qs = (active.content?.questions ?? []) as { question: string; options: string[] }[];
    return (
      <div className="min-h-screen p-6" dir="rtl" style={{ background: "linear-gradient(180deg, #FFF1F5, #FFF8E7)" }}>
        <div className="max-w-2xl mx-auto space-y-4">
          <h1 className="text-2xl font-bold">{active.title}</h1>
          {qs.map((q, i) => (
            <div key={i} className="bg-white p-5 rounded-2xl shadow">
              <div className="font-bold mb-3">{i + 1}. {q.question}</div>
              <div className="space-y-2">
                {q.options.map((o, oi) => (
                  <label key={oi} className={`block p-3 rounded-xl border-2 cursor-pointer ${answers[String(i)] === oi ? "border-pink-500 bg-pink-50" : "border-border"}`}>
                    <input type="radio" className="ml-2" checked={answers[String(i)] === oi} onChange={() => setAnswers({ ...answers, [String(i)]: oi })}/>
                    {o}
                  </label>
                ))}
              </div>
            </div>
          ))}
          <button onClick={submit} className="w-full py-3 rounded-xl text-white font-bold text-lg" style={{ background: "linear-gradient(135deg,#FF6B9D,#FEC260)" }}>إرسال ✨</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" dir="rtl" style={{ background: "linear-gradient(180deg, #FFF1F5, #FFF8E7)" }}>
      <div className="max-w-2xl mx-auto space-y-3">
        <Link to="/kids" className="text-sm">← الرئيسية</Link>
        <h1 className="text-2xl font-bold">تماريني 📚</h1>
        {list.length === 0 && <div className="text-center p-10 bg-white rounded-2xl">لا توجد تمارين بعد 🌱</div>}
        {list.map(e => (
          <button key={e.id} onClick={() => { setActive(e); setAnswers({}); setResult(null); }}
            className="w-full text-right p-5 rounded-2xl bg-white shadow hover:-translate-y-1 transition">
            <div className="font-bold text-lg">{e.title}</div>
            <div className="text-sm text-muted-foreground">{(e.content?.questions?.length ?? 0)} أسئلة</div>
          </button>
        ))}
      </div>
    </div>
  );
}
