"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import {
  Search,
  ArrowUpDown,
  X,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { AuctionCard } from "@/components/auctions/AuctionCard";
import {
  listAuctions,
  type PublicAuctionCard,
} from "@/services/auctions.service";
import { queryKeys } from "@/lib/query-keys";
import { useLanguage } from "@/contexts/LanguageContext";

type StatusFilter = "all" | "active" | "closed" | "executed";
type SortOption = "newest" | "closing_soon" | "fee_asc" | "fee_desc";

const PAGE_SIZE = 12;

export default function AuctionsPage() {
  const { dict, t } = useLanguage();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const statusOptions: { value: StatusFilter; label: string }[] = useMemo(
    () => [
      { value: "all", label: dict.auctions.filters.all },
      { value: "active", label: dict.auctions.filters.active },
      { value: "closed", label: dict.auctions.filters.closed },
      { value: "executed", label: dict.auctions.filters.executed },
    ],
    [dict]
  );

  const sortOptions: { value: SortOption; label: string }[] = useMemo(
    () => [
      { value: "newest", label: dict.auctions.sortOptions.newest },
      { value: "closing_soon", label: dict.auctions.sortOptions.closingSoon },
      { value: "fee_asc", label: dict.auctions.sortOptions.feeAsc },
      { value: "fee_desc", label: dict.auctions.sortOptions.feeDesc },
    ],
    [dict]
  );

  const {
    data,
    isLoading,
    isError,
    refetch,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: queryKeys.auctions.infinite({
      limit: PAGE_SIZE,
      status: statusFilter,
      search: debouncedSearch,
      sort: sortBy,
    }),
    initialPageParam: 1,
    queryFn: ({ pageParam = 1 }) =>
      listAuctions({
        page: pageParam,
        limit: PAGE_SIZE,
        status: statusFilter,
        search: debouncedSearch,
        sort: sortBy,
      }),
    getNextPageParam: (lastPage) => {
      if (lastPage.hasMore) {
        return (lastPage.page ?? 1) + 1;
      }
      const currentPage = lastPage.page ?? 1;
      const limit = lastPage.limit || PAGE_SIZE;
      if (currentPage * limit < (lastPage.total ?? 0)) {
        return currentPage + 1;
      }
      return undefined;
    },
    placeholderData: keepPreviousData,
    staleTime: 15_000,
    refetchInterval: 45_000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { rootMargin: "320px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const items: PublicAuctionCard[] = useMemo(() => {
    if (!data?.pages) return [];
    const seen = new Set<string>();
    const merged: PublicAuctionCard[] = [];
    for (const page of data.pages) {
      for (const item of page.items) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          merged.push(item);
        }
      }
    }
    return merged;
  }, [data]);

  const firstPage = data?.pages?.[0];
  const totalMatching = firstPage?.total ?? items.length;

  const statusCounts = useMemo(() => {
    const serverCounts = firstPage?.statusCounts;
    if (serverCounts && Object.keys(serverCounts).length > 0) {
      return {
        all: serverCounts.all ?? totalMatching,
        active: serverCounts.active ?? 0,
        closed: serverCounts.closed ?? 0,
        executed: serverCounts.executed ?? 0,
      };
    }
    return {
      all: totalMatching,
      active: 0,
      closed: 0,
      executed: 0,
    };
  }, [firstPage?.statusCounts, totalMatching]);

  const hasActiveFilters =
    search.trim() !== "" || statusFilter !== "all" || sortBy !== "newest";

  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setStatusFilter("all");
    setSortBy("newest");
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 pt-24 sm:pt-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="mb-8 max-w-2xl">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            {dict.auctions.title}
          </h1>
          <p className="mt-3 text-base text-slate-600">
            {dict.auctions.subtitle}
          </p>
        </header>

        {/* Filter Bar */}
        <section
          aria-label="Filter auctions"
          className="mb-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Search input */}
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={dict.auctions.searchPlaceholder}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-9 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-[var(--brand-blue)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)]/20"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setDebouncedSearch("");
                  }}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="relative min-w-[200px] w-full sm:w-auto">
              <ArrowUpDown className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                aria-label="Sort auctions"
                className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-8 text-sm font-semibold text-slate-700 focus:border-[var(--brand-blue)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)]/20 sm:min-w-[200px]"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status Pills + Results summary */}
          <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {statusOptions.map((tab) => {
                const active = statusFilter === tab.value;
                const count = statusCounts[tab.value] ?? 0;
                return (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setStatusFilter(tab.value)}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                      active
                        ? "bg-[var(--brand-blue)] text-white shadow-sm shadow-blue-500/20"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-extrabold ${
                        active
                          ? "bg-white/20 text-white"
                          : "bg-white text-slate-600"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between gap-3 text-xs font-semibold text-slate-500 sm:justify-end">
              <span className="inline-flex items-center gap-1.5">
                {isFetching && !isFetchingNextPage && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--brand-blue)]" />
                )}
                {t("auctions.showingSummary", {
                  count: items.length,
                  total: totalMatching,
                })}
              </span>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold text-[var(--brand-blue)] hover:bg-sky-50"
                >
                  <X className="h-3.5 w-3.5" />
                  {dict.auctions.resetFilters}
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Auctions Grid / States */}
        {isLoading ? (
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
        ) : isError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center text-red-800">
            <p className="font-bold">{dict.auctions.loadError}</p>
            <button
              type="button"
              onClick={() => void refetch()}
              disabled={isFetching}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[var(--brand-blue)] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:brightness-110 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
              {dict.common.retry}
            </button>
          </div>
        ) : items.length === 0 && !hasActiveFilters ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center text-slate-500">
            {dict.auctions.noAuctionsYet}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <p className="text-base font-bold text-slate-800">
              {dict.auctions.noMatches}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {dict.auctions.noMatchesDesc}
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[var(--brand-blue)] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:brightness-110"
            >
              <X className="h-3.5 w-3.5" />
              {dict.auctions.clearFilters}
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((auction) => (
                <AuctionCard key={auction.id} auction={auction} />
              ))}
            </div>

            {/* Infinite scroll sentinel & Load More fallback */}
            <div
              ref={sentinelRef}
              className="mt-10 flex flex-col items-center justify-center gap-3"
            >
              {isFetchingNextPage ? (
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-600 shadow-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-[var(--brand-blue)]" />
                  {dict.common.loading}
                </div>
              ) : hasNextPage ? (
                <button
                  type="button"
                  onClick={() => void fetchNextPage()}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:border-[var(--brand-blue)] hover:text-[var(--brand-blue)]"
                >
                  {dict.common.viewAll} ({items.length} / {totalMatching})
                </button>
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  );
}


