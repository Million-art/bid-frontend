"use client";

import { useEffect, useRef, useState } from "react";
import { getApiBase } from "@/lib/api";
import type { TelegramAuthPayload } from "@/services/auth.service";

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
  onError,
}: {
  onAuth: (payload: TelegramAuthPayload) => void | Promise<void>;
  onError?: (message: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [botUsername, setBotUsername] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const onAuthRef = useRef(onAuth);
  const onErrorRef = useRef(onError);
  onAuthRef.current = onAuth;
  onErrorRef.current = onError;

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

  useEffect(() => {
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
  }, [botUsername]);

  if (unavailable) return null;

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
