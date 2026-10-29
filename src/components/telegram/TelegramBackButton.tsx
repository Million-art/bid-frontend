"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ensureTelegramWebAppReady,
  getTelegramWebApp,
  isInsideTelegram,
} from "@/lib/telegram-webapp";

/**
 * Manages Telegram Mini App native BackButton (`Telegram.WebApp.BackButton`).
 * Hidden on the root route (`/`), shown on all inner routes with `router.back()`.
 */
export function TelegramBackButton() {
  const pathname = usePathname() || "/";
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    let timerId: number | null = null;
    let cleanupBackHandler: (() => void) | null = null;

    const handleBack = () => {
      if (typeof window !== "undefined" && window.history.length > 1) {
        router.back();
      } else {
        router.push("/");
      }
    };

    const syncBackButton = () => {
      if (cancelled) return;
      ensureTelegramWebAppReady();

      const wa = getTelegramWebApp();
      const inside = isInsideTelegram();

      if (!wa?.BackButton || !inside) {
        if (attempts < 10) {
          attempts += 1;
          timerId = window.setTimeout(syncBackButton, 150);
        }
        return;
      }

      const backButton = wa.BackButton;

      if (pathname === "/") {
        try {
          backButton.offClick?.(handleBack);
          wa.offEvent?.("backButtonClicked", handleBack);
          backButton.hide?.();
        } catch {
          /* ignore */
        }
        return;
      }

      try {
        if (typeof backButton.onClick === "function") {
          backButton.onClick(handleBack);
        } else {
          wa.onEvent?.("backButtonClicked", handleBack);
        }
        backButton.show?.();
      } catch {
        /* ignore */
      }

      cleanupBackHandler = () => {
        try {
          if (typeof backButton.offClick === "function") {
            backButton.offClick(handleBack);
          } else {
            wa.offEvent?.("backButtonClicked", handleBack);
          }
        } catch {
          /* ignore */
        }
      };
    };

    syncBackButton();

    return () => {
      cancelled = true;
      if (timerId !== null) {
        window.clearTimeout(timerId);
      }
      if (cleanupBackHandler) {
        cleanupBackHandler();
      }
    };
  }, [pathname, router]);

  return null;
}
