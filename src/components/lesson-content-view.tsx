import { useState } from "react";
import { Check, X, Sparkles, BookOpen, MessageSquare, GraduationCap } from "lucide-react";
import type { LessonContent } from "@/data/lesson-content";

const KID_GRADIENTS = [
  "from-pink-400 to-rose-500",
  "from-amber-400 to-orange-500",
  "from-emerald-400 to-teal-500",
  "from-sky-400 to-indigo-500",
];

export function LessonContentView({ content }: { content: LessonContent }) {
  const isKids = content.audience === "kids";
  const [picked, setPicked] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const correct = picked === content.quiz.answer;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Title block */}
      <div
        className={`relative overflow-hidden rounded-3xl p-7 text-white ${
          isKids
            ? "bg-gradient-to-br from-fuchsia-500 via-pink-500 to-orange-400"
            : "bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-900"
        }`}
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold mb-3">
          {isKids ? <Sparkles className="w-3.5 h-3.5" /> : <GraduationCap className="w-3.5 h-3.5" />}
          {isKids ? "Kids Zone • 6th Grade" : "Adults Hub • Professional"}
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold mb-2" dir="ltr">{content.title}</h2>
        {content.subtitle && <p className="text-white/85">{content.subtitle}</p>}
        <p className="text-white/90 mt-3 leading-relaxed">{content.intro}</p>
      </div>

      {/* Vocabulary flashcards (kids) */}
      {content.vocabulary && (
        <section className="p-6 rounded-2xl bg-card border border-border" style={{ boxShadow: "var(--shadow-soft)" }}>
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" /> المفردات الجديدة
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {content.vocabulary.map((v, i) => (
              <div
                key={v.word}
                className={`group rounded-2xl p-4 text-white bg-gradient-to-br ${KID_GRADIENTS[i % KID_GRADIENTS.length]} transition-transform hover:-translate-y-1`}
                style={{ boxShadow: "var(--shadow-soft)" }}
              >
                <div className="text-4xl mb-2">{v.emoji}</div>
                <div className="text-lg font-extrabold tracking-tight" dir="ltr">{v.word}</div>
                <div className="text-xs text-white/90 mt-1">{v.meaning}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Dialogue (adults) */}
      {content.dialogue && (
        <section className="p-6 rounded-2xl bg-card border border-border" style={{ boxShadow: "var(--shadow-soft)" }}>
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" /> {content.dialogue.title}
          </h3>
          <div className="space-y-3" dir="ltr">
            {content.dialogue.lines.map((line, i) => {
              const isFirst = i % 2 === 0;
              return (
                <div key={i} className={`flex gap-3 ${isFirst ? "" : "flex-row-reverse"}`}>
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0 ${
                      isFirst ? "bg-indigo-600" : "bg-emerald-600"
                    }`}
                  >
                    {line.speaker[0]}
                  </div>
                  <div className={`max-w-[80%] p-3 rounded-2xl ${isFirst ? "bg-muted rounded-tl-sm" : "bg-primary/10 rounded-tr-sm"}`}>
                    <div className="text-xs font-semibold text-muted-foreground mb-0.5">{line.speaker}</div>
                    <div className="text-sm leading-relaxed">{line.text}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Grammar focus */}
      <section className="p-6 rounded-2xl border-2 border-primary/30 bg-primary/5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold mb-3">
          Grammar Focus
        </div>
        <h3 className="text-lg font-bold mb-2" dir="ltr">{content.grammar.title}</h3>
        <p className="text-sm text-foreground/80 leading-relaxed mb-3">{content.grammar.explanation}</p>
        <ul className="space-y-1.5">
          {content.grammar.examples.map((ex) => (
            <li key={ex} className="flex items-start gap-2 text-sm" dir="ltr">
              <span className="text-primary mt-0.5">•</span>
              <span>{ex}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Mini quiz */}
      <section className="p-6 rounded-2xl bg-card border border-border" style={{ boxShadow: "var(--shadow-soft)" }}>
        <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" /> تمرين سريع
        </h3>
        <p className="text-sm text-muted-foreground mb-4">{content.quiz.prompt}</p>
        <p className="text-xl font-semibold mb-5 text-center p-4 rounded-xl bg-muted" dir="ltr">
          {content.quiz.sentence.split("___")[0]}
          <span className="inline-block min-w-[80px] mx-1 px-3 py-1 rounded-md border-2 border-dashed border-primary/50 align-middle text-primary">
            {checked && picked != null ? content.quiz.options[picked] : "___"}
          </span>
          {content.quiz.sentence.split("___")[1]}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          {content.quiz.options.map((opt, i) => {
            const active = picked === i;
            const showRight = checked && i === content.quiz.answer;
            const showWrong = checked && active && !correct;
            return (
              <button
                key={opt}
                onClick={() => {
                  if (checked) return;
                  setPicked(i);
                }}
                className={`px-4 py-3 rounded-xl font-semibold border-2 transition-all ${
                  showRight
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : showWrong
                    ? "border-rose-500 bg-rose-50 text-rose-700"
                    : active
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/40 bg-background"
                }`}
                dir="ltr"
              >
                {opt}
              </button>
            );
          })}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <button
            onClick={() => setChecked(true)}
            disabled={picked == null || checked}
            className="px-5 py-2.5 rounded-xl font-semibold text-primary-foreground inline-flex items-center gap-2 disabled:opacity-40"
            style={{ background: "var(--gradient-hero)" }}
          >
            <Check className="w-4 h-4" /> تحقق من إجابتي
          </button>
          {checked && (
            <div
              className={`flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg ${
                correct ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
              }`}
            >
              {correct ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
              {correct ? "إجابة صحيحة! " : "إجابة غير صحيحة. "}
              <span className="font-normal">{content.quiz.explanation}</span>
            </div>
          )}
          {checked && (
            <button
              onClick={() => {
                setChecked(false);
                setPicked(null);
              }}
              className="text-sm text-muted-foreground hover:text-foreground underline"
            >
              إعادة المحاولة
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
