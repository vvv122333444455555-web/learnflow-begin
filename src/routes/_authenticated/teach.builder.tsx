import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, Save, Send } from "lucide-react";

export const Route = createFileRoute("/_authenticated/teach/builder")({
  component: Builder,
});

type Q = { question: string; options: string[]; correct: number };

function Builder() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [timeLimit, setTimeLimit] = useState(0);
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [questions, setQuestions] = useState<Q[]>([{ question: "", options: ["", ""], correct: 0 }]);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [targetClass, setTargetClass] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { (async () => {
    const { data: u } = await supabase.auth.getUser();
    const { data } = await supabase.from("classes").select("id, name").eq("teacher_id", u.user!.id);
    setClasses(data ?? []);
  })(); }, []);

  const addQ = () => setQuestions([...questions, { question: "", options: ["",""], correct: 0 }]);
  const removeQ = (i: number) => setQuestions(questions.filter((_, x) => x !== i));
  const updQ = (i: number, patch: Partial<Q>) => setQuestions(questions.map((q, x) => x === i ? { ...q, ...patch } : q));

  const publish = async (publish: boolean) => {
    if (!title.trim() || questions.some(q => !q.question.trim() || q.options.some(o => !o.trim()))) {
      toast.error("أكمل كل الحقول");
      return;
    }
    setLoading(true);
    const { data: u } = await supabase.auth.getUser();
    const { data: ex, error } = await supabase.from("exercises").insert({
      teacher_id: u.user!.id, title, type: "mcq",
      content: { questions },
      time_limit_sec: timeLimit || null, max_attempts: maxAttempts,
      published: publish,
    }).select("id").single();
    if (error) { setLoading(false); toast.error(error.message); return; }
    if (publish && targetClass) {
      await supabase.from("exercise_assignments").insert({
        exercise_id: ex!.id, target_type: "class", target_id: targetClass,
      });
    }
    setLoading(false);
    toast.success(publish ? "تم النشر!" : "تم الحفظ كمسودة");
    navigate({ to: "/teach/dashboard" });
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">منشئ التمارين — اختيار من متعدد</h1>
          <p className="text-sm text-muted-foreground">أنشئ تمرينًا وانشره على فصل معيّن.</p>
        </div>

        <div className="bg-card border rounded-2xl p-6 space-y-4">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="عنوان التمرين"
            className="w-full text-lg font-bold px-4 py-3 rounded-xl border border-input bg-background"/>
          <div className="grid grid-cols-3 gap-3">
            <label className="block"><span className="text-sm mb-1 block">وقت (ثانية، 0 = بدون)</span>
              <input type="number" min={0} value={timeLimit} onChange={(e) => setTimeLimit(+e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background"/></label>
            <label className="block"><span className="text-sm mb-1 block">عدد المحاولات</span>
              <input type="number" min={1} value={maxAttempts} onChange={(e) => setMaxAttempts(+e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background"/></label>
            <label className="block"><span className="text-sm mb-1 block">النشر إلى فصل</span>
              <select value={targetClass} onChange={(e) => setTargetClass(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background">
                <option value="">— لا شيء (حفظ فقط) —</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select></label>
          </div>
        </div>

        {questions.map((q, i) => (
          <div key={i} className="bg-card border rounded-2xl p-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold">السؤال {i + 1}</span>
              {questions.length > 1 && <button onClick={() => removeQ(i)} className="text-red-500"><Trash2 className="w-4 h-4"/></button>}
            </div>
            <input value={q.question} onChange={(e) => updQ(i, { question: e.target.value })} placeholder="نص السؤال"
              className="w-full px-3 py-2 rounded-lg border border-input bg-background"/>
            {q.options.map((opt, oi) => (
              <div key={oi} className="flex items-center gap-2">
                <input type="radio" checked={q.correct === oi} onChange={() => updQ(i, { correct: oi })}/>
                <input value={opt} onChange={(e) => {
                  const opts = [...q.options]; opts[oi] = e.target.value;
                  updQ(i, { options: opts });
                }} placeholder={`الخيار ${oi + 1}`}
                  className="flex-1 px-3 py-2 rounded-lg border border-input bg-background"/>
                {q.options.length > 2 && <button onClick={() => updQ(i, { options: q.options.filter((_, x) => x !== oi) })} className="text-muted-foreground"><Trash2 className="w-4 h-4"/></button>}
              </div>
            ))}
            <button onClick={() => updQ(i, { options: [...q.options, ""] })}
              className="text-sm text-primary inline-flex items-center gap-1"><Plus className="w-4 h-4"/> خيار جديد</button>
          </div>
        ))}

        <button onClick={addQ} className="w-full py-3 rounded-xl border-2 border-dashed border-primary text-primary font-semibold inline-flex items-center justify-center gap-2">
          <Plus className="w-4 h-4"/> سؤال جديد
        </button>

        <div className="flex gap-3">
          <button onClick={() => publish(false)} disabled={loading}
            className="flex-1 py-3 rounded-xl border border-border font-semibold inline-flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} حفظ كمسودة
          </button>
          <button onClick={() => publish(true)} disabled={loading}
            className="flex-1 py-3 rounded-xl font-semibold text-white inline-flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: "var(--gradient-hero)" }}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>} نشر
          </button>
        </div>
      </div>
    </div>
  );
}
