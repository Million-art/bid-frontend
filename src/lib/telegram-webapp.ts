/** Telegram Mini App (WebApp) helpers. */

export type TelegramWebAppUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
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
  };
  ready?: () => void;
  expand?: () => void;
  requestContact?: (
    callback?: (shared: boolean, response?: TelegramWebAppContact) => void
  ) => void;
  openTelegramLink?: (url: string) => void;
  openLink?: (url: string) => void;
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

/** True when the page is running inside Telegram's Mini App WebView. */
export function isTelegramMiniApp(): boolean {
  const wa = getTelegramWebApp();
  if (!wa) return false;
  if (wa.initData && wa.initData.length > 0) return true;
  if (wa.initDataUnsafe?.user?.id) return true;
  return false;
}

export function getTelegramWebAppUser(): TelegramWebAppUser | null {
  const user = getTelegramWebApp()?.initDataUnsafe?.user;
  if (!user?.id) return null;
  return user;
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
 * Falls back to false when the API is unavailable.
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
