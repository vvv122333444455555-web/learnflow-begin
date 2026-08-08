import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Star, Trophy, Rocket, BookOpen, Sparkles, LogOut, MessageCircle } from "lucide-react";
import { Mascot } from "@/components/mascot";

export const Route = createFileRoute("/_authenticated/kids/")({
  component: KidsDashboard,
});

import { useRoleGuard } from "@/hooks/use-role-guard";

function KidsDashboard() {
  const ready = useRoleGuard(["student"], { track: "kids" });
  const [profile, setProfile] = useState<{ full_name: string; points: number; badges: string[]; track: string | null } | null>(null);
  const [count, setCount] = useState({ assigned: 0, done: 0 });
  const navigate = useNavigate();

  useEffect(() => { if (!ready) return;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data: p } = await supabase.from("profiles").select("full_name, points, badges, track").eq("id", u.user.id).maybeSingle();
      setProfile(p as any);
      const [{ count: a }, { count: d }] = await Promise.all([
        supabase.from("exercise_assignments").select("*", { count: "exact", head: true }),
        supabase.from("exercise_submissions").select("*", { count: "exact", head: true }).eq("student_id", u.user.id),
      ]);
      setCount({ assigned: a ?? 0, done: d ?? 0 });
    })();
  }, [navigate, ready]);

  const signOut = async () => { await supabase.auth.signOut(); navigate({ to: "/" }); };

  return (
    <div className="min-h-screen" dir="rtl" style={{ background: "linear-gradient(180deg, #FFF1F5 0%, #FFF8E7 100%)" }}>
      <Mascot context="kids_welcome" palette="kid" />
      <header className="px-6 py-4 flex items-center justify-between max-w-5xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-2xl" style={{ background: "linear-gradient(135deg, #FF6B9D, #FEC260)" }}>🎨</div>
          <div>
            <div className="text-xs text-muted-foreground">مرحبًا</div>
            <div className="font-bold text-lg">{profile?.full_name || "صديقي"} 👋</div>
          </div>
        </div>
        <button onClick={signOut} className="p-2 rounded-xl bg-white hover:bg-muted"><LogOut className="w-4 h-4"/></button>
      </header>

      <main className="max-w-5xl mx-auto px-6 pb-16 space-y-6">
        <div className="grid grid-cols-3 gap-3">
          <Stat icon="⭐" label="نقاطي" value={profile?.points ?? 0} color="#FEC260"/>
          <Stat icon="🏅" label="شاراتي" value={profile?.badges?.length ?? 0} color="#FF6B9D"/>
          <Stat icon="✅" label="تمارين" value={count.done} color="#7EE8FA"/>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Link to="/kids/exercises" className="p-6 rounded-3xl bg-white shadow-lg hover:-translate-y-1 transition-transform">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl" style={{ background: "#FF6B9D" }}><BookOpen className="w-6 h-6"/></div>
              <div>
                <div className="font-bold text-lg">تماريني</div>
                <div className="text-sm text-muted-foreground">{count.assigned} تمرين في انتظارك</div>
              </div>
            </div>
            <div className="mt-4 inline-flex items-center gap-2 font-bold" style={{ color: "#FF6B9D" }}>
              <Rocket className="w-4 h-4"/> ابدأ الآن
            </div>
          </Link>

          <Link to="/curriculum/tunisian" className="p-6 rounded-3xl bg-white shadow-lg hover:-translate-y-1 transition-transform">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl" style={{ background: "#FEC260" }}><Sparkles className="w-6 h-6"/></div>
              <div>
                <div className="font-bold text-lg">بنك المناهج 🇹🇳</div>
                <div className="text-sm text-muted-foreground">دروس تفاعلية جاهزة</div>
              </div>
            </div>
          </Link>

          <Link to="/kids/chat" className="p-6 rounded-3xl bg-white shadow-lg hover:-translate-y-1 transition-transform">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl" style={{ background: "#7EE8FA" }}><MessageCircle className="w-6 h-6"/></div>
              <div>
                <div className="font-bold text-lg">صديقي للمحادثة</div>
                <div className="text-sm text-muted-foreground">دردش وتمرّن على اللغة 🤖</div>
              </div>
            </div>
          </Link>
        </div>

        <div className="p-6 rounded-3xl bg-white shadow-lg">
          <div className="flex items-center gap-2 mb-4"><Trophy className="w-5 h-5" style={{ color: "#FEC260" }}/><h3 className="font-bold">شاراتي</h3></div>
          <div className="flex gap-3 flex-wrap">
            {(profile?.badges?.length ? profile.badges : ["البداية 🌱"]).map((b, i) => (
              <div key={i} className="px-4 py-2 rounded-full text-sm font-bold" style={{ background: "linear-gradient(135deg, #FEC26030, #FF6B9D30)" }}>{b}</div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

function Stat({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  return (
    <div className="p-5 rounded-2xl bg-white shadow-md text-center">
      <div className="text-3xl mb-1">{icon}</div>
      <div className="text-2xl font-bold" style={{ color }}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
