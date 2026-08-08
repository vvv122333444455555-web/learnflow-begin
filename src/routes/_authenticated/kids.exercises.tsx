import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ExercisePlayer, type Exercise } from "@/components/exercise-player";
import { useRoleGuard } from "@/hooks/use-role-guard";
import { Mascot } from "@/components/mascot";

export const Route = createFileRoute("/_authenticated/kids/exercises")({
  component: KidsExercises,
});

function KidsExercises() {
  const ready = useRoleGuard(["student"], { track: "kids" });
  const [list, setList] = useState<Exercise[]>([]);
  const [active, setActive] = useState<Exercise | null>(null);
  const [result, setResult] = useState<{ score: number; max_score: number } | null>(null);

  useEffect(() => { if (!ready) return; (async () => {
    const { data } = await supabase.from("exercises").select("id, title, type, content, video_url, target_language").eq("published", true).order("created_at", { ascending: false });
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
    const great = result.score === result.max_score;
    return (
      <div className="min-h-screen p-6 flex items-center justify-center" dir="rtl" style={{ background: "linear-gradient(180deg, #FFF1F5, #FFF8E7)" }}>
        <Mascot context={great ? "kids_result_great" : "kids_result_ok"} palette="kid" />
        <div className="bg-white p-10 rounded-3xl text-center shadow-2xl max-w-md">
          <div className="text-6xl mb-4">{result.score === result.max_score ? "🏆" : result.score >= result.max_score / 2 ? "🎉" : "💪"}</div>
          <h2 className="text-3xl font-bold mb-2">{result.score} / {result.max_score}</h2>
          <p className="text-muted-foreground mb-6">+{Number(result.score) * 10} نقطة!</p>
          <button onClick={() => { setActive(null); setResult(null); }} className="px-6 py-3 rounded-xl text-white font-semibold" style={{ background: "linear-gradient(135deg,#FF6B9D,#FEC260)" }}>عودة للتمارين</button>
        </div>
      </div>
    );
  }

  if (active) {
    return (
      <div className="min-h-screen p-6" dir="rtl" style={{ background: "linear-gradient(180deg, #FFF1F5, #FFF8E7)" }}>
        <div className="max-w-2xl mx-auto space-y-4">
          <button onClick={() => setActive(null)} className="text-sm">← العودة</button>
          <h1 className="text-2xl font-bold">{active.title}</h1>
          <ExercisePlayer ex={active} onSubmit={submit} palette="kid"/>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" dir="rtl" style={{ background: "linear-gradient(180deg, #FFF1F5, #FFF8E7)" }}>
      <Mascot context="kids_exercises" palette="kid" />
      <div className="max-w-2xl mx-auto space-y-3">
        <Link to="/kids" className="text-sm">← الرئيسية</Link>
        <h1 className="text-2xl font-bold">تماريني 📚</h1>
        {list.length === 0 && <div className="text-center p-10 bg-white rounded-2xl">لا توجد تمارين بعد 🌱</div>}
        {list.map(e => (
          <button key={e.id} onClick={() => { setActive(e); setResult(null); }}
            className="w-full text-right p-5 rounded-2xl bg-white shadow hover:-translate-y-1 transition">
            <div className="font-bold text-lg">{e.title}</div>
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
