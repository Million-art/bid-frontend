import { AuctionCard } from "@/components/auctions/AuctionCard";
import { listAuctions } from "@/services/auctions.service";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Auctions",
  description: "Browse live Lowest Unique Bid auctions on CarraMarket.",
};

export default async function AuctionsPage() {
  let items: Awaited<ReturnType<typeof listAuctions>>["items"] = [];
  let error: string | null = null;
  try {
    const res = await listAuctions({ page: 1, limit: 48 });
    items = res.items;
  } catch {
    error = "Could not load auctions. Please try again later.";
  }

  return (
    <div className="bg-slate-50 pb-20 pt-24 sm:pt-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="mb-10 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--brand-blue)]">
            CarraMarket
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Auctions
          </h1>
          <p className="mt-3 text-base text-slate-600">
            Platform products. Pay the entrance fee, place your bids — lowest
            unique value wins.
          </p>
        </header>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center text-red-800">
            {error}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center text-slate-500">
            No auctions available yet.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((auction) => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
