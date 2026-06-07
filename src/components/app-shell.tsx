import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Languages, LayoutDashboard, BookOpen, GraduationCap, LogOut, Library } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export function AppShell({ children }: { children: ReactNode }) {
  const [name, setName] = useState<string>("");
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: p } = await supabase.from("profiles").select("full_name, email").eq("id", data.user.id).maybeSingle();
      setName(p?.full_name || p?.email?.split("@")[0] || "");
    });
  }, []);

  const links = [
    { to: "/dashboard", label: "الرئيسية", icon: LayoutDashboard },
    { to: "/courses", label: "الدورات", icon: BookOpen },
    { to: "/my-courses", label: "دوراتي", icon: Library },
    { to: "/level", label: "مستواي", icon: GraduationCap },
  ] as const;

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  return (
    <div className="min-h-screen flex bg-background" dir="rtl">
      <aside className="hidden md:flex flex-col w-64 border-l border-border bg-card p-6">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-primary-foreground" style={{ background: "var(--gradient-hero)" }}>
            <Languages className="w-5 h-5" />
          </div>
          <span className="text-lg font-bold">لغات</span>
        </div>

        <nav className="space-y-1 flex-1">
          {links.map((l) => {
            const Icon = l.icon;
            const active = pathname === l.to || pathname.startsWith(l.to + "/");
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="pt-4 border-t border-border">
          <div className="px-3 py-2 mb-2">
            <div className="text-sm font-semibold text-foreground truncate">{name || "..."}</div>
            <div className="text-xs text-muted-foreground">حسابي</div>
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
