import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Download, FileSpreadsheet, MessageSquare, Save, Loader2, ChevronLeft } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export const Route = createFileRoute("/_authenticated/teach/exercise/$id")({
  component: ExerciseResults,
});

type Sub = {
  id: string;
  student_id: string;
  answers: any;
  score: number;
  max_score: number;
  submitted_at: string;
  time_taken_seconds: number | null;
  teacher_feedback: string | null;
};

function ExerciseResults() {
  const { id } = Route.useParams();
  const [ex, setEx] = useState<any>(null);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const load = async () => {
    const { data: e } = await supabase.from("exercises").select("*").eq("id", id).maybeSingle();
    setEx(e);
    const { data: s } = await supabase
      .from("exercise_submissions")
      .select("id, student_id, answers, score, max_score, submitted_at, time_taken_seconds, teacher_feedback")
      .eq("exercise_id", id)
      .order("submitted_at", { ascending: false });
    const rows = (s ?? []) as Sub[];
    setSubs(rows);
    const fb: Record<string, string> = {};
    rows.forEach((r) => { fb[r.id] = r.teacher_feedback ?? ""; });
    setFeedback(fb);
    const ids = Array.from(new Set(rows.map((r) => r.student_id)));
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name, email").in("id", ids);
      setNames(Object.fromEntries((profs ?? []).map((p) => [p.id, p.full_name || p.email || p.id.slice(0, 8)])));
    }
  };

  useEffect(() => { load(); }, [id]);

  const analytics = useMemo(() => {
    if (!ex || !subs.length) return null;
    const avg = subs.reduce((a, s) => a + (s.max_score ? s.score / s.max_score : 0), 0) / subs.length;
    return {
      count: subs.length,
      avg: Math.round(avg * 100),
      best: Math.max(...subs.map((s) => s.max_score ? Math.round((s.score / s.max_score) * 100) : 0)),
    };
  }, [ex, subs]);

  const wrongSummary = (s: Sub): string => {
    if (!ex?.content?.questions) return "—";
    const qs = ex.content.questions as any[];
    const wrong: number[] = [];
    qs.forEach((q, i) => {
      const ans = s.answers?.[String(i)];
      if (ex.type === "mcq") { if (JSON.stringify(ans) !== JSON.stringify(q.correct)) wrong.push(i + 1); }
      else if (ex.type === "true_false") { if (ans !== q.correct) wrong.push(i + 1); }
      else if (ex.type === "fill_blank") {
        const a = Array.isArray(ans) ? ans.map((x: string) => String(x).trim().toLowerCase()) : [];
        const b = (q.blanks ?? []).map((x: string) => String(x).trim().toLowerCase());
        if (JSON.stringify(a) !== JSON.stringify(b)) wrong.push(i + 1);
      } else if (ex.type === "matching" || ex.type === "ordering") {
        if (JSON.stringify(ans) !== JSON.stringify(q.correct)) wrong.push(i + 1);
      }
    });
    return wrong.length ? `أخطأ في: ${wrong.join(", ")}` : "كل شيء صحيح ✓";
  };

  const saveFeedback = async (subId: string) => {
    setSaving(subId);
    const { error } = await supabase
      .from("exercise_submissions")
      .update({ teacher_feedback: feedback[subId] || null })
      .eq("id", subId);
    setSaving(null);
    if (error) return toast.error(error.message);
    toast.success("حُفظت التغذية الراجعة");
    setSubs((prev) => prev.map((s) => s.id === subId ? { ...s, teacher_feedback: feedback[subId] || null } : s));
  };

  const rows = () => subs.map((s) => ({
    student: names[s.student_id] ?? s.student_id.slice(0, 8),
    date: new Date(s.submitted_at).toLocaleString("ar"),
    score: `${s.score}/${s.max_score}`,
    percent: s.max_score ? `${Math.round((s.score / s.max_score) * 100)}%` : "—",
    time: s.time_taken_seconds != null ? `${s.time_taken_seconds}s` : "—",
    wrong: wrongSummary(s),
    feedback: s.teacher_feedback ?? "",
  }));

  const exportPdf = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.text(`Report: ${ex?.title ?? ""}`, 14, 14);
    autoTable(doc, {
      startY: 22,
      head: [["Student", "Date", "Score", "%", "Time", "Wrong Answers", "Feedback"]],
      body: rows().map((r) => [r.student, r.date, r.score, r.percent, r.time, r.wrong, r.feedback]),
      styles: { fontSize: 9 },
    });
    doc.save(`report-${ex?.title ?? id}.pdf`);
  };

  const exportXlsx = () => {
    const ws = XLSX.utils.json_to_sheet(rows());
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `report-${ex?.title ?? id}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-background p-6" dir="rtl">
      <div className="max-w-5xl mx-auto space-y-4">
        <Link to="/teach/dashboard" className="text-sm text-muted-foreground inline-flex items-center gap-1"><ChevronLeft className="w-4 h-4 rotate-180"/> لوحة المعلّم</Link>

        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">{ex?.title || "نتائج التمرين"}</h1>
            <p className="text-xs text-muted-foreground">تحليلات الطلاب والتغذية الراجعة</p>
          </div>
          <div className="flex gap-2">
            <button onClick={exportPdf} disabled={!subs.length} className="px-3 py-2 rounded-lg border text-sm inline-flex items-center gap-1 disabled:opacity-50">
              <Download className="w-4 h-4"/> PDF
            </button>
            <button onClick={exportXlsx} disabled={!subs.length} className="px-3 py-2 rounded-lg border text-sm inline-flex items-center gap-1 disabled:opacity-50">
              <FileSpreadsheet className="w-4 h-4"/> Excel
            </button>
          </div>
        </div>

        {analytics && (
          <div className="grid grid-cols-3 gap-3">
            <Card label="التسليمات" value={analytics.count}/>
            <Card label="المعدّل" value={`${analytics.avg}%`}/>
            <Card label="أعلى نتيجة" value={`${analytics.best}%`}/>
          </div>
        )}

        {subs.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground bg-card border rounded-2xl">لا تسليمات بعد.</div>
        ) : (
          <div className="space-y-3">
            {subs.map((s) => {
              const pct = s.max_score ? Math.round((s.score / s.max_score) * 100) : 0;
              return (
                <div key={s.id} className="p-4 rounded-2xl border bg-card space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <div className="font-semibold">{names[s.student_id] ?? s.student_id.slice(0, 8)}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(s.submitted_at).toLocaleString("ar")}
                        {s.time_taken_seconds != null && <> · ⏱ {s.time_taken_seconds}s</>}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">{s.score}/{s.max_score}</div>
                      <div className={`text-xs font-semibold ${pct >= 70 ? "text-green-600" : pct >= 40 ? "text-orange-600" : "text-red-600"}`}>{pct}%</div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">{wrongSummary(s)}</div>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <MessageSquare className="w-4 h-4 absolute right-3 top-3 text-muted-foreground pointer-events-none"/>
                      <textarea
                        value={feedback[s.id] ?? ""}
                        onChange={(e) => setFeedback((f) => ({ ...f, [s.id]: e.target.value }))}
                        placeholder="اكتب تعليقًا محفزًا للطالب…"
                        rows={2}
                        className="w-full pr-9 pl-3 py-2 rounded-lg border border-input bg-background text-sm"
                      />
                    </div>
                    <button onClick={() => saveFeedback(s.id)} disabled={saving === s.id}
                      className="self-start px-3 py-2 rounded-lg text-white text-sm inline-flex items-center gap-1"
                      style={{ background: "var(--gradient-hero)" }}>
                      {saving === s.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} حفظ
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="p-4 rounded-2xl bg-card border">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
