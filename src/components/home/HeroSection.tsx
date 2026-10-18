"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export function HeroSection() {
  const { dict } = useLanguage();

  return (
    <section className="relative overflow-hidden bg-[#2D9FF6] pt-20 sm:pt-24">
      <Image
        src="/hero_banner.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="pointer-events-none object-cover object-center"
        aria-hidden
      />

      <div className="relative z-10 mx-auto grid max-w-7xl items-end gap-8 px-4 pb-0 pt-8 sm:px-6 lg:grid-cols-2 lg:gap-4 lg:px-8 lg:pt-6">
        <div className="max-w-xl pb-10 pt-4 lg:pb-20">
          <div className="mb-5 flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/90">
              {dict.home.heroTag}
            </span>
            <span className="h-5 w-5 rounded-full bg-[#FFF307]" />
          </div>

          <h1 className="text-[2.15rem] font-extrabold leading-[1.12] tracking-tight text-white sm:text-5xl lg:text-[3.35rem] lg:leading-[1.08]">
            {dict.home.heroTitlePrefix}{" "}
            <span className="mt-1 block text-[#FFF307]">
              {dict.home.heroTitleHighlight}
            </span>
          </h1>

          <p className="mt-5 max-w-md text-sm leading-relaxed text-white/90 sm:text-base">
            {dict.home.heroSubtitle}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/auctions"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-bold text-[#1c8ee0] shadow-sm transition hover:bg-white/95"
            >
              {dict.home.browseAuctions}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/#how-it-works"
              className="inline-flex h-12 items-center gap-2 rounded-full border-2 border-white/90 bg-transparent px-6 text-sm font-bold text-white transition hover:bg-white/10"
            >
              {dict.home.howItWorksBtn}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="relative mx-auto flex w-full max-w-lg items-end justify-center self-end lg:max-w-none lg:translate-x-4">
          <Image
            src="/hero.png"
            alt="Win CarraMarket auctions with the lowest unique bid"
            width={900}
            height={900}
            priority
            className="block h-auto w-full object-contain object-bottom align-bottom"
          />
        </div>
      </div>
    </section>
  );
}

