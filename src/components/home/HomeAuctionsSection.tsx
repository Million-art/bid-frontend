"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { SectionTag } from "@/components/home/SectionTag";
import { AuctionCard } from "@/components/auctions/AuctionCard";
import { useLanguage } from "@/contexts/LanguageContext";
import { queryKeys } from "@/lib/query-keys";
import {
  listAuctions,
  type PublicAuctionCard,
} from "@/services/auctions.service";

const POLL_MS = 45_000;
const HOME_LIMIT = 6;

export function HomeAuctionsSection({
  auctions,
}: {
  auctions: PublicAuctionCard[];
}) {
  const { dict } = useLanguage();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.auctions.list({
      page: 1,
      limit: HOME_LIMIT,
      status: "active",
    }),
    queryFn: () =>
      listAuctions({
        page: 1,
        limit: HOME_LIMIT,
        status: "active",
      }),
    initialData:
      auctions.length > 0
        ? {
            items: auctions,
            total: auctions.length,
            page: 1,
            limit: HOME_LIMIT,
            totalPages: 1,
            hasMore: false,
            statusCounts: {},
          }
        : undefined,
    staleTime: 15_000,
    refetchInterval: POLL_MS,
    refetchOnWindowFocus: true,
  });

  const items = data?.items ?? auctions;

  return (
    <section className="bg-slate-50 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionTag>{dict.nav.auctions}</SectionTag>
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
              {dict.home.openAuctions}
            </h2>
          </div>
          <Link
            href="/auctions"
            className="text-sm font-bold text-[var(--brand-blue)] hover:underline"
          >
            {dict.common.viewAll}
          </Link>
        </div>
        {isLoading && items.length === 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="flex flex-col overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-2.5 sm:p-3.5 shadow-sm"
              >
                <div className="aspect-[4/3] w-full animate-pulse rounded-xl sm:rounded-2xl bg-slate-100" />
                <div className="space-y-2 pt-3">
                  <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
                  <div className="hidden sm:block h-3 w-full animate-pulse rounded bg-slate-100" />
                  <div className="h-4 w-1/3 animate-pulse rounded bg-slate-100 pt-1" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center text-slate-500">
            {dict.home.noLiveAuctions}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((auction) => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
