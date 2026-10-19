"use client";

import Link from "next/link";
import { Gavel } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { AuctionCountdown } from "@/components/auctions/AuctionCountdown";
import type { Auction } from "@/services/auctions.service";

export function AuctionCard({ auction }: { auction: Auction }) {
  const { dict, formatCurrency } = useLanguage();

  const normalizedStatus = String(auction.status || "").toLowerCase();
  const isOpen = ["active", "postponed"].includes(normalizedStatus);

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

  return (
    <Link
      href={`/auctions/${auction.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--brand-blue)]/40 hover:shadow-md"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        {auction.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={auction.imageUrl}
            alt={auction.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-300">
            <Gavel className="h-10 w-10" />
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-800 shadow-sm">
          {getStatusLabel(String(auction.status))}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <h3 className="line-clamp-2 text-base font-bold text-slate-900 group-hover:text-[var(--brand-blue)]">
          {auction.title}
        </h3>
        <p className="line-clamp-2 text-sm text-slate-500">
          {auction.description || dict.howItWorks.title}
        </p>
        <div className="mt-auto space-y-3 pt-2">
          {isOpen ? (
            <AuctionCountdown
              closeAt={auction.closeAt}
              status={auction.status}
              variant="card"
            />
          ) : auction.winnerBidValue != null || auction.winnerName ? (
            <div className="space-y-1 rounded-xl border border-emerald-200/80 bg-emerald-50/80 px-3 py-2 text-xs">
              {auction.winnerName && (
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-emerald-800">
                    {dict.winners.winner}
                  </span>
                  <span className="truncate font-extrabold text-emerald-950">
                    {auction.winnerName}
                  </span>
                </div>
              )}
              {auction.winnerBidValue != null && (
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-emerald-800">
                    {dict.winners.winningBid}
                  </span>
                  <span className="font-extrabold text-emerald-950">
                    {formatCurrency(auction.winnerBidValue)}
                  </span>
                </div>
              )}
            </div>
          ) : null}
          <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-2.5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {dict.auctions.entranceFee}
              </p>
              <p className="text-sm font-extrabold text-slate-900">
                {formatCurrency(auction.entranceFee)}
              </p>
            </div>
            {isOpen ? (
              <span className="inline-flex items-center justify-center rounded-xl bg-[var(--brand-blue)] px-4 py-2 text-xs font-bold text-white shadow-sm transition group-hover:brightness-110">
                {dict.auctions.setBid}
              </span>
            ) : (
              <span className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 transition group-hover:border-slate-300 group-hover:bg-slate-100">
                {dict.auctions.viewResults}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

