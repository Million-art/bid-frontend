/** Telegram Mini App / in-app browser helpers. */

export type TelegramWebAppUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
};

export type TelegramWebAppContact = {
  contact?: {
    phone_number?: string;
    first_name?: string;
    last_name?: string;
    user_id?: number;
  };
  responseUnsafe?: {
    contact?: {
      phone_number?: string;
      first_name?: string;
      last_name?: string;
      user_id?: number;
    };
  };
};

type TelegramWebApp = {
  initData?: string;
  initDataUnsafe?: {
    user?: TelegramWebAppUser;
    auth_date?: number;
    hash?: string;
    start_param?: string;
  };
  platform?: string;
  version?: string;
  ready?: () => void;
  expand?: () => void;
  requestContact?: (
    callback?: (
      shared: boolean | string,
      response?: TelegramWebAppContact
    ) => void
  ) => void;
  onEvent?: (eventType: string, callback: (...args: unknown[]) => void) => void;
  offEvent?: (eventType: string, callback: (...args: unknown[]) => void) => void;
  openTelegramLink?: (url: string) => void;
  openLink?: (url: string, options?: { try_instant_view?: boolean }) => void;
};

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

export function getTelegramWebApp(): TelegramWebApp | null {
  if (typeof window === "undefined") return null;
  return window.Telegram?.WebApp ?? null;
}

/** True when opened as a Telegram Mini App with signed initData. */
export function isTelegramMiniApp(): boolean {
  const wa = getTelegramWebApp();
  if (!wa) return false;
  if (wa.initData && wa.initData.length > 0) return true;
  if (wa.initDataUnsafe?.user?.id) return true;
  return false;
}

/**
 * True when the page is running inside Telegram (Mini App or Telegram in-app browser).
 * Broader than isTelegramMiniApp — used for contact / channel prompts.
 */
export function isInsideTelegram(): boolean {
  if (typeof window === "undefined") return false;
  if (isTelegramMiniApp()) return true;

  const wa = getTelegramWebApp();
  if (wa?.platform && wa.platform !== "unknown" && wa.platform !== "") {
    return true;
  }

  const ua = navigator.userAgent || "";
  if (/Telegram/i.test(ua)) return true;
  if (/\bTG\//i.test(ua)) return true;
  if (/TelegramBot/i.test(ua)) return true;

  return false;
}

export function canRequestTelegramContact(): boolean {
  return Boolean(getTelegramWebApp()?.requestContact) && isTelegramMiniApp();
}

export function getTelegramWebAppUser(): TelegramWebAppUser | null {
  const user = getTelegramWebApp()?.initDataUnsafe?.user;
  if (!user?.id) return null;
  return user;
}

export function getTelegramInitData(): string {
  return (getTelegramWebApp()?.initData || "").trim();
}

export function ensureTelegramWebAppReady(): void {
  const wa = getTelegramWebApp();
  if (!wa) return;
  try {
    wa.ready?.();
    wa.expand?.();
  } catch {
    /* ignore */
  }
}

export function openTelegramUrl(url: string): void {
  const wa = getTelegramWebApp();
  if (wa?.openTelegramLink && url.includes("t.me/")) {
    wa.openTelegramLink(url);
    return;
  }
  if (wa?.openLink) {
    wa.openLink(url);
    return;
  }
  if (typeof window !== "undefined") {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

function extractContact(response?: TelegramWebAppContact): {
  phone?: string;
  firstName?: string;
  lastName?: string;
  userId?: number;
} {
  const c = response?.contact ?? response?.responseUnsafe?.contact;
  if (!c?.phone_number) return {};
  return {
    phone: c.phone_number,
    firstName: c.first_name,
    lastName: c.last_name,
    userId: c.user_id,
  };
}

/**
 * Ask the user to share their phone via Telegram's native contact sheet.
 *
 * Note: older Telegram clients only send the contact to the bot webhook and
 * call the Mini App callback with `true` (no phone payload). Treat that as success.
 */
export function requestTelegramContact(): Promise<{
  shared: boolean;
  phone?: string;
  firstName?: string;
  lastName?: string;
  userId?: number;
}> {
  const wa = getTelegramWebApp();
  if (!wa?.requestContact) {
    return Promise.resolve({ shared: false });
  }

  return new Promise((resolve) => {
    let settled = false;
    const finish = (shared: boolean, response?: TelegramWebAppContact) => {
      if (settled) return;
      settled = true;
      if (wa.offEvent && onContactRequested) {
        try {
          wa.offEvent("contactRequested", onContactRequested);
        } catch {
          /* ignore */
        }
      }
      if (!shared) {
        resolve({ shared: false });
        return;
      }
      resolve({ shared: true, ...extractContact(response) });
    };

    const onContactRequested = (...args: unknown[]) => {
      const event = args[0] as
        | { status?: string; response?: TelegramWebAppContact }
        | undefined;
      const status = String(event?.status || "").toLowerCase();
      if (status === "sent" || status === "shared") {
        finish(true, event?.response);
      } else if (status === "cancelled" || status === "canceled") {
        finish(false);
      }
    };

    try {
      wa.onEvent?.("contactRequested", onContactRequested);
      wa.requestContact?.((shared, response) => {
        const ok =
          shared === true ||
          shared === "sent" ||
          shared === "shared" ||
          String(shared).toLowerCase() === "true";
        finish(ok, response);
      });
    } catch {
      finish(false);
    }

    // Safety timeout so the UI never spins forever.
    window.setTimeout(() => {
      if (!settled) finish(false);
    }, 60_000);
  });
}

/**
 * Extracts deep-link start_param from Telegram WebApp or URL search/hash params.
 * E.g. "auction_6ed3fc7e-1261-4303-8c65-a29ff5242e7e"
 */
export function getTelegramStartParam(): string | null {
  if (typeof window === "undefined") return null;

  // 1. Check window.Telegram.WebApp.initDataUnsafe.start_param
  const wa = getTelegramWebApp();
  if (wa?.initDataUnsafe?.start_param) {
    return wa.initDataUnsafe.start_param;
  }

  // 2. Check URL search params (tgWebAppStartParam or startapp or start_param)
  try {
    const params = new URLSearchParams(window.location.search);
    const fromQuery =
      params.get("tgWebAppStartParam") ||
      params.get("startapp") ||
      params.get("start_param");
    if (fromQuery) return fromQuery;

    // 3. Check hash for tgWebAppStartParam or tgWebAppData
    if (window.location.hash) {
      const hashString = window.location.hash.replace(/^#/, "");
      const hashParams = new URLSearchParams(hashString);
      const fromHash =
        hashParams.get("tgWebAppStartParam") ||
        hashParams.get("startapp") ||
        hashParams.get("start_param");
      if (fromHash) return fromHash;

      // Check tgWebAppData embedded query string if present
      const rawData = hashParams.get("tgWebAppData");
      if (rawData) {
        const dataParams = new URLSearchParams(rawData);
        const fromData = dataParams.get("start_param");
        if (fromData) return fromData;
      }
    }
  } catch {
    /* ignore */
  }

  return null;
}

/**
 * Strips 'auction_' prefix from start_param to get raw auction UUID.
 * Supports both "auction_6ed3fc7e-..." and legacy "6ed3fc7e-..."
 */
export function extractAuctionIdFromStartParam(
  param: string | null | undefined
): string | null {
  if (!param) return null;
  const trimmed = param.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("auction_")) {
    return trimmed.slice("auction_".length).trim();
  }
  return trimmed;
}

