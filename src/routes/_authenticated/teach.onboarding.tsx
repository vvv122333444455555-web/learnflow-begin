import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/teach/onboarding")({
  component: Onboarding,
});

function Onboarding() {
  const [fullName, setFullName] = useState("");
  const [specialty, setSpecialty] = useState("English");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.rpc("complete_teacher_profile", {
      _full_name: fullName, _specialty: specialty, _bio: bio, _avatar: avatar,
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("تم إكمال ملفك!");
    navigate({ to: "/teach/dashboard" });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6" dir="rtl">
      <form onSubmit={submit} className="w-full max-w-lg bg-card border border-border rounded-2xl p-8 space-y-4">
        <div>
          <h1 className="text-2xl font-bold">أكمل ملف المعلّم</h1>
          <p className="text-sm text-muted-foreground">هذه المعلومات ستظهر للطلاب.</p>
        </div>
        <Label label="الاسم الكامل">
          <input required value={fullName} onChange={(e)=>setFullName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-input bg-background"/>
        </Label>
        <Label label="لغة التخصص">
          <select value={specialty} onChange={(e)=>setSpecialty(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-input bg-background">
            {["English","French","German","Italian","Arabic"].map(l => <option key={l}>{l}</option>)}
          </select>
        </Label>
        <Label label="نبذة قصيرة">
          <textarea rows={4} value={bio} onChange={(e)=>setBio(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-input bg-background"/>
        </Label>
        <Label label="رابط الصورة (اختياري)">
          <input type="url" value={avatar} onChange={(e)=>setAvatar(e.target.value)} placeholder="https://..."
            className="w-full px-4 py-3 rounded-xl border border-input bg-background"/>
        </Label>
        <button disabled={loading} className="w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
          style={{ background: "var(--gradient-hero)" }}>
          {loading && <Loader2 className="w-4 h-4 animate-spin"/>} حفظ ومتابعة
        </button>
      </form>
    </div>
  );
}

function Label({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-sm font-medium mb-1.5 block">{label}</span>{children}</label>;
}
