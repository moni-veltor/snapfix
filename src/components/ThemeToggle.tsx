"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "snapfix-theme";

function applyTheme(theme: "light" | "dark") {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
}

export default function ThemeToggle({ collapsed = false }: { collapsed?: boolean }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as "light" | "dark" | null) ?? "light";
    setTheme(stored);
    applyTheme(stored);
    setMounted(true);
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
    localStorage.setItem(STORAGE_KEY, next);
  };

  if (!mounted) return null;
  const Icon = theme === "dark" ? Sun : Moon;
  const label = theme === "dark" ? "Light mode" : "Dark mode";

  return (
    <button
      type="button"
      onClick={toggle}
      title={label}
      aria-label={label}
      className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-slate-600 hover:bg-surface-2 hover:text-slate-900 dark:text-soft dark:hover:bg-slate-800 dark:hover:text-slate-100 ${
        collapsed ? "w-full justify-center" : "w-full"
      }`}
    >
      <Icon size={14} />
      {!collapsed && <span>{label}</span>}
    </button>
  );
}
