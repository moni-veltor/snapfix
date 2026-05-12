// SnapFix brand mark — tight SF ligature.
//
// Both letters share their vertical axis: the S's rightmost edge sits
// flush against the F's spine, so the eye reads them as one mark. No
// enclosing tile; bold continuous strokes; single indigo gradient.
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
  // Native viewBox 32×24 — slightly wide to fit "SF" as a ligature.
  const h = size;
  const w = Math.round((size * 32) / 24);
  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 32 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={className}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="32" y2="24" gradientUnits="userSpaceOnUse">
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

      {/* "S" — three short horizontals connected by snug semicircular ends.
          Drawn as ONE continuous path, terminating exactly at x=15 so the
          F's spine at x=15.5 visually butts against it. */}
      <path
        d="M 12 3
           H 5.5
           C 3 3 2 4.3 2 5.7
           C 2 7.1 3 8.5 5.5 8.5
           H 10.5
           C 13 8.5 14 9.9 14 11.3
           C 14 12.7 13 14 10.5 14
           H 5.5
           C 3 14 2 15.3 2 16.7
           C 2 18.1 3 19.5 5.5 19.5
           H 13"
        stroke={`url(#${id})`}
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* "F" — spine + top arm + middle arm. Starts flush against S. */}
      <path
        d="M 16 3
           V 21
           M 16 3
           H 30
           M 16 11.3
           H 27"
        stroke={`url(#${id})`}
        strokeWidth="3.2"
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
