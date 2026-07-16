import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, Send, Eye, Globe, Lock, CloudUpload } from "lucide-react";
import { ExercisePlayer } from "@/components/exercise-player";
import { useRoleGuard } from "@/hooks/use-role-guard";

export const Route = createFileRoute("/_authenticated/teach/builder")({
  component: Builder,
});

type Type = "mcq" | "true_false" | "fill_blank" | "matching" | "ordering" | "flashcards";
type Visibility = "private" | "public";
type Track = "" | "kids" | "adults";

const TYPES: { v: Type; l: string; e: string }[] = [
  { v: "mcq", l: "اختيار من متعدد", e: "🔘" },
  { v: "true_false", l: "صح أو خطأ", e: "✅" },
  { v: "fill_blank", l: "ملء الفراغات", e: "✏️" },
  { v: "matching", l: "الربط بين عمودين", e: "🔗" },
  { v: "ordering", l: "ترتيب الكلمات", e: "🔀" },
  { v: "flashcards", l: "بطاقات مفردات", e: "🃏" },
];

const DRAFT_KEY = "learnflow_builder_draft_v2";

const LANGUAGES = ["English", "French", "German", "Italian"];
const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const GRADES = ["السنة 3", "السنة 4", "السنة 5", "السنة 6", "السنة 7", "السنة 8", "السنة 9"];
const TERMS = ["الثلاثي 1", "الثلاثي 2", "الثلاثي 3"];

function Builder() {
  useRoleGuard(["teacher", "admin"]);
  const navigate = useNavigate();
  const [type, setType] = useState<Type>("mcq");
  const [title, setTitle] = useState("");
  const [timeLimit, setTimeLimit] = useState(0);
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [content, setContent] = useState<any>({ questions: [defaultQ("mcq")] });
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [targetClass, setTargetClass] = useState<string>("");
  const [visibility, setVisibility] = useState<Visibility>("private");
  const [track, setTrack] = useState<Track>("");
  const [grade, setGrade] = useState("");
  const [module, setModule] = useState("");
  const [term, setTerm] = useState("");
  const [language, setLanguage] = useState("");
  const [level, setLevel] = useState("");
  const [loading, setLoading] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [restored, setRestored] = useState(false);
  const firstRender = useRef(true);

  // Load draft + classes
  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (u.user) {
        const { data } = await supabase.from("classes").select("id, name").eq("teacher_id", u.user.id);
        setClasses(data ?? []);
      }
      try {
        const raw = typeof window !== "undefined" ? localStorage.getItem(DRAFT_KEY) : null;
        if (raw) {
          const d = JSON.parse(raw);
          setType(d.type ?? "mcq");
          setTitle(d.title ?? "");
          setTimeLimit(d.timeLimit ?? 0);
          setMaxAttempts(d.maxAttempts ?? 1);
          setContent(d.content ?? { questions: [defaultQ("mcq")] });
          setVisibility(d.visibility ?? "private");
          setTrack(d.track ?? "");
          setGrade(d.grade ?? ""); setModule(d.module ?? ""); setTerm(d.term ?? "");
          setLanguage(d.language ?? ""); setLevel(d.level ?? "");
          setRestored(true);
        }
      } catch {}
    })();
  }, []);

  // Auto-save
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    const t = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({
          type, title, timeLimit, maxAttempts, content, visibility, track, grade, module, term, language, level,
        }));
        setSavedAt(new Date());
      } catch {}
    }, 800);
    return () => clearTimeout(t);
  }, [type, title, timeLimit, maxAttempts, content, visibility, track, grade, module, term, language, level]);

  const clearDraft = () => { try { localStorage.removeItem(DRAFT_KEY); } catch {} };

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
      visibility,
      target_track: track || null,
      target_grade: track === "kids" ? grade || null : null,
      target_module: track === "kids" ? module || null : null,
      target_term: track === "kids" ? term || null : null,
      target_language: track === "adults" ? language || null : null,
      target_level: track === "adults" ? level || null : null,
    }).select("id").single();
    if (error) { setLoading(false); return toast.error(error.message); }
    if (publishFlag && targetClass) {
      await supabase.from("exercise_assignments").insert({
        exercise_id: ex!.id, target_type: "class", target_id: targetClass,
      });
    }
    setLoading(false);
    clearDraft();
    toast.success(publishFlag ? "تم النشر!" : "تم الحفظ كمسودة");
    navigate({ to: "/teach/dashboard" });
  };

  const previewEx = useMemo(() => ({ id: "preview", title, type, content }), [title, type, content]);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="max-w-[1600px] mx-auto p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">منشئ التمارين</h1>
            <p className="text-sm text-muted-foreground">
              معاينة مباشرة على اليسار.
              {restored && <span className="mr-2 text-primary">↻ استُعيدت مسودة محفوظة</span>}
            </p>
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <CloudUpload className="w-4 h-4" />
            {savedAt ? `حُفظت المسودة تلقائيًا ${savedAt.toLocaleTimeString("ar")}` : "الحفظ التلقائي مفعّل"}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* EDITOR */}
          <div className="space-y-4">
            <div className="bg-card border rounded-2xl p-5">
              <div className="text-sm font-bold mb-3">نوع التمرين</div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {TYPES.map((t) => (
                  <button key={t.v} onClick={() => changeType(t.v)}
                    className={`p-3 rounded-xl border-2 text-right transition ${type === t.v ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                    <div className="text-2xl">{t.e}</div>
                    <div className="text-sm font-semibold">{t.l}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-card border rounded-2xl p-6 space-y-4">
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="عنوان التمرين"
                className="w-full text-lg font-bold px-4 py-3 rounded-xl border border-input bg-background" />
              <div className="grid grid-cols-2 gap-3">
                <Field label="وقت (ثانية، 0 = بدون)"><input type="number" min={0} value={timeLimit} onChange={(e) => setTimeLimit(+e.target.value)} className="w-full px-3 py-2 rounded-lg border border-input bg-background" /></Field>
                <Field label="عدد المحاولات"><input type="number" min={1} value={maxAttempts} onChange={(e) => setMaxAttempts(+e.target.value)} className="w-full px-3 py-2 rounded-lg border border-input bg-background" /></Field>
              </div>
            </div>

            {/* Publishing controls */}
            <div className="bg-card border rounded-2xl p-6 space-y-4">
              <div className="text-sm font-bold">النشر والتوزيع</div>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setVisibility("private")}
                  className={`p-3 rounded-xl border-2 text-right inline-flex items-center gap-2 ${visibility === "private" ? "border-primary bg-primary/5" : "border-border"}`}>
                  <Lock className="w-4 h-4" /> <div><div className="font-semibold text-sm">خاص</div><div className="text-xs text-muted-foreground">لفصلك فقط</div></div>
                </button>
                <button onClick={() => setVisibility("public")}
                  className={`p-3 rounded-xl border-2 text-right inline-flex items-center gap-2 ${visibility === "public" ? "border-primary bg-primary/5" : "border-border"}`}>
                  <Globe className="w-4 h-4" /> <div><div className="font-semibold text-sm">المكتبة العامة</div><div className="text-xs text-muted-foreground">مشاركة مع المجتمع</div></div>
                </button>
              </div>

              <Field label="الفصل المستهدف (اختياري)">
                <select value={targetClass} onChange={(e) => setTargetClass(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-input bg-background">
                  <option value="">— لا شيء —</option>
                  {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>

              <Field label="التوزيع السريع">
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => setTrack("")}
                    className={`p-2 rounded-lg border-2 text-sm ${track === "" ? "border-primary bg-primary/5" : "border-border"}`}>بدون</button>
                  <button onClick={() => setTrack("kids")}
                    className={`p-2 rounded-lg border-2 text-sm ${track === "kids" ? "border-primary bg-primary/5" : "border-border"}`}>👶 Kids Zone</button>
                  <button onClick={() => setTrack("adults")}
                    className={`p-2 rounded-lg border-2 text-sm ${track === "adults" ? "border-primary bg-primary/5" : "border-border"}`}>🎓 Adults Hub</button>
                </div>
              </Field>

              {track === "kids" && (
                <div className="grid grid-cols-3 gap-2">
                  <select value={grade} onChange={(e) => setGrade(e.target.value)} className="px-3 py-2 rounded-lg border border-input bg-background text-sm">
                    <option value="">السنة</option>
                    {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                  <input value={module} onChange={(e) => setModule(e.target.value)} placeholder="الوحدة (Module)"
                    className="px-3 py-2 rounded-lg border border-input bg-background text-sm" />
                  <select value={term} onChange={(e) => setTerm(e.target.value)} className="px-3 py-2 rounded-lg border border-input bg-background text-sm">
                    <option value="">الثلاثي</option>
                    {TERMS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              )}

              {track === "adults" && (
                <div className="grid grid-cols-2 gap-2">
                  <select value={language} onChange={(e) => setLanguage(e.target.value)} className="px-3 py-2 rounded-lg border border-input bg-background text-sm">
                    <option value="">اللغة</option>
                    {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                  <select value={level} onChange={(e) => setLevel(e.target.value)} className="px-3 py-2 rounded-lg border border-input bg-background text-sm">
                    <option value="">المستوى</option>
                    {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              )}
            </div>

            <Editor type={type} content={content} setContent={setContent} />

            <div className="flex gap-3 sticky bottom-4 bg-background/80 backdrop-blur p-3 rounded-2xl border">
              <button onClick={() => publish(true)} disabled={loading}
                className="flex-1 py-3 rounded-xl font-semibold text-white inline-flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ background: "var(--gradient-hero)" }}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} نشر
              </button>
              <button onClick={() => { clearDraft(); toast.success("مُسحت المسودة"); }} className="px-4 py-3 rounded-xl border text-sm">مسح المسودة</button>
            </div>
          </div>

          {/* LIVE PREVIEW */}
          <div className="lg:sticky lg:top-4 lg:self-start lg:max-h-[calc(100vh-2rem)] lg:overflow-auto">
            <div className="bg-gradient-to-br from-primary/5 to-accent/5 border-2 border-dashed border-primary/30 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
                <Eye className="w-4 h-4" /> معاينة مباشرة (تُحدَّث فورًا)
              </div>
              <div className="text-lg font-bold mb-3">{title || <span className="text-muted-foreground">عنوان التمرين…</span>}</div>
              <ExercisePlayer ex={previewEx} palette={track === "kids" ? "kid" : "adult"} onSubmit={() => toast.info("هذه معاينة فقط")} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-xs text-muted-foreground mb-1 block">{label}</span>{children}</label>;
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
  if (type === "flashcards") return <FlashEditor content={content} setContent={setContent} />;
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
            {qs.length > 1 && <button onClick={() => rmQ(i)} className="text-red-500"><Trash2 className="w-4 h-4" /></button>}
          </div>
          {type === "mcq" && <McqQ q={q} onChange={(p: any) => updQ(i, p)} />}
          {type === "true_false" && <TfQ q={q} onChange={(p: any) => updQ(i, p)} />}
          {type === "fill_blank" && <FillQ q={q} onChange={(p: any) => updQ(i, p)} />}
          {type === "matching" && <MatchQ q={q} onChange={(p: any) => updQ(i, p)} />}
          {type === "ordering" && <OrderQ q={q} onChange={(p: any) => updQ(i, p)} />}
        </div>
      ))}
      <button onClick={addQ} className="w-full py-3 rounded-xl border-2 border-dashed border-primary text-primary font-semibold inline-flex items-center justify-center gap-2">
        <Plus className="w-4 h-4" /> سؤال جديد
      </button>
    </>
  );
}

function McqQ({ q, onChange }: any) {
  return (
    <>
      <input value={q.question} onChange={(e) => onChange({ question: e.target.value })} placeholder="نص السؤال"
        className="w-full px-3 py-2 rounded-lg border border-input bg-background" />
      {q.options.map((opt: string, oi: number) => (
        <div key={oi} className="flex items-center gap-2">
          <input type="radio" checked={q.correct === oi} onChange={() => onChange({ correct: oi })} />
          <input value={opt} onChange={(e) => { const o = [...q.options]; o[oi] = e.target.value; onChange({ options: o }); }}
            placeholder={`الخيار ${oi + 1}`} className="flex-1 px-3 py-2 rounded-lg border border-input bg-background" />
          {q.options.length > 2 && <button onClick={() => onChange({ options: q.options.filter((_: any, x: number) => x !== oi) })}><Trash2 className="w-4 h-4 text-muted-foreground" /></button>}
        </div>
      ))}
      <button onClick={() => onChange({ options: [...q.options, ""] })} className="text-sm text-primary inline-flex items-center gap-1"><Plus className="w-4 h-4" /> خيار</button>
    </>
  );
}
function TfQ({ q, onChange }: any) {
  return (
    <>
      <input value={q.statement} onChange={(e) => onChange({ statement: e.target.value })} placeholder="نص العبارة"
        className="w-full px-3 py-2 rounded-lg border border-input bg-background" />
      <div className="flex gap-2">
        {[{ v: true, l: "صحيح" }, { v: false, l: "خطأ" }].map((o) => (
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
        className="w-full px-3 py-2 rounded-lg border border-input bg-background" />
      <div className="text-xs text-muted-foreground">عدد الفراغات: {nBlanks}</div>
      {Array.from({ length: nBlanks }).map((_, i) => (
        <input key={i} value={blanks[i] ?? ""} onChange={(e) => setBlank(i, e.target.value)}
          placeholder={`الإجابة للفراغ ${i + 1}`}
          className="w-full px-3 py-2 rounded-lg border border-input bg-background" />
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
      <div className="text-xs text-muted-foreground">الصواب حسب الترتيب.</div>
      {left.map((_, i) => (
        <div key={i} className="flex gap-2 items-center">
          <input value={left[i]} onChange={(e) => upd("left", i, e.target.value)} placeholder="يمين"
            className="flex-1 px-3 py-2 rounded-lg border border-input bg-background" />
          <span>↔</span>
          <input value={right[i]} onChange={(e) => upd("right", i, e.target.value)} placeholder="يسار"
            className="flex-1 px-3 py-2 rounded-lg border border-input bg-background" />
          {left.length > 2 && <button onClick={() => rm(i)}><Trash2 className="w-4 h-4 text-muted-foreground" /></button>}
        </div>
      ))}
      <button onClick={add} className="text-sm text-primary inline-flex items-center gap-1"><Plus className="w-4 h-4" /> زوج</button>
    </>
  );
}
function OrderQ({ q, onChange }: any) {
  const [txt, setTxt] = useState((q.correct ?? []).join(" "));
  return (
    <>
      <input value={txt} onChange={(e) => { setTxt(e.target.value); onChange({ correct: e.target.value.split(/\s+/).filter(Boolean) }); }}
        placeholder="الجملة الصحيحة (ستُخلط للطالب)"
        className="w-full px-3 py-2 rounded-lg border border-input bg-background" />
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
            {cards.length > 1 && <button onClick={() => rm(i)} className="text-red-500"><Trash2 className="w-4 h-4" /></button>}
          </div>
          <input value={c.front} onChange={(e) => upd(i, { front: e.target.value })} placeholder="الوجه الأمامي"
            className="w-full px-3 py-2 rounded-lg border border-input bg-background" />
          <input value={c.back} onChange={(e) => upd(i, { back: e.target.value })} placeholder="الوجه الخلفي"
            className="w-full px-3 py-2 rounded-lg border border-input bg-background" />
          <input value={c.image ?? ""} onChange={(e) => upd(i, { image: e.target.value })} placeholder="رابط صورة (اختياري)"
            className="w-full px-3 py-2 rounded-lg border border-input bg-background" />
        </div>
      ))}
      <button onClick={add} className="w-full py-3 rounded-xl border-2 border-dashed border-primary text-primary font-semibold inline-flex items-center justify-center gap-2">
        <Plus className="w-4 h-4" /> بطاقة جديدة
      </button>
    </>
  );
}
