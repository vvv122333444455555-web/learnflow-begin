import type { Character } from "@/data/kids-unit1";

const SKIN = "oklch(0.85 0.06 60)";
const INK = "var(--kw-ink)";

/** Consistent cartoon characters for the whole unit. */
export function Char({ who, size = 96, wave = false }: { who: Character; size?: number; wave?: boolean }) {
  if (who === "robo") {
    return (
      <svg viewBox="0 0 100 120" width={size} height={size * 1.2} aria-label="Robo">
        <line x1="50" y1="6" x2="50" y2="20" stroke={INK} strokeWidth="3" />
        <circle cx="50" cy="6" r="5" fill="var(--kw-pink)" />
        <rect x="18" y="20" width="64" height="48" rx="16" fill="oklch(0.85 0.05 220)" stroke={INK} strokeWidth="3" />
        <rect x="28" y="30" width="44" height="26" rx="10" fill="oklch(0.35 0.06 250)" />
        <circle cx="40" cy="43" r="5" fill="var(--kw-sun)" /><circle cx="60" cy="43" r="5" fill="var(--kw-sun)" />
        <path d="M42 51 Q50 56 58 51" stroke="var(--kw-sun)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <rect x="26" y="72" width="48" height="34" rx="10" fill="oklch(0.85 0.05 220)" stroke={INK} strokeWidth="3" />
        <circle cx="50" cy="88" r="7" fill="var(--kw-pink)" />
        <rect x="8" y="78" width="16" height="8" rx="4" fill={INK} transform={wave ? "rotate(-40 24 82)" : ""} />
        <rect x="76" y="78" width="16" height="8" rx="4" fill={INK} />
        <rect x="32" y="106" width="12" height="10" rx="3" fill={INK} /><rect x="56" y="106" width="12" height="10" rx="3" fill={INK} />
      </svg>
    );
  }
  const cfg = {
    adam: { shirt: "var(--kw-blue)", hair: "oklch(0.3 0.05 50)", girl: false, cap: false },
    tom: { shirt: "var(--kw-green)", hair: "oklch(0.55 0.1 60)", girl: false, cap: true },
    sara: { shirt: "var(--kw-pink)", hair: "oklch(0.35 0.08 40)", girl: true, cap: false },
  }[who];
  return (
    <svg viewBox="0 0 100 120" width={size} height={size * 1.2} aria-label={who}>
      {cfg.girl && <path d="M22 40 Q18 80 30 84 L70 84 Q82 80 78 40 Z" fill={cfg.hair} />}
      <circle cx="50" cy="40" r="26" fill={SKIN} stroke={INK} strokeWidth="2.5" />
      {cfg.cap ? (
        <><path d="M24 34 Q50 8 76 34 Z" fill="var(--kw-green)" stroke={INK} strokeWidth="2.5" /><rect x="60" y="30" width="26" height="6" rx="3" fill="var(--kw-green)" stroke={INK} strokeWidth="2" /></>
      ) : (
        <path d={cfg.girl ? "M24 38 Q30 12 50 14 Q70 12 76 38 Q62 26 50 28 Q38 26 24 38Z" : "M25 36 Q28 12 50 14 Q72 12 75 36 Q66 24 50 26 Q34 24 25 36Z"} fill={cfg.hair} />
      )}
      {cfg.girl && <circle cx="76" cy="26" r="6" fill="var(--kw-sun)" stroke={INK} strokeWidth="2" />}
      <circle cx="41" cy="42" r="3.5" fill={INK} /><circle cx="59" cy="42" r="3.5" fill={INK} />
      <circle cx="35" cy="50" r="4" fill="var(--kw-pink)" opacity=".5" /><circle cx="65" cy="50" r="4" fill="var(--kw-pink)" opacity=".5" />
      <path d="M42 52 Q50 59 58 52" stroke={INK} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d={cfg.girl ? "M30 70 L70 70 L80 110 L20 110 Z" : "M28 70 L72 70 L74 108 L26 108 Z"} fill={cfg.shirt} stroke={INK} strokeWidth="2.5" />
      <line x1="28" y1="74" x2={wave ? 12 : 18} y2={wave ? 52 : 96} stroke={SKIN} strokeWidth="8" strokeLinecap="round" />
      <line x1="72" y1="74" x2="82" y2="96" stroke={SKIN} strokeWidth="8" strokeLinecap="round" />
      <rect x="36" y="108" width="10" height="10" rx="3" fill={INK} /><rect x="54" y="108" width="10" height="10" rx="3" fill={INK} />
    </svg>
  );
}

export const CHAR_NAME: Record<Character, string> = { adam: "Adam", sara: "Sara", robo: "Robo", tom: "Tom" };

/** Illustrated backgrounds: one per lesson + the main world. */
export function Scene({ kind, className = "" }: { kind: "world" | "garden" | "classroom" | "library" | "playground"; className?: string }) {
  return (
    <svg viewBox="0 0 800 300" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden>
      <defs>
        <linearGradient id={`sky-${kind}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--kw-sky-deep)" /><stop offset="1" stopColor="var(--kw-sky)" />
        </linearGradient>
      </defs>
      <rect width="800" height="300" fill={`url(#sky-${kind})`} />
      <circle cx="700" cy="60" r="36" fill="var(--kw-sun)" />
      {[[120, 60], [380, 40], [560, 80]].map(([x, y], i) => (
        <g key={i} fill="var(--kw-paper)" opacity=".95"><ellipse cx={x} cy={y} rx="40" ry="16" /><ellipse cx={x! + 25} cy={y! - 10} rx="25" ry="15" /></g>
      ))}
      <path d="M0 220 Q150 140 320 210 T800 190 V300 H0Z" fill="var(--kw-hill)" />
      <path d="M0 250 Q200 200 420 245 T800 235 V300 H0Z" fill="var(--kw-grass)" />
      {(kind === "world" || kind === "garden") && (
        <g transform="translate(330 120)">
          <rect x="0" y="40" width="140" height="90" fill="var(--kw-paper)" stroke="var(--kw-ink)" strokeWidth="3" />
          <path d="M-10 42 L70 0 L150 42Z" fill="var(--kw-pink)" stroke="var(--kw-ink)" strokeWidth="3" />
          <rect x="55" y="85" width="30" height="45" fill="var(--kw-orange)" />
          <rect x="15" y="60" width="25" height="20" fill="var(--kw-sky)" /><rect x="100" y="60" width="25" height="20" fill="var(--kw-sky)" />
          <text x="70" y="32" textAnchor="middle" fontSize="12" fontWeight="bold" fill="var(--kw-ink)">SCHOOL</text>
        </g>
      )}
      {kind === "classroom" && (
        <g transform="translate(250 90)"><rect width="300" height="130" rx="10" fill="oklch(0.4 0.08 160)" stroke="var(--kw-ink)" strokeWidth="5" />
          <text x="150" y="60" textAnchor="middle" fontSize="28" fill="var(--kw-paper)" fontFamily="cursive">What's your name?</text>
          <text x="150" y="100" textAnchor="middle" fontSize="20" fill="var(--kw-sun)" fontFamily="cursive">My name is …</text></g>
      )}
      {kind === "library" && (
        <g transform="translate(240 100)">{"ABCDEFG".split("").map((l, i) => (
          <g key={l} transform={`translate(${i * 46} ${i % 2 ? 10 : 0})`}><rect width="40" height="40" rx="8" fill={["var(--kw-pink)", "var(--kw-blue)", "var(--kw-orange)", "var(--kw-green)", "var(--kw-purple)"][i % 5]} stroke="var(--kw-ink)" strokeWidth="2.5" />
            <text x="20" y="29" textAnchor="middle" fontSize="24" fontWeight="bold" fill="var(--kw-paper)">{l}</text></g>))}</g>
      )}
      {kind === "playground" && (
        <g transform="translate(300 110)" stroke="var(--kw-ink)" strokeWidth="4" fill="none">
          <path d="M0 120 L40 0 L160 0 L200 120" /><line x1="70" y1="0" x2="70" y2="80" /><line x1="120" y1="0" x2="120" y2="80" />
          <rect x="60" y="80" width="70" height="10" fill="var(--kw-orange)" /></g>
      )}
      {[[60, 260], [180, 275], [520, 270], [640, 260], [760, 278]].map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y})`}><circle r="6" fill={["var(--kw-pink)", "var(--kw-sun)", "var(--kw-purple)"][i % 3]} /><circle r="2.5" fill="var(--kw-sun)" /></g>
      ))}
      <g transform="translate(70 170)"><rect x="-6" y="0" width="12" height="60" fill="oklch(0.45 0.08 50)" /><circle cy="-10" r="34" fill="var(--kw-green)" /></g>
      <g className="kw-fly"><path d="M200 140 q-12 -14 0 -6 q12 -8 0 6" fill="var(--kw-purple)" /><path d="M600 150 q-10 -12 0 -5 q10 -7 0 5" fill="var(--kw-orange)" /></g>
    </svg>
  );
}
