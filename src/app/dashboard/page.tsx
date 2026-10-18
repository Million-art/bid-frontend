"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { queryKeys } from "@/lib/query-keys";
import { listMyParticipations } from "@/services/auctions.service";

function DashboardContent() {
  const { dict, t } = useLanguage();
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.me.auctions({ page: 1, limit: 50 }),
    queryFn: () => listMyParticipations({ page: 1, limit: 50 }),
  });

  const items = data?.items ?? [];

  return (
    <div className="bg-slate-50 pb-20 pt-24 sm:pt-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900">
            {dict.dashboard.title}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {dict.dashboard.subtitle}
          </p>
        </header>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--brand-blue)] border-t-transparent" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-8 text-center text-red-800">
            {dict.dashboard.loadError}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <p className="font-semibold text-slate-900">
              {dict.dashboard.emptyTitle}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {dict.dashboard.emptyDesc}
            </p>
            <Link
              href="/auctions"
              className="mt-4 inline-block text-sm font-bold text-[var(--brand-blue)] hover:underline"
            >
              {dict.dashboard.browseAuctions}
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map(({ auction, participation, bids }) => {
              const statusLabel =
                dict.auctions.filters[
                  auction.status as keyof typeof dict.auctions.filters
                ] ?? String(auction.status);
              return (
                <li key={participation.id || auction.id}>
                  <Link
                    href={`/auctions/${auction.id}`}
                    className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-[var(--brand-blue)]/40"
                  >
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                      {auction.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={auction.imageUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-slate-900">
                        {auction.title}
                      </p>
                      <p className="mt-0.5 text-xs uppercase tracking-wide text-slate-400">
                        {statusLabel}
                        {bids?.length
                          ? ` · ${t("dashboard.bidsPlaced", { count: bids.length })}`
                          : ` · ${dict.dashboard.noBidsYet}`}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
