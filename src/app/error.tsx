"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Report the error to Sentry, tagged with the route's error digest for easy lookup.
    Sentry.captureException(error, {
      tags: { digest: error.digest ?? "none", source: "route_error_boundary" },
    });
    console.error("[Route ErrorBoundary]", error);
  }, [error]);

  return (
    <div
      className="flex min-h-[60vh] flex-col items-center justify-center gap-6 p-8"
      role="alert"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-red-50 text-red-600 ring-1 ring-red-100">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <div className="max-w-md text-center">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Something went wrong
        </h2>
        <p className="mt-3 text-base text-slate-600">
          We encountered an unexpected error while rendering this page. You can try recovering the page or navigate safely back home.
        </p>
        
        {process.env.NODE_ENV === "development" && (
          <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 text-left">
            <div className="border-b border-slate-200 bg-slate-100/50 px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Error Details
            </div>
            <pre className="max-h-[200px] overflow-auto p-4 text-xs font-mono text-slate-700">
              {error.message}
              {'\n'}
              {error.stack}
            </pre>
          </div>
        )}
      </div>
      <div className="flex flex-col sm:flex-row gap-3 mt-4">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900 transition-all active:scale-[0.98]"
        >
          <RefreshCw className="h-4 w-4" />
          Try recovering
        </button>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-blue px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-blue/90 transition-all active:scale-[0.98]"
        >
          <Home className="h-4 w-4" />
          Return to Hub
        </Link>
      </div>
    </div>
  );
}
