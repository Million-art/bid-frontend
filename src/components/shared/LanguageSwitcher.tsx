"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { localeLabels, type Locale } from "@/locales";
import { Globe } from "lucide-react";

interface LanguageSwitcherProps {
  variant?: "pill" | "compact" | "full";
  size?: "sm" | "md";
  className?: string;
}

export function LanguageSwitcher({
  variant = "pill",
  size = "md",
  className = "",
}: LanguageSwitcherProps) {
  const { locale, setLocale } = useLanguage();

  if (variant === "compact") {
    const nextLocale: Locale = locale === "en" ? "am" : "en";
    const padClass = size === "sm" ? "px-2 py-1 text-[11px]" : "px-2.5 py-1.5 text-xs";
    return (
      <button
        type="button"
        onClick={() => setLocale(nextLocale)}
        aria-label={`Switch to ${localeLabels[nextLocale].label}`}
        className={`inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white ${padClass} font-bold text-slate-700 shadow-sm transition hover:border-[var(--brand-blue)]/50 hover:bg-slate-50 ${className}`}
      >
        <Globe className="h-3.5 w-3.5 text-[var(--brand-blue)]" />
        <span>{localeLabels[locale].short}</span>
      </button>
    );
  }

  if (variant === "full") {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {(Object.keys(localeLabels) as Locale[]).map((loc) => {
          const active = locale === loc;
          return (
            <button
              key={loc}
              type="button"
              onClick={() => setLocale(loc)}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
                active
                  ? "bg-[var(--brand-blue)] text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
              }`}
            >
              <span>{localeLabels[loc].flag}</span>
              <span>{localeLabels[loc].label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Default: Segmented pill (Single click toggle, highest usability)
  return (
    <div
      role="group"
      aria-label="Language selection"
      className={`inline-flex items-center rounded-xl border border-slate-200 bg-slate-50/80 p-0.5 shadow-sm ${className}`}
    >
      {(Object.keys(localeLabels) as Locale[]).map((loc) => {
        const active = locale === loc;
        const pillPad = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";
        return (
          <button
            key={loc}
            type="button"
            onClick={() => setLocale(loc)}
            aria-pressed={active}
            className={`rounded-lg ${pillPad} font-extrabold transition-all ${
              active
                ? "bg-[var(--brand-blue)] text-white shadow-sm shadow-blue-500/20"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {localeLabels[loc].short}
          </button>
        );
      })}
    </div>
  );
}
