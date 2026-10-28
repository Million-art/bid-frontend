"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { SOCIAL } from "@/lib/social";
import {
  ensureTelegramWebAppReady,
  getTelegramWebAppUser,
  isTelegramMiniApp,
  openTelegramUrl,
  requestTelegramContact,
} from "@/lib/telegram-webapp";
import { shareTelegramContact } from "@/services/telegram.service";

const CHANNEL_DISMISS_KEY = "carramarket_tg_channel_dismissed";
const CONTACT_DONE_KEY = "carramarket_tg_contact_done";
const CONTACT_DISMISS_KEY = "carramarket_tg_contact_dismissed";

const SKIP_PATH =
  /^\/(login|signup|forgot-password|set-password|staffpanel)(\/|$)/;

function readFlag(key: string): boolean {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function writeFlag(key: string): void {
  try {
    localStorage.setItem(key, "1");
  } catch {
    /* ignore */
  }
}

export function TelegramPrompts() {
  const pathname = usePathname() || "";
  const { t } = useLanguage();
  const { user, refreshUser } = useAuth();

  const [inMiniApp, setInMiniApp] = useState(false);
  const [showChannel, setShowChannel] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [contactBusy, setContactBusy] = useState(false);

  useEffect(() => {
    if (SKIP_PATH.test(pathname)) {
      setShowChannel(false);
      setShowContact(false);
      return;
    }

    let cancelled = false;
    let attempts = 0;

    const tick = () => {
      if (cancelled) return;
      ensureTelegramWebAppReady();
      const mini = isTelegramMiniApp();
      setInMiniApp(mini);

      if (!readFlag(CHANNEL_DISMISS_KEY)) {
        setShowChannel(true);
      }

      const hasPhone = Boolean(user?.phone?.trim());
      if (
        mini &&
        !hasPhone &&
        !readFlag(CONTACT_DONE_KEY) &&
        !readFlag(CONTACT_DISMISS_KEY)
      ) {
        setShowContact(true);
      } else {
        setShowContact(false);
      }

      // WebApp script may load after first paint.
      if (!mini && attempts < 8) {
        attempts += 1;
        window.setTimeout(tick, 250);
      }
    };

    tick();
    return () => {
      cancelled = true;
    };
  }, [pathname, user?.phone]);

  const dismissChannel = useCallback(() => {
    writeFlag(CHANNEL_DISMISS_KEY);
    setShowChannel(false);
  }, []);

  const joinChannel = useCallback(() => {
    openTelegramUrl(SOCIAL.telegram);
    writeFlag(CHANNEL_DISMISS_KEY);
    setShowChannel(false);
  }, []);

  const dismissContact = useCallback(() => {
    writeFlag(CONTACT_DISMISS_KEY);
    setShowContact(false);
  }, []);

  const shareContact = useCallback(async () => {
    setContactBusy(true);
    try {
      const result = await requestTelegramContact();
      if (!result.shared || !result.phone) {
        return;
      }
      const tgUser = getTelegramWebAppUser();
      const telegramId = result.userId || tgUser?.id;
      if (!telegramId) {
        return;
      }
      const fullName = [result.firstName ?? tgUser?.first_name, result.lastName ?? tgUser?.last_name]
        .filter(Boolean)
        .join(" ")
        .trim();
      await shareTelegramContact({
        telegramId,
        phone: result.phone,
        fullName: fullName || undefined,
        username: tgUser?.username,
      });
      writeFlag(CONTACT_DONE_KEY);
      setShowContact(false);
      try {
        await refreshUser();
      } catch {
        /* ignore */
      }
    } catch {
      /* user cancelled or network error — keep prompt */
    } finally {
      setContactBusy(false);
    }
  }, [refreshUser]);

  if (SKIP_PATH.test(pathname)) return null;
  if (!showChannel && !showContact) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col gap-2 p-3 sm:bottom-4 sm:left-auto sm:right-4 sm:max-w-sm sm:p-0">
      {showContact && inMiniApp ? (
        <div className="pointer-events-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-lg shadow-slate-900/10">
          <p className="text-sm font-semibold text-slate-900">
            {t("telegram.contactTitle")}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {t("telegram.contactBody")}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={contactBusy}
              onClick={() => void shareContact()}
              className="rounded-xl bg-brand-blue px-3.5 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {contactBusy
                ? t("telegram.contactSharing")
                : t("telegram.shareContact")}
            </button>
            <button
              type="button"
              onClick={dismissContact}
              className="rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              {t("telegram.maybeLater")}
            </button>
          </div>
        </div>
      ) : null}

      {showChannel ? (
        <div className="pointer-events-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-lg shadow-slate-900/10">
          <p className="text-sm font-semibold text-slate-900">
            {t("telegram.channelTitle")}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {t("telegram.channelBody")}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={joinChannel}
              className="rounded-xl bg-[#229ED9] px-3.5 py-2 text-sm font-semibold text-white"
            >
              {t("telegram.joinChannel")}
            </button>
            <button
              type="button"
              onClick={dismissChannel}
              className="rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              {t("telegram.maybeLater")}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
