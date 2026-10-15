import Link from "next/link";
import { HowLubWorks } from "@/components/auctions/HowLubWorks";
import { AuctionCard } from "@/components/auctions/AuctionCard";
import { HeroSection } from "@/components/home/HeroSection";
import { FAQSection } from "@/components/home/FAQSection";
import { WinnersSection } from "@/components/home/WinnersSection";
import { CtaSection } from "@/components/home/CtaSection";
import { SectionTag } from "@/components/home/SectionTag";
import { listAuctions } from "@/services/auctions.service";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let auctions: Awaited<ReturnType<typeof listAuctions>>["items"] = [];
  let winners: Awaited<ReturnType<typeof listAuctions>>["items"] = [];
  try {
    const res = await listAuctions({ page: 1, limit: 24 });
    auctions = res.items
      .filter((a) => ["active", "postponed"].includes(String(a.status)))
      .slice(0, 6);
    winners = res.items
      .filter(
        (a) =>
          ["executed", "closed"].includes(String(a.status)) &&
          (a.winnerName || a.winnerBidValue != null)
      )
      .slice(0, 6);
  } catch {
    auctions = [];
    winners = [];
  }

  return (
    <>
      <HeroSection />

      <section className="bg-slate-50 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTag>Auctions</SectionTag>
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
                Open auctions
              </h2>
            </div>
            <Link
              href="/auctions"
              className="text-sm font-bold text-[var(--brand-blue)] hover:underline"
            >
              View all
            </Link>
          </div>
          {auctions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center text-slate-500">
              No live auctions right now. Check back soon.
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {auctions.map((auction) => (
                <AuctionCard key={auction.id} auction={auction} />
              ))}
            </div>
          )}
        </div>
      </section>

      <HowLubWorks />

      <WinnersSection winners={winners} />

      <FAQSection />

      <CtaSection />
    </>
  );
}
