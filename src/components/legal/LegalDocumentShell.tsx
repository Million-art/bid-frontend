import Link from "next/link";
import type { ReactNode } from "react";

type LegalDocumentShellProps = {
  title: string;
  updatedLabel: string;
  children: ReactNode;
};

/**
 * Participant legal pages: readable measure, clear hierarchy, light visual structure
 * so long policy HTML is easier to scan.
 */
export function LegalDocumentShell({ title, updatedLabel, children }: LegalDocumentShellProps) {
  return (
    <main className="min-h-[70vh] bg-gradient-to-b from-slate-100/80 via-slate-50/50 to-white pb-16 pt-8 sm:pb-20 sm:pt-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <article className="rounded-2xl border border-slate-200/90 bg-white px-6 py-9 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_12px_40px_-12px_rgba(15,23,42,0.12)] sm:px-11 sm:py-12">
          <header className="pb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-700">
              <span className="rounded-full bg-primary-50 px-2.5 py-1">Legal</span>
            </p>
            <p className="mt-4 text-sm text-slate-500">{updatedLabel}</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-[2rem] sm:leading-tight">
              {title}
            </h1>

          </header>

          <div className="pt-8">{children}</div>

          <footer className="mt-14 pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 transition hover:text-primary-700"
            >
              <span aria-hidden>←</span> Back to home
            </Link>
          </footer>
        </article>
      </div>
    </main>
  );
}
