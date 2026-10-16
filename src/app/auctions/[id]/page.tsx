"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";
import { ProductMediaGallery } from "@/components/media/ProductMediaGallery";
import { BidPanel } from "@/components/auctions/BidPanel";
import {
  useAuction,
  useMyBids,
  useMyParticipation,
} from "@/hooks/useAuction";

export default function AuctionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: auction, isLoading, error } = useAuction(id);
  const { data: participation } = useMyParticipation(id);
  const { data: myBids = [] } = useMyBids(id);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center pt-28">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--brand-blue)] border-t-transparent" />
      </div>
    );
  }

  if (error || !auction) {
    return (
      <div className="mx-auto max-w-lg px-4 pb-20 pt-28 text-center">
        <p className="text-lg font-bold text-slate-900">Auction not found</p>
        <Link
          href="/auctions"
          className="mt-4 inline-block text-sm font-bold text-[var(--brand-blue)] hover:underline"
        >
          Back to auctions
        </Link>
      </div>
    );
  }

  const closes = auction.closeAt ? new Date(auction.closeAt) : null;

  return (
    <div className="bg-slate-50 pb-20 pt-24 sm:pt-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link
          href="/auctions"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" /> All auctions
        </Link>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <ProductMediaGallery
            imageUrl={auction.imageUrl}
            videoUrl={auction.videoUrl}
          />

          <div className="space-y-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--brand-blue)]">
                {String(auction.status)}
              </p>
              <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">
                {auction.title}
              </h1>
              {closes && !Number.isNaN(closes.getTime()) && (
                <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
                  <Clock className="h-4 w-4" />
                  Closes {closes.toLocaleString()}
                </p>
              )}
              {auction.description ? (
                <p className="mt-4 whitespace-pre-wrap text-base leading-relaxed text-slate-600">
                  {auction.description}
                </p>
              ) : null}
            </div>

            <div className="rounded-xl border border-sky-100 bg-sky-50/80 px-4 py-3 text-sm text-sky-950">
              <strong className="font-bold">LUB rule:</strong> the winner is the
              lowest bid value placed by exactly one person.
            </div>

            <BidPanel
              auction={auction}
              participating={Boolean(participation?.participating)}
              myBids={myBids}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
