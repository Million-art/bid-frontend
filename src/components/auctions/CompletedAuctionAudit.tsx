"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  Trophy,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getAuctionAudit, type AuctionAuditEntry } from "@/services/auctions.service";

interface CompletedAuctionAuditProps {
  auctionId: string;
}

export function CompletedAuctionAudit({ auctionId }: CompletedAuctionAuditProps) {
  const { dict, formatCurrency } = useLanguage();

  const { data: audit, isLoading, isError } = useQuery({
    queryKey: ["auction-audit", auctionId],
    queryFn: () => getAuctionAudit(auctionId),
    staleTime: 5 * 60 * 1000,
  });

  const [searchVal, setSearchVal] = useState("");
  const [filterType, setFilterType] = useState<"all" | "unique" | "duplicates">("all");
  const [showExplanation, setShowExplanation] = useState(false);

  // Search check logic
  const searchResult = useMemo(() => {
    if (!searchVal.trim() || !audit?.entries) return null;
    const num = Number(searchVal.trim());
    if (isNaN(num) || num <= 0) return null;

    // find match with 2 decimals
    const match = audit.entries.find(
      (e) => Math.abs(Number(e.bidValue) - num) < 0.001
    );

    if (!match) {
      return {
        type: "not_found" as const,
        message: dict.audit.searchNotFound.replace(
          "{amount}",
          formatCurrency(num)
        ),
      };
    }

    if (match.isWinner) {
      return {
        type: "winner" as const,
        message: dict.audit.searchFoundWinner.replace(
          "{amount}",
          formatCurrency(Number(match.bidValue))
        ),
      };
    }

    if (match.isUnique) {
      return {
        type: "unique" as const,
        message: dict.audit.searchFoundUnique.replace(
          "{amount}",
          formatCurrency(Number(match.bidValue))
        ),
      };
    }

    return {
      type: "duplicate" as const,
      message: dict.audit.searchFoundDuplicate
        .replace("{amount}", formatCurrency(Number(match.bidValue)))
        .replace("{count}", String(match.count)),
    };
  }, [searchVal, audit?.entries, dict.audit, formatCurrency]);

  // Filter entries
  const filteredEntries = useMemo(() => {
    if (!audit?.entries) return [];
    let list = audit.entries;
    if (filterType === "unique") {
      list = list.filter((e) => e.isUnique);
    } else if (filterType === "duplicates") {
      list = list.filter((e) => !e.isUnique);
    }
    return list;
  }, [audit?.entries, filterType]);

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm">
        <div className="h-6 w-1/3 animate-pulse rounded-lg bg-slate-100" />
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      </div>
    );
  }

  if (isError || !audit) {
    return null;
  }

  return (
    <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-7 shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-5">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700 border border-emerald-200/60">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {dict.winners.auditedAndVerified}
          </span>
          <h2 className="mt-2 text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {dict.audit.title}
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-xl">
            {dict.audit.subtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowExplanation(!showExplanation)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
        >
          <HelpCircle className="h-4 w-4 text-slate-400" />
          <span>{dict.audit.provableFairHeading}</span>
        </button>
      </div>

      {/* Explanatory Collapsible */}
      {showExplanation && (
        <div className="my-4 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-xs sm:text-sm text-blue-950">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="h-5 w-5 text-[var(--brand-blue)] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">{dict.audit.provableFairHeading}</p>
              <p className="mt-1 leading-relaxed text-blue-900/90">
                {dict.audit.provableFairExplanation}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Winner & Stats Summary */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-4 gap-3">
        {/* Winner Highlight */}
        <div className="sm:col-span-2 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/50 p-4 flex items-center gap-3.5 shadow-xs">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--brand-yellow)] text-slate-900 shadow-xs">
            <Trophy className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
              {dict.audit.winnerBanner}
            </p>
            <p className="truncate text-base font-black text-slate-900">
              {audit.winnerName || dict.winners.winner}
            </p>
            <p className="text-lg font-black text-emerald-700 tabular-nums">
              {audit.winnerBidValue != null
                ? formatCurrency(Number(audit.winnerBidValue))
                : "—"}
            </p>
          </div>
        </div>

        {/* Unique bids count */}
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 flex flex-col justify-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {dict.audit.uniqueNumbers}
          </span>
          <span className="text-xl sm:text-2xl font-black text-slate-900 tabular-nums mt-0.5">
            {audit.uniqueBidsCount}
          </span>
          <span className="text-[11px] text-slate-500">
            {dict.audit.filterUnique}
          </span>
        </div>

        {/* Total bids count */}
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 flex flex-col justify-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {dict.audit.totalBids}
          </span>
          <span className="text-xl sm:text-2xl font-black text-slate-900 tabular-nums mt-0.5">
            {audit.totalBids.toLocaleString()}
          </span>
          <span className="text-[11px] text-slate-500">
            {audit.duplicatedBidsCount} {dict.audit.duplicateBadge.toLowerCase()}
          </span>
        </div>
      </div>

      {/* Interactive Number Checker */}
      <div className="mt-6 rounded-2xl border border-slate-200/90 bg-slate-50/60 p-4 sm:p-5">
        <label
          htmlFor="bid-check-input"
          className="block text-xs sm:text-sm font-bold text-slate-800 mb-2"
        >
          🔍 {dict.winners.trustPoints.verifyTitle}
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <input
              id="bid-check-input"
              type="number"
              step="0.01"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder={dict.audit.searchPlaceholder}
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-3.5 pr-10 text-sm font-bold text-slate-900 shadow-inner focus:border-[var(--brand-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)]/20"
            />
            {searchVal && (
              <button
                type="button"
                onClick={() => setSearchVal("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Search Result Feedback Box */}
        {searchResult && (
          <div
            className={`mt-3 rounded-xl p-3 text-xs sm:text-sm font-semibold flex items-start gap-2.5 ${
              searchResult.type === "winner"
                ? "bg-amber-100/90 text-amber-950 border border-amber-300"
                : searchResult.type === "unique"
                ? "bg-blue-100/90 text-blue-950 border border-blue-300"
                : searchResult.type === "duplicate"
                ? "bg-rose-100/90 text-rose-950 border border-rose-300"
                : "bg-slate-200/80 text-slate-800 border border-slate-300"
            }`}
          >
            {searchResult.type === "winner" ? (
              <Trophy className="h-4 w-4 shrink-0 text-amber-700 mt-0.5" />
            ) : searchResult.type === "unique" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-700 mt-0.5" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-700 mt-0.5" />
            )}
            <p className="leading-snug">{searchResult.message}</p>
          </div>
        )}
      </div>

      {/* Filter Tabs & Log Table Header */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <h3 className="text-sm font-bold text-slate-900">
          {dict.winners.trustPoints.logTitle} ({filteredEntries.length})
        </h3>
        <div className="flex items-center gap-1.5 rounded-xl bg-slate-100 p-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => setFilterType("all")}
            className={`rounded-lg px-2.5 py-1 transition ${
              filterType === "all"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            {dict.audit.filterAll}
          </button>
          <button
            type="button"
            onClick={() => setFilterType("unique")}
            className={`rounded-lg px-2.5 py-1 transition ${
              filterType === "unique"
                ? "bg-white text-[var(--brand-blue)] shadow-xs"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            {dict.audit.filterUnique} ({audit.uniqueBidsCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("duplicates")}
            className={`rounded-lg px-2.5 py-1 transition ${
              filterType === "duplicates"
                ? "bg-white text-rose-600 shadow-xs"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            {dict.audit.filterDuplicates}
          </button>
        </div>
      </div>

      {/* Number Grid View */}
      <div className="mt-4 max-h-[380px] overflow-y-auto pr-1">
        {filteredEntries.length === 0 ? (
          <p className="py-8 text-center text-xs text-slate-400">
            No numbers match the selected filter.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {filteredEntries.map((entry: AuctionAuditEntry, idx: number) => {
              const num = Number(entry.bidValue);
              const isHighlight =
                searchVal.trim() && Math.abs(num - Number(searchVal.trim())) < 0.001;

              return (
                <div
                  key={idx}
                  className={`rounded-xl p-2.5 flex flex-col justify-between text-center transition-all ${
                    isHighlight
                      ? "ring-2 ring-[var(--brand-blue)] scale-105 z-10"
                      : ""
                  } ${
                    entry.isWinner
                      ? "border-2 border-amber-400 bg-amber-50 text-amber-950 font-black shadow-xs"
                      : entry.isUnique
                      ? "border border-blue-200 bg-blue-50/70 text-blue-900 font-bold"
                      : "border border-slate-200 bg-white text-slate-600 font-medium opacity-85"
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-bold">
                    {entry.isWinner ? (
                      <span className="inline-flex items-center gap-0.5 text-amber-800">
                        <Trophy className="h-3 w-3" />
                        {dict.audit.winnerBadge}
                      </span>
                    ) : entry.isUnique ? (
                      <span className="text-[var(--brand-blue)] font-bold">
                        {dict.audit.uniqueBadge}
                      </span>
                    ) : (
                      <span className="text-slate-400 font-normal">
                        {dict.audit.duplicateBadge}
                      </span>
                    )}
                    <span
                      className={`text-[10px] tabular-nums ${
                        entry.isUnique ? "font-bold" : "text-slate-400"
                      }`}
                    >
                      {entry.count}x
                    </span>
                  </div>

                  <p
                    className={`mt-1 text-sm tabular-nums tracking-tight ${
                      entry.isWinner
                        ? "text-slate-950 font-black text-base"
                        : entry.isUnique
                        ? "text-blue-950 font-bold"
                        : "text-slate-500 line-through"
                    }`}
                  >
                    {formatCurrency(num)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
