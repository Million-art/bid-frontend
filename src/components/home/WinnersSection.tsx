import Link from "next/link";
import { Gavel, Trophy } from "lucide-react";
import { SectionTag } from "@/components/home/SectionTag";
import type { LubProduct } from "@/services/auctions.service";

function formatEtb(n: number) {
  return `${n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} ETB`;
}

function displayName(name: string | null | undefined) {
  const trimmed = name?.trim();
  if (!trimmed) return "A CarraMarket bidder";
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

export function WinnersSection({ winners }: { winners: LubProduct[] }) {
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
        <SectionTag>Winners</SectionTag>
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Lowest unique bids that won
          </h2>
          <p className="mt-3 text-base text-slate-600">
            When an auction closes, the lowest value placed by exactly one
            person takes the product.
          </p>
        </div>

        {winners.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center text-slate-500">
            No winners yet. Join a live auction and be the first.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {winners.map((auction) => (
              <Link
                key={auction.id}
                href={`/auctions/${auction.id}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:border-[var(--brand-blue)]/40 hover:shadow-md"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                  {auction.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={auction.imageUrl}
                      alt={auction.name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-300">
                      <Gavel className="h-10 w-10" />
                    </div>
                  )}
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#FFF307] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-900 shadow-sm">
                    <Trophy className="h-3 w-3" />
                    Winner
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-3 p-4">
                  <h3 className="line-clamp-2 text-base font-bold text-slate-900 group-hover:text-[var(--brand-blue)]">
                    {auction.name}
                  </h3>
                  <div className="mt-auto flex items-end justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Winner
                      </p>
                      <p className="text-sm font-bold text-slate-900">
                        {displayName(auction.winnerName)}
                      </p>
                    </div>
                    {auction.winnerBidValue != null && (
                      <div className="text-right">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Winning bid
                        </p>
                        <p className="text-sm font-extrabold text-[#2D9FF6]">
                          {formatEtb(Number(auction.winnerBidValue))}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
