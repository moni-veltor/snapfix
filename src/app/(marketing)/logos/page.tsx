// Internal-ish logo gallery page. Renders S-based logo concepts side by side
// at multiple sizes for visual comparison. Public route (no auth) so it can
// be reviewed on the deployed site.

export const metadata = { title: "Logo options — SnapFix" };

type Variant = {
  id: string;
  label: string;
  description: string;
  Mark: React.ComponentType<{ size: number; tone?: "brand" | "light" }>;
};

const VARIANTS: Variant[] = [
  {
    id: "A",
    label: "A — Sharp architectural S",
    description: "Three strokes, hard 90° corners. Bold and engineered.",
    Mark: VariantSharp,
  },
  {
    id: "B",
    label: "B — Rounded block S",
    description: "Three strokes with soft, rounded corner joins. Friendlier.",
    Mark: VariantRound,
  },
  {
    id: "C",
    label: "C — Filled block S",
    description: "Solid filled letterform. Heaviest, most brand-block.",
    Mark: VariantFilled,
  },
  {
    id: "D",
    label: "D — S in rounded tile",
    description: "Letter inside a small rounded square. App-icon style.",
    Mark: VariantTile,
  },
  {
    id: "E",
    label: "E — S with snap notch",
    description: "Filled S with a small angular notch top-right — the 'snap'.",
    Mark: VariantNotch,
  },
  {
    id: "F",
    label: "F — Constructed S (3 blocks)",
    description: "Three offset rectangles. Modular, fintech-mark feel.",
    Mark: VariantBlocks,
  },
  {
    id: "G",
    label: "G — Outlined S",
    description: "Thin outlined letterform, no fill. Refined and editorial.",
    Mark: VariantOutline,
  },
  {
    id: "H",
    label: "H — Two-tone filled S",
    description: "Filled S with a clean two-tone split for depth.",
    Mark: VariantTwoTone,
  },
];

export default function LogoOptionsPage() {
  return (
    <div className="text-slate-200">
      <section className="bg-night-hero">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <span className="text-xs uppercase tracking-wider text-indigo-300">Internal</span>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
            Logo options
          </h1>
          <p className="mt-3 max-w-2xl text-slate-400">
            Eight S-based concepts. Pick the one you want and I'll wire it as the
            site mark + favicon. Or tell me which feature from each to combine
            (e.g. "B's rounded corners but C's weight").
          </p>
        </div>
      </section>
      <section className="bg-night-dots">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-2">
            {VARIANTS.map((v) => (
              <div key={v.id} className="card-night p-6">
                <div className="flex items-baseline justify-between gap-3">
                  <div>
                    <div className="text-base font-semibold text-white">{v.label}</div>
                    <p className="mt-1 text-sm text-slate-400">{v.description}</p>
                  </div>
                  <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 font-mono text-xs text-indigo-300 ring-1 ring-inset ring-indigo-400/30">
                    {v.id}
                  </span>
                </div>
                {/* Multiple render sizes */}
                <div className="mt-6 grid grid-cols-3 items-end gap-4">
                  <RenderCell label="16px" bg="dark">
                    <v.Mark size={16} tone="light" />
                  </RenderCell>
                  <RenderCell label="32px" bg="dark">
                    <v.Mark size={32} tone="light" />
                  </RenderCell>
                  <RenderCell label="64px" bg="dark">
                    <v.Mark size={64} tone="light" />
                  </RenderCell>
                </div>
                <div className="mt-3 grid grid-cols-3 items-end gap-4">
                  <RenderCell label="16px" bg="light">
                    <v.Mark size={16} tone="brand" />
                  </RenderCell>
                  <RenderCell label="32px" bg="light">
                    <v.Mark size={32} tone="brand" />
                  </RenderCell>
                  <RenderCell label="With wordmark" bg="light">
                    <span className="inline-flex items-baseline gap-2">
                      <v.Mark size={28} tone="brand" />
                      <span
                        className="text-[20px] font-semibold tracking-tight text-ink"
                      >
                        SnapFix
                      </span>
                    </span>
                  </RenderCell>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function RenderCell({
  label,
  bg,
  children,
}: {
  label: string;
  bg: "light" | "dark";
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-2 rounded-md border p-3 ${
        bg === "dark"
          ? "border-white/[0.08] bg-[color:var(--night-base)]"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex h-[80px] items-center justify-center">{children}</div>
      <div className={`text-[10px] uppercase tracking-wider ${bg === "dark" ? "text-slate-500" : "text-slate-400"}`}>
        {label}
      </div>
    </div>
  );
}

// ─── Shared gradient helpers ─────────────────────────────────────────────
let gid = 0;
function nid(prefix: string) {
  gid += 1;
  return `${prefix}-${gid}`;
}

function gradientStops(tone: "brand" | "light") {
  return tone === "light" ? (
    <>
      <stop offset="0%" stopColor="#e0e7ff" />
      <stop offset="100%" stopColor="#a5b4fc" />
    </>
  ) : (
    <>
      <stop offset="0%" stopColor="#818cf8" />
      <stop offset="100%" stopColor="#4338ca" />
    </>
  );
}

// ─── Variants ────────────────────────────────────────────────────────────

// A — Sharp architectural S (current shipped)
function VariantSharp({ size, tone = "brand" }: { size: number; tone?: "brand" | "light" }) {
  const id = nid("a");
  const w = Math.round((size * 24) / 32);
  return (
    <svg width={w} height={size} viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="24" y2="32" gradientUnits="userSpaceOnUse">
          {gradientStops(tone)}
        </linearGradient>
      </defs>
      <path
        d="M 4 4 H 20 V 16 H 4 V 28 H 20"
        stroke={`url(#${id})`}
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="miter"
        strokeMiterlimit="8"
        fill="none"
      />
    </svg>
  );
}

// B — Rounded block S
function VariantRound({ size, tone = "brand" }: { size: number; tone?: "brand" | "light" }) {
  const id = nid("b");
  const w = Math.round((size * 24) / 32);
  return (
    <svg width={w} height={size} viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="24" y2="32" gradientUnits="userSpaceOnUse">
          {gradientStops(tone)}
        </linearGradient>
      </defs>
      <path
        d="M 4 4 H 20 V 16 H 4 V 28 H 20"
        stroke={`url(#${id})`}
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

// C — Filled block S (solid letterform)
function VariantFilled({ size, tone = "brand" }: { size: number; tone?: "brand" | "light" }) {
  const id = nid("c");
  const w = Math.round((size * 24) / 32);
  return (
    <svg width={w} height={size} viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="24" y2="32" gradientUnits="userSpaceOnUse">
          {gradientStops(tone)}
        </linearGradient>
      </defs>
      {/* Filled S — outer outline traced clockwise, inner cuts (eyes) trace counter-clockwise */}
      <path
        d="M 3 3 H 21 V 9 H 9 V 13 H 21 V 23 H 3 V 17 H 15 V 13 H 3 Z M 3 23 H 21 V 29 H 3 Z"
        fill={`url(#${id})`}
        fillRule="evenodd"
      />
    </svg>
  );
}

// D — S in rounded tile
function VariantTile({ size, tone = "brand" }: { size: number; tone?: "brand" | "light" }) {
  const id = nid("d");
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          {gradientStops(tone)}
        </linearGradient>
      </defs>
      <rect
        x="0"
        y="0"
        width="32"
        height="32"
        rx="7"
        fill={tone === "light" ? "rgba(255,255,255,0.06)" : "rgba(79,70,229,0.08)"}
        stroke={tone === "light" ? "rgba(255,255,255,0.25)" : "rgba(79,70,229,0.30)"}
        strokeWidth="0.75"
      />
      <path
        d="M 10 8 H 22 V 15 H 10 V 24 H 22"
        stroke={`url(#${id})`}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

// E — Filled S with snap notch top-right
function VariantNotch({ size, tone = "brand" }: { size: number; tone?: "brand" | "light" }) {
  const id = nid("e");
  const w = Math.round((size * 24) / 32);
  return (
    <svg width={w} height={size} viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="24" y2="32" gradientUnits="userSpaceOnUse">
          {gradientStops(tone)}
        </linearGradient>
      </defs>
      {/* Filled S with diagonal notch cut from upper-right corner */}
      <path
        d="M 3 3 H 17 L 21 7 V 9 H 9 V 13 H 21 V 23 H 3 V 17 H 15 V 13 H 3 Z M 3 23 H 21 V 29 H 3 Z"
        fill={`url(#${id})`}
        fillRule="evenodd"
      />
    </svg>
  );
}

// F — S formed from 3 offset rectangles (constructed)
function VariantBlocks({ size, tone = "brand" }: { size: number; tone?: "brand" | "light" }) {
  const id = nid("f");
  const w = Math.round((size * 24) / 32);
  return (
    <svg width={w} height={size} viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="24" y2="32" gradientUnits="userSpaceOnUse">
          {gradientStops(tone)}
        </linearGradient>
      </defs>
      {/* Three rounded rectangles, offset top→right, middle→centre, bottom→left */}
      <rect x="6" y="3" width="16" height="6" rx="2" fill={`url(#${id})`} />
      <rect x="4" y="13" width="16" height="6" rx="2" fill={`url(#${id})`} opacity="0.85" />
      <rect x="2" y="23" width="16" height="6" rx="2" fill={`url(#${id})`} />
    </svg>
  );
}

// G — Outlined S (thin, refined)
function VariantOutline({ size, tone = "brand" }: { size: number; tone?: "brand" | "light" }) {
  const id = nid("g");
  const w = Math.round((size * 24) / 32);
  return (
    <svg width={w} height={size} viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="24" y2="32" gradientUnits="userSpaceOnUse">
          {gradientStops(tone)}
        </linearGradient>
      </defs>
      <path
        d="M 4 4 H 20 V 16 H 4 V 28 H 20"
        stroke={`url(#${id})`}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="miter"
        strokeMiterlimit="8"
        fill="none"
      />
    </svg>
  );
}

// H — Two-tone filled S (depth)
function VariantTwoTone({
  size,
  tone = "brand",
}: {
  size: number;
  tone?: "brand" | "light";
}) {
  const id1 = nid("h-top");
  const id2 = nid("h-bot");
  const w = Math.round((size * 24) / 32);
  return (
    <svg width={w} height={size} viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={id1} x1="0" y1="0" x2="24" y2="16" gradientUnits="userSpaceOnUse">
          {tone === "light" ? (
            <>
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#c7d2fe" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#a5b4fc" />
              <stop offset="100%" stopColor="#6366f1" />
            </>
          )}
        </linearGradient>
        <linearGradient id={id2} x1="0" y1="16" x2="24" y2="32" gradientUnits="userSpaceOnUse">
          {tone === "light" ? (
            <>
              <stop offset="0%" stopColor="#a5b4fc" />
              <stop offset="100%" stopColor="#6366f1" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#3730a3" />
            </>
          )}
        </linearGradient>
      </defs>
      {/* Top half */}
      <path d="M 3 3 H 21 V 9 H 9 V 13 H 21 V 16 H 3 Z" fill={`url(#${id1})`} />
      {/* Bottom half */}
      <path d="M 3 16 H 21 V 23 H 3 V 17 H 15 V 16 Z M 3 23 H 21 V 29 H 3 Z" fill={`url(#${id2})`} />
    </svg>
  );
}
