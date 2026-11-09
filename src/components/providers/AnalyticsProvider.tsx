"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  AnalyticsEvents,
  configureAnalytics,
  identifyUser,
  initAnalytics,
  isAnalyticsEnabled,
  track,
  trackPageView,
} from "@/lib/analytics";
import { useAuth } from "@/contexts/AuthContext";
import {
  getTelegramWebAppUser,
  isInsideTelegram,
} from "@/lib/telegram-webapp";

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const miniAppTracked = useRef(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/public-config", { cache: "no-store" });
        if (!res.ok) return;
        const cfg = (await res.json()) as {
          posthogProjectToken?: string;
          posthogHost?: string;
        };
        if (cancelled) return;
        configureAnalytics(cfg);
        initAnalytics();
      } catch {
        /* analytics optional */
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready || !isAnalyticsEnabled()) return;
    const qs = searchParams?.toString();
    trackPageView(qs ? `${pathname}?${qs}` : pathname || undefined);
  }, [ready, pathname, searchParams]);

  useEffect(() => {
    if (!ready || !isAnalyticsEnabled() || !user?.id) return;
    identifyUser({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    });
  }, [ready, user?.id, user?.email, user?.fullName, user?.role]);

  useEffect(() => {
    if (!ready || !isAnalyticsEnabled() || miniAppTracked.current) return;
    if (typeof window === "undefined" || !isInsideTelegram()) return;
    miniAppTracked.current = true;
    const tg = getTelegramWebAppUser();
    track(AnalyticsEvents.MiniAppOpen, {
      telegram_id: tg?.id,
      username: tg?.username,
      platform: "telegram_webapp",
    });
  }, [ready]);

  return <>{children}</>;
}
