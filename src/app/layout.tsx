import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { auth } from "@/lib/auth";
import SessionWidget from "@/components/SessionWidget";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Operational Resilience Simulator",
  description:
    "CMORG-aligned operational resilience exercise simulator: design scenarios, run live event-based exercises, and generate after-action reports.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
            <Link href="/" className="font-semibold tracking-tight">
              OR Simulator
            </Link>
            <nav className="flex items-center gap-6 text-sm">
              <Link href="/scenarios" className="hover:underline">
                Scenarios
              </Link>
              <Link href="/runs" className="hover:underline">
                Runs
              </Link>
              <SessionWidget session={session} />
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
        <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
          Operational Resilience Exercise Simulator — based on CMORG
        </footer>
      </body>
    </html>
  );
}
