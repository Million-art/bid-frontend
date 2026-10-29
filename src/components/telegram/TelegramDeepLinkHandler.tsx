"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  ensureTelegramWebAppReady,
  extractAuctionIdFromStartParam,
  getTelegramStartParam,
} from "@/lib/telegram-webapp";

/**
 * Listens for Telegram Mini App start_param (e.g. "auction_6ed3fc7e-...")
 * and automatically redirects the user to the auction details page.
 */
export function TelegramDeepLinkHandler() {
  const router = useRouter();
  const pathname = usePathname() || "";
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;

    ensureTelegramWebAppReady();

    let attempts = 0;
    const checkParam = () => {
      const startParam = getTelegramStartParam();
      const auctionId = extractAuctionIdFromStartParam(startParam);

      if (auctionId) {
        handledRef.current = true;
        const targetPath = `/auctions/${auctionId}`;

        // Only navigate if we aren't already on this specific auction page
        if (pathname !== targetPath) {
          try {
            const sessionKey = `carra_tg_start_${auctionId}`;
            if (!sessionStorage.getItem(sessionKey)) {
              sessionStorage.setItem(sessionKey, "1");
              router.push(targetPath);
            }
          } catch {
            router.push(targetPath);
          }
        }
        return;
      }

      // Check a few times in case Telegram WebApp JS sdk takes a tick to populate initDataUnsafe
      if (attempts < 8) {
        attempts += 1;
        window.setTimeout(checkParam, 200);
      }
    };

    checkParam();
  }, [router, pathname]);

  return null;
}
