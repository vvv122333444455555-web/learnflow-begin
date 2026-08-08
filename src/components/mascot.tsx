import { useEffect, useState } from "react";
import { X } from "lucide-react";

export type MascotContext =
  | "kids_welcome" | "kids_exercises" | "kids_result_great" | "kids_result_ok" | "kids_chat_promo"
  | "adults_welcome" | "adults_exercises" | "adults_placement" | "adults_chat_promo";

const MESSAGES: Record<MascotContext, string[]> = {
  kids_welcome: [
    "أهلاً بيك! 🌟 أنا كوكو، رفيقك هنا! جاهز نتعلمو مع بعضنا؟",
    "مرحبا بطل! 🚀 عندك تمارين واقفة تستناك، هيا بينا!",
  ],
  kids_exercises: [
    "دوس على أي تمرين وابدا! أنا معاك خطوة بخطوة 💪",
    "كل تمرين تكمّلو يديلك نقاط وشارات جديدة! ⭐",
  ],
  kids_result_great: [
    "واااو! 🏆 أنت نجم حقيقي! برشا مبروك عليك!",
    "ممتاز برشا! 🎉 راك تتقدم بسرعة، كمّل هكا!",
  ],
  kids_result_ok: [
    "برافو على المحاولة! 💪 مرّة أخرى وتنجح أكثر إن شاء الله!",
    "تو خطوة قدّام! 🌱 كل مرّة تتحسن أكثر، ثابر!",
  ],
  kids_chat_promo: [
    "تحب تحكيلي؟ 💬 روح لـ«صديقي للمحادثة» ونهدرو مع بعضنا!",
  ],
  adults_welcome: [
    "مرحبًا بك من جديد 👋 جاهز لمواصلة رحلتك اللغوية؟",
    "أهلًا! تمارين اليوم تنتظرك — لنبدأ بخطوة صغيرة نحو التقدم.",
  ],
  adults_exercises: [
    "اختر تمرينًا وابدأ — كل خطوة تقرّبك من هدفك 🎯",
  ],
  adults_placement: [
    "لست متأكدًا من مستواك؟ اختبار سريع يحدّده لك بدقة.",
  ],
  adults_chat_promo: [
    "مارس اللغة بمحادثة حقيقية — جرّب «المساعد الذكي» الآن.",
  ],
};

function pick(context: MascotContext): string {
  const options = MESSAGES[context];
  return options[Math.floor(Math.random() * options.length)];
}

const SESSION_KEY_PREFIX = "mascot_seen_";

export function Mascot({ context, palette = "kid" }: { context: MascotContext; palette?: "kid" | "adult" }) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [wave, setWave] = useState(false);

  useEffect(() => {
    const key = SESSION_KEY_PREFIX + context;
    let alreadySeen = false;
    try { alreadySeen = sessionStorage.getItem(key) === "1"; } catch { /* ignore */ }
    if (alreadySeen) return;

    setMessage(pick(context));
    const t = setTimeout(() => setVisible(true), 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context]);

  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => setWave((w) => !w), 1600);
    return () => clearInterval(interval);
  }, [visible]);

  const dismiss = () => {
    setVisible(false);
    try { sessionStorage.setItem(SESSION_KEY_PREFIX + context, "1"); } catch { /* ignore */ }
  };

  if (!visible) return null;

  const kid = palette === "kid";
  const bodyColor = kid ? "#FF6B9D" : "hsl(var(--primary))";
  const accentColor = kid ? "#FEC260" : "hsl(var(--primary) / 0.6)";

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-end gap-2 max-w-[90vw]" dir="rtl">
      <div className="relative bg-card border shadow-xl rounded-2xl rounded-bl-sm px-4 py-3 max-w-xs text-sm animate-in fade-in slide-in-from-bottom-2">
        <button onClick={dismiss} className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20">
          <X className="w-3 h-3" />
        </button>
        {message}
      </div>
      <svg
        width="56" height="56" viewBox="0 0 100 100"
        style={{ transform: wave ? "rotate(-4deg)" : "rotate(4deg)", transition: "transform 0.8s ease-in-out" }}
        className="shrink-0 drop-shadow-lg"
      >
        <circle cx="50" cy="55" r="38" fill={bodyColor} />
        <circle cx="50" cy="30" r="8" fill={accentColor} />
        <circle cx="38" cy="50" r="6" fill="white" />
        <circle cx="62" cy="50" r="6" fill="white" />
        <circle cx="38" cy="50" r="3" fill="#222" />
        <circle cx="62" cy="50" r="3" fill="#222" />
        <path d="M 38 65 Q 50 75 62 65" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" />
        <circle
          cx={wave ? "22" : "78"} cy="60" r="7" fill={bodyColor}
          style={{ transition: "cx 0.8s ease-in-out" }}
        />
      </svg>
    </div>
  );
}
