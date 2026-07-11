import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Languages, LayoutDashboard, BookOpen, GraduationCap, LogOut, Library, Sparkles, Video, Crown, Receipt, Wand2, Presentation, BookMarked } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; premium?: boolean };

export function AppShell({ children }: { children: ReactNode }) {
  const [name, setName] = useState<string>("");
  const [isPremium, setIsPremium] = useState(false);
  const [isTeacher, setIsTeacher] = useState(false);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      const [{ data: p }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("full_name, email, is_premium").eq("id", data.user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", data.user.id),
      ]);
      setName(p?.full_name || p?.email?.split("@")[0] || "");
      setIsPremium(!!p?.is_premium);
      setIsTeacher(!!roles?.some((r) => r.role === "teacher"));
    })();
  }, [pathname]);

  const links: NavItem[] = [
    { to: "/dashboard", label: "الرئيسية", icon: LayoutDashboard },
    { to: "/courses", label: "الدورات", icon: BookOpen },
    { to: "/my-courses", label: "دوراتي", icon: Library },
    { to: "/level", label: "مستواي", icon: GraduationCap },
    { to: "/placement-test", label: "اختبار المستوى", icon: Sparkles },
    { to: "/curriculum/tunisian", label: "بنك المناهج التونسية 🇹🇳", icon: BookMarked },
    { to: "/live-sessions", label: "الجلسات الحيّة", icon: Video, premium: true },
    { to: "/invoices", label: "الفواتير", icon: Receipt },
    ...(isTeacher ? [
      { to: "/teach/availability", label: "بوابة المعلّم", icon: Presentation },
      { to: "/teach/widgets", label: "منشئ النشاطات", icon: Wand2 },
    ] : []),
  ];

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  return (
    <div className="min-h-screen flex bg-background" dir="rtl">
      <aside className="hidden md:flex flex-col w-64 border-l border-border bg-card p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-primary-foreground" style={{ background: "var(--gradient-hero)" }}>
            <Languages className="w-5 h-5" />
          </div>
          <span className="text-lg font-bold">لغات</span>
        </div>

        {!isPremium && (
          <Link
            to="/upgrade"
            className="mb-6 p-3 rounded-xl text-white text-sm font-semibold flex items-center gap-2"
            style={{ background: "var(--gradient-hero)", boxShadow: "var(--shadow-elegant)" }}
          >
            <Crown className="w-4 h-4" /> ترقية إلى Premium
          </Link>
        )}
        {isPremium && (
          <div className="mb-6 p-3 rounded-xl bg-accent/10 border border-accent/30 text-sm font-semibold flex items-center gap-2">
            <Crown className="w-4 h-4 text-accent-foreground" /> عضو Premium
          </div>
        )}

        <nav className="space-y-1 flex-1">
          {links.map((l) => {
            const Icon = l.icon;
            const active = pathname === l.to || pathname.startsWith(l.to + "/");
            const locked = l.premium && !isPremium;
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="flex-1">{l.label}</span>
                {locked && <Crown className="w-3.5 h-3.5 opacity-60" />}
              </Link>
            );
          })}
        </nav>

        <div className="pt-4 border-t border-border">
          <div className="px-3 py-2 mb-2">
            <div className="text-sm font-semibold text-foreground truncate">{name || "..."}</div>
            <div className="text-xs text-muted-foreground">{isPremium ? "Premium" : "حساب مجاني"}</div>
          </div>
          <button onClick={signOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition">
            <LogOut className="w-4 h-4" />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
