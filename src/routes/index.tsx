import { createFileRoute, Link } from "@tanstack/react-router";
import { Languages, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "منصة تعليم اللغات" },
      { name: "description", content: "منصة عربية لتعلّم اللغات بدورات تفاعلية ومعلّمين مختصّين." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6" dir="rtl" style={{ background: "var(--gradient-hero)" }}>
      <div className="max-w-2xl text-center text-white">
        <div className="inline-flex items-center gap-3 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
            <Languages className="w-7 h-7" />
          </div>
          <span className="text-2xl font-bold">لغات</span>
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold leading-tight mb-6">
          تعلّم لغة جديدة<br />بطريقة تُشبهك
        </h1>
        <p className="text-white/85 text-lg mb-10 leading-relaxed">
          ابدأ بإنشاء حسابك واختيار مستواك، ودع البقية علينا.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link to="/auth" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-foreground font-semibold hover:bg-white/90 transition">
            ابدأ الآن
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <Link to="/dashboard" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border-2 border-white/30 text-white font-semibold hover:bg-white/10 transition">
            لوحتي
          </Link>
        </div>
      </div>
    </div>
  );
}
