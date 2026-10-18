"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  defaultLocale,
  locales,
  getTranslation,
  type Locale,
  type Translations,
} from "@/locales";

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  dict: Translations;
  t: (keyPath: string, params?: Record<string, string | number>) => string;
  formatCurrency: (amount: number) => string;
  formatDate: (
    date: Date | string | null | undefined,
    options?: Intl.DateTimeFormatOptions
  ) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "carramarket_locale";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  // Initialize from localStorage or navigator
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (saved && (saved === "en" || saved === "am")) {
        setLocaleState(saved);
        document.documentElement.lang = saved;
      } else {
        document.documentElement.lang = defaultLocale;
      }
    } catch {
      // Storage unavailable fallback
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(STORAGE_KEY, newLocale);
      document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
      document.documentElement.lang = newLocale;
    } catch {
      // Ignore storage errors
    }
  }, []);

  const dict = locales[locale] || locales[defaultLocale];

  const t = useCallback(
    (keyPath: string, params?: Record<string, string | number>) => {
      return getTranslation(locale, keyPath, params);
    },
    [locale]
  );

  const formatCurrency = useCallback(
    (n: number) => {
      const formatted = n.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      });
      return locale === "am" ? `${formatted} ብር` : `${formatted} ETB`;
    },
    [locale]
  );

  const formatDate = useCallback(
    (
      date: Date | string | null | undefined,
      options?: Intl.DateTimeFormatOptions
    ) => {
      if (!date) return "";
      const d = typeof date === "string" ? new Date(date) : date;
      if (Number.isNaN(d.getTime())) return "";

      const defaultOpts: Intl.DateTimeFormatOptions = {
        dateStyle: "medium",
        timeStyle: "short",
        ...options,
      };

      try {
        return new Intl.DateTimeFormat(
          locale === "am" ? "am-ET" : "en-US",
          defaultOpts
        ).format(d);
      } catch {
        return d.toLocaleString();
      }
    },
    [locale]
  );

  const value: LanguageContextValue = {
    locale,
    setLocale,
    dict,
    t,
    formatCurrency,
    formatDate,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}
