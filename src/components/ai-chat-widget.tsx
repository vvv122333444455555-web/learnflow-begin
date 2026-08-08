import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send, Loader2, Sparkles } from "lucide-react";

type ChatMsg = { role: "user" | "assistant"; content: string };

export function AiChatWidget({ palette = "adult" }: { palette?: "adult" | "kid" }) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const primary = palette === "kid" ? "linear-gradient(135deg,#FF6B9D,#FEC260)" : "var(--gradient-hero)";
  const bubbleUser = palette === "kid" ? "bg-pink-500 text-white" : "bg-primary text-primary-foreground";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    const nextMessages = [...messages, { role: "user" as const, content: text }];
    setMessages(nextMessages);
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-chat", {
        body: { message: text, history: messages },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setMessages([...nextMessages, { role: "assistant", content: data.reply as string }]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "تعذر إرسال الرسالة");
      setMessages(messages); // revert optimistic add on failure
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[70vh] bg-card border rounded-2xl overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground gap-2 p-6">
            <Sparkles className="w-8 h-8" />
            <p>{palette === "kid" ? "أهلاً! أنا صديقك للتحدث وتعلم اللغة 🌟 جرّب تكتبلي حاجة!" : "ابدأ محادثة لممارسة اللغة — اكتب أي جملة وسأرد عليك."}</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${
              m.role === "user" ? bubbleUser : "bg-muted"
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-muted px-4 py-2.5 rounded-2xl text-sm inline-flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> يكتب...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="p-3 border-t flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="اكتب رسالتك هنا..."
          className="flex-1 px-4 py-2.5 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          onClick={send}
          disabled={sending || !input.trim()}
          className="w-11 h-11 shrink-0 rounded-xl text-white flex items-center justify-center disabled:opacity-50"
          style={{ background: primary }}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
