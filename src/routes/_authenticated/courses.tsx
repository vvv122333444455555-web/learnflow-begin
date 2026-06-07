import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { CourseCard } from "./dashboard";
import { Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/courses")({
  head: () => ({ meta: [{ title: "الدورات | منصة اللغات" }] }),
  component: CoursesPage,
});

type Language = { id: string; name: string; flag: string | null };
type Course = {
  id: string;
  title: string;
  description: string | null;
  level: string;
  language_id: string;
  duration_weeks: number;
  lessons_count: number;
  languages: { name: string; flag: string | null } | null;
};

const LEVELS = ["all", "A1", "A2", "B1", "B2", "C1", "C2"] as const;

function CoursesPage() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [lang, setLang] = useState<string>("all");
  const [level, setLevel] = useState<string>("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    (async () => {
      const [{ data: l }, { data: c }] = await Promise.all([
        supabase.from("languages").select("id, name, flag").order("name"),
        supabase.from("courses").select("id, title, description, level, language_id, duration_weeks, lessons_count, languages(name, flag)").eq("is_active", true),
      ]);
      setLanguages(l ?? []);
      setCourses((c as Course[]) ?? []);
    })();
  }, []);

  const filtered = useMemo(() => {
    return courses.filter((c) => {
      if (lang !== "all" && c.language_id !== lang) return false;
      if (level !== "all" && c.level !== level) return false;
      if (query && !c.title.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [courses, lang, level, query]);

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto p-6 sm:p-10">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">استكشف الدورات</h1>
          <p className="text-muted-foreground mt-2">اختر اللغة والمستوى الذي يناسبك.</p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث عن دورة..."
            className="w-full pr-11 pl-4 py-3 rounded-xl border border-input bg-card focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Language filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
          <Chip active={lang === "all"} onClick={() => setLang("all")}>كل اللغات</Chip>
          {languages.map((l) => (
            <Chip key={l.id} active={lang === l.id} onClick={() => setLang(l.id)}>
              <span className="ml-1">{l.flag}</span> {l.name}
            </Chip>
          ))}
        </div>

        {/* Level filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-8">
          {LEVELS.map((lv) => (
            <Chip key={lv} active={level === lv} onClick={() => setLevel(lv)}>
              {lv === "all" ? "كل المستويات" : lv}
            </Chip>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="p-10 text-center rounded-2xl border border-dashed border-border bg-card">
            <p className="text-muted-foreground">لا توجد دورات تطابق بحثك.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((c) => <CourseCard key={c.id} course={c} />)}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition ${
        active ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
