"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  AnalyticsEvents,
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

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    if (!isAnalyticsEnabled()) return;
    const qs = searchParams?.toString();
    trackPageView(qs ? `${pathname}?${qs}` : pathname || undefined);
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!isAnalyticsEnabled() || !user?.id) return;
    identifyUser({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    });
  }, [user?.id, user?.email, user?.fullName, user?.role]);

  useEffect(() => {
    if (!isAnalyticsEnabled() || miniAppTracked.current) return;
    if (typeof window === "undefined" || !isInsideTelegram()) return;
    miniAppTracked.current = true;
    const tg = getTelegramWebAppUser();
    track(AnalyticsEvents.MiniAppOpen, {
      telegram_id: tg?.id,
      username: tg?.username,
      platform: "telegram_webapp",
    });
  }, []);

  return <>{children}</>;
}
