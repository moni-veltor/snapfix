type Mood = "happy" | "thinking" | "alert" | "sleeping";

type Props = {
  size?: number;
  mood?: Mood;
  className?: string;
};

/**
 * Hoot — SnapFix's resident night-watch owl mascot. Used in empty states,
 * the daily-tip widget, the Wrapped page hero. Pure SVG so it scales and
 * tints from the surrounding `currentColor`. Each mood swaps the eyes /
 * brow only — the body silhouette is the same shape for instant recognition.
 */
export default function Hoot({ size = 64, mood = "happy", className = "" }: Props) {
  return (
    <svg
      viewBox="0 0 96 96"
      width={size}
      height={size}
      role="img"
      aria-label={`Hoot the resilience owl (${mood})`}
      className={className}
    >
      <defs>
        <linearGradient id="hoot-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#4338ca" />
        </linearGradient>
        <linearGradient id="hoot-belly" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e0e7ff" />
          <stop offset="100%" stopColor="#c7d2fe" />
        </linearGradient>
      </defs>

      {/* Body */}
      <ellipse cx="48" cy="56" rx="32" ry="34" fill="url(#hoot-body)" />
      {/* Belly */}
      <ellipse cx="48" cy="62" rx="20" ry="22" fill="url(#hoot-belly)" />

      {/* Ear tufts */}
      <path d="M 22 32 L 28 18 L 34 32 Z" fill="#4338ca" />
      <path d="M 62 32 L 68 18 L 74 32 Z" fill="#4338ca" />

      {/* Eye discs */}
      <circle cx="36" cy="44" r="11" fill="#f8fafc" />
      <circle cx="60" cy="44" r="11" fill="#f8fafc" />

      {/* Eyes by mood */}
      {mood === "happy" && (
        <>
          <circle cx="36" cy="45" r="4" fill="#0f172a" />
          <circle cx="60" cy="45" r="4" fill="#0f172a" />
          <circle cx="37.5" cy="43.5" r="1.2" fill="#f8fafc" />
          <circle cx="61.5" cy="43.5" r="1.2" fill="#f8fafc" />
        </>
      )}
      {mood === "thinking" && (
        <>
          <circle cx="38" cy="45" r="4" fill="#0f172a" />
          <circle cx="62" cy="45" r="4" fill="#0f172a" />
          <path d="M 28 38 L 36 36" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
          <path d="M 68 38 L 60 36" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
        </>
      )}
      {mood === "alert" && (
        <>
          <circle cx="36" cy="44" r="5" fill="#ef4444" />
          <circle cx="60" cy="44" r="5" fill="#ef4444" />
          <circle cx="36" cy="44" r="2" fill="#0f172a" />
          <circle cx="60" cy="44" r="2" fill="#0f172a" />
          <path d="M 26 36 L 38 38" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 70 36 L 58 38" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
        </>
      )}
      {mood === "sleeping" && (
        <>
          <path d="M 30 44 Q 36 49 42 44" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M 54 44 Q 60 49 66 44" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <text x="78" y="28" fontSize="14" fill="#94a3b8" fontWeight="bold">z</text>
        </>
      )}

      {/* Beak */}
      <path d="M 44 52 L 48 60 L 52 52 Z" fill="#f59e0b" />

      {/* Feet */}
      <path d="M 40 88 L 42 92 L 44 88" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M 52 88 L 54 92 L 56 88" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}
