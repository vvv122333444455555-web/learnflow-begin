import { createFileRoute, Link } from "@tanstack/react-router";
import { useRoleGuard } from "@/hooks/use-role-guard";
import { AiChatWidget } from "@/components/ai-chat-widget";

export const Route = createFileRoute("/_authenticated/kids/chat")({
  component: KidsChat,
});

function KidsChat() {
  const ready = useRoleGuard(["student"], { track: "kids" });
  if (!ready) return null;

  return (
    <div className="min-h-screen p-6" dir="rtl" style={{ background: "linear-gradient(180deg, #FFF1F5, #FFF8E7)" }}>
      <div className="max-w-2xl mx-auto space-y-3">
        <Link to="/kids" className="text-sm">← الرئيسية</Link>
        <h1 className="text-2xl font-bold">صديقي للمحادثة 🤖💬</h1>
        <AiChatWidget palette="kid" />
      </div>
    </div>
  );
}
