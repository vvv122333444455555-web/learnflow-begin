import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, Save, Sparkles, ListChecks, Type, Shuffle, Eye, Rocket, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/teach/widgets")({
  head: () => ({ meta: [{ title: "منشئ النشاطات | لوحة المعلّم" }] }),
  beforeLoad: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw redirect({ to: "/auth" });
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id);
    if (!roles?.some((r) => r.role === "teacher")) throw redirect({ to: "/dashboard" });
  },
  component: WidgetBuilderPage,
});

type WidgetType = "multiple_choice" | "fill_blanks" | "matching_pairs";

type MCQ = { question: string; options: { text: string; correct: boolean }[] };
type Blank = { sentence: string; answer: string };
type Pair = { left: string; right: string };

type Content =
  | { type: "multiple_choice"; items: MCQ[] }
  | { type: "fill_blanks"; items: Blank[] }
  | { type: "matching_pairs"; items: Pair[] };

type Language = { id: string; name: string; flag: string | null };
type Widget = {
  id: string;
  title: string;
  description: string | null;
  widget_type: WidgetType;
  content: Content;
  is_published: boolean;
  language_id: string | null;
  created_at: string;
};

const TYPE_META: Record<WidgetType, { label: string; icon: typeof ListChecks; color: string }> = {
  multiple_choice: { label: "اختيار من متعدد", icon: ListChecks, color: "from-blue-500 to-indigo-600" },
  fill_blanks: { label: "ملء الفراغات", icon: Type, color: "from-rose-500 to-pink-600" },
  matching_pairs: { label: "مطابقة الأزواج", icon: Shuffle, color: "from-emerald-500 to-green-600" },
};

function emptyContent(t: WidgetType): Content {
  if (t === "multiple_choice") return { type: t, items: [{ question: "", options: [{ text: "", correct: true }, { text: "", correct: false }] }] };
  if (t === "fill_blanks") return { type: t, items: [{ sentence: "", answer: "" }] };
  return { type: t, items: [{ left: "", right: "" }] };
}

function WidgetBuilderPage() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [type, setType] = useState<WidgetType>("multiple_choice");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [languageId, setLanguageId] = useState<string>("");
  const [content, setContent] = useState<Content>(emptyContent("multiple_choice"));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const [{ data: l }, { data: u }] = await Promise.all([
        supabase.from("languages").select("id, name, flag").order("name"),
        supabase.auth.getUser(),
      ]);
      setLanguages(l ?? []);
      if (u.user) {
        const { data: w } = await supabase
          .from("teacher_widgets")
          .select("*")
          .eq("teacher_id", u.user.id)
          .order("created_at", { ascending: false });
        setWidgets((w as unknown as Widget[]) ?? []);
      }
    })();
  }, []);

  const switchType = (t: WidgetType) => {
    setType(t);
    setContent(emptyContent(t));
  };

  const save = async () => {
    if (!title.trim()) return toast.error("أدخل عنوان النشاط");
    // Validation per type
    if (content.type === "multiple_choice") {
      if (content.items.some((q) => !q.question.trim() || q.options.length < 2 || q.options.some((o) => !o.text.trim()) || !q.options.some((o) => o.correct))) {
        return toast.error("تأكد من إكمال كل سؤال مع إجابة صحيحة واحدة على الأقل");
      }
    } else if (content.type === "fill_blanks") {
      if (content.items.some((b) => !b.sentence.includes("___") || !b.answer.trim())) {
        return toast.error("استخدم ___ في الجملة وأدخل الإجابة");
      }
    } else {
      if (content.items.some((p) => !p.left.trim() || !p.right.trim())) return toast.error("أكمل كل زوج");
    }

    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { data, error } = await supabase
      .from("teacher_widgets")
      .insert({
        teacher_id: u.user.id,
        widget_type: type,
        title: title.trim(),
        description: description.trim() || null,
        language_id: languageId || null,
        content: content as unknown as never,
        is_published: true,
      })
      .select()
      .single();
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("تم نشر النشاط بنجاح!");
    setWidgets((prev) => [data as unknown as Widget, ...prev]);
    setTitle("");
    setDescription("");
    setContent(emptyContent(type));
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("teacher_widgets").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setWidgets((p) => p.filter((w) => w.id !== id));
    toast.success("تم الحذف");
  };

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto p-6 sm:p-10">
        <div className="mb-8 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 grid place-items-center text-white shadow-lg">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">LearnFlow Widget Builder</h1>
            <p className="text-muted-foreground text-sm">صمم نشاطات تفاعلية لطلابك في ثوانٍ</p>
          </div>
        </div>

        {/* Type picker */}
        <div className="grid sm:grid-cols-3 gap-3 mb-6">
          {(Object.keys(TYPE_META) as WidgetType[]).map((t) => {
            const meta = TYPE_META[t];
            const Icon = meta.icon;
            const active = type === t;
            return (
              <button
                key={t}
                onClick={() => switchType(t)}
                className={`p-4 rounded-2xl border-2 text-right transition ${
                  active ? "border-primary bg-primary/5 shadow-md" : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${meta.color} grid place-items-center text-white mb-2`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="font-semibold">{meta.label}</div>
              </button>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Builder form */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <Plus className="w-4 h-4" /> إعداد النشاط
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label>العنوان</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: مراجعة الفصل الأول" />
              </div>
              <div>
                <Label>اللغة</Label>
                <select
                  value={languageId}
                  onChange={(e) => setLanguageId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  <option value="">— عامة —</option>
                  {languages.map((l) => (
                    <option key={l.id} value={l.id}>{l.flag} {l.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <Label>وصف مختصر (اختياري)</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>

            <Editor content={content} setContent={setContent} />

            <Button onClick={save} disabled={saving} className="w-full" size="lg">
              <Rocket className="w-4 h-4" /> {saving ? "جارٍ الحفظ..." : "حفظ ونشر"}
            </Button>
          </Card>

          {/* Live preview */}
          <Card className="p-5 space-y-3 bg-gradient-to-br from-muted/30 to-background">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <Eye className="w-4 h-4" /> معاينة مباشرة
            </div>
            <WidgetPreview title={title || "عنوان النشاط"} content={content} />
          </Card>
        </div>

        {/* Existing */}
        <div className="mt-10">
          <h2 className="text-xl font-bold mb-4">نشاطاتك المنشورة ({widgets.length})</h2>
          {widgets.length === 0 ? (
            <Card className="p-10 text-center text-muted-foreground border-dashed">لا توجد نشاطات بعد. أنشئ نشاطك الأول!</Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {widgets.map((w) => {
                const meta = TYPE_META[w.widget_type];
                const Icon = meta.icon;
                const count = Array.isArray((w.content as { items?: unknown[] })?.items) ? (w.content as { items: unknown[] }).items.length : 0;
                return (
                  <Card key={w.id} className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${meta.color} grid place-items-center text-white`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <button onClick={() => remove(w.id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="font-semibold mb-1">{w.title}</div>
                    <div className="text-xs text-muted-foreground">{meta.label} • {count} عنصر</div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function Editor({ content, setContent }: { content: Content; setContent: (c: Content) => void }) {
  if (content.type === "multiple_choice") {
    return (
      <div className="space-y-4">
        {content.items.map((q, qi) => (
          <div key={qi} className="p-3 rounded-xl border border-border bg-card/50 space-y-2">
            <div className="flex items-center justify-between">
              <Label>السؤال {qi + 1}</Label>
              {content.items.length > 1 && (
                <button onClick={() => setContent({ ...content, items: content.items.filter((_, i) => i !== qi) })}>
                  <Trash2 className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>
            <Input
              value={q.question}
              onChange={(e) => {
                const items = [...content.items];
                items[qi] = { ...q, question: e.target.value };
                setContent({ ...content, items });
              }}
              placeholder="اكتب السؤال هنا"
            />
            <div className="space-y-2">
              {q.options.map((o, oi) => (
                <div key={oi} className="flex items-center gap-2">
                  <Checkbox
                    checked={o.correct}
                    onCheckedChange={(v) => {
                      const items = [...content.items];
                      items[qi] = { ...q, options: q.options.map((op, i) => ({ ...op, correct: i === oi ? !!v : op.correct })) };
                      setContent({ ...content, items });
                    }}
                  />
                  <Input
                    value={o.text}
                    onChange={(e) => {
                      const items = [...content.items];
                      items[qi] = { ...q, options: q.options.map((op, i) => i === oi ? { ...op, text: e.target.value } : op) };
                      setContent({ ...content, items });
                    }}
                    placeholder={`الخيار ${oi + 1}`}
                  />
                  {q.options.length > 2 && (
                    <button onClick={() => {
                      const items = [...content.items];
                      items[qi] = { ...q, options: q.options.filter((_, i) => i !== oi) };
                      setContent({ ...content, items });
                    }}>
                      <Trash2 className="w-4 h-4 text-muted-foreground" />
                    </button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  const items = [...content.items];
                  items[qi] = { ...q, options: [...q.options, { text: "", correct: false }] };
                  setContent({ ...content, items });
                }}
              >
                <Plus className="w-3 h-3" /> إضافة خيار
              </Button>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => setContent({ ...content, items: [...content.items, { question: "", options: [{ text: "", correct: true }, { text: "", correct: false }] }] })}>
          <Plus className="w-4 h-4" /> إضافة سؤال
        </Button>
      </div>
    );
  }
  if (content.type === "fill_blanks") {
    return (
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">استخدم <code className="px-1 bg-muted rounded">___</code> مكان الفراغ.</p>
        {content.items.map((b, i) => (
          <div key={i} className="p-3 rounded-xl border border-border bg-card/50 space-y-2">
            <div className="flex items-center justify-between">
              <Label>الجملة {i + 1}</Label>
              {content.items.length > 1 && (
                <button onClick={() => setContent({ ...content, items: content.items.filter((_, j) => j !== i) })}>
                  <Trash2 className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>
            <Input
              value={b.sentence}
              onChange={(e) => {
                const items = [...content.items];
                items[i] = { ...b, sentence: e.target.value };
                setContent({ ...content, items });
              }}
              placeholder="The cat ___ on the mat."
            />
            <Input
              value={b.answer}
              onChange={(e) => {
                const items = [...content.items];
                items[i] = { ...b, answer: e.target.value };
                setContent({ ...content, items });
              }}
              placeholder="الإجابة الصحيحة"
            />
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => setContent({ ...content, items: [...content.items, { sentence: "", answer: "" }] })}>
          <Plus className="w-4 h-4" /> إضافة جملة
        </Button>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {content.items.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input
            value={p.left}
            onChange={(e) => {
              const items = [...content.items];
              items[i] = { ...p, left: e.target.value };
              setContent({ ...content, items });
            }}
            placeholder="العنصر"
          />
          <span className="text-muted-foreground">↔</span>
          <Input
            value={p.right}
            onChange={(e) => {
              const items = [...content.items];
              items[i] = { ...p, right: e.target.value };
              setContent({ ...content, items });
            }}
            placeholder="المطابق"
          />
          {content.items.length > 1 && (
            <button onClick={() => setContent({ ...content, items: content.items.filter((_, j) => j !== i) })}>
              <Trash2 className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
      ))}
      <Button type="button" variant="outline" onClick={() => setContent({ ...content, items: [...content.items, { left: "", right: "" }] })}>
        <Plus className="w-4 h-4" /> إضافة زوج
      </Button>
    </div>
  );
}

function WidgetPreview({ title, content }: { title: string; content: Content }) {
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [blanks, setBlanks] = useState<Record<number, string>>({});
  const [matches, setMatches] = useState<Record<number, string>>({});
  const rights = useMemo(() => (content.type === "matching_pairs" ? [...content.items.map((p) => p.right)].sort(() => Math.random() - 0.5) : []), [content]);

  return (
    <div className="rounded-2xl bg-card p-5 border border-border">
      <div className="font-bold text-lg mb-4">{title}</div>
      {content.type === "multiple_choice" && (
        <div className="space-y-4">
          {content.items.map((q, qi) => (
            <div key={qi}>
              <div className="font-medium mb-2">{qi + 1}. {q.question || <span className="text-muted-foreground">سؤال...</span>}</div>
              <div className="grid grid-cols-2 gap-2">
                {q.options.map((o, oi) => {
                  const picked = selected[qi] === oi;
                  const reveal = picked;
                  const ok = o.correct;
                  return (
                    <button
                      key={oi}
                      onClick={() => setSelected({ ...selected, [qi]: oi })}
                      className={`p-2 text-sm rounded-lg border text-right transition ${
                        reveal ? (ok ? "bg-emerald-500/15 border-emerald-500" : "bg-red-500/15 border-red-500") : "border-border hover:bg-muted"
                      }`}
                    >
                      {o.text || <span className="text-muted-foreground">خيار {oi + 1}</span>}
                      {reveal && ok && <CheckCircle2 className="inline w-3.5 h-3.5 ml-1 text-emerald-600" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
      {content.type === "fill_blanks" && (
        <div className="space-y-3">
          {content.items.map((b, i) => {
            const v = blanks[i] ?? "";
            const ok = v.trim().toLowerCase() === b.answer.trim().toLowerCase();
            const parts = (b.sentence || "___").split("___");
            return (
              <div key={i} className="text-sm">
                <span>{parts[0]}</span>
                <input
                  value={v}
                  onChange={(e) => setBlanks({ ...blanks, [i]: e.target.value })}
                  className={`mx-1 px-2 py-0.5 rounded border outline-none ${v ? (ok ? "border-emerald-500 bg-emerald-500/10" : "border-red-500 bg-red-500/10") : "border-border"}`}
                  style={{ width: 100 }}
                />
                <span>{parts[1] ?? ""}</span>
              </div>
            );
          })}
        </div>
      )}
      {content.type === "matching_pairs" && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            {content.items.map((p, i) => (
              <div key={i} className="p-2 rounded-lg bg-muted text-sm">{p.left || `عنصر ${i + 1}`}</div>
            ))}
          </div>
          <div className="space-y-2">
            {content.items.map((p, i) => (
              <select
                key={i}
                value={matches[i] ?? ""}
                onChange={(e) => setMatches({ ...matches, [i]: e.target.value })}
                className={`w-full p-2 rounded-lg border text-sm ${matches[i] ? (matches[i] === p.right ? "border-emerald-500 bg-emerald-500/10" : "border-red-500 bg-red-500/10") : "border-border"}`}
              >
                <option value="">اختر...</option>
                {rights.map((r, ri) => <option key={ri} value={r}>{r}</option>)}
              </select>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
