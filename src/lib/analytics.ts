"use client";

import posthog from "posthog-js";

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY || "";
const HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

let initialized = false;

export function initAnalytics(): void {
  if (initialized || typeof window === "undefined" || !KEY) return;
  posthog.init(KEY, {
    api_host: HOST,
    person_profiles: "identified_only",
    capture_pageview: false,
    capture_pageleave: true,
    persistence: "localStorage+cookie",
  });
  initialized = true;
}

export function isAnalyticsEnabled(): boolean {
  return Boolean(KEY);
}

export function trackPageView(path?: string): void {
  if (!initialized) initAnalytics();
  if (!initialized) return;
  posthog.capture("$pageview", {
    $current_url: path || window.location.href,
  });
}

export function identifyUser(user: {
  id: string;
  email?: string | null;
  fullName?: string | null;
  role?: string | null;
}): void {
  if (!initialized) initAnalytics();
  if (!initialized || !user?.id) return;
  posthog.identify(user.id, {
    email: user.email || undefined,
    name: user.fullName || undefined,
    role: user.role || undefined,
  });
}

export function resetAnalytics(): void {
  if (!initialized) return;
  posthog.reset();
}

type AnalyticsProps = Record<string, string | number | boolean | null | undefined>;

export function track(event: string, properties?: AnalyticsProps): void {
  if (!initialized) initAnalytics();
  if (!initialized) return;
  posthog.capture(event, properties);
}

/** Product funnel event names */
export const AnalyticsEvents = {
  MiniAppOpen: "mini_app_open",
  LoginSuccess: "login_success",
  SignupSuccess: "signup_success",
  ContactSharePrompted: "contact_share_prompted",
  ContactShareShared: "contact_share_shared",
  ContactShareDismissed: "contact_share_dismissed",
  ChannelJoinClicked: "channel_join_clicked",
  ChannelJoinDismissed: "channel_join_dismissed",
  PaymentStarted: "payment_started",
  PaymentVerified: "payment_verified",
  PaymentVerifyFailed: "payment_verify_failed",
} as const;
