// SnapFix brand mark — a single bold "F" letterform.
//
// Three strokes: vertical spine + top arm + middle arm. Indigo gradient.
// Bold, geometric, rounded caps. No enclosing tile. Distinctive in a
// landscape full of "S" marks (Stripe, Starling, etc.) and reads cleanly
// at favicon size.

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
      <path
        d="M 4 4
           V 28
           M 4 4
           H 21
           M 4 16
           H 18"
        stroke={`url(#${id})`}
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
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
          tone === "light" ? "text-white" : "text-slate-900"
        }`}
        style={{ fontSize: size * 0.75 }}
      >
        SnapFix
      </span>
    </span>
  );
}
