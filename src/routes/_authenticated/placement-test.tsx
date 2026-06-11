import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Sparkles, Trophy, BookOpen, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/placement-test")({
  head: () => ({
    meta: [
      { title: "اختبار تحديد المستوى | منصة اللغات" },
      { name: "description", content: "اختبار قصير لتحديد مستواك في الإنجليزية أو الفرنسية أو الألمانية وترشيح أنسب دورة لك." },
    ],
  }),
  component: PlacementTestPage,
});

type Lang = "en" | "fr" | "de";

const LANGS: { code: Lang; name: string; flag: string; gradient: string }[] = [
  { code: "en", name: "الإنجليزية", flag: "🇬🇧", gradient: "from-blue-500 to-indigo-600" },
  { code: "fr", name: "الفرنسية", flag: "🇫🇷", gradient: "from-rose-500 to-pink-600" },
  { code: "de", name: "الألمانية", flag: "🇩🇪", gradient: "from-amber-500 to-orange-600" },
];

type Q = { q: string; options: string[]; answer: number; level: "A1" | "A2" | "B1" | "B2" | "C1" };

const QUESTIONS: Record<Lang, Q[]> = {
  en: [
    {
      q: "Choose the correct word: 'The children are playing with their _______ in the garden.'",
      options: ["cars", "toys", "books", "tables"],
      answer: 1,
      level: "A1",
    },
    {
      q: "Look! Ahmed _______ his homework right now.",
      options: ["is doing", "does", "did", "has done"],
      answer: 0,
      level: "A2",
    },
    {
      q: "Tunis is _______ than Medenine.",
      options: ["big", "bigger", "biggest", "more big"],
      answer: 1,
      level: "A2",
    },
    {
      q: "Read: 'Sarah is 11 years old. She loves swimming and goes to the pool every Sunday.' — When does Sarah go swimming?",
      options: ["On Fridays", "Every day", "On Sundays", "Never"],
      answer: 2,
      level: "B1",
    },
    {
      q: "If I _______ more time, I would join the LearnFlow live session.",
      options: ["have", "had", "will have", "having"],
      answer: 1,
      level: "B1",
    },
  ],
  fr: [
    { q: "___ m'appelle Marc.", options: ["Je", "Tu", "Il", "Me"], answer: 0, level: "A1" },
    { q: "Nous ___ le français.", options: ["parle", "parles", "parlons", "parlent"], answer: 2, level: "A1" },
    { q: "Hier, j'___ au cinéma.", options: ["vais", "suis allé", "irai", "allais"], answer: 1, level: "A2" },
    { q: "Si j'avais le temps, je ___ avec toi.", options: ["viens", "viendrai", "viendrais", "venais"], answer: 2, level: "B1" },
    { q: "Il faut que tu ___ tout de suite.", options: ["pars", "partes", "partiras", "partais"], answer: 1, level: "B2" },
    { q: "À peine ___ qu'il s'est mis à pleuvoir.", options: ["je suis sorti", "étais-je sorti", "j'étais sorti", "je sortais"], answer: 1, level: "C1" },
  ],
  de: [
    { q: "Wie ___ du?", options: ["heißt", "heiße", "heißen", "heißt"], answer: 0, level: "A1" },
    { q: "Ich komme ___ Deutschland.", options: ["von", "aus", "in", "zu"], answer: 1, level: "A1" },
    { q: "Gestern ___ ich ins Kino gegangen.", options: ["habe", "bin", "war", "hatte"], answer: 1, level: "A2" },
    { q: "Wenn ich Zeit ___, würde ich kommen.", options: ["habe", "hätte", "haben", "hatte"], answer: 1, level: "B1" },
    { q: "Das Buch, ___ ich gelesen habe, war spannend.", options: ["der", "die", "das", "den"], answer: 2, level: "B2" },
    { q: "___ des schlechten Wetters fand das Fest statt.", options: ["Wegen", "Trotz", "Während", "Statt"], answer: 1, level: "C1" },
  ],
};

const LEVEL_INFO: Record<string, { title: string; desc: string; recommend: string }> = {
  A1: { title: "مبتدئ", desc: "تعرف الأساسيات وعبارات بسيطة جدًا.", recommend: "باقة المبتدئين — تأسيس قوي من الصفر." },
  A2: { title: "ما قبل المتوسط", desc: "تتواصل في مواقف يومية بسيطة.", recommend: "باقة A2 — توسيع المفردات وبناء الجمل." },
  B1: { title: "متوسط", desc: "تتعامل مع معظم المواقف اليومية.", recommend: "باقة B1 — محادثة وقراءة متوسطة." },
  B2: { title: "فوق المتوسط", desc: "تناقش مواضيع معقدة بثقة.", recommend: "باقة B2 — إتقان القواعد المتقدمة." },
  C1: { title: "متقدّم", desc: "تتحدث بطلاقة في سياقات مهنية.", recommend: "باقة C1 — صقل الأسلوب والكتابة الأكاديمية." },
};

function PlacementTestPage() {
  const navigate = useNavigate();
  const [lang, setLang] = useState<Lang | null>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);

  const questions = lang ? QUESTIONS[lang] : [];
  const langInfo = LANGS.find((l) => l.code === lang);

  const result = useMemo(() => {
    if (!finished || !lang) return null;
    let correct = 0;
    const correctLevels: string[] = [];
    questions.forEach((q, i) => {
      if (answers[i] === q.answer) {
        correct++;
        correctLevels.push(q.level);
      }
    });
    const order = ["A1", "A2", "B1", "B2", "C1"];
    let highest = "A1";
    for (const lv of order) if (correctLevels.includes(lv)) highest = lv;
    if (correct === 0) highest = "A1";
    // English uses the simple LearnFlow scoring band (5 questions):
    // 1-2 → A1, 3-4 → A2, 5 → B1
    if (lang === "en") {
      if (correct <= 2) highest = "A1";
      else if (correct <= 4) highest = "A2";
      else highest = "B1";
    }
    return { correct, total: questions.length, level: highest };
  }, [finished, answers, questions, lang]);

  const pick = (i: number) => {
    const next = [...answers];
    next[step] = i;
    setAnswers(next);
  };

  const goNext = () => {
    if (step < questions.length - 1) setStep(step + 1);
    else setFinished(true);
  };

  const reset = () => {
    setLang(null);
    setStep(0);
    setAnswers([]);
    setFinished(false);
  };

  const saveLevel = async () => {
    if (!result) return;
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) {
      navigate({ to: "/auth" });
      return;
    }
    const { error } = await supabase.from("profiles").update({ level: result.level }).eq("id", u.user.id);
    setSaving(false);
    if (error) {
      toast.error("تعذّر الحفظ");
      return;
    }
    toast.success(`تم حفظ مستواك: ${result.level}`);
    navigate({ to: "/courses" });
  };

  // Language selection
  if (!lang) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <div className="h-2 w-full" style={{ background: "var(--gradient-hero)" }} />
        <div className="max-w-4xl mx-auto px-6 py-12">
          <button onClick={() => navigate({ to: "/dashboard" })} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
            <ArrowLeft className="w-4 h-4" /> رجوع
          </button>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/15 text-accent-foreground text-xs font-medium mb-4">
            <Sparkles className="w-3.5 h-3.5" /> اختبار تحديد المستوى
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-3">اختر اللغة لبدء الاختبار</h1>
          <p className="text-lg text-muted-foreground mb-10">٦ أسئلة قصيرة فقط لتقدير مستواك واقتراح الدورة المناسبة.</p>

          <div className="grid sm:grid-cols-3 gap-5">
            {LANGS.map((l) => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                className="group p-8 rounded-3xl border-2 border-border hover:border-primary bg-card text-right transition-all hover:-translate-y-1"
                style={{ boxShadow: "var(--shadow-soft)" }}
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${l.gradient} flex items-center justify-center text-3xl mb-4`}>
                  {l.flag}
                </div>
                <h3 className="text-2xl font-bold mb-1">{l.name}</h3>
                <p className="text-sm text-muted-foreground">ابدأ الاختبار الآن</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Results
  if (finished && result) {
    const info = LEVEL_INFO[result.level];
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <div className="h-2 w-full" style={{ background: "var(--gradient-hero)" }} />
        <div className="max-w-3xl mx-auto px-6 py-12">
          <div className="rounded-3xl overflow-hidden border border-border bg-card" style={{ boxShadow: "var(--shadow-elegant)" }}>
            <div className="p-10 text-center text-primary-foreground" style={{ background: "var(--gradient-hero)" }}>
              <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-5">
                <Trophy className="w-10 h-10" />
              </div>
              <p className="text-sm opacity-90 mb-2">مستواك التقديري في {langInfo?.name}</p>
              <div className="text-7xl font-black tracking-tight mb-3">{result.level}</div>
              <p className="text-xl font-semibold">{info.title}</p>
              <p className="opacity-90 mt-2">{info.desc}</p>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-5 rounded-2xl bg-muted text-center">
                  <div className="text-3xl font-bold text-foreground">{result.correct}/{result.total}</div>
                  <div className="text-sm text-muted-foreground mt-1">إجابات صحيحة</div>
                </div>
                <div className="p-5 rounded-2xl bg-muted text-center">
                  <div className="text-3xl font-bold text-foreground">{Math.round((result.correct / result.total) * 100)}%</div>
                  <div className="text-sm text-muted-foreground mt-1">نسبة الدقة</div>
                </div>
              </div>

              <div className="p-6 rounded-2xl border-2 border-primary/30 bg-primary/5 mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold mb-1">الباقة الموصى بها</p>
                    <p className="text-sm text-muted-foreground">{info.recommend}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={saveLevel}
                  disabled={saving}
                  className="flex-1 px-6 py-3 rounded-xl font-semibold text-primary-foreground inline-flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ background: "var(--gradient-hero)", boxShadow: "var(--shadow-elegant)" }}
                >
                  <Check className="w-4 h-4" /> احفظ مستواي واستعرض الدورات
                </button>
                <button onClick={reset} className="px-6 py-3 rounded-xl font-semibold border-2 border-border hover:bg-muted inline-flex items-center justify-center gap-2">
                  <RotateCcw className="w-4 h-4" /> إعادة الاختبار
                </button>
              </div>

              <Link to="/dashboard" className="block text-center text-sm text-muted-foreground hover:text-foreground mt-4">العودة إلى الرئيسية</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Question step
  const q = questions[step];
  const picked = answers[step];
  const progress = ((step + (picked != null ? 1 : 0)) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="h-2 w-full bg-muted">
        <div className="h-full transition-all" style={{ width: `${progress}%`, background: "var(--gradient-hero)" }} />
      </div>
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <button onClick={reset} className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm">
            <ArrowLeft className="w-4 h-4" /> تغيير اللغة
          </button>
          <span className="text-sm text-muted-foreground">السؤال {step + 1} من {questions.length}</span>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${langInfo?.gradient} flex items-center justify-center text-2xl`}>
            {langInfo?.flag}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{langInfo?.name}</p>
            <p className="font-semibold">اختر الإجابة الصحيحة</p>
          </div>
        </div>

        <div className="p-8 rounded-3xl border border-border bg-card mb-6" style={{ boxShadow: "var(--shadow-soft)" }}>
          <h2 className="text-2xl font-bold mb-6 leading-relaxed" dir="auto">{q.q}</h2>
          <div className="space-y-3">
            {q.options.map((opt, i) => {
              const active = picked === i;
              return (
                <button
                  key={i}
                  onClick={() => pick(i)}
                  className={`w-full p-4 rounded-2xl border-2 text-right transition-all flex items-center justify-between ${
                    active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 bg-background"
                  }`}
                  dir="auto"
                >
                  <span className="font-medium">{opt}</span>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${active ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>
                    {active && <Check className="w-3.5 h-3.5" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={goNext}
          disabled={picked == null}
          className="w-full px-6 py-3.5 rounded-xl font-semibold text-primary-foreground inline-flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: "var(--gradient-hero)", boxShadow: "var(--shadow-elegant)" }}
        >
          {step === questions.length - 1 ? "عرض النتيجة" : "السؤال التالي"}
          <ArrowRight className="w-4 h-4 rotate-180" />
        </button>
      </div>
    </div>
  );
}
