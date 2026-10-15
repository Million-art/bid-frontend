// This file configures the initialization of Sentry on the **client** (browser).
// Tuned for the Sentry Free plan (5,000 errors/month)   filters noise aggressively
// so quota is preserved for real financial and application errors.

import * as Sentry from "@sentry/nextjs";

// Errors that are almost always noise: network blips, browser extensions,
// ad-blockers, and irrelevant third-party scripts.
const IGNORED_ERRORS = [
  "ResizeObserver loop limit exceeded",
  "ResizeObserver loop completed",
  "Non-Error promise rejection captured",
  "Network request failed",
  "Load failed",
  "Failed to fetch",
  "NetworkError",
  "ChunkLoadError", // stale bundles after deploy   user just needs to refresh
  "Hydration",      // SSR hydration mismatches are noisy and not actionable
];

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? "development",

  // Keep traces low to preserve quota   we care about errors, not performance traces.
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.05 : 0.0,

  // Only capture replays when an error actually occurs (not random sessions).
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.0, // disabled   too quota-heavy on free plan

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  beforeSend(event, hint) {
    const error = hint?.originalException;

    // Drop network-level errors   usually the user's connection, not our bug
    if (error instanceof Error) {
      for (const pattern of IGNORED_ERRORS) {
        if (error.message?.includes(pattern)) return null;
      }
    }

    // Drop 404 errors   not our bugs, just missing pages/assets
    if (event.request?.url) {
      const status = event.contexts?.response?.status_code;
      if (status === 404) return null;
    }

    // Strip sensitive auth headers before the event leaves the browser
    if (event.request?.headers) {
      delete event.request.headers["Cookie"];
      delete event.request.headers["Authorization"];
    }

    return event;
  },
});
