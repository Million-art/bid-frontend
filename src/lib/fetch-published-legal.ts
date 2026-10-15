/**
 * Privacy & Terms HTML lives in Postgres (`platform_legal_documents`), written by staff via admin-backend.
 * Participant app reads it through **client-backend** `GET /api/public/legal/:docType` (same DB).
 *
 * - `NEXT_PUBLIC_API_URL`: public API origin only, no `/api` suffix (browser + SSR fallback).
 * - `CLIENT_BACKEND_INTERNAL_URL` (optional): server-side first choice in Docker, e.g. `http://client-backend:8081`.
 *   If that URL is misconfigured or unreachable, we **fall back** to `NEXT_PUBLIC_API_URL` so the public site
 *   still loads published legal HTML instead of the placeholder.
 */

export type LegalDocKey = "privacy" | "terms";

export type PublishedLegalPayload = {
  contentHtml: string;
  updatedAt: string | null;
};

function normalizeOrigin(raw: string | undefined): string | null {
  const t = raw?.trim().replace(/\/$/, "");
  return t || null;
}

/** Ordered list of origins to try (no duplicates). Browser: public only. Server: internal then public. */
function legalApiOrigins(): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (raw: string | undefined) => {
    const o = normalizeOrigin(raw);
    if (o && !seen.has(o)) {
      seen.add(o);
      out.push(o);
    }
  };
  if (typeof window === "undefined") {
    push(process.env.CLIENT_BACKEND_INTERNAL_URL);
  }
  push(process.env.NEXT_PUBLIC_API_URL);
  return out;
}

type TryFetchResult =
  | { kind: "ok"; payload: PublishedLegalPayload }
  | { kind: "empty" }
  | { kind: "retry" };

async function tryFetchPublishedLegal(
  origin: string,
  doc: LegalDocKey
): Promise<TryFetchResult> {
  try {
    const res = await fetch(`${origin}/api/public/legal/${doc}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return { kind: "retry" };

    const body = (await res.json()) as {
      data?: { contentHtml?: string; updatedAt?: string | null };
    };
    const contentHtml = (body?.data?.contentHtml ?? "").trim();
    if (!contentHtml) return { kind: "empty" };

    const u = body?.data?.updatedAt;
    const updatedAt =
      u != null && String(u).trim() !== "" ? String(u) : null;

    return { kind: "ok", payload: { contentHtml, updatedAt } };
  } catch {
    return { kind: "retry" };
  }
}

export async function fetchPublishedLegalDoc(
  doc: LegalDocKey
): Promise<PublishedLegalPayload | null> {
  const origins = legalApiOrigins();
  if (origins.length === 0) return null;

  for (const origin of origins) {
    const r = await tryFetchPublishedLegal(origin, doc);
    if (r.kind === "ok") return r.payload;
    if (r.kind === "empty") return null;
  }
  return null;
}
