"use client";

import Image from "next/image";
import Link from "next/link";
import { Trophy, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { listAuctions } from "@/services/auctions.service";
import { useEffect, useState } from "react";

const easeOut = [0.22, 1, 0.36, 1] as const;

export interface HeroFeaturedAuction {
  id?: string;
  title?: string | null;
  entranceFee?: number | null;
}

export function HeroSection({
  featuredAuction,
  winner,
}: {
  featuredAuction?: HeroFeaturedAuction | null;
  winner?: { name?: string | null; product?: string | null } | null;
}) {
  const { dict, locale } = useLanguage();
  const reduceMotion = useReducedMotion();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [autoplay, setAutoplay] = useState(true);

  const { data } = useQuery({
    queryKey: ["hero-auctions", locale],
    queryFn: () => listAuctions({
      page: 1,
      limit: 6,
      status: "active",
      sort: "-createdAt",
    }),
    staleTime: 15_000,
    refetchInterval: 45_000,
    refetchOnWindowFocus: true,
  });

  const auctions = data?.items || [];

  const slideCount = Math.min(6, auctions.length);

  useEffect(() => {
    if (!autoplay || slideCount <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slideCount);
    }, 4000);

    return () => clearInterval(interval);
  }, [autoplay, slideCount]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setAutoplay(false);
  };

  const goToPrev = () => {
    setCurrentSlide((prev) => (prev - 1 + slideCount) % slideCount);
    setAutoplay(false);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slideCount);
    setAutoplay(false);
  };

  const auction = auctions[currentSlide] || {};
  const auctionTitle =
    auction.title?.trim() ||
    featuredAuction?.title?.trim() ||
    winner?.product?.trim() ||
    "iphone 18";
  const auctionFee = auction.entranceFee || featuredAuction?.entranceFee || 75;
  const formattedFee =
    locale === "am" ? `${auctionFee} ብር` : `${auctionFee} ETB`;
  const auctionHref = auction.id
    ? `/auctions/${auction.id}`
    : featuredAuction?.id
      ? `/auctions/${featuredAuction.id}`
      : "/auctions";

  const fadeUp = {
    hidden: reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: reduceMotion ? 0 : 0.55, ease: easeOut },
    },
  };

  const copyContainer = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: reduceMotion ? 0 : 0.1,
        delayChildren: reduceMotion ? 0 : 0.1,
      },
    },
  };

  return (
    <section className="relative overflow-hidden bg-white pt-16 sm:bg-[#2D9FF6] sm:pt-20">
      {/* Sunburst background — desktop/tablet only */}
      <Image
        src="/hero_banner.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="pointer-events-none hidden object-cover object-center sm:block"
        aria-hidden
      />

      {/* Right soft light-blue arch backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-[25%] top-[8%] z-10 hidden h-[125%] w-[68%] rounded-tl-[999px] rounded-bl-[999px] bg-gradient-to-br from-[#bce3ff]/85 via-[#a6d9ff]/80 to-[#7cc4ff]/75 backdrop-blur-[2px] lg:block"
      />

      <div className="relative z-20 mx-auto grid min-h-[calc(100svh-4rem)] max-w-7xl grid-cols-1 items-center gap-10 px-4 pb-12 pt-10 sm:min-h-[600px] sm:px-6 lg:min-h-[640px] lg:grid-cols-12 lg:gap-8 lg:px-8 lg:py-12">
        {/* Left copy + CTA buttons */}
        <motion.div
          className="relative z-30 flex flex-col items-start text-left lg:col-span-6"
          variants={copyContainer}
          initial="hidden"
          animate="show"
        >
          <motion.h1
            variants={fadeUp}
            className="text-[2.4rem] font-extrabold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl sm:text-white lg:text-[3.75rem]"
          >
            <span className="block">{dict.home.heroTitlePrefix}</span>
            <span className="mt-1 block text-[#2D9FF6] sm:text-[#FFF307]">
              {dict.home.heroTitleHighlight}
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mt-6 max-w-lg text-base font-bold leading-relaxed text-slate-600 sm:text-xl sm:text-white"
          >
            {dict.home.heroSubtitle}
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="mt-9 flex w-full flex-col items-stretch gap-4 sm:w-auto sm:flex-row sm:items-center"
          >
            <Link
              href="/auctions"
              className="inline-flex h-14 items-center justify-center gap-2.5 rounded-2xl bg-[#2D9FF6] px-7 text-base font-extrabold text-white shadow-[0_10px_25px_rgba(13,60,110,0.18)] transition hover:-translate-y-0.5 hover:bg-[#1c8ee0] active:translate-y-0 sm:bg-white sm:text-[#2D9FF6] sm:hover:bg-white/95"
            >
              <Trophy className="h-5 w-5 shrink-0" />
              <span>{dict.home.browseAuctions}</span>
            </Link>

            <Link
              href="/#how-it-works"
              className="inline-flex h-14 items-center justify-center gap-2.5 rounded-2xl border border-slate-200 bg-slate-50 px-7 text-base font-extrabold text-slate-800 transition hover:-translate-y-0.5 hover:bg-slate-100 active:translate-y-0 sm:border-white/85 sm:bg-white/15 sm:text-white sm:backdrop-blur-xs sm:hover:bg-white/25"
            >
              <Users className="h-5 w-5 shrink-0" />
              <span>{dict.home.howItWorksBtn}</span>
            </Link>
            </motion.div>
        </motion.div>

        {/* Floating "Current auction" card slider with navigation */}
        <motion.div
          className="relative z-20 flex w-full items-center justify-center lg:col-span-6 lg:justify-end"
          initial={reduceMotion ? false : { opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: reduceMotion ? 0 : 0.7,
            delay: reduceMotion ? 0 : 0.2,
            ease: easeOut,
          }}
        >
          <div className="relative mx-auto w-full max-w-[540px] pt-4 pb-10 sm:pb-14">
            {/* Main product image above pedestal */}
            <div className="relative z-20 mx-auto flex items-end justify-center px-4">
              <Image
                src="/hero-products.png"
                alt="Featured auction prizes"
                width={1375}
                height={841}
                priority
                sizes="(max-width: 640px) 90vw, (max-width: 1024px) 60vw, 540px"
                className="relative z-20 h-auto w-full max-w-[420px] object-contain drop-shadow-[0_24px_34px_rgba(15,23,42,0.32)] sm:max-w-[470px]"
              />
            </div>

            {/* 3D White Cylinder Pedestal */}
            <div
              aria-hidden
              className="relative z-10 mx-auto -mt-6 h-24 w-[92%] max-w-[480px] sm:-mt-8 sm:h-28"
            >
              {/* Cylinder body */}
              <div className="absolute inset-x-0 bottom-0 h-16 rounded-b-[100%] bg-gradient-to-r from-[#d5dbe3] via-[#f1f5f9] to-[#cbd5e1] shadow-[0_24px_48px_rgba(8,47,73,0.35)] sm:h-20" />
              {/* Cylinder top ellipse */}
              <div className="absolute inset-x-0 top-0 h-12 rounded-[100%] border border-white bg-gradient-to-b from-white via-[#f8fafc] to-[#e2e8f0] shadow-inner sm:h-14" />
            </div>

            {/* Slider container */}
            <div className="relative z-30 w-full overflow-hidden rounded-3xl bg-white p-4 shadow-[0_18px_40px_rgba(15,23,42,0.18)] transition-transform duration-200 hover:-translate-y-1 sm:p-5">
              {/* Navigation arrows */}
              {slideCount > 1 && (
                <>
                  <button
                    onClick={goToPrev}
                    className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-sm transition-all hover:bg-white hover:scale-110 active:scale-95 sm:left-3"
                    aria-label="Previous auction"
                  >
                    <ChevronLeft className="h-4 w-4 text-slate-700" />
                  </button>
                  <button
                    onClick={goToNext}
                    className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-sm transition-all hover:bg-white hover:scale-110 active:scale-95 sm:right-3"
                    aria-label="Next auction"
                  >
                    <ChevronRight className="h-4 w-4 text-slate-700" />
                  </button>
                </>
              )}

              {/* Single auction card in slider */}
              <Link
                href={auctionHref}
                className="group block"
                onMouseEnter={() => setAutoplay(false)}
                onMouseLeave={() => setAutoplay(true)}
              >
                <div className="flex items-center gap-2.5">
                  
                  <span className="text-sm font-extrabold text-slate-500 sm:text-base">
                    {dict.home.currentAuction}
                  </span>
                </div>

                <p className="mt-2 truncate text-lg font-extrabold text-[#F59E0B] group-hover:underline sm:text-xl">
                  {auctionTitle}
                </p>

                <div className="mt-2.5 flex items-baseline justify-between gap-2 border-t border-slate-200 pt-2.5">
                  <span className="text-xs font-bold text-slate-800 sm:text-sm">
                    {dict.home.entryFrom}
                  </span>
                  <span className="text-lg font-extrabold text-[#2D9FF6] tabular-nums sm:text-2xl">
                    {formattedFee}
                  </span>
                </div>

                {/* Slide indicators */}
                {slideCount > 1 && (
                  <div className="mt-3 flex items-center justify-center gap-1.5">
                    {Array.from({ length: slideCount }).map((_, index) => (
                      <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        className={`h-1.5 rounded-full transition-all duration-300 ${index === currentSlide
                            ? "w-8 bg-[#2D9FF6]"
                            : "w-1.5 bg-slate-300 hover:bg-slate-400"
                          }`}
                        aria-label={`Go to auction ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
