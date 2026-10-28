"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { SOCIAL } from "@/lib/social";
import {
  canRequestTelegramContact,
  ensureTelegramWebAppReady,
  getTelegramWebAppUser,
  isInsideTelegram,
  openTelegramUrl,
  requestTelegramContact,
} from "@/lib/telegram-webapp";
import { shareTelegramContact } from "@/services/telegram.service";

const CHANNEL_DISMISS_KEY = "carramarket_tg_channel_dismissed";
const CONTACT_DONE_KEY = "carramarket_tg_contact_done";
const CONTACT_DISMISS_KEY = "carramarket_tg_contact_dismissed";

const STAFF_PATH = /^\/staffpanel(\/|$)/;

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

  const [insideTelegram, setInsideTelegram] = useState(false);
  const [canShareContact, setCanShareContact] = useState(false);
  const [showChannel, setShowChannel] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [contactBusy, setContactBusy] = useState(false);

  useEffect(() => {
    if (STAFF_PATH.test(pathname)) {
      setShowChannel(false);
      setShowContact(false);
      return;
    }

    let cancelled = false;
    let attempts = 0;

    const tick = () => {
      if (cancelled) return;
      ensureTelegramWebAppReady();
      const inside = isInsideTelegram();
      const canContact = canRequestTelegramContact();
      setInsideTelegram(inside);
      setCanShareContact(canContact);

      if (!readFlag(CHANNEL_DISMISS_KEY)) {
        setShowChannel(true);
      }

      const hasPhone = Boolean(user?.phone?.trim());
      // Prompt contact whenever the user is inside Telegram and we can request it
      // (Mini App), or we at least detected Telegram + no phone yet.
      if (
        inside &&
        !hasPhone &&
        !readFlag(CONTACT_DONE_KEY) &&
        !readFlag(CONTACT_DISMISS_KEY)
      ) {
        setShowContact(true);
      } else {
        setShowContact(false);
      }

      if (!inside && attempts < 12) {
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

  const markContactDone = useCallback(() => {
    writeFlag(CONTACT_DONE_KEY);
    setShowContact(false);
  }, []);

  const shareContact = useCallback(async () => {
    setContactBusy(true);
    try {
      if (!canRequestTelegramContact()) {
        // In Telegram browser but not Mini App — open bot so user can share contact there.
        openTelegramUrl(
          `https://t.me/${(process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "carramarket_bot").replace(/^@/, "")}`
        );
        return;
      }
      const result = await requestTelegramContact();
      if (!result.shared) {
        return;
      }

      // Telegram often delivers the phone only to the bot webhook (not the JS callback).
      // Always dismiss after the user allows sharing so the prompt does not return.
      markContactDone();

      const tgUser = getTelegramWebAppUser();
      const telegramId = result.userId || tgUser?.id;
      if (result.phone && telegramId) {
        const fullName = [
          result.firstName ?? tgUser?.first_name,
          result.lastName ?? tgUser?.last_name,
        ]
          .filter(Boolean)
          .join(" ")
          .trim();
        try {
          await shareTelegramContact({
            telegramId,
            phone: result.phone,
            fullName: fullName || undefined,
            username: tgUser?.username,
          });
          await refreshUser();
        } catch {
          /* webhook will still persist the contact */
        }
      }
    } catch {
      /* keep prompt only if share never completed */
    } finally {
      setContactBusy(false);
    }
  }, [markContactDone, refreshUser]);

  if (STAFF_PATH.test(pathname)) return null;
  if (!showChannel && !showContact) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col gap-3 p-3 sm:bottom-5 sm:left-auto sm:right-5 sm:max-w-[22rem] sm:p-0">
      {showContact && insideTelegram ? (
        <div className="pointer-events-auto overflow-hidden rounded-[22px] border border-white/70 bg-white shadow-[0_18px_50px_-18px_rgba(15,23,42,0.45)]">
          <div className="p-4">
            <p className="text-[15px] font-semibold tracking-tight text-slate-900">
              {t("telegram.contactTitle")}
            </p>
            <p className="mt-1 text-sm leading-snug text-slate-600">
              {t("telegram.contactBody")}
            </p>
            <div className="mt-3.5 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={contactBusy}
                onClick={() => void shareContact()}
                className="rounded-full bg-[#2AABEE] px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-[#2AABEE]/30 transition hover:bg-[#229ED9] disabled:opacity-60"
              >
                {contactBusy
                  ? t("telegram.contactSharing")
                  : canShareContact
                    ? t("telegram.shareContact")
                    : t("telegram.shareContact")}
              </button>
              <button
                type="button"
                onClick={dismissContact}
                className="rounded-full px-3.5 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100"
              >
                {t("telegram.maybeLater")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showChannel ? (
        <div className="pointer-events-auto relative overflow-hidden rounded-[22px] border border-[#8ec9a0]/55 shadow-[0_22px_55px_-20px_rgba(34,158,217,0.55)]">
          <div
            aria-hidden
            className="absolute inset-0 bg-[#c6e1b3]"
            style={{
              backgroundImage: "url(/telegram/chat-bg.webp)",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-b from-white/55 via-white/72 to-white/88 backdrop-blur-[1.5px]"
          />

          <div className="relative px-4 pb-4 pt-5 text-center">
            <div className="mx-auto flex h-[76px] w-[76px] items-center justify-center overflow-hidden rounded-full bg-black shadow-[0_12px_30px_-10px_rgba(15,23,42,0.45)] ring-[3px] ring-white/95">
              <Image
                src="/logo.png"
                alt="CarraMarket"
                width={76}
                height={76}
                className="h-full w-full object-cover object-center"
                priority
              />
            </div>

            <p className="mt-3.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#229ED9]">
              Telegram
            </p>
            <p className="mt-1 text-[17px] font-bold tracking-tight text-slate-900">
              {t("telegram.channelTitle")}
            </p>
            <p className="mx-auto mt-1.5 max-w-[16.5rem] text-[13.5px] leading-snug text-slate-600">
              {t("telegram.channelBody")}
            </p>

            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={joinChannel}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#2AABEE] px-4 py-2.5 text-[15px] font-semibold text-white shadow-[0_8px_20px_-6px_rgba(42,171,238,0.7)] transition hover:bg-[#229ED9] active:scale-[0.99]"
              >
                <svg
                  aria-hidden
                  viewBox="0 0 24 24"
                  className="h-4 w-4 fill-current"
                >
                  <path d="M9.78 18.65 10.17 14.3 18.05 7.3c.34-.31-.07-.46-.51-.19L7.74 13.18 3.5 11.85c-.91-.28-.92-.9.2-1.35L20.06 5.2c.76-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.9-.74 1.12-1.5.7l-4.15-3.05-2-.97.92-.9z" />
                </svg>
                {t("telegram.joinChannel")}
              </button>
              <button
                type="button"
                onClick={dismissChannel}
                className="w-full rounded-full px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-white/70"
              >
                {t("telegram.maybeLater")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
