import { HowLubWorks } from "@/components/auctions/HowLubWorks";
import { HeroSection } from "@/components/home/HeroSection";
import { HomeAuctionsSection } from "@/components/home/HomeAuctionsSection";
import { FAQSection } from "@/components/home/FAQSection";
import { WinnersSection } from "@/components/home/WinnersSection";
import { CtaSection } from "@/components/home/CtaSection";
import { listAuctions } from "@/services/auctions.service";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let auctions: Awaited<ReturnType<typeof listAuctions>>["items"] = [];
  let winners: Awaited<ReturnType<typeof listAuctions>>["items"] = [];
  try {
    const [activeRes, executedRes] = await Promise.all([
      listAuctions({ page: 1, limit: 6, status: "active" }),
      listAuctions({ page: 1, limit: 6, status: "executed" }),
    ]);
    auctions = activeRes.items.slice(0, 6);
    winners = executedRes.items
      .filter((a) => Boolean(a.winnerName))
      .slice(0, 6);
  } catch {
    auctions = [];
    winners = [];
  }

  return (
    <>
      <HeroSection
        winner={
          winners[0]
            ? {
                name: winners[0].winnerName,
                product: winners[0].title,
              }
            : null
        }
      />
      <HomeAuctionsSection auctions={auctions} />
      <HowLubWorks />
      <WinnersSection winners={winners} />
      <FAQSection />
      <CtaSection />
    </>
  );
}

