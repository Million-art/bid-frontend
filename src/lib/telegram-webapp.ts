/** Telegram Mini App / in-app browser helpers. */

export type TelegramWebAppUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
};

export type TelegramWebAppContact = {
  contact: {
    phone_number: string;
    first_name?: string;
    last_name?: string;
    user_id?: number;
  };
};

type TelegramWebApp = {
  initData?: string;
  initDataUnsafe?: {
    user?: TelegramWebAppUser;
    auth_date?: number;
    hash?: string;
  };
  platform?: string;
  version?: string;
  ready?: () => void;
  expand?: () => void;
  requestContact?: (
    callback?: (shared: boolean, response?: TelegramWebAppContact) => void
  ) => void;
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
    // Script is present and Telegram filled platform (Mini App / TG browser).
    return true;
  }

  const ua = navigator.userAgent || "";
  if (/Telegram/i.test(ua)) return true;
  if (/\bTG\//i.test(ua)) return true;
  // Some Android Telegram WebViews
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

/**
 * Ask the user to share their phone via Telegram's native contact sheet.
 * Only works inside a real Mini App session.
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
    try {
      wa.requestContact?.((shared, response) => {
        if (!shared || !response?.contact?.phone_number) {
          resolve({ shared: false });
          return;
        }
        resolve({
          shared: true,
          phone: response.contact.phone_number,
          firstName: response.contact.first_name,
          lastName: response.contact.last_name,
          userId: response.contact.user_id,
        });
      });
    } catch {
      resolve({ shared: false });
    }
  });
}
