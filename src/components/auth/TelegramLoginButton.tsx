"use client";

import { useEffect, useRef, useState } from "react";
import { getApiBase } from "@/lib/api";
import type { TelegramAuthPayload } from "@/services/auth.service";
import {
  ensureTelegramWebAppReady,
  getTelegramInitData,
  getTelegramWebAppUser,
  isInsideTelegram,
  isTelegramMiniApp,
} from "@/lib/telegram-webapp";

declare global {
  interface Window {
    onTelegramAuth?: (user: TelegramAuthPayload) => void;
  }
}

type AuthConfig = {
  telegramEnabled?: boolean;
  telegramBotUsername?: string;
};

export function TelegramLoginButton({
  onAuth,
  onWebAppAuth,
  onError,
}: {
  onAuth: (payload: TelegramAuthPayload) => void | Promise<void>;
  /** Preferred inside Telegram Mini App — posts signed initData. */
  onWebAppAuth?: (initData: string) => void | Promise<void>;
  onError?: (message: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [botUsername, setBotUsername] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [inTelegram, setInTelegram] = useState(false);
  const [miniApp, setMiniApp] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tgLabel, setTgLabel] = useState("Continue with Telegram");
  const onAuthRef = useRef(onAuth);
  const onWebAppAuthRef = useRef(onWebAppAuth);
  const onErrorRef = useRef(onError);
  onAuthRef.current = onAuth;
  onWebAppAuthRef.current = onWebAppAuth;
  onErrorRef.current = onError;
  const autoTried = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;

    const detect = () => {
      if (cancelled) return;
      ensureTelegramWebAppReady();
      const inside = isInsideTelegram();
      const mini = isTelegramMiniApp();
      setInTelegram(inside);
      setMiniApp(mini);
      const user = getTelegramWebAppUser();
      if (user) {
        const name =
          [user.first_name, user.last_name].filter(Boolean).join(" ").trim() ||
          (user.username ? `@${user.username}` : "");
        setTgLabel(name ? `Continue as ${name}` : "Continue with Telegram");
      }
      if (!inside && !mini && attempts < 10) {
        attempts += 1;
        window.setTimeout(detect, 200);
      }
    };
    detect();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const envUser = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME?.replace(
      /^@/,
      ""
    );
    if (envUser) {
      setBotUsername(envUser);
      return;
    }

    (async () => {
      try {
        const res = await fetch(`${getApiBase()}/api/public/auth-config`, {
          credentials: "include",
        });
        if (!res.ok) {
          if (!cancelled) setUnavailable(true);
          return;
        }
        const json = (await res.json()) as { data?: AuthConfig };
        const username = json?.data?.telegramBotUsername?.replace(/^@/, "");
        if (!cancelled) {
          if (json?.data?.telegramEnabled && username) {
            setBotUsername(username);
          } else {
            setUnavailable(true);
          }
        }
      } catch {
        if (!cancelled) setUnavailable(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const runWebAppLogin = async () => {
    const initData = getTelegramInitData();
    if (!initData || !onWebAppAuthRef.current) {
      // In Telegram's in-app browser (not Mini App) the Login Widget cannot complete.
      // Open the bot Mini App so we get signed initData.
      const bot = (botUsername || process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "")
        .replace(/^@/, "");
      if (bot) {
        window.location.href = `https://t.me/${bot}?startapp`;
        return;
      }
      onErrorRef.current?.(
        "Open CarraMarket from the Telegram Mini App to sign in."
      );
      return;
    }
    setBusy(true);
    try {
      await onWebAppAuthRef.current(initData);
    } catch (err) {
      onErrorRef.current?.(
        err instanceof Error ? err.message : "Telegram login failed"
      );
    } finally {
      setBusy(false);
    }
  };

  // Auto-login once when opened as Mini App with initData.
  useEffect(() => {
    if (!miniApp || !onWebAppAuth || autoTried.current || busy) return;
    const initData = getTelegramInitData();
    if (!initData) return;
    autoTried.current = true;
    void runWebAppLogin();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot on detect
  }, [miniApp, onWebAppAuth]);

  // Login Widget only outside Telegram — iframe auth breaks inside Telegram WebView.
  useEffect(() => {
    if (inTelegram || miniApp) return;
    if (!botUsername || !containerRef.current) return;

    const callbackName = `onTelegramAuth_${botUsername.replace(/\W/g, "_")}`;
    (window as unknown as Record<string, unknown>)[callbackName] = (
      user: TelegramAuthPayload
    ) => {
      void Promise.resolve(onAuthRef.current(user)).catch((err) => {
        onErrorRef.current?.(
          err instanceof Error ? err.message : "Telegram login failed"
        );
      });
    };

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.setAttribute("data-telegram-login", botUsername);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-radius", "24");
    script.setAttribute("data-request-access", "write");
    script.setAttribute("data-onauth", `${callbackName}(user)`);

    const el = containerRef.current;
    el.innerHTML = "";
    el.appendChild(script);

    return () => {
      delete (window as unknown as Record<string, unknown>)[callbackName];
      el.innerHTML = "";
    };
  }, [botUsername, inTelegram, miniApp]);

  if (unavailable) return null;

  if (inTelegram || miniApp) {
    const hasInitData = Boolean(getTelegramInitData());
    return (
      <button
        type="button"
        disabled={busy || (!hasInitData && !onWebAppAuth)}
        onClick={() => void runWebAppLogin()}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#2AABEE] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#229ED9] disabled:opacity-60"
      >
        <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4 fill-current">
          <path d="M9.78 18.65 10.17 14.3 18.05 7.3c.34-.31-.07-.46-.51-.19L7.74 13.18 3.5 11.85c-.91-.28-.92-.9.2-1.35L20.06 5.2c.76-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.9-.74 1.12-1.5.7l-4.15-3.05-2-.97.92-.9z" />
        </svg>
        {busy ? "Signing in…" : tgLabel}
      </button>
    );
  }

  if (!botUsername) {
    return (
      <div className="flex h-10 w-full items-center justify-center rounded-full border border-slate-200 bg-white text-xs text-slate-400">
        Loading Telegram…
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex w-full justify-center [&>iframe]:!mx-auto"
      aria-label="Continue with Telegram"
    />
  );
}
