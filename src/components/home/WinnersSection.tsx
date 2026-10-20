"use client";

import Link from "next/link";
import {
  Gavel,
  CheckCircle2,
  FileText,
  Search,
  Scale,
  ArrowRight,
} from "lucide-react";
import { SectionTag } from "@/components/home/SectionTag";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Auction } from "@/services/auctions.service";
import { auctionCoverImage } from "@/lib/auction-media";

export function WinnersSection({ winners }: { winners: Auction[] }) {
  const { dict, formatCurrency } = useLanguage();

  return (
    <section
      id="winners"
      className="relative scroll-mt-24 overflow-hidden py-16 sm:py-20"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[#f4f6f8]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "linear-gradient(to right, #dbe3ea 1px, transparent 1px), linear-gradient(to bottom, #dbe3ea 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionTag>{dict.winners.tag}</SectionTag>

        {/* Section Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              {dict.winners.title}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-slate-600">
              {dict.winners.subtitle}
            </p>
          </div>
          <Link
            href="/auctions?status=executed"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[var(--brand-blue)] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#1c8ee0]"
          >
            <span>{dict.winners.seePastResults}</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* 3 Transparency & Audit Pillars */}
        <div className="mb-10 grid grid-cols-1 gap-3.5 sm:grid-cols-3">
          <div className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-xs">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[var(--brand-blue)]">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                {dict.winners.trustPoints.logTitle}
              </h4>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                {dict.winners.trustPoints.logDesc}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-xs">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Search className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                {dict.winners.trustPoints.verifyTitle}
              </h4>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                {dict.winners.trustPoints.verifyDesc}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-xs">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                {dict.winners.trustPoints.fairTitle}
              </h4>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                {dict.winners.trustPoints.fairDesc}
              </p>
            </div>
          </div>
        </div>

        {/* Audit Cards Grid */}
        {winners.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center text-slate-500">
            {dict.winners.empty}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
            {winners.map((auction) => {
              const cover = auctionCoverImage(auction);
              return (
                <Link
                  key={auction.id}
                  href={`/auctions/${auction.id}`}
                  className="group flex flex-col overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-3 sm:p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-md"
                >
                  {/* Product Cover with Verification Badges */}
                  <div className="relative aspect-[16/10] overflow-hidden rounded-xl sm:rounded-2xl bg-neutral-100 flex items-center justify-center">
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={cover}
                        alt={auction.title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-300">
                        <Gavel className="h-10 w-10" />
                      </div>
                    )}
                    {/* Audited Pill Badge */}
                    <span className="absolute left-2.5 top-2.5 z-10 inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-xs">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>{dict.winners.auditedAndVerified}</span>
                    </span>

                    {/* Winning Unique Value Badge */}
                    {auction.winnerBidValue != null && (
                      <span className="absolute right-2.5 top-2.5 z-10 inline-flex items-center gap-1 rounded-full bg-[var(--brand-yellow)] px-2.5 py-1 text-[11px] font-extrabold text-black shadow-xs">
                        {formatCurrency(Number(auction.winnerBidValue))}
                      </span>
                    )}
                  </div>

                  {/* Card Info */}
                  <div className="flex flex-1 flex-col pt-3">
                    <h3 className="line-clamp-1 text-sm sm:text-base font-bold text-slate-900 group-hover:text-[var(--brand-blue)] transition-colors">
                      {auction.title}
                    </h3>

                    {/* Winner and Bid Summary */}
                    <div className="mt-2.5 flex items-baseline justify-between gap-2 border-t border-slate-100 pt-2.5">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {dict.winners.winner}
                        </p>
                        <p className="truncate text-xs sm:text-sm font-bold text-slate-800">
                          {auction.winnerName || dict.winners.won}
                        </p>
                      </div>
                      {auction.winnerBidValue != null && (
                        <div className="shrink-0 text-right">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {dict.winners.winningBid}
                          </p>
                          <p className="text-xs sm:text-sm font-black text-emerald-600 tabular-nums">
                            {formatCurrency(Number(auction.winnerBidValue))}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* View Audit Button */}
                    <span className="mt-3 inline-flex h-9 sm:h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-3 text-xs sm:text-sm font-bold text-white shadow-xs transition-colors group-hover:bg-[var(--brand-blue)]">
                      <Search className="h-3.5 w-3.5" />
                      <span>{dict.winners.viewAudit}</span>
                      <ArrowRight className="h-3.5 w-3.5 ml-0.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
