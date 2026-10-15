// Server-side Sentry config   handles SSR and API route errors.
// Tuned for the Sentry Free plan (5,000 errors/month).

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? "development",

  // Low trace sampling   we prioritize error quota over performance data.
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.05 : 0.0,

  debug: false,

  beforeSend(event) {
    // Drop health-check and monitoring pings   they are never real errors
    const url = event.request?.url ?? "";
    if (url.includes("/health") || url.includes("/monitoring")) return null;

    // Strip auth headers from server-side events
    if (event.request?.headers) {
      delete event.request.headers["Cookie"];
      delete event.request.headers["Authorization"];
      delete event.request.headers["X-Csrf-Token"];
    }

    return event;
  },
});
