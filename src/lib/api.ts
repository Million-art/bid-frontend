export const getApiBase = (): string => {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:8081";
    }
    return process.env.NEXT_PUBLIC_API_URL || "https://clientbackend.carramarket.com";
  }
  return (
    process.env.NEXT_PUBLIC_API_URL ||
    "https://clientbackend.carramarket.com"
  );
};

let csrfToken: string | null = null;
let csrfPromise: Promise<string> | null = null;

/** Clear cached CSRF (e.g. after CSRF_INVALID or cookie rotation). */
export function resetCsrfToken(): void {
  csrfToken = null;
  csrfPromise = null;
}

/**
 * Seed the in-memory CSRF token after an auth response delivers a fresh one.
 * Avoids a separate `/csrf-token` round-trip and keeps the cached token bound to the new jti.
 */
export function setCsrfToken(token: string | null | undefined): void {
  const t = typeof token === "string" ? token.trim() : "";
  if (!t) {
    csrfToken = null;
    csrfPromise = null;
    return;
  }
  csrfToken = t;
  csrfPromise = Promise.resolve(t);
}

async function fetchFreshCsrfToken(): Promise<string> {
  const apiBase = getApiBase();
  const r = await fetch(`${apiBase}/api/csrf-token`, { credentials: "include" });
  if (!r.ok) {
    throw new Error(`CSRF token request failed (${r.status})`);
  }
  const j = (await r.json()) as { data?: { token?: string } };
  const t = typeof j?.data?.token === "string" ? j.data.token.trim() : "";
  if (!t) {
    throw new Error("CSRF token missing in API response");
  }
  csrfToken = t;
  return t;
}

/** Fetch and cache CSRF token. Required for POST/PUT/DELETE/PATCH. */
export async function getCsrfToken(): Promise<string> {
  if (csrfToken) return csrfToken;
  if (!csrfPromise) {
    csrfPromise = (async () => {
      try {
        return await fetchFreshCsrfToken();
      } catch (e) {
        csrfPromise = null;
        throw e;
      }
    })();
  }
  return csrfPromise;
}

/**
 * Drops cached CSRF and fetches a new token so the header matches the HttpOnly cookie.
 * Use before auth credential POSTs (e.g. Google) when a stale cache can cause false CSRF failures.
 */
export async function syncCsrfToken(): Promise<void> {
  resetCsrfToken();
  await getCsrfToken();
}

/** Do not treat 401 on these paths as “expired session”   refresh would not help and can confuse errors. */
function shouldSkipAuthRefreshOn401(path: string): boolean {
  if (path.includes("/auth/refresh")) return true;
  return (
    path.includes("/auth/login") ||
    path.includes("/auth/google") ||
    path.includes("/auth/signup") ||
    path.includes("/auth/send-otp") ||
    path.includes("/auth/verify-otp") ||
    path.includes("/auth/forgot-password/")
  );
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error?: string;
}

function trimNonEmpty(s: unknown): string | null {
  if (typeof s !== "string") return null;
  const t = s.trim();
  return t.length > 0 ? t : null;
}

/**
 * Extract user-facing error message from API JSON (or non-JSON) error response.
 * Prefers `message` over machine `error` codes.
 */
function extractErrorMessage(body: unknown, status: number, statusText: string): string {
  const generic =
    status >= 500
      ? "Something went wrong. Please try again in a moment."
      : statusText || `Request failed (${status})`;

  if (!body || typeof body !== "object") {
    return generic;
  }
  const o = body as Record<string, unknown>;
  const msg =
    trimNonEmpty(o.message) ||
    trimNonEmpty(o.msg) ||
    (() => {
      const data = o.data;
      if (data && typeof data === "object") {
        const d = data as Record<string, unknown>;
        return trimNonEmpty(d.message) || trimNonEmpty(d.error);
      }
      return null;
    })();
  if (msg) return msg;

  const errCode = trimNonEmpty(o.error);
  if (errCode && errCode !== "INTERNAL_ERROR" && errCode.length < 80) {
    return errCode;
  }
  return generic;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ApiFetchOptions = RequestInit & {
  skipAuthRedirect?: boolean;
  /**
   * When true, treat `path` as already absolute (do not prepend NEXT_PUBLIC_API_URL).
   * Use for same-origin Next.js BFF routes that we still want CSRF-token-protected.
   */
  sameOrigin?: boolean;
  /** Internal: retry once after refreshing CSRF (do not set from app code). */
  _csrfRetry?: boolean;
};

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
  _isRetry = false
): Promise<T> {
  const { skipAuthRedirect, sameOrigin, _csrfRetry, ...fetchInit } = options;
  const apiBase = getApiBase();
  const url = sameOrigin || path.startsWith("http") ? path : `${apiBase}${path}`;
  const method = (fetchInit.method || "GET").toUpperCase();
  const isStateChange = ["POST", "PUT", "DELETE", "PATCH"].includes(method);
  // FormData bodies need the browser to set the multipart Content-Type (with its
  // own boundary). Forcing application/json there would break the upload.
  const isFormData = typeof FormData !== "undefined" && fetchInit.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(fetchInit.headers as Record<string, string>),
  };
  if (isStateChange) {
    const token = await getCsrfToken();
    headers["X-CSRF-Token"] = token;
  }

  const res = await fetch(url, {
    ...fetchInit,
    credentials: "include",
    headers,
  });

  if (res.status === 401 && !_isRetry && !shouldSkipAuthRefreshOn401(path)) {
    try {
      const csrf = await getCsrfToken();
      const refreshRes = await fetch(`${apiBase}/api/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrf,
        },
      });

      if (refreshRes.ok) {
        return apiFetch(path, options, true);
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
    }

    if (!skipAuthRedirect && typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
    }
  }

  if (!res.ok) {
    const text = await res.text();
    let body: unknown = {};
    if (text) {
      try {
        body = JSON.parse(text) as unknown;
      } catch {
        body = {};
      }
    }
    const message = extractErrorMessage(body, res.status, res.statusText);
    const finalMessage = trimNonEmpty(message) ?? (res.status >= 500 ? "Something went wrong. Please try again." : `Request failed (${res.status})`);
    const code =
      body && typeof body === "object" && "error" in body && typeof (body as { error?: string }).error === "string"
        ? (body as { error: string }).error
        : undefined;

    if (res.status === 403 && code === "CSRF_INVALID" && !_csrfRetry && isStateChange) {
      resetCsrfToken();
      try {
        await getCsrfToken();
        return apiFetch<T>(path, { ...fetchInit, skipAuthRedirect, sameOrigin, _csrfRetry: true }, _isRetry);
      } catch {
        /* fall through to throw */
      }
    }

    throw new ApiError(finalMessage, res.status, code);
  }

  const parsed = (await res.json()) as T;
  // Backend auth responses (login/signup/refresh/google/etc.) deliver a fresh `csrfToken`
  // bound to the new access-token jti. Seed the in-memory cache so we don't need an extra
  // `/csrf-token` round-trip and don't replay a token bound to the old jti.
  const fresh = (parsed as { data?: { csrfToken?: unknown } } | null)?.data?.csrfToken;
  if (typeof fresh === "string" && fresh) {
    setCsrfToken(fresh);
  }
  return parsed;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const m = error.message?.trim();
    if (m) return m;
    return error.status >= 500
      ? "Something went wrong. Please try again."
      : `Request failed (${error.status})`;
  }
  if (error instanceof Error) {
    const m = error.message?.trim();
    return m || "An unexpected error occurred";
  }
  return "An unexpected error occurred";
}
