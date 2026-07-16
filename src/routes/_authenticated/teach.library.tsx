import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BookOpen, Copy, ArrowRight, Filter } from "lucide-react";
import { useRoleGuard } from "@/hooks/use-role-guard";

export const Route = createFileRoute("/_authenticated/teach/library")({
  component: Library,
});

type Collection = {
  id: string;
  title: string;
  description: string | null;
  language: string;
  track: string;
  level: string;
  topic: string | null;
};
type Template = {
  id: string;
  collection_id: string;
  title: string;
  type: string;
  content: any;
  video_url: string | null;
};

const LANGS = [
  { v: "", l: "كل اللغات" },
  { v: "fr", l: "الفرنسية 🇫🇷" },
  { v: "en", l: "الإنجليزية 🇬🇧" },
  { v: "ar", l: "العربية 🇹🇳" },
  { v: "de", l: "الألمانية 🇩🇪" },
  { v: "it", l: "الإيطالية 🇮🇹" },
];
const TRACKS = [
  { v: "", l: "الكل" },
  { v: "kids", l: "أطفال" },
  { v: "adults", l: "كبار" },
];

function Library() {
  useRoleGuard(["teacher", "admin"]);
  const navigate = useNavigate();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [lang, setLang] = useState("");
  const [track, setTrack] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [cloning, setCloning] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [{ data: c }, { data: t }] = await Promise.all([
        supabase.from("exercise_collections").select("*").order("created_at", { ascending: false }),
        supabase.from("exercise_templates").select("*"),
      ]);
      setCollections((c ?? []) as Collection[]);
      setTemplates((t ?? []) as Template[]);
    })();
  }, []);

  const filtered = useMemo(
    () =>
      collections.filter(
        (c) => (!lang || c.language === lang) && (!track || c.track === track),
      ),
    [collections, lang, track],
  );

  const clone = async (templateId: string) => {
    setCloning(templateId);
    const { data, error } = await supabase.rpc("clone_template_to_exercise", { _template_id: templateId });
    setCloning(null);
    if (error) return toast.error(error.message);
    toast.success("تمّ استنساخ التمرين في مسوداتك ✅");
    navigate({ to: "/teach/dashboard" });
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <header className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-primary" />
          <div>
            <div className="text-xs text-muted-foreground">مكتبة النماذج الجاهزة</div>
            <div className="font-bold">تمارين المنهج التونسي وCEFR</div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6 space-y-5">
        <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-card border">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select value={lang} onChange={(e) => setLang(e.target.value)} className="px-3 py-2 rounded-lg border bg-background text-sm">
            {LANGS.map((l) => <option key={l.v} value={l.v}>{l.l}</option>)}
          </select>
          <select value={track} onChange={(e) => setTrack(e.target.value)} className="px-3 py-2 rounded-lg border bg-background text-sm">
            {TRACKS.map((l) => <option key={l.v} value={l.v}>{l.l}</option>)}
          </select>
          <span className="text-sm text-muted-foreground mr-auto">{filtered.length} مجموعة</span>
        </div>

        {filtered.length === 0 && (
          <div className="p-10 text-center rounded-2xl bg-card border text-muted-foreground">
            لا توجد نماذج مطابقة للفلترة.
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((c) => {
            const items = templates.filter((t) => t.collection_id === c.id);
            const open = openId === c.id;
            return (
              <div key={c.id} className="rounded-2xl bg-card border overflow-hidden">
                <button
                  onClick={() => setOpenId(open ? null : c.id)}
                  className="w-full text-right p-5 hover:bg-muted/50 transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold">{c.title}</div>
                      <div className="text-sm text-muted-foreground mt-1">{c.description}</div>
                      <div className="flex flex-wrap gap-2 mt-2 text-xs">
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary">{c.language.toUpperCase()}</span>
                        <span className="px-2 py-0.5 rounded-full bg-accent/20">{c.track === "kids" ? "أطفال" : "كبار"}</span>
                        <span className="px-2 py-0.5 rounded-full bg-muted">{c.level}</span>
                        {c.topic && <span className="px-2 py-0.5 rounded-full bg-muted">{c.topic}</span>}
                        <span className="px-2 py-0.5 rounded-full bg-muted">{items.length} تمرين</span>
                      </div>
                    </div>
                    <ArrowRight className={`w-4 h-4 mt-1 transition ${open ? "rotate-90" : ""}`} />
                  </div>
                </button>
                {open && (
                  <div className="border-t divide-y">
                    {items.length === 0 && (
                      <div className="p-4 text-sm text-muted-foreground text-center">لا توجد قوالب داخل المجموعة بعد.</div>
                    )}
                    {items.map((t) => (
                      <div key={t.id} className="p-4 flex items-center justify-between gap-3">
                        <div>
                          <div className="font-semibold">{t.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {typeLabel(t.type)}
                            {t.video_url && " · 🎬 يشمل فيديو"}
                          </div>
                        </div>
                        <button
                          onClick={() => clone(t.id)}
                          disabled={cloning === t.id}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-50"
                          style={{ background: "var(--gradient-hero)" }}
                        >
                          <Copy className="w-4 h-4" /> استنساخ إلى مسوداتي
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

function typeLabel(t: string) {
  return ({
    mcq: "اختيار من متعدد",
    true_false: "صح أو خطأ",
    fill_blank: "ملء الفراغات",
    matching: "ربط",
    ordering: "ترتيب",
    flashcards: "بطاقات",
  } as Record<string, string>)[t] ?? t;
}
