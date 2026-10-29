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
  const [showContact, setShowContact] = useState(false);
  const [showChannel, setShowChannel] = useState(false);
  const [contactBusy, setContactBusy] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);

  useEffect(() => {
    if (STAFF_PATH.test(pathname)) {
      setShowContact(false);
      setShowChannel(false);
      return;
    }

    let cancelled = false;
    let attempts = 0;
    let channelTimer: NodeJS.Timeout | null = null;

    const tick = () => {
      if (cancelled) return;
      ensureTelegramWebAppReady();
      const inside = isInsideTelegram();
      setInsideTelegram(inside);

      const hasPhone = Boolean(user?.phone?.trim());
      const needsContact =
        inside &&
        !hasPhone &&
        !readFlag(CONTACT_DONE_KEY) &&
        !readFlag(CONTACT_DISMISS_KEY);

      if (needsContact) {
        // Priority 1: ONLY show the Native Contact Verification sheet
        setShowContact(true);
        setShowChannel(false);
      } else {
        setShowContact(false);

        // Priority 2: Channel prompt only if contact is not needed,
        // and only after a polite delay so it never shocks the user on first glance.
        if (!readFlag(CHANNEL_DISMISS_KEY) && !channelTimer) {
          const delayMs = inside ? 12000 : 4000;
          channelTimer = setTimeout(() => {
            if (!cancelled) {
              setShowChannel(true);
            }
          }, delayMs);
        }
      }

      if (!inside && attempts < 12) {
        attempts += 1;
        window.setTimeout(tick, 250);
      }
    };

    tick();
    return () => {
      cancelled = true;
      if (channelTimer) clearTimeout(channelTimer);
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
    setContactSuccess(true);
    setTimeout(() => {
      setShowContact(false);
    }, 1200);
  }, []);

  const shareContact = useCallback(async () => {
    setContactBusy(true);
    try {
      if (!canRequestTelegramContact()) {
        openTelegramUrl(
          `https://t.me/${(process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "carramarket_bot").replace(/^@/, "")}`
        );
        return;
      }

      const result = await requestTelegramContact();
      if (!result.shared) {
        return;
      }

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

  return (
    <>
      {/* 
        Scenario 1: Native-style Telegram Contact Verification Bottom Sheet
        Displayed exclusively when a user in Telegram Mini App needs to link phone.
      */}
      {showContact && insideTelegram ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="tg-contact-title"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-200 sm:items-center sm:p-4"
        >
          <div className="w-full max-w-md overflow-hidden rounded-t-[28px] border-t border-slate-100 bg-white p-6 shadow-2xl transition-all animate-in slide-in-from-bottom duration-300 sm:rounded-[28px] sm:border">
            {/* Top Handlebar */}
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200 sm:hidden" />

            <div className="text-center">
              {/* Telegram Official Icon Badge */}
              <div className="relative mx-auto mb-3.5 flex h-16 w-16 items-center justify-center rounded-full bg-[#24A1DE]/10 text-[#24A1DE] ring-8 ring-[#24A1DE]/5">
                <svg
                  viewBox="0 0 24 24"
                  className="h-8 w-8 fill-current"
                  aria-hidden="true"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.37.74-.56 2.91-1.27 4.86-2.11 5.84-2.52 2.78-1.16 3.35-1.36 3.73-1.37.08 0 .27.02.39.12.1.08.13.19.14.27-.01.07.01.26-.01.4z" />
                </svg>
                {/* Verified Small Badge */}
                <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#24A1DE] text-white ring-2 ring-white">
                  <svg
                    className="h-3 w-3 fill-current"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
              </div>

              {/* Tag / Status */}
              <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[11.5px] font-semibold text-slate-600">
                <span>Carra Market</span>
                <span className="text-slate-300">•</span>
                <span className="text-[#24A1DE]">{t("telegram.verifiedBadge")}</span>
              </div>

              {/* Title & Description */}
              <h3
                id="tg-contact-title"
                className="mt-2.5 text-lg font-bold tracking-tight text-slate-900 sm:text-xl"
              >
                {t("telegram.contactTitle")}
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-600">
                {t("telegram.contactBody")}
              </p>

              {/* Success Notification */}
              {contactSuccess ? (
                <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700 animate-in fade-in">
                  ✓ {t("telegram.contactThanks")}
                </div>
              ) : (
                <>
                  {/* Action Buttons */}
                  <div className="mt-6 flex flex-col gap-2.5">
                    <button
                      type="button"
                      disabled={contactBusy}
                      onClick={() => void shareContact()}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#24A1DE] py-3.5 px-5 text-[15px] font-bold text-white shadow-lg shadow-[#24A1DE]/25 transition hover:bg-[#208fc4] active:scale-[0.98] disabled:opacity-60"
                    >
                      {contactBusy ? (
                        <>
                          <svg
                            className="h-4 w-4 animate-spin text-white"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8v8H4z"
                            />
                          </svg>
                          <span>{t("telegram.contactSharing")}</span>
                        </>
                      ) : (
                        <>
                          <svg
                            viewBox="0 0 24 24"
                            className="h-4 w-4 fill-current"
                            aria-hidden="true"
                          >
                            <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                          </svg>
                          <span>{t("telegram.shareContact")}</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={dismissContact}
                      className="w-full rounded-xl py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                    >
                      {t("telegram.maybeLater")}
                    </button>
                  </div>

                  {/* Trust Footer */}
                  <div className="mt-3 text-[11px] font-medium text-slate-400">
                    🔒 {t("telegram.privacyNote")}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* 
        Scenario 2: Join Telegram Channel Card
        Shown ONLY when contact prompt is NOT active, and after a polite delay.
      */}
      {showChannel && !showContact ? (
        <div className="fixed inset-x-3 bottom-3 z-40 flex justify-center sm:bottom-5 sm:left-auto sm:right-5 sm:max-w-[22rem]">
          <div className="relative w-full overflow-hidden rounded-[24px] border border-[#8ec9a0]/50 shadow-[0_20px_50px_-15px_rgba(34,158,217,0.45)] transition-all animate-in slide-in-from-bottom duration-300">
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
              className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/75 to-white/90 backdrop-blur-[2px]"
            />

            <div className="relative px-5 pb-5 pt-5 text-center">
              <div className="mx-auto flex h-[68px] w-[68px] items-center justify-center overflow-hidden rounded-full bg-black shadow-[0_10px_25px_-8px_rgba(15,23,42,0.4)] ring-[3px] ring-white">
                <Image
                  src="/logo.png"
                  alt="CarraMarket"
                  width={68}
                  height={68}
                  className="h-full w-full object-cover object-center"
                  priority
                />
              </div>

              <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[#229ED9]">
                Telegram
              </p>
              <p className="mt-0.5 text-base font-bold tracking-tight text-slate-900">
                {t("telegram.channelTitle")}
              </p>
              <p className="mx-auto mt-1 max-w-[16rem] text-xs leading-snug text-slate-600">
                {t("telegram.channelBody")}
              </p>

              <div className="mt-4 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={joinChannel}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#2AABEE] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#2AABEE]/30 transition hover:bg-[#229ED9] active:scale-[0.98]"
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
                  className="w-full rounded-full py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-white/80"
                >
                  {t("telegram.maybeLater")}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
