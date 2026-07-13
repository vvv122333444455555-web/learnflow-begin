import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield, Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin-login")({
  component: AdminLogin,
});

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error("بيانات الدخول غير صحيحة");
    navigate({ to: "/admin" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" dir="rtl" style={{ background: "var(--gradient-hero)" }}>
      <form onSubmit={submit} className="w-full max-w-sm bg-card rounded-2xl p-8 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white" style={{ background: "var(--gradient-hero)" }}><Shield className="w-6 h-6"/></div>
          <h1 className="text-xl font-bold">دخول الإدارة</h1>
        </div>
        <input required type="email" placeholder="البريد" value={email} onChange={e=>setEmail(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-input bg-background"/>
        <input required type="password" placeholder="كلمة المرور" value={password} onChange={e=>setPassword(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-input bg-background"/>
        <button disabled={loading} className="w-full py-3 rounded-xl text-white font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60" style={{ background: "var(--gradient-hero)" }}>
          {loading && <Loader2 className="w-4 h-4 animate-spin"/>} دخول
        </button>
      </form>
    </div>
  );
}
