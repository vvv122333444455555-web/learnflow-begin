import { useMemo, useState } from "react";
import { EmbeddedVideo } from "@/components/embedded-video";

export type Exercise = { id: string; title: string; type: string; content: any; video_url?: string | null };

export function ExercisePlayer({ ex, onSubmit, palette = "adult" }: {
  ex: Exercise;
  onSubmit: (answers: Record<string, any>) => void;
  palette?: "adult" | "kid";
}) {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const set = (i: number, v: any) => setAnswers(a => ({ ...a, [String(i)]: v }));

  const primary = palette === "kid" ? "linear-gradient(135deg,#FF6B9D,#FEC260)" : "var(--gradient-hero)";
  const accent = palette === "kid" ? "border-pink-500 bg-pink-50" : "border-primary bg-primary/5";

  const render = () => {
    if (ex.type === "mcq") {
      const qs = ex.content?.questions ?? [];
      return qs.map((q: any, i: number) => (
        <Card key={i} n={i + 1} q={q.question}>
          {q.options.map((o: string, oi: number) => (
            <label key={oi} className={`block p-3 rounded-xl border-2 cursor-pointer transition ${answers[i] === oi ? accent : "border-border"}`}>
              <input type="radio" className="ml-2" checked={answers[i] === oi} onChange={() => set(i, oi)}/>{o}
            </label>
          ))}
        </Card>
      ));
    }

    if (ex.type === "true_false") {
      const qs = ex.content?.questions ?? [];
      return qs.map((q: any, i: number) => (
        <Card key={i} n={i + 1} q={q.statement}>
          <div className="grid grid-cols-2 gap-3">
            {[{ v: true, l: "صحيح ✓" }, { v: false, l: "خطأ ✗" }].map(o => (
              <button key={String(o.v)} type="button" onClick={() => set(i, o.v)}
                className={`p-3 rounded-xl border-2 font-semibold ${answers[i] === o.v ? accent : "border-border"}`}>{o.l}</button>
            ))}
          </div>
        </Card>
      ));
    }

    if (ex.type === "fill_blank") {
      const qs = ex.content?.questions ?? [];
      return qs.map((q: any, i: number) => {
        const parts = String(q.text || "").split("___");
        const arr: string[] = answers[i] ?? Array(q.blanks?.length ?? Math.max(parts.length - 1, 0)).fill("");
        return (
          <Card key={i} n={i + 1}>
            <div className="flex flex-wrap items-center gap-2 leading-loose">
              {parts.map((p, pi) => (
                <span key={pi} className="inline-flex items-center gap-2">
                  <span>{p}</span>
                  {pi < parts.length - 1 && (
                    <input value={arr[pi] ?? ""}
                      onChange={(e) => { const c = [...arr]; c[pi] = e.target.value; set(i, c); }}
                      className="inline-block w-32 px-2 py-1 rounded border-2 border-dashed border-primary bg-background"/>
                  )}
                </span>
              ))}
            </div>
          </Card>
        );
      });
    }

    if (ex.type === "matching") {
      const qs = ex.content?.questions ?? [];
      return qs.map((q: any, i: number) => {
        const left: string[] = q.left ?? [];
        const right: string[] = q.right ?? [];
        const sel: number[] = answers[i] ?? Array(left.length).fill(-1);
        return (
          <Card key={i} n={i + 1} q="اربط بين العمودين:">
            <div className="space-y-2">
              {left.map((l, li) => (
                <div key={li} className="flex items-center gap-2">
                  <span className="flex-1 p-2 rounded-lg bg-muted">{l}</span>
                  <span>←</span>
                  <select value={sel[li] ?? -1} onChange={(e) => { const c = [...sel]; c[li] = +e.target.value; set(i, c); }}
                    className="flex-1 p-2 rounded-lg border border-input bg-background">
                    <option value={-1}>— اختر —</option>
                    {right.map((r, ri) => <option key={ri} value={ri}>{r}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </Card>
        );
      });
    }

    if (ex.type === "ordering") {
      const qs = ex.content?.questions ?? [];
      return qs.map((q: any, i: number) => <OrderingQ key={i} n={i + 1} words={q.correct ?? []} value={answers[i]} onChange={(v) => set(i, v)}/>);
    }

    if (ex.type === "flashcards") {
      const cards = ex.content?.cards ?? [];
      return <FlashcardsView cards={cards}/>;
    }

    return <div className="text-muted-foreground">نوع غير مدعوم بعد</div>;
  };

  return (
    <div className="space-y-4">
      {ex.video_url && <EmbeddedVideo url={ex.video_url} />}
      {render()}
      <button onClick={() => onSubmit(answers)}
        className="w-full py-3 rounded-xl text-white font-bold text-lg" style={{ background: primary }}>
        إرسال ✨
      </button>
    </div>
  );
}

function Card({ n, q, children }: { n: number; q?: string; children: React.ReactNode }) {
  return (
    <div className="bg-card p-5 rounded-2xl shadow border">
      <div className="text-xs text-muted-foreground mb-1">سؤال {n}</div>
      {q && <div className="font-bold mb-3">{q}</div>}
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function OrderingQ({ n, words, value, onChange }: { n: number; words: string[]; value?: string[]; onChange: (v: string[]) => void }) {
  const shuffled = useMemo(() => [...words].sort(() => Math.random() - 0.5), [words]);
  const picked: string[] = value ?? [];
  const available = shuffled.filter(w => picked.filter(p => p === w).length < shuffled.filter(x => x === w).length);
  return (
    <Card n={n} q="رتّب الكلمات:">
      <div className="min-h-12 p-3 rounded-xl border-2 border-dashed flex flex-wrap gap-2 mb-2">
        {picked.map((w, i) => (
          <button key={i} onClick={() => onChange(picked.filter((_, x) => x !== i))}
            className="px-3 py-1 rounded-lg bg-primary text-primary-foreground">{w} ×</button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {available.map((w, i) => (
          <button key={i} onClick={() => onChange([...picked, w])}
            className="px-3 py-1 rounded-lg border-2 border-border hover:border-primary">{w}</button>
        ))}
      </div>
    </Card>
  );
}

function FlashcardsView({ cards }: { cards: any[] }) {
  const [i, setI] = useState(0);
  const [flip, setFlip] = useState(false);
  if (!cards.length) return <div>لا توجد بطاقات</div>;
  const c = cards[i];
  return (
    <div className="bg-card p-8 rounded-2xl shadow border text-center">
      <div className="text-xs text-muted-foreground mb-2">{i + 1} / {cards.length}</div>
      <button onClick={() => setFlip(f => !f)} className="w-full min-h-40 flex items-center justify-center text-3xl font-bold p-6 rounded-xl bg-muted">
        {flip ? c.back : c.front}
      </button>
      {c.image && <img src={c.image} alt="" className="mx-auto mt-3 max-h-40 rounded-lg"/>}
      <div className="flex justify-between mt-4">
        <button onClick={() => { setFlip(false); setI(Math.max(0, i - 1)); }} disabled={i === 0} className="px-4 py-2 rounded-lg border">السابق</button>
        <button onClick={() => setFlip(f => !f)} className="px-4 py-2 rounded-lg border">قلب</button>
        <button onClick={() => { setFlip(false); setI(Math.min(cards.length - 1, i + 1)); }} disabled={i === cards.length - 1} className="px-4 py-2 rounded-lg border">التالي</button>
      </div>
    </div>
  );
}
