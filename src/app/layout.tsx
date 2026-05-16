import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";
import { Toaster } from "sonner";
import "./globals.css";

// Display — Space Grotesk reserved for PageHero titles, severity badges,
// hero numerals. Geometric with distinctive numerals; earns the visual
// weight in signature moments where character pays off.
const spaceGrotesk = Space_Grotesk({
  variable: "--font-display-primary",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

// Body — General Sans. Premium-fintech neutral with humanist warmth.
// Self-hosted from Fontshare (Sans Free License). 4 static weights.
const generalSans = localFont({
  variable: "--font-sans-primary",
  display: "swap",
  src: [
    { path: "./fonts/GeneralSans-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/GeneralSans-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/GeneralSans-Semibold.woff2", weight: "600", style: "normal" },
    { path: "./fonts/GeneralSans-Bold.woff2", weight: "700", style: "normal" },
  ],
});

// Mono — JetBrains Mono for clocks, IDs, severity scores, audit fields.
// Distinct 0/O 1/l/I, true tabular figures, no ligatures by default.
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono-primary",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SnapFix — Operational Resilience for Banks",
  description:
    "SnapFix is operational-resilience consulting in technology, plus a SaaS platform of practical apps that help banks practise the disruptions that matter — before they happen.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${generalSans.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        {children}
        <Toaster
          richColors
          position="bottom-right"
          closeButton
          toastOptions={{ duration: 4000 }}
        />
      </body>
    </html>
  );
}
