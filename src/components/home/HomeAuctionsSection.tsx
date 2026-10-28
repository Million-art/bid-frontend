"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SectionTag } from "@/components/home/SectionTag";
import { AuctionCard } from "@/components/auctions/AuctionCard";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  listAuctions,
  type PublicAuctionCard,
} from "@/services/auctions.service";

const POLL_MS = 45_000;

export function HomeAuctionsSection({
  auctions,
}: {
  auctions: PublicAuctionCard[];
}) {
  const { dict } = useLanguage();
  const [items, setItems] = useState<PublicAuctionCard[]>(auctions);

  useEffect(() => {
    setItems(auctions);
  }, [auctions]);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await listAuctions({ page: 1, limit: 24 });
        if (!cancelled && res.items) {
          setItems(res.items);
        }
      } catch {
        // keep last good snapshot
      }
    };
    const id = window.setInterval(tick, POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

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
        {items.length === 0 ? (
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
