import { authorizeWorkspace } from "@/lib/workspace-guard";
import { pageHead } from "@/lib/page-head";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useRoleGuard } from "@/hooks/use-role-guard";
import { AiChatWidget } from "@/components/ai-chat-widget";

export const Route = createFileRoute("/_authenticated/adults/chat")({
  beforeLoad: () => authorizeWorkspace(["student"]),
  head: () => pageHead("مساعد تعلم اللغات للكبار", "مساعد تعلم اللغات للكبار في منصة LearnFlow لتعلم اللغات."),
  component: AdultsChat,
});

function AdultsChat() {
  const ready = useRoleGuard(["student"], { track: "adults" });
  if (!ready) return null;

  return (
    <div className="min-h-screen bg-background p-6" dir="rtl">
      <div className="max-w-3xl mx-auto space-y-3">
        <Link to="/adults" className="text-sm text-muted-foreground">← لوحة التحكم</Link>
        <h1 className="text-2xl font-bold">محادثة مع المساعد الذكي</h1>
        <AiChatWidget palette="adult" />
      </div>
    </div>
  );
}
