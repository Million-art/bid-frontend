"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  X,
  RefreshCw,
} from "lucide-react";
import { AuctionCard } from "@/components/auctions/AuctionCard";
import { listAuctions, type Auction } from "@/services/auctions.service";
import { queryKeys } from "@/lib/query-keys";
import { useLanguage } from "@/contexts/LanguageContext";

type StatusFilter = "all" | "active" | "postponed" | "closed" | "executed";
type FeeFilter = "all" | "under_100" | "100_to_500" | "over_500";
type SortOption = "newest" | "closing_soon" | "fee_asc" | "fee_desc";

function normalizeStatus(status: string): StatusFilter {
  const s = String(status).toLowerCase();
  if (s === "completed" || s === "executed") return "executed";
  if (s === "active") return "active";
  if (s === "postponed") return "postponed";
  if (s === "closed") return "closed";
  return "all";
}

export default function AuctionsPage() {
  const { dict, t } = useLanguage();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [feeFilter, setFeeFilter] = useState<FeeFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  const statusOptions: { value: StatusFilter; label: string }[] = useMemo(
    () => [
      { value: "all", label: dict.auctions.filters.all },
      { value: "active", label: dict.auctions.filters.active },
      { value: "postponed", label: dict.auctions.filters.postponed },
      { value: "closed", label: dict.auctions.filters.closed },
      { value: "executed", label: dict.auctions.filters.executed },
    ],
    [dict]
  );

  const feeOptions: { value: FeeFilter; label: string }[] = useMemo(
    () => [
      { value: "all", label: dict.auctions.feeFilters.all },
      { value: "under_100", label: dict.auctions.feeFilters.under100 },
      { value: "100_to_500", label: dict.auctions.feeFilters.from100To500 },
      { value: "over_500", label: dict.auctions.feeFilters.over500 },
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
  } = useQuery({
    queryKey: queryKeys.auctions.list({ page: 1, limit: 100 }),
    queryFn: () => listAuctions({ page: 1, limit: 100 }),
  });

  const items: Auction[] = useMemo(() => data?.items ?? [], [data]);

  const statusCounts = useMemo(() => {
    const counts: Record<StatusFilter, number> = {
      all: items.length,
      active: 0,
      postponed: 0,
      closed: 0,
      executed: 0,
    };
    for (const item of items) {
      const st = normalizeStatus(String(item.status));
      if (st !== "all") {
        counts[st] = (counts[st] ?? 0) + 1;
      }
    }
    return counts;
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();

    const filtered = items.filter((auction) => {
      if (statusFilter !== "all") {
        if (normalizeStatus(String(auction.status)) !== statusFilter) {
          return false;
        }
      }

      if (feeFilter === "under_100" && auction.entranceFee > 100) {
        return false;
      }
      if (
        feeFilter === "100_to_500" &&
        (auction.entranceFee < 100 || auction.entranceFee > 500)
      ) {
        return false;
      }
      if (feeFilter === "over_500" && auction.entranceFee <= 500) {
        return false;
      }

      if (q) {
        const titleMatch = auction.title.toLowerCase().includes(q);
        const descMatch = (auction.description || "").toLowerCase().includes(q);
        if (!titleMatch && !descMatch) {
          return false;
        }
      }

      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "fee_asc") {
        return a.entranceFee - b.entranceFee;
      }
      if (sortBy === "fee_desc") {
        return b.entranceFee - a.entranceFee;
      }
      if (sortBy === "closing_soon") {
        const aTime = a.closeAt ? new Date(a.closeAt).getTime() : Number.POSITIVE_INFINITY;
        const bTime = b.closeAt ? new Date(b.closeAt).getTime() : Number.POSITIVE_INFINITY;
        return aTime - bTime;
      }
      const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bCreated - aCreated;
    });
  }, [items, search, statusFilter, feeFilter, sortBy]);

  const hasActiveFilters =
    search.trim() !== "" ||
    statusFilter !== "all" ||
    feeFilter !== "all" ||
    sortBy !== "newest";

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setFeeFilter("all");
    setSortBy("newest");
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 pt-24 sm:pt-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="mb-8 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--brand-blue)]">
            {dict.auctions.tag}
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
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
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Entrance fee & Sort selects */}
            <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap">
              <div className="relative min-w-[170px] flex-1 sm:flex-initial">
                <SlidersHorizontal className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select
                  value={feeFilter}
                  onChange={(e) => setFeeFilter(e.target.value as FeeFilter)}
                  aria-label="Filter by entrance fee"
                  className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-8 text-sm font-semibold text-slate-700 focus:border-[var(--brand-blue)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)]/20"
                >
                  {feeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative min-w-[200px] flex-1 sm:flex-initial">
                <ArrowUpDown className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  aria-label="Sort auctions"
                  className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-8 text-sm font-semibold text-slate-700 focus:border-[var(--brand-blue)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)]/20"
                >
                  {sortOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
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
              <span>
                {t("auctions.showingSummary", {
                  count: filteredItems.length,
                  total: items.length,
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
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="aspect-[16/10] animate-pulse bg-slate-100" />
                <div className="space-y-3 p-4">
                  <div className="h-5 w-2/3 animate-pulse rounded bg-slate-100" />
                  <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
                  <div className="h-4 w-1/3 animate-pulse rounded bg-slate-100 pt-2" />
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
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center text-slate-500">
            {dict.auctions.noAuctionsYet}
          </div>
        ) : filteredItems.length === 0 ? (
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
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((auction) => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


