"use client";

import { Suspense, use, useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ProductMediaGallery } from "@/components/media/ProductMediaGallery";
import { AuctionCard } from "@/components/auctions/AuctionCard";
import { AuctionCountdown } from "@/components/auctions/AuctionCountdown";
import { BidPanel } from "@/components/auctions/BidPanel";
import {
  useAuction,
  useMyBids,
  useMyParticipation,
} from "@/hooks/useAuction";
import { listAuctions } from "@/services/auctions.service";
import { queryKeys } from "@/lib/query-keys";
import { useLanguage } from "@/contexts/LanguageContext";

export default function AuctionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { dict } = useLanguage();
  const { data: auction, isLoading, error } = useAuction(id);
  const { data: participation } = useMyParticipation(id);
  const { data: myBids = [] } = useMyBids(id);

  const { data: listData } = useQuery({
    queryKey: queryKeys.auctions.list({ page: 1, limit: 24 }),
    queryFn: () => listAuctions({ page: 1, limit: 24 }),
  });

  const recommendedAuctions = useMemo(() => {
    const all = listData?.items ?? [];
    const others = all.filter((item) => item.id !== id);
    return [...others]
      .sort((a, b) => {
        const aOpen = ["active", "postponed"].includes(
          String(a.status).toLowerCase()
        )
          ? 0
          : 1;
        const bOpen = ["active", "postponed"].includes(
          String(b.status).toLowerCase()
        )
          ? 0
          : 1;
        if (aOpen !== bOpen) return aOpen - bOpen;
        const aTime = a.closeAt
          ? new Date(a.closeAt).getTime()
          : Number.POSITIVE_INFINITY;
        const bTime = b.closeAt
          ? new Date(b.closeAt).getTime()
          : Number.POSITIVE_INFINITY;
        return aTime - bTime;
      })
      .slice(0, 6);
  }, [listData, id]);

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
        <p className="text-lg font-bold text-slate-900">
          {dict.auctionDetail.notFound}
        </p>
        <Link
          href="/auctions"
          className="mt-4 inline-block text-sm font-bold text-[var(--brand-blue)] hover:underline"
        >
          {dict.auctionDetail.backToAuctions}
        </Link>
      </div>
    );
  }

  const statusKey = String(auction.status).toLowerCase();
  const statusLabel =
    statusKey in dict.auctions.filters
      ? dict.auctions.filters[statusKey as keyof typeof dict.auctions.filters]
      : auction.status;

  return (
    <div className="bg-slate-50 pb-20 pt-24 sm:pt-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link
          href="/auctions"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" /> {dict.auctionDetail.allAuctions}
        </Link>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <ProductMediaGallery
            imageUrl={auction.imageUrl}
            videoUrl={auction.videoUrl}
          />

          <div className="space-y-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--brand-blue)]">
                {statusLabel}
              </p>
              <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">
                {auction.title}
              </h1>
              {auction.description ? (
                <p className="mt-3 whitespace-pre-wrap text-base leading-relaxed text-slate-600">
                  {auction.description}
                </p>
              ) : null}
              <AuctionCountdown
                closeAt={auction.closeAt}
                status={auction.status}
                variant="detail"
              />
            </div>

            <div className="rounded-xl border border-sky-100 bg-sky-50/80 px-4 py-3 text-sm text-sky-950">
              <strong className="font-bold">{dict.auctionDetail.lubRuleTitle}</strong>{" "}
              {dict.auctionDetail.lubRuleBody}
            </div>

            <Suspense fallback={null}>
              <BidPanel
                auction={auction}
                participating={Boolean(participation?.participating)}
                myBids={myBids}
              />
            </Suspense>
          </div>
        </div>

        {recommendedAuctions.length > 0 && (
          <section className="mt-16 border-t border-slate-200/80 pt-12">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[var(--brand-blue)]">
                  {dict.auctionDetail.recommendedTag}
                </p>
                <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                  {dict.auctionDetail.recommendedTitle}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {dict.auctionDetail.recommendedSubtitle}
                </p>
              </div>
              <Link
                href="/auctions"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--brand-blue)] hover:underline"
              >
                {dict.common.viewAll}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {recommendedAuctions.map((item) => (
                <AuctionCard key={item.id} auction={item} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

