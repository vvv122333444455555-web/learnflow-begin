import { useCallback, useRef, useState } from "react";

// Maps the language names used in the exercise builder to BCP-47 speech codes.
export const LANG_CODES: Record<string, string> = {
  English: "en-US",
  French: "fr-FR",
  German: "de-DE",
  Italian: "it-IT",
  Arabic: "ar-TN",
};

export function langToCode(language?: string | null): string {
  if (!language) return "fr-FR"; // French is the most common target language in the Tunisian curriculum
  return LANG_CODES[language] ?? "fr-FR";
}

/** Speak text aloud using the browser's built-in speech synthesis (no API key, no cost). */
export function speak(text: string, lang: string = "fr-FR") {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel(); // stop anything currently playing
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = lang;
  utter.rate = 0.9;
  window.speechSynthesis.speak(utter);
}

export function isSpeechSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function isRecognitionSupported() {
  return typeof window !== "undefined" && !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
}

// Very simple similarity check: normalize (lowercase, strip accents/punctuation) then compare.
function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .trim();
}

function similarity(a: string, b: string): number {
  const x = normalize(a), y = normalize(b);
  if (!x || !y) return 0;
  if (x === y) return 1;
  // Levenshtein distance based similarity
  const m = x.length, n = y.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = x[i - 1] === y[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  const dist = dp[m][n];
  return 1 - dist / Math.max(m, n);
}

export type PronunciationResult = "correct" | "close" | "retry" | null;

/** Records the student's voice and compares it to the target text. */
export function usePronunciationCheck(lang: string) {
  const [listening, setListening] = useState(false);
  const [result, setResult] = useState<PronunciationResult>(null);
  const [heard, setHeard] = useState("");
  const recognizerRef = useRef<any>(null);

  const listen = useCallback((targetText: string) => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const recognizer = new SR();
    recognizerRef.current = recognizer;
    recognizer.lang = lang;
    recognizer.interimResults = false;
    recognizer.maxAlternatives = 1;

    setResult(null);
    setHeard("");
    setListening(true);

    recognizer.onresult = (e: any) => {
      const transcript = e.results?.[0]?.[0]?.transcript ?? "";
      setHeard(transcript);
      const score = similarity(transcript, targetText);
      setResult(score > 0.85 ? "correct" : score > 0.55 ? "close" : "retry");
    };
    recognizer.onerror = () => setListening(false);
    recognizer.onend = () => setListening(false);
    recognizer.start();
  }, [lang]);

  const stop = useCallback(() => {
    recognizerRef.current?.stop();
    setListening(false);
  }, []);

  return { listen, stop, listening, result, heard };
}
