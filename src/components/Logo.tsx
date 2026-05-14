// SnapFix brand mark — Variant E: filled S with snap-notch.
//
// A solid filled "S" letterform with a diagonal notch cut from the
// upper-right corner — the "snap" that gives the mark a distinctive
// silhouette. Indigo gradient. No tile.
//
// Variants:
//   <Logo />          mark only
//   <Wordmark />      mark + "SnapFix" wordmark
//   tone="light"      light foreground for dark backgrounds (marketing)
//   tone="brand"      brand foreground for light backgrounds (app)

let counter = 0;
function nextId() {
  counter += 1;
  return `sfx-${counter}`;
}

export function Logo({
  size = 28,
  className = "",
  tone = "brand",
}: {
  size?: number;
  className?: string;
  tone?: "brand" | "light";
}) {
  const id = nextId();
  // Native 24×32 — taller than wide, classic letterform proportions.
  const w = Math.round((size * 24) / 32);
  const h = size;
  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 24 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={className}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="24" y2="32" gradientUnits="userSpaceOnUse">
          {tone === "light" ? (
            <>
              <stop offset="0%" stopColor="#e0e7ff" />
              <stop offset="100%" stopColor="#a5b4fc" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#4338ca" />
            </>
          )}
        </linearGradient>
      </defs>
      {/* Filled "S" with a diagonal notch cut from the upper-right corner */}
      <path
        d="M 3 3 H 17 L 21 7 V 9 H 9 V 13 H 21 V 23 H 3 V 17 H 15 V 13 H 3 Z M 3 23 H 21 V 29 H 3 Z"
        fill={`url(#${id})`}
        fillRule="evenodd"
      />
    </svg>
  );
}

export function Wordmark({
  size = 28,
  tone = "brand",
  className = "",
}: {
  size?: number;
  tone?: "brand" | "light";
  className?: string;
}) {
  return (
    <span className={`inline-flex items-baseline gap-2 ${className}`}>
      <Logo size={size} tone={tone} />
      <span
        className={`font-semibold tracking-tight ${
          tone === "light" ? "text-white" : "text-ink"
        }`}
        style={{ fontSize: size * 0.75 }}
      >
        SnapFix
      </span>
    </span>
  );
}
