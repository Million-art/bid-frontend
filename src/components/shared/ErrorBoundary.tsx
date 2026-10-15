"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import Link from "next/link";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          className="flex min-h-[60vh] flex-col items-center justify-center gap-6 p-8"
          role="alert"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-600">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <div className="max-w-md text-center">
            <h2 className="text-xl font-bold text-slate-900">Something went wrong</h2>
            <p className="mt-2 text-sm text-slate-600">
              We encountered an unexpected error. Please try again.
            </p>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <pre className="mt-4 max-h-32 overflow-auto rounded-lg bg-slate-100 p-3 text-left text-xs text-slate-700">
                {this.state.error.message}
              </pre>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => this.setState({ hasError: false })}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-500"
            >
              Go home
            </Link>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
