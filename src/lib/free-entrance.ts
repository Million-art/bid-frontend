/**
 * Free-entrance promo helpers shared by the staff form.
 *
 * Mirrors the backend rules (`domain.ParseFreeEntranceLimit`): the staff text box accepts a whole
 * number ("10", "100", "2500"), thousands shorthand ("1k", "25k") or "all" (no cap). The server
 * re-validates everything; this only gives staff instant, precise feedback.
 */

/** Stored/wire value meaning "all": every eligible joiner gets a free entrance. */
export const FREE_ENTRANCE_UNLIMITED = 0;
export const DEFAULT_FREE_ENTRANCE_LIMIT = 100;
export const MAX_FREE_ENTRANCE_LIMIT = 1_000_000;

export type FreeEntranceLimitParse =
  | { ok: true; limit: number; canonical: string }
  | { ok: false; error: string };

export function parseFreeEntranceLimit(raw: string): FreeEntranceLimitParse {
  const s = raw.trim().toLowerCase();
  if (s === "") {
    return { ok: false, error: 'Enter a number like 100 or 1k, or "all"' };
  }
  if (s === "all" || s === "unlimited") {
    return { ok: true, limit: FREE_ENTRANCE_UNLIMITED, canonical: "all" };
  }

  const match = /^(\d{1,7})(k?)$/.exec(s);
  if (!match) {
    return {
      ok: false,
      error: 'Use a whole number (e.g. 10, 100), thousands (e.g. 1k) or "all"',
    };
  }
  const limit = Number(match[1]) * (match[2] === "k" ? 1000 : 1);
  if (limit < 1) {
    return { ok: false, error: 'Must be at least 1 (use "all" for no limit)' };
  }
  if (limit > MAX_FREE_ENTRANCE_LIMIT) {
    return {
      ok: false,
      error: `Cannot exceed ${MAX_FREE_ENTRANCE_LIMIT.toLocaleString("en-US")}`,
    };
  }
  return { ok: true, limit, canonical: String(limit) };
}

/** Text-box value for a stored limit (0 -> "all"). */
export function formatFreeEntranceLimit(limit: number | null | undefined): string {
  if (limit == null) return String(DEFAULT_FREE_ENTRANCE_LIMIT);
  return limit === FREE_ENTRANCE_UNLIMITED ? "all" : String(limit);
}
