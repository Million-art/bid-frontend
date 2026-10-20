"use client";

import Image from "next/image";
import Link from "next/link";
import { Trophy, Users } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

function shortWinnerName(name?: string | null) {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (parts.length === 0) return "A bidder";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

export function HeroSection({
  winner,
}: {
  winner?: { name?: string | null; product?: string | null } | null;
}) {
  const { dict, t } = useLanguage();
  const winnerLabel =
    winner?.product
      ? t("home.justWon", {
          name: shortWinnerName(winner.name),
          product: winner.product,
        })
      : null;

  return (
    <section className="relative overflow-hidden bg-[#2D9FF6] pt-16 sm:pt-20">
      <Image
        src="/hero_banner.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="pointer-events-none object-cover object-center"
        aria-hidden
      />

      <div className="relative z-10 mx-auto min-h-[560px] max-w-7xl px-4 sm:min-h-[620px] sm:px-6 lg:min-h-[700px] lg:px-8">
        <Image
          src="/watch-1.png"
          alt=""
          width={420}
          height={420}
          priority
          className="pointer-events-none absolute left-[-8px] top-10 z-20 w-24 rotate-[-18deg] object-contain sm:left-2 sm:top-16 sm:w-36 lg:left-0 lg:top-20 lg:w-44"
        />

        <div className="relative z-30 mx-auto flex max-w-2xl flex-col items-center px-8 pb-6 pt-20 text-center sm:px-16 sm:pt-24 lg:pb-28 lg:pt-28">
          <h1 className="text-[2.4rem] font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-[3.6rem]">
            {dict.home.heroTitlePrefix}{" "}
            <span className="text-[#FFF307]">{dict.home.heroTitleHighlight}</span>
          </h1>
          <p className="mt-4 text-lg font-semibold text-white sm:text-xl">
            {dict.home.heroKicker}
          </p>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-white/90 sm:text-base">
            {dict.home.heroSubtitle}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/auctions"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-bold text-[#1c8ee0] shadow-sm transition hover:bg-white/95"
            >
              <Trophy className="h-4 w-4" />
              {dict.home.winProduct}
            </Link>
            <Link
              href="/#how-it-works"
              className="inline-flex h-12 items-center gap-2 rounded-full border-2 border-white/90 bg-transparent px-6 text-sm font-bold text-white transition hover:bg-white/10"
            >
              <Users className="h-4 w-4" />
              {dict.home.howItWorksBtn}
            </Link>
          </div>
        </div>

        <div className="pointer-events-none relative z-10 mx-auto w-[min(100%,920px)] lg:absolute lg:bottom-0 lg:right-0 lg:mx-0 lg:w-[72%] lg:max-w-[880px]">
          {winnerLabel ? (
            <div className="pointer-events-auto absolute left-3 top-2 z-20 hidden w-[220px] sm:block lg:left-[26%] lg:top-[8%] lg:w-[240px]">
              <div className="flex items-center gap-2.5 rounded-2xl bg-white px-3 py-2.5 shadow-[0_12px_30px_rgba(15,23,42,0.12)]">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FFF307] text-slate-900">
                  <Trophy className="h-4 w-4" />
                </span>
                <div className="min-w-0 text-left">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    {dict.home.recentWinner}
                  </p>
                  <p className="truncate text-xs font-bold text-slate-900">
                    {winnerLabel}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <Image
            src="/hero-products.png"
            alt=""
            width={932}
            height={584}
            priority
            sizes="(max-width: 1024px) 100vw, 880px"
            className="relative z-0 h-auto w-full object-contain object-bottom drop-shadow-[0_18px_28px_rgba(8,47,73,0.16)]"
          />
        </div>
      </div>
    </section>
  );
}
