"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionTag } from "@/components/home/SectionTag";
import { useLanguage } from "@/contexts/LanguageContext";

export function CtaSection() {
  const { dict } = useLanguage();

  return (
    <section
      id="join"
      className="relative scroll-mt-24 overflow-hidden bg-[#2D9FF6] py-16 sm:py-20"
    >
      <Image
        src="/hero_banner.jpg"
        alt=""
        fill
        sizes="100vw"
        className="pointer-events-none object-cover object-center"
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <SectionTag>{dict.home.ctaTag}</SectionTag>
        <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
          {dict.home.ctaTitlePrefix}{" "}
          <span className="mt-1 block text-[#FFF307]">
            {dict.home.ctaTitleHighlight}
          </span>
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-white/90 sm:text-base">
          {dict.home.ctaSubtitle}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/signup"
            className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-bold text-[#1c8ee0] shadow-sm transition hover:bg-white/95"
          >
            {dict.home.createAccount}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/auctions"
            className="inline-flex h-12 items-center gap-2 rounded-full border-2 border-white/90 bg-transparent px-6 text-sm font-bold text-white transition hover:bg-white/10"
          >
            {dict.home.browseAuctions}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

