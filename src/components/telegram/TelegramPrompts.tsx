"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  canRequestTelegramContact,
  ensureTelegramWebAppReady,
  getTelegramWebApp,
  getTelegramWebAppUser,
  isInsideTelegram,
  requestTelegramContact,
} from "@/lib/telegram-webapp";
import { shareTelegramContact } from "@/services/telegram.service";

const CONTACT_PROMPTED_SESSION_KEY = "carramarket_tg_contact_prompted";
const STAFF_PATH = /^\/staffpanel(\/|$)/;

/**
 * Native Telegram Integration for phone verification.
 * Does NOT render any custom HTML/CSS modal.
 * Uses Telegram's real native client dialogs: Telegram.WebApp.showPopup & Telegram.WebApp.requestContact.
 */
export function TelegramPrompts() {
  const pathname = usePathname() || "";
  const { user, refreshUser } = useAuth();
  const busyRef = useRef(false);

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
      }
    } catch {
      /* ignore */
    } finally {
      busyRef.current = false;
    }
  }, [refreshUser]);

  useEffect(() => {
    if (STAFF_PATH.test(pathname)) {
      return;
    }

    // Only run if user is inside Telegram and phone is not yet verified
    const hasPhone = Boolean(user?.phone?.trim());
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
              }
            }
          );
        } else if (typeof wa.requestContact === "function") {
          // Fallback directly to Telegram's native contact sheet if showPopup is unavailable
          void handleRequestContact();
        }
      }, 1000);
    };

    triggerNativeDialog();

    return () => {
      cancelled = true;
    };
  }, [pathname, user?.phone, handleRequestContact]);

  // Renders no HTML in the DOM — pure native Telegram UI integration
  return null;
}
