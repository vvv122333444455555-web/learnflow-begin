import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { TUNISIAN_CURRICULUM, type Module, type Exercise, type PairItem } from "@/data/tunisian-curriculum";
import { Check, X, Sparkles, BookOpen, Trophy, RotateCcw, GraduationCap, Puzzle, Type as TypeIcon, ListChecks, BookMarked } from "lucide-react";

export const Route = createFileRoute("/_authenticated/curriculum/tunisian")({
  head: () => ({ meta: [{ title: "بنك المناهج التونسية | LearnFlow" }] }),
  component: TunisianCurriculumPage,
});

function TunisianCurriculumPage() {
  const [gradeId, setGradeId] = useState<"grade5" | "grade6">("grade5");
  const grade = useMemo(() => TUNISIAN_CURRICULUM.find((g) => g.id === gradeId)!, [gradeId]);
  const [activeModuleId, setActiveModuleId] = useState<string>(grade.modules[0].id);
  const activeModule = grade.modules.find((m) => m.id === activeModuleId) ?? grade.modules[0];

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto p-6 sm:p-10" dir="rtl">
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl p-8 text-white mb-8 bg-gradient-to-br from-red-500 via-rose-500 to-orange-400">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/25 text-xs font-semibold mb-3">
            <BookMarked className="w-3.5 h-3.5" /> Curriculum Bank
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-2">🇹🇳 بنك المناهج التونسية</h1>
          <p className="text-white/90 max-w-2xl">
            تمارين إنجليزية تفاعلية مصمَّمة خصيصاً لتلاميذ السنتين الخامسة والسادسة ابتدائي في تونس — مطابقات، اختيارات، ملء فراغات وقراءة.
          </p>
        </div>

        {/* Grade selector */}
        <div className="flex gap-3 mb-6 flex-wrap">
          {TUNISIAN_CURRICULUM.map((g) => (
            <button
              key={g.id}
              onClick={() => {
                setGradeId(g.id);
                setActiveModuleId(g.modules[0].id);
              }}
              className={`px-5 py-3 rounded-2xl font-bold text-sm border-2 transition ${
                gradeId === g.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border hover:border-primary/40"
              }`}
            >
              <span className="text-lg ml-1">{g.emoji}</span> {g.labelAr}
            </button>
          ))}
        </div>

        {/* Module tabs */}
        <div className="grid sm:grid-cols-2 gap-3 mb-8">
          {grade.modules.map((m) => {
            const active = m.id === activeModuleId;
            return (
              <button
                key={m.id}
                onClick={() => setActiveModuleId(m.id)}
                className={`text-right p-4 rounded-2xl border-2 transition ${
                  active ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/30"
                }`}
              >
                <div className={`inline-flex w-11 h-11 rounded-xl items-center justify-center text-2xl mb-2 bg-gradient-to-br ${m.color} text-white`}>
                  {m.emoji}
                </div>
                <div className="font-bold">{m.titleAr}</div>
                <div className="text-xs text-muted-foreground" dir="ltr">{m.title} • {m.exercises.length} exercises</div>
              </button>
            );
          })}
        </div>

        <ModuleView key={activeModule.id} module={activeModule} />
      </div>
    </AppShell>
  );
}

function ModuleView({ module }: { module: Module }) {
  return (
    <div className="space-y-6">
      {module.exercises.map((ex, i) => (
        <ExerciseCard key={i} exercise={ex} accent={module.color} />
      ))}
    </div>
  );
}

function ExerciseCard({ exercise, accent }: { exercise: Exercise; accent: string }) {
  const Icon =
    exercise.kind === "mcq" ? ListChecks : exercise.kind === "blanks" ? TypeIcon : exercise.kind === "pairs" ? Puzzle : BookOpen;
  return (
    <section className="rounded-3xl border border-border bg-card overflow-hidden" style={{ boxShadow: "var(--shadow-soft)" }}>
      <header className={`p-4 text-white bg-gradient-to-r ${accent} flex items-center gap-3`}>
        <Icon className="w-5 h-5" />
        <h3 className="font-bold" dir="ltr">{exercise.title}</h3>
      </header>
      <div className="p-6">
        {exercise.kind === "mcq" && <MCQBlock items={exercise.items} />}
        {exercise.kind === "blanks" && <BlanksBlock items={exercise.items} />}
        {exercise.kind === "pairs" && <PairsBlock items={exercise.items} />}
        {exercise.kind === "reading" && <ReadingBlock passage={exercise.passage} tf={exercise.tf} blanks={exercise.blanks} />}
      </div>
    </section>
  );
}

/* ---------------- MCQ ---------------- */
function MCQBlock({ items }: { items: import("@/data/tunisian-curriculum").MCQItem[] }) {
  const [picks, setPicks] = useState<Record<number, number>>({});
  const [checked, setChecked] = useState(false);
  const score = items.reduce((n, it, i) => n + (picks[i] === it.answer ? 1 : 0), 0);
  return (
    <div className="space-y-5">
      {items.map((it, i) => {
        const pick = picks[i];
        return (
          <div key={i} className="p-4 rounded-xl bg-muted/30 border border-border">
            <p className="font-semibold mb-3" dir="ltr">
              <span className="text-primary">{i + 1}.</span> {it.question}
            </p>
            <div className="grid sm:grid-cols-2 gap-2">
              {it.options.map((opt, j) => {
                const active = pick === j;
                const right = checked && j === it.answer;
                const wrong = checked && active && j !== it.answer;
                return (
                  <button
                    key={j}
                    disabled={checked}
                    onClick={() => setPicks((p) => ({ ...p, [i]: j }))}
                    className={`px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition text-left ${
                      right
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : wrong
                        ? "border-rose-500 bg-rose-50 text-rose-700"
                        : active
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/40"
                    }`}
                    dir="ltr"
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
            {checked && it.explain && (
              <p className="mt-2 text-xs text-muted-foreground" dir="ltr">💡 {it.explain}</p>
            )}
          </div>
        );
      })}
      <ScoreBar checked={checked} score={score} total={items.length} onCheck={() => setChecked(true)} onReset={() => { setChecked(false); setPicks({}); }} />
    </div>
  );
}

/* ---------------- Fill Blanks ---------------- */
function BlanksBlock({ items }: { items: import("@/data/tunisian-curriculum").BlankItem[] }) {
  const [vals, setVals] = useState<Record<number, string>>({});
  const [checked, setChecked] = useState(false);
  const score = items.reduce((n, it, i) => n + ((vals[i] ?? "").trim().toLowerCase() === it.answer.toLowerCase() ? 1 : 0), 0);
  return (
    <div className="space-y-4">
      {items.map((it, i) => {
        const [before, after] = it.sentence.split("___");
        const val = vals[i] ?? "";
        const ok = checked && val.trim().toLowerCase() === it.answer.toLowerCase();
        const bad = checked && !ok;
        return (
          <div key={i} className="p-4 rounded-xl bg-muted/30 border border-border">
            <p className="text-lg" dir="ltr">
              <span className="text-primary font-bold ml-1">{i + 1}.</span> {before}
              <input
                value={val}
                disabled={checked}
                onChange={(e) => setVals((v) => ({ ...v, [i]: e.target.value }))}
                className={`inline-block mx-2 px-3 py-1 rounded-md border-2 min-w-[120px] text-center font-semibold ${
                  ok ? "border-emerald-500 bg-emerald-50" : bad ? "border-rose-500 bg-rose-50" : "border-primary/40 bg-background"
                }`}
                placeholder={it.hint ?? "____"}
              />
              {after}
            </p>
            {bad && (
              <p className="text-xs text-rose-600 mt-2" dir="ltr">✔ Correct answer: <b>{it.answer}</b></p>
            )}
          </div>
        );
      })}
      <ScoreBar checked={checked} score={score} total={items.length} onCheck={() => setChecked(true)} onReset={() => { setChecked(false); setVals({}); }} />
    </div>
  );
}

/* ---------------- Matching Pairs ---------------- */
function PairsBlock({ items }: { items: PairItem[] }) {
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [matched, setMatched] = useState<Record<number, number>>({}); // leftIdx -> rightIdx
  const [wrong, setWrong] = useState<{ l: number; r: number } | null>(null);
  const rights = useMemo(() => {
    const arr = items.map((it, i) => ({ ...it, origIdx: i }));
    return arr.sort(() => Math.random() - 0.5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);
  const allDone = Object.keys(matched).length === items.length;

  const pickRight = (rightOrig: number) => {
    if (selectedLeft == null) return;
    if (rightOrig === selectedLeft) {
      setMatched((m) => ({ ...m, [selectedLeft]: rightOrig }));
      setSelectedLeft(null);
      setWrong(null);
    } else {
      setWrong({ l: selectedLeft, r: rightOrig });
      setTimeout(() => setWrong(null), 600);
    }
  };

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-4">اضغط على كلمة من اليسار ثم على تعريفها المطابق من اليمين.</p>
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          {items.map((it, i) => {
            const done = matched[i] != null;
            const active = selectedLeft === i;
            const shake = wrong?.l === i;
            return (
              <button
                key={i}
                disabled={done}
                onClick={() => setSelectedLeft(active ? null : i)}
                className={`w-full px-4 py-3 rounded-xl border-2 font-bold text-left transition ${
                  done
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 opacity-70"
                    : active
                    ? "border-primary bg-primary/10 scale-[1.02]"
                    : "border-border bg-card hover:border-primary/40"
                } ${shake ? "animate-pulse border-rose-500" : ""}`}
                dir="ltr"
              >
                <span className="text-xl ml-2">{it.emoji}</span> {it.left}
                {done && <Check className="w-4 h-4 inline float-right text-emerald-600" />}
              </button>
            );
          })}
        </div>
        <div className="space-y-2">
          {rights.map((r) => {
            const done = matched[r.origIdx] != null;
            const shake = wrong?.r === r.origIdx;
            return (
              <button
                key={r.origIdx}
                disabled={done || selectedLeft == null}
                onClick={() => pickRight(r.origIdx)}
                className={`w-full px-4 py-3 rounded-xl border-2 text-sm text-left transition ${
                  done
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 opacity-70"
                    : "border-border bg-card hover:border-primary/40 disabled:opacity-50"
                } ${shake ? "border-rose-500 bg-rose-50" : ""}`}
                dir="ltr"
              >
                {r.right}
              </button>
            );
          })}
        </div>
      </div>
      {allDone && (
        <div className="mt-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold flex items-center gap-2">
          <Trophy className="w-5 h-5" /> رائع! لقد طابقت جميع الأزواج بنجاح 🎉
          <button
            onClick={() => setMatched({})}
            className="mr-auto text-xs font-medium underline flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" /> إعادة
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------------- Reading ---------------- */
function ReadingBlock({
  passage,
  tf,
  blanks,
}: {
  passage: string;
  tf: import("@/data/tunisian-curriculum").TFItem[];
  blanks: import("@/data/tunisian-curriculum").BlankItem[];
}) {
  const [tfPicks, setTfPicks] = useState<Record<number, boolean>>({});
  const [vals, setVals] = useState<Record<number, string>>({});
  const [checked, setChecked] = useState(false);
  const tfScore = tf.reduce((n, it, i) => n + (tfPicks[i] === it.answer ? 1 : 0), 0);
  const blankScore = blanks.reduce((n, it, i) => n + ((vals[i] ?? "").trim().toLowerCase() === it.answer.toLowerCase() ? 1 : 0), 0);
  const total = tf.length + blanks.length;
  const score = tfScore + blankScore;

  return (
    <div className="space-y-5">
      <article className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 leading-relaxed text-[15px]" dir="ltr">
        📖 {passage}
      </article>

      <div>
        <h4 className="font-bold mb-2 flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> صح أم خطأ؟</h4>
        <div className="space-y-2">
          {tf.map((t, i) => {
            const pick = tfPicks[i];
            const ok = checked && pick === t.answer;
            const bad = checked && pick != null && pick !== t.answer;
            return (
              <div key={i} className={`p-3 rounded-xl border-2 flex items-center gap-3 ${ok ? "border-emerald-500 bg-emerald-50" : bad ? "border-rose-500 bg-rose-50" : "border-border"}`}>
                <p className="flex-1 text-sm" dir="ltr">{i + 1}. {t.statement}</p>
                <div className="flex gap-1.5">
                  {([true, false] as const).map((v) => (
                    <button
                      key={String(v)}
                      disabled={checked}
                      onClick={() => setTfPicks((p) => ({ ...p, [i]: v }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 ${
                        pick === v ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"
                      }`}
                    >
                      {v ? "True ✓" : "False ✗"}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h4 className="font-bold mb-2 flex items-center gap-2"><TypeIcon className="w-4 h-4 text-primary" /> املأ الفراغ (To Be / To Have)</h4>
        <div className="space-y-2">
          {blanks.map((b, i) => {
            const [before, after] = b.sentence.split("___");
            const val = vals[i] ?? "";
            const ok = checked && val.trim().toLowerCase() === b.answer.toLowerCase();
            const bad = checked && !ok;
            return (
              <p key={i} className="text-sm p-3 rounded-xl bg-muted/30 border border-border" dir="ltr">
                {i + 1}. {before}
                <input
                  value={val}
                  disabled={checked}
                  onChange={(e) => setVals((v) => ({ ...v, [i]: e.target.value }))}
                  className={`inline-block mx-2 px-2 py-0.5 rounded border-2 min-w-[80px] text-center font-semibold ${
                    ok ? "border-emerald-500 bg-emerald-50" : bad ? "border-rose-500 bg-rose-50" : "border-primary/40"
                  }`}
                  placeholder={b.hint ?? "___"}
                />
                {after}
                {bad && <span className="ml-2 text-xs text-rose-600">→ <b>{b.answer}</b></span>}
              </p>
            );
          })}
        </div>
      </div>

      <ScoreBar checked={checked} score={score} total={total} onCheck={() => setChecked(true)} onReset={() => { setChecked(false); setTfPicks({}); setVals({}); }} />
    </div>
  );
}

/* ---------------- Score Bar ---------------- */
function ScoreBar({
  checked, score, total, onCheck, onReset,
}: { checked: boolean; score: number; total: number; onCheck: () => void; onReset: () => void }) {
  const pct = total ? Math.round((score / total) * 100) : 0;
  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
      {!checked ? (
        <button
          onClick={onCheck}
          className="px-6 py-2.5 rounded-xl font-bold text-white inline-flex items-center gap-2"
          style={{ background: "var(--gradient-hero)" }}
        >
          <Check className="w-4 h-4" /> تحقق من الإجابات
        </button>
      ) : (
        <>
          <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold ${
            pct >= 70 ? "bg-emerald-50 text-emerald-700" : pct >= 40 ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"
          }`}>
            {pct >= 70 ? <Trophy className="w-5 h-5" /> : pct >= 40 ? <Sparkles className="w-5 h-5" /> : <X className="w-5 h-5" />}
            نتيجتك: {score} / {total} ({pct}%)
          </div>
          <button onClick={onReset} className="px-4 py-2 rounded-xl border border-border text-sm font-medium inline-flex items-center gap-2 hover:bg-muted">
            <RotateCcw className="w-4 h-4" /> إعادة المحاولة
          </button>
        </>
      )}
    </div>
  );
}

// re-export icon for tree-shake safety
export { GraduationCap };
