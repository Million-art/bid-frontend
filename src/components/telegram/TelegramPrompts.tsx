"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { SOCIAL } from "@/lib/social";
import {
  canRequestTelegramContact,
  ensureTelegramWebAppReady,
  getTelegramWebApp,
  getTelegramWebAppUser,
  isInsideTelegram,
  openTelegramUrl,
  requestTelegramContact,
} from "@/lib/telegram-webapp";
import { shareTelegramContact } from "@/services/telegram.service";

const CONTACT_PROMPTED_SESSION_KEY = "carramarket_tg_contact_prompted";
const CHANNEL_DISMISS_KEY = "carramarket_tg_channel_dismissed";
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

/**
 * Native Telegram phone verification (untouched) + Join Channel card popup.
 * Contact uses Telegram.WebApp.showPopup / requestContact.
 * Channel join is a cached custom card restored from earlier UX.
 */
export function TelegramPrompts() {
  const pathname = usePathname() || "";
  const { t } = useLanguage();
  const { user, loading: authLoading, refreshUser } = useAuth();
  const busyRef = useRef(false);
  const [showChannel, setShowChannel] = useState(false);
  const [contactPromptActive, setContactPromptActive] = useState(false);

  const handleRequestContact = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;

    try {
      if (!canRequestTelegramContact()) {
        return;
      }

      const result = await requestTelegramContact();
      if (!result.shared) {
        return;
      }

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
      } else {
        // Older Telegram clients send contact only to the bot webhook; poll briefly then refresh user
        window.setTimeout(() => {
          void refreshUser();
        }, 1500);
      }
    } catch {
      /* ignore */
    } finally {
      busyRef.current = false;
      setContactPromptActive(false);
    }
  }, [refreshUser]);

  // Existing native phone-share flow — logic unchanged.
  useEffect(() => {
    if (STAFF_PATH.test(pathname)) {
      return;
    }

    // Wait until AuthContext finishes loading the user profile from the backend
    // so we don't prompt users who already shared their contact previously.
    if (authLoading || !user) {
      return;
    }

    // Only run if user is inside Telegram and phone is not yet verified in the database
    const hasPhone = Boolean(user.phone?.trim());
    if (hasPhone) {
      return;
    }

    try {
      if (sessionStorage.getItem(CONTACT_PROMPTED_SESSION_KEY) === "1") {
        return;
      }
    } catch {
      /* ignore */
    }

    let cancelled = false;
    let attempts = 0;

    const triggerNativeDialog = () => {
      if (cancelled) return;
      ensureTelegramWebAppReady();

      const inside = isInsideTelegram();
      if (!inside) {
        if (attempts < 8) {
          attempts += 1;
          window.setTimeout(triggerNativeDialog, 300);
        }
        return;
      }

      // Mark session as prompted so it never pesters the user repeatedly
      try {
        sessionStorage.setItem(CONTACT_PROMPTED_SESSION_KEY, "1");
      } catch {
        /* ignore */
      }

      const wa = getTelegramWebApp();
      if (!wa) return;

      setContactPromptActive(true);

      // Small delay so the Telegram Mini App view is completely settled
      window.setTimeout(() => {
        if (cancelled) return;

        // Use Telegram client's real native popup
        if (typeof wa.showPopup === "function") {
          wa.showPopup(
            {
              title: "Verify Phone Number",
              message:
                "Please share your phone number with Carra Market to verify your account, place bids, and receive win notifications.",
              buttons: [
                { id: "share", type: "default", text: "Share Phone" },
                { id: "cancel", type: "cancel" },
              ],
            },
            (buttonId) => {
              if (buttonId === "share") {
                void handleRequestContact();
              } else {
                setContactPromptActive(false);
              }
            }
          );
        } else if (typeof wa.requestContact === "function") {
          // Fallback directly to Telegram's native contact sheet if showPopup is unavailable
          void handleRequestContact();
        } else {
          setContactPromptActive(false);
        }
      }, 1000);
    };

    triggerNativeDialog();

    return () => {
      cancelled = true;
    };
  }, [pathname, authLoading, user, handleRequestContact]);

  // Join-channel card — restored; cached via localStorage; does not alter contact flow.
  useEffect(() => {
    if (STAFF_PATH.test(pathname)) {
      setShowChannel(false);
      return;
    }
    if (readFlag(CHANNEL_DISMISS_KEY)) {
      setShowChannel(false);
      return;
    }
    if (contactPromptActive) {
      setShowChannel(false);
      return;
    }

    let cancelled = false;
    let attempts = 0;
    let channelTimer: ReturnType<typeof setTimeout> | null = null;
    let pollTimer: ReturnType<typeof setTimeout> | null = null;

    const armChannelTimer = (inside: boolean) => {
      if (channelTimer || cancelled) return;
      // Delay: longer inside Telegram so contact dialog can go first.
      const delayMs = inside ? 12000 : 4000;
      channelTimer = setTimeout(() => {
        if (cancelled || readFlag(CHANNEL_DISMISS_KEY) || contactPromptActive) {
          return;
        }
        setShowChannel(true);
      }, delayMs);
    };

    const poll = () => {
      if (cancelled) return;
      ensureTelegramWebAppReady();
      const inside = isInsideTelegram();
      armChannelTimer(inside);
      if (!inside && attempts < 12) {
        attempts += 1;
        pollTimer = setTimeout(poll, 250);
      }
    };

    poll();

    return () => {
      cancelled = true;
      if (channelTimer) clearTimeout(channelTimer);
      if (pollTimer) clearTimeout(pollTimer);
    };
  }, [pathname, contactPromptActive]);

  const dismissChannel = useCallback(() => {
    writeFlag(CHANNEL_DISMISS_KEY);
    setShowChannel(false);
  }, []);

  const joinChannel = useCallback(() => {
    openTelegramUrl(SOCIAL.telegram);
    writeFlag(CHANNEL_DISMISS_KEY);
    setShowChannel(false);
  }, []);

  if (STAFF_PATH.test(pathname)) return null;
  if (!showChannel || contactPromptActive) return null;

  return (
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
  );
}
