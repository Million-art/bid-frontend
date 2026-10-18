import { en, type Translations } from "./en";
import { am } from "./am";

export type Locale = "en" | "am";

export const defaultLocale: Locale = "en";

export const locales: Record<Locale, Translations> = {
  en,
  am,
};

export const localeLabels: Record<Locale, { label: string; short: string; flag: string }> = {
  en: { label: "English", short: "EN", flag: "🇬🇧" },
  am: { label: "አማርኛ", short: "አማ", flag: "🇪🇹" },
};

/**
 * Access a nested translation string by dot notation path (e.g. "nav.auctions").
 * Falls back to English if the translation is missing in the requested locale.
 */
export function getTranslation(
  locale: Locale,
  keyPath: string,
  params?: Record<string, string | number>
): string {
  const currentDict = locales[locale] || locales[defaultLocale];
  const fallbackDict = locales[defaultLocale];

  const value = getNestedValue(currentDict, keyPath) ?? getNestedValue(fallbackDict, keyPath);

  if (typeof value !== "string") {
    return keyPath;
  }

  if (!params) {
    return value;
  }

  return Object.entries(params).reduce((acc, [paramKey, paramVal]) => {
    return acc.replace(new RegExp(`\\{${paramKey}\\}`, "g"), String(paramVal));
  }, value);
}

function getNestedValue(obj: unknown, path: string): unknown {
  if (!obj || typeof obj !== "object") return undefined;
  const parts = path.split(".");
  let current: any = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = current[part];
  }
  return current;
}

export { en, am };
export type { Translations };
