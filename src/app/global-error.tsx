"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { AlertOctagon, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Report the critical layout crash to Sentry with high priority.
    Sentry.captureException(error, {
      tags: {
        digest: error.digest ?? "none",
        source: "global_error_boundary",
        severity: "critical",
      },
    });
    console.error("[Global ErrorBoundary]", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 antialiased font-sans selection:bg-brand-blue/10 selection:text-brand-blue flex flex-col items-center justify-center">
        <div
          className="flex w-full max-w-xl flex-col items-center justify-center gap-6 p-8 bg-white md:rounded-3xl md:shadow-xl md:ring-1 md:ring-slate-200"
          role="alert"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] bg-red-50 text-red-600 ring-1 ring-red-100 shadow-sm">
            <AlertOctagon className="h-10 w-10" />
          </div>
          
          <div className="text-center w-full">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Critical Error
            </h2>
            <p className="mt-3 text-lg text-slate-600 leading-relaxed">
              The application experienced a critical failure. The layout could not be rendered.
            </p>

            {process.env.NODE_ENV === "development" && (
              <div className="mt-6 overflow-hidden rounded-2xl border border-red-100 bg-red-50/50 text-left w-full">
                <div className="border-b border-red-100 bg-red-100/50 px-4 py-2 text-xs font-semibold text-red-800 uppercase tracking-wider">
                  Critical Diagnostics
                </div>
                <pre className="max-h-[300px] overflow-auto p-4 text-xs font-mono text-red-900/80">
                  {error.message}
                  {'\n\n'}
                  {error.stack}
                </pre>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => reset()}
              className="inline-flex flex-1 sm:flex-none justify-center items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-base font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900 transition-all active:scale-[0.98]"
            >
              <RefreshCw className="h-5 w-5" />
              Force Reload
            </button>
            <button
              onClick={() => window.location.href = "/"}
              className="inline-flex flex-1 sm:flex-none justify-center items-center gap-2 rounded-xl bg-slate-900 px-6 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-slate-800 transition-all active:scale-[0.98]"
            >
              <Home className="h-5 w-5" />
              Start Fresh
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
