"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Gavel, Clock, Heart, ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Auction } from "@/services/auctions.service";
import { auctionCoverImage } from "@/lib/auction-media";

export function AuctionCard({ auction }: { auction: Auction }) {
  const { dict, formatCurrency } = useLanguage();

  const normalizedStatus = String(auction.status || "").toLowerCase();
  const isOpen = ["active", "postponed"].includes(normalizedStatus);
  const cover = auctionCoverImage(auction);

  // Wishlist / favorite state
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("carra_favorites");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.includes(auction.id)) {
          setIsFavorite(true);
        }
      }
    } catch {
      // ignore
    }
  }, [auction.id]);

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const stored = localStorage.getItem("carra_favorites");
      const list = stored ? JSON.parse(stored) : [];
      const updated = Array.isArray(list)
        ? isFavorite
          ? list.filter((id: string) => id !== auction.id)
          : [...list, auction.id]
        : [auction.id];
      localStorage.setItem("carra_favorites", JSON.stringify(updated));
      setIsFavorite(!isFavorite);
    } catch {
      setIsFavorite(!isFavorite);
    }
  };

  // Live countdown
  const targetMs = useMemo(() => {
    if (!auction.closeAt) return null;
    const d = new Date(auction.closeAt);
    return Number.isNaN(d.getTime()) ? null : d.getTime();
  }, [auction.closeAt]);

  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    if (!targetMs || !isOpen) return;
    setNowMs(Date.now());
    const interval = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(interval);
  }, [targetMs, isOpen]);

  const timeLeft = useMemo(() => {
    if (!targetMs) return null;
    const diff = targetMs - nowMs;
    if (diff <= 0) return null;

    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    const desktop =
      days > 0
        ? `${days}d ${hours}h ${minutes}m`
        : hours > 0
        ? `${hours}h ${minutes}m`
        : `${minutes}m`;

    const mobile =
      days > 0
        ? `${days}d ${String(hours).padStart(2, "0")}h left`
        : hours > 0
        ? `${hours}h ${String(minutes).padStart(2, "0")}m left`
        : `${minutes}m left`;

    return { desktop, mobile };
  }, [targetMs, nowMs]);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return dict.auctions.filters.active;
      case "postponed":
        return dict.auctions.filters.postponed;
      case "closed":
        return dict.auctions.filters.closed;
      case "executed":
        return dict.auctions.filters.executed;
      case "cancelled":
        return dict.auctions.filters.cancelled;
      default:
        return status;
    }
  };

  // Current bid / winning bid / starting bid display
  const currentBidDisplay = useMemo(() => {
    if (isOpen) {
      if (auction.minBidValue != null && auction.minBidValue > 0) {
        return formatCurrency(auction.minBidValue);
      }
      return `${formatCurrency(auction.entranceFee)}`;
    }
    if (auction.winnerBidValue != null) {
      return formatCurrency(auction.winnerBidValue);
    }
    return "—";
  }, [isOpen, auction.minBidValue, auction.entranceFee, auction.winnerBidValue, formatCurrency]);

  return (
    <Link
      href={`/auctions/${auction.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-2.5 sm:p-3.5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-md"
    >
      {/* Product Image Container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl sm:rounded-2xl bg-neutral-100 flex items-center justify-center">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={auction.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center text-slate-400">
            <Gavel className="h-8 w-8 mb-1 text-slate-300" />
            <span className="text-[11px] font-medium text-slate-400">[Product photo]</span>
          </div>
        )}

        {/* Status Pill for non-active auctions (no live mark/blink) */}
        {!isOpen && (
          <div className="absolute left-2.5 top-2.5 sm:left-3 sm:top-3 z-10 flex items-center gap-1.5 rounded-full bg-black/75 backdrop-blur-xs px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
            <span>{getStatusLabel(String(auction.status))}</span>
          </div>
        )}

        {/* Top-Right Countdown Pill (Brand yellow bg, black text) */}
        {isOpen && timeLeft && (
          <div className="absolute right-2.5 top-2.5 sm:right-3 sm:top-3 z-10 flex items-center gap-1.5 rounded-full bg-[var(--brand-yellow)] px-2.5 py-1 text-[10px] sm:text-[11px] font-bold text-black shadow-sm">
            <Clock className="h-3 w-3 text-black" />
            <span>{timeLeft.desktop}</span>
          </div>
        )}

        {/* Bottom-Right Wishlist / Heart Button */}
        <button
          type="button"
          onClick={toggleFavorite}
          aria-label="Add to wishlist"
          className="absolute bottom-2.5 right-2.5 sm:bottom-3 sm:right-3 z-10 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-white/95 shadow-sm border border-slate-100/90 text-slate-400 hover:text-rose-500 hover:scale-110 active:scale-95 transition-all"
        >
          <Heart
            className={`h-3.5 w-3.5 sm:h-4 sm:w-4 transition-colors ${
              isFavorite ? "fill-rose-500 text-rose-500" : "text-slate-400 group-hover:text-slate-600"
            }`}
          />
        </button>
      </div>

      {/* Card Content */}
      <div className="flex flex-1 flex-col pt-2.5 sm:pt-3">
        {/* Title */}
        <h3 className="line-clamp-2 text-xs sm:text-base font-bold text-slate-900 group-hover:text-[var(--brand-blue)] transition-colors leading-snug">
          {auction.title}
        </h3>

        <div className="mt-auto pt-2">
          {/* Winner banner if closed */}
          {!isOpen && (auction.winnerName || auction.winnerBidValue != null) ? (
            <div className="mb-2 space-y-0.5 rounded-lg border border-emerald-200/80 bg-emerald-50/80 px-2.5 py-1.5 text-xs">
              {auction.winnerName && (
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold text-emerald-800 text-[11px]">
                    {dict.winners.winner}
                  </span>
                  <span className="truncate font-extrabold text-emerald-950 text-[11px]">
                    {auction.winnerName}
                  </span>
                </div>
              )}
              {auction.winnerBidValue != null && (
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold text-emerald-800 text-[11px]">
                    {dict.winners.winningBid}
                  </span>
                  <span className="font-extrabold text-emerald-950 text-[11px]">
                    {formatCurrency(auction.winnerBidValue)}
                  </span>
                </div>
              )}
            </div>
          ) : null}

          {/* Divider line (desktop) */}
          <div className="hidden sm:block border-t border-slate-100 my-2" />

          {/* Pricing columns (Desktop) */}
          <div className="hidden sm:flex items-baseline justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {dict.auctions.entranceFee}
              </p>
              <p className="text-base sm:text-lg font-black text-slate-900 tabular-nums">
                {formatCurrency(auction.entranceFee)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {isOpen ? dict.auctions.currentBid : dict.winners.winningBid}
              </p>
              <p className="text-sm sm:text-base font-bold text-slate-700 tabular-nums">
                {currentBidDisplay}
              </p>
            </div>
          </div>

          {/* Pricing row (Mobile) */}
          <div className="sm:hidden flex items-baseline justify-between mt-0.5">
            <span className="text-sm font-extrabold text-slate-900 tabular-nums">
              {formatCurrency(auction.entranceFee)}
            </span>
          </div>

          {/* Full Width Button (Brand Blue, NOT red) */}
          {isOpen ? (
            <span className="mt-2.5 sm:mt-3 inline-flex h-9 sm:h-11 w-full items-center justify-center gap-1.5 sm:gap-2 rounded-xl sm:rounded-2xl bg-[var(--brand-blue)] hover:bg-[#1c8ee0] active:scale-[0.99] px-3 sm:px-4 text-xs sm:text-sm font-bold text-white shadow-sm transition-all duration-200 group-hover:brightness-105">
              <Gavel className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span>{dict.auctions.setBid}</span>
              <ArrowRight className="hidden sm:inline h-3.5 w-3.5 sm:h-4 sm:w-4 ml-0.5 shrink-0" />
            </span>
          ) : (
            <span className="mt-2.5 sm:mt-3 inline-flex h-9 sm:h-11 w-full items-center justify-center rounded-xl sm:rounded-2xl border border-slate-200 bg-slate-50 px-3 sm:px-4 text-xs sm:text-sm font-bold text-slate-700 transition hover:bg-slate-100">
              {dict.auctions.viewResults}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
