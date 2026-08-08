import { Volume2, Mic, Check, RotateCcw } from "lucide-react";
import { speak, isSpeechSupported, isRecognitionSupported, usePronunciationCheck } from "@/hooks/use-speech";

/** A small speaker icon button that reads the given text aloud. */
export function SpeakButton({ text, lang, className = "" }: { text: string; lang: string; className?: string }) {
  if (!isSpeechSupported() || !text) return null;
  return (
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); speak(text, lang); }}
      title="استمع للنطق"
      className={`inline-flex items-center justify-center w-8 h-8 rounded-full border border-border hover:bg-muted transition shrink-0 ${className}`}
    >
      <Volume2 className="w-4 h-4" />
    </button>
  );
}

/** Speaker + mic pair: listen to the correct pronunciation, then try saying it yourself. */
export function PronunciationPractice({ text, lang }: { text: string; lang: string }) {
  const { listen, listening, result, heard } = usePronunciationCheck(lang);
  const micSupported = isRecognitionSupported();

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <SpeakButton text={text} lang={lang} />
      {micSupported && (
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); listen(text); }}
          disabled={listening}
          title="جرّب تنطقها"
          className={`inline-flex items-center justify-center w-8 h-8 rounded-full border transition shrink-0 ${
            listening ? "bg-red-100 border-red-300 animate-pulse" : "border-border hover:bg-muted"
          }`}
        >
          <Mic className="w-4 h-4" />
        </button>
      )}
      {result === "correct" && (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600">
          <Check className="w-3.5 h-3.5" /> أحسنت! نطق صحيح
        </span>
      )}
      {result === "close" && (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600">
          قريب! جرّب مرة أخرى
        </span>
      )}
      {result === "retry" && (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-500">
          <RotateCcw className="w-3.5 h-3.5" /> حاول مرة أخرى — سمعت: "{heard || "..."}"
        </span>
      )}
    </div>
  );
}
