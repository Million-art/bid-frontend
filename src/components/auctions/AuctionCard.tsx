"use client";

import Link from "next/link";
import { Clock, Gavel } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Auction } from "@/services/auctions.service";

export function AuctionCard({ auction }: { auction: Auction }) {
  const { dict, formatCurrency, formatDate } = useLanguage();

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

  const closes = auction.closeAt ? new Date(auction.closeAt) : null;
  const closesLabel =
    closes && !Number.isNaN(closes.getTime()) ? formatDate(closes) : null;

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
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 text-base font-bold text-slate-900 group-hover:text-[var(--brand-blue)]">
          {auction.title}
        </h3>
        <p className="line-clamp-2 text-sm text-slate-500">
          {auction.description || dict.howItWorks.title}
        </p>
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {dict.auctions.entranceFee}
            </p>
            <p className="text-sm font-bold text-slate-900">
              {formatCurrency(auction.entranceFee)}
            </p>
          </div>
          {closesLabel && (
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Clock className="h-3.5 w-3.5" />
              <span className="line-clamp-1">{closesLabel}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

