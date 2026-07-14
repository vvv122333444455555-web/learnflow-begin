import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, Save, Send, Eye } from "lucide-react";
import { ExercisePlayer } from "@/components/exercise-player";

export const Route = createFileRoute("/_authenticated/teach/builder")({
  component: Builder,
});

type Type = "mcq" | "true_false" | "fill_blank" | "matching" | "ordering" | "flashcards";

const TYPES: { v: Type; l: string; e: string }[] = [
  { v: "mcq", l: "اختيار من متعدد", e: "🔘" },
  { v: "true_false", l: "صح أو خطأ", e: "✅" },
  { v: "fill_blank", l: "ملء الفراغات", e: "✏️" },
  { v: "matching", l: "الربط بين عمودين", e: "🔗" },
  { v: "ordering", l: "ترتيب الكلمات", e: "🔀" },
  { v: "flashcards", l: "بطاقات مفردات", e: "🃏" },
];

function Builder() {
  const navigate = useNavigate();
  const [type, setType] = useState<Type>("mcq");
  const [title, setTitle] = useState("");
  const [timeLimit, setTimeLimit] = useState(0);
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [content, setContent] = useState<any>({ questions: [defaultQ("mcq")] });
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [targetClass, setTargetClass] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(false);

  useEffect(() => { (async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { data } = await supabase.from("classes").select("id, name").eq("teacher_id", u.user.id);
    setClasses(data ?? []);
  })(); }, []);

  const changeType = (t: Type) => {
    setType(t);
    setContent(t === "flashcards" ? { cards: [defaultCard()] } : { questions: [defaultQ(t)] });
  };

  const publish = async (publishFlag: boolean) => {
    if (!title.trim()) return toast.error("أدخل عنوان التمرين");
    setLoading(true);
    const { data: u } = await supabase.auth.getUser();
    const { data: ex, error } = await supabase.from("exercises").insert({
      teacher_id: u.user!.id, title, type, content,
      time_limit_sec: timeLimit || null, max_attempts: maxAttempts, published: publishFlag,
    }).select("id").single();
    if (error) { setLoading(false); return toast.error(error.message); }
    if (publishFlag && targetClass) {
      await supabase.from("exercise_assignments").insert({
        exercise_id: ex!.id, target_type: "class", target_id: targetClass,
      });
    }
    setLoading(false);
    toast.success(publishFlag ? "تم النشر!" : "تم الحفظ كمسودة");
    navigate({ to: "/teach/dashboard" });
  };

  if (preview) {
    return (
      <div className="min-h-screen bg-background p-6" dir="rtl">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold">معاينة: {title || "بدون عنوان"}</h1>
            <button onClick={() => setPreview(false)} className="px-3 py-2 rounded-lg border">رجوع للتعديل</button>
          </div>
          <ExercisePlayer ex={{ id: "preview", title, type, content }} onSubmit={() => toast.info("معاينة فقط")} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">منشئ التمارين</h1>
          <p className="text-sm text-muted-foreground">أنشئ تمرينًا بدون كتابة كود.</p>
        </div>

        <div className="bg-card border rounded-2xl p-5">
          <div className="text-sm font-bold mb-3">نوع التمرين</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {TYPES.map(t => (
              <button key={t.v} onClick={() => changeType(t.v)}
                className={`p-3 rounded-xl border-2 text-right ${type === t.v ? "border-primary bg-primary/5" : "border-border"}`}>
                <div className="text-2xl">{t.e}</div>
                <div className="text-sm font-semibold">{t.l}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-card border rounded-2xl p-6 space-y-4">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="عنوان التمرين"
            className="w-full text-lg font-bold px-4 py-3 rounded-xl border border-input bg-background"/>
          <div className="grid grid-cols-3 gap-3">
            <Field label="وقت (ثانية، 0 = بدون)"><input type="number" min={0} value={timeLimit} onChange={(e) => setTimeLimit(+e.target.value)} className="w-full px-3 py-2 rounded-lg border border-input bg-background"/></Field>
            <Field label="عدد المحاولات"><input type="number" min={1} value={maxAttempts} onChange={(e) => setMaxAttempts(+e.target.value)} className="w-full px-3 py-2 rounded-lg border border-input bg-background"/></Field>
            <Field label="النشر إلى فصل">
              <select value={targetClass} onChange={(e) => setTargetClass(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-input bg-background">
                <option value="">— لا شيء —</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
          </div>
        </div>

        <Editor type={type} content={content} setContent={setContent}/>

        <div className="flex gap-3">
          <button onClick={() => setPreview(true)} className="flex-1 py-3 rounded-xl border font-semibold inline-flex items-center justify-center gap-2">
            <Eye className="w-4 h-4"/> معاينة
          </button>
          <button onClick={() => publish(false)} disabled={loading} className="flex-1 py-3 rounded-xl border font-semibold inline-flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} حفظ
          </button>
          <button onClick={() => publish(true)} disabled={loading} className="flex-1 py-3 rounded-xl font-semibold text-white inline-flex items-center justify-center gap-2 disabled:opacity-60" style={{ background: "var(--gradient-hero)" }}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>} نشر
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-sm mb-1 block">{label}</span>{children}</label>;
}

function defaultQ(t: Type): any {
  switch (t) {
    case "mcq": return { question: "", options: ["", ""], correct: 0 };
    case "true_false": return { statement: "", correct: true };
    case "fill_blank": return { text: "The sky is ___.", blanks: ["blue"] };
    case "matching": return { left: ["", ""], right: ["", ""], correct: [0, 1] };
    case "ordering": return { correct: ["", ""] };
    default: return {};
  }
}
function defaultCard() { return { front: "", back: "", image: "" }; }

function Editor({ type, content, setContent }: { type: Type; content: any; setContent: (c: any) => void }) {
  if (type === "flashcards") return <FlashEditor content={content} setContent={setContent}/>;
  const qs: any[] = content.questions ?? [];
  const updQ = (i: number, patch: any) => setContent({ ...content, questions: qs.map((q, x) => x === i ? { ...q, ...patch } : q) });
  const addQ = () => setContent({ ...content, questions: [...qs, defaultQ(type)] });
  const rmQ = (i: number) => setContent({ ...content, questions: qs.filter((_, x) => x !== i) });

  return (
    <>
      {qs.map((q, i) => (
        <div key={i} className="bg-card border rounded-2xl p-6 space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-bold">السؤال {i + 1}</span>
            {qs.length > 1 && <button onClick={() => rmQ(i)} className="text-red-500"><Trash2 className="w-4 h-4"/></button>}
          </div>

          {type === "mcq" && <McqQ q={q} onChange={(p) => updQ(i, p)}/>}
          {type === "true_false" && <TfQ q={q} onChange={(p) => updQ(i, p)}/>}
          {type === "fill_blank" && <FillQ q={q} onChange={(p) => updQ(i, p)}/>}
          {type === "matching" && <MatchQ q={q} onChange={(p) => updQ(i, p)}/>}
          {type === "ordering" && <OrderQ q={q} onChange={(p) => updQ(i, p)}/>}
        </div>
      ))}
      <button onClick={addQ} className="w-full py-3 rounded-xl border-2 border-dashed border-primary text-primary font-semibold inline-flex items-center justify-center gap-2">
        <Plus className="w-4 h-4"/> سؤال جديد
      </button>
    </>
  );
}

function McqQ({ q, onChange }: any) {
  return (
    <>
      <input value={q.question} onChange={(e) => onChange({ question: e.target.value })} placeholder="نص السؤال"
        className="w-full px-3 py-2 rounded-lg border border-input bg-background"/>
      {q.options.map((opt: string, oi: number) => (
        <div key={oi} className="flex items-center gap-2">
          <input type="radio" checked={q.correct === oi} onChange={() => onChange({ correct: oi })}/>
          <input value={opt} onChange={(e) => { const o = [...q.options]; o[oi] = e.target.value; onChange({ options: o }); }}
            placeholder={`الخيار ${oi + 1}`} className="flex-1 px-3 py-2 rounded-lg border border-input bg-background"/>
          {q.options.length > 2 && <button onClick={() => onChange({ options: q.options.filter((_: any, x: number) => x !== oi) })}><Trash2 className="w-4 h-4 text-muted-foreground"/></button>}
        </div>
      ))}
      <button onClick={() => onChange({ options: [...q.options, ""] })} className="text-sm text-primary inline-flex items-center gap-1"><Plus className="w-4 h-4"/> خيار</button>
    </>
  );
}
function TfQ({ q, onChange }: any) {
  return (
    <>
      <input value={q.statement} onChange={(e) => onChange({ statement: e.target.value })} placeholder="نص العبارة"
        className="w-full px-3 py-2 rounded-lg border border-input bg-background"/>
      <div className="flex gap-2">
        {[{ v: true, l: "صحيح" }, { v: false, l: "خطأ" }].map(o => (
          <button key={String(o.v)} onClick={() => onChange({ correct: o.v })}
            className={`flex-1 p-2 rounded-lg border-2 ${q.correct === o.v ? "border-primary bg-primary/5" : "border-border"}`}>{o.l}</button>
        ))}
      </div>
    </>
  );
}
function FillQ({ q, onChange }: any) {
  const nBlanks = (String(q.text || "").match(/___/g) || []).length;
  const blanks: string[] = q.blanks ?? [];
  const setBlank = (i: number, v: string) => {
    const b = Array.from({ length: nBlanks }, (_, x) => blanks[x] ?? "");
    b[i] = v; onChange({ blanks: b });
  };
  return (
    <>
      <textarea value={q.text} onChange={(e) => onChange({ text: e.target.value })}
        placeholder="النص — استخدم ___ للفراغ" rows={2}
        className="w-full px-3 py-2 rounded-lg border border-input bg-background"/>
      <div className="text-xs text-muted-foreground">عدد الفراغات: {nBlanks}</div>
      {Array.from({ length: nBlanks }).map((_, i) => (
        <input key={i} value={blanks[i] ?? ""} onChange={(e) => setBlank(i, e.target.value)}
          placeholder={`الإجابة للفراغ ${i + 1}`}
          className="w-full px-3 py-2 rounded-lg border border-input bg-background"/>
      ))}
    </>
  );
}
function MatchQ({ q, onChange }: any) {
  const left: string[] = q.left ?? [];
  const right: string[] = q.right ?? [];
  const correct: number[] = q.correct ?? left.map((_, i) => i);
  const upd = (side: "left" | "right", i: number, v: string) => {
    const arr = [...(side === "left" ? left : right)]; arr[i] = v;
    onChange(side === "left" ? { left: arr } : { right: arr });
  };
  const add = () => onChange({ left: [...left, ""], right: [...right, ""], correct: [...correct, correct.length] });
  const rm = (i: number) => onChange({ left: left.filter((_, x) => x !== i), right: right.filter((_, x) => x !== i), correct: correct.filter((_, x) => x !== i) });
  return (
    <>
      <div className="text-xs text-muted-foreground">الصواب حسب الترتيب. لتغيير الربط، أعد ترتيب العمود الأيمن.</div>
      {left.map((_, i) => (
        <div key={i} className="flex gap-2 items-center">
          <input value={left[i]} onChange={(e) => upd("left", i, e.target.value)} placeholder="يمين"
            className="flex-1 px-3 py-2 rounded-lg border border-input bg-background"/>
          <span>↔</span>
          <input value={right[i]} onChange={(e) => upd("right", i, e.target.value)} placeholder="يسار"
            className="flex-1 px-3 py-2 rounded-lg border border-input bg-background"/>
          {left.length > 2 && <button onClick={() => rm(i)}><Trash2 className="w-4 h-4 text-muted-foreground"/></button>}
        </div>
      ))}
      <button onClick={add} className="text-sm text-primary inline-flex items-center gap-1"><Plus className="w-4 h-4"/> زوج</button>
    </>
  );
}
function OrderQ({ q, onChange }: any) {
  const [txt, setTxt] = useState((q.correct ?? []).join(" "));
  return (
    <>
      <input value={txt} onChange={(e) => { setTxt(e.target.value); onChange({ correct: e.target.value.split(/\s+/).filter(Boolean) }); }}
        placeholder="الجملة الصحيحة (ستُخلط للطالب)"
        className="w-full px-3 py-2 rounded-lg border border-input bg-background"/>
      <div className="text-xs text-muted-foreground">الكلمات: {(q.correct ?? []).length}</div>
    </>
  );
}
function FlashEditor({ content, setContent }: any) {
  const cards: any[] = content.cards ?? [];
  const upd = (i: number, patch: any) => setContent({ cards: cards.map((c, x) => x === i ? { ...c, ...patch } : c) });
  const add = () => setContent({ cards: [...cards, defaultCard()] });
  const rm = (i: number) => setContent({ cards: cards.filter((_, x) => x !== i) });
  return (
    <>
      {cards.map((c, i) => (
        <div key={i} className="bg-card border rounded-2xl p-6 space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-bold">البطاقة {i + 1}</span>
            {cards.length > 1 && <button onClick={() => rm(i)} className="text-red-500"><Trash2 className="w-4 h-4"/></button>}
          </div>
          <input value={c.front} onChange={(e) => upd(i, { front: e.target.value })} placeholder="الوجه الأمامي (الكلمة)"
            className="w-full px-3 py-2 rounded-lg border border-input bg-background"/>
          <input value={c.back} onChange={(e) => upd(i, { back: e.target.value })} placeholder="الوجه الخلفي (المعنى)"
            className="w-full px-3 py-2 rounded-lg border border-input bg-background"/>
          <input value={c.image ?? ""} onChange={(e) => upd(i, { image: e.target.value })} placeholder="رابط صورة (اختياري)"
            className="w-full px-3 py-2 rounded-lg border border-input bg-background"/>
        </div>
      ))}
      <button onClick={add} className="w-full py-3 rounded-xl border-2 border-dashed border-primary text-primary font-semibold inline-flex items-center justify-center gap-2">
        <Plus className="w-4 h-4"/> بطاقة جديدة
      </button>
    </>
  );
}
