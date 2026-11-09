"use client";

import Image from "next/image";
import Link from "next/link";
import { Trophy, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import {
  listAuctions,
  type PublicAuctionCard,
} from "@/services/auctions.service";
import { useEffect, useState } from "react";

const easeOut = [0.22, 1, 0.36, 1] as const;
const AUTOPLAY_MS = 3500;

export function HeroSection({
  initialAuctions = [],
}: {
  initialAuctions?: PublicAuctionCard[];
}) {
  const { dict, locale, formatCurrency, t } = useLanguage();
  const reduceMotion = useReducedMotion();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const [slideDir, setSlideDir] = useState(1);

  const { data } = useQuery({
    queryKey: ["hero-auctions", locale],
    queryFn: () =>
      listAuctions({
        page: 1,
        limit: 6,
        status: "active",
        sort: "-createdAt",
      }),
    initialData:
      initialAuctions.length > 0
        ? {
            items: initialAuctions,
            total: initialAuctions.length,
            page: 1,
            limit: 6,
            totalPages: 1,
            hasMore: false,
            statusCounts: {},
          }
        : undefined,
    staleTime: 15_000,
    refetchInterval: 45_000,
    refetchOnWindowFocus: true,
  });

  const auctions = (data?.items?.length ? data.items : initialAuctions).slice(
    0,
    6
  );
  const slideCount = auctions.length;

  useEffect(() => {
    if (slideCount <= 0) return;
    setCurrentSlide((prev) => (prev >= slideCount ? 0 : prev));
  }, [slideCount]);

  useEffect(() => {
    if (paused || slideCount <= 1) return;
    const interval = window.setInterval(() => {
      setSlideDir(1);
      setCurrentSlide((prev) => (prev + 1) % slideCount);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(interval);
  }, [paused, slideCount, currentSlide]);

  const goToSlide = (index: number) => {
    setSlideDir(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
  };

  const goToPrev = () => {
    if (slideCount <= 1) return;
    setSlideDir(-1);
    setCurrentSlide((prev) => (prev - 1 + slideCount) % slideCount);
  };

  const goToNext = () => {
    if (slideCount <= 1) return;
    setSlideDir(1);
    setCurrentSlide((prev) => (prev + 1) % slideCount);
  };

  const auction = auctions[currentSlide];
  const auctionTitle = auction?.title?.trim() || "";
  const auctionFee = Number(auction?.entranceFee ?? 0);
  const retailValue = Number(auction?.retailValue ?? 0);
  const auctionHref = auction?.id ? `/auctions/${auction.id}` : "/auctions";

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
    <section className="relative overflow-hidden bg-white pt-[4.75rem] sm:bg-[#2D9FF6] sm:pt-[5.25rem]">
      <Image
        src="/hero_banner.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="pointer-events-none hidden object-cover object-center sm:block"
        aria-hidden
      />

      <div className="relative z-20 mx-auto flex w-full max-w-6xl flex-col items-stretch gap-8 px-4 py-10 sm:px-6 lg:min-h-[calc(100svh-5.25rem)] lg:flex-row lg:items-center lg:gap-12 lg:px-8 lg:py-12">
        {/* Copy */}
        <motion.div
          className="relative z-30 flex w-full flex-col items-start justify-center text-left lg:w-1/2 lg:max-w-xl lg:shrink-0"
          variants={copyContainer}
          initial="hidden"
          animate="show"
        >
          <motion.h1
            variants={fadeUp}
            className="text-[2.35rem] font-extrabold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl sm:text-white lg:text-[3.5rem]"
          >
            <span className="block">{dict.home.heroTitlePrefix}</span>
            <span className="mt-1 block text-[#2D9FF6] sm:text-[#FFF307]">
              {dict.home.heroTitleHighlight}
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mt-5 max-w-md text-base font-bold leading-relaxed text-slate-600 sm:text-lg sm:text-white"
          >
            {dict.home.heroSubtitle}
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="mt-8 flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center"
          >
            <Link
              href="/auctions"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#2D9FF6] px-6 text-sm font-extrabold text-white shadow-[0_10px_25px_rgba(13,60,110,0.18)] transition hover:-translate-y-0.5 hover:bg-[#1c8ee0] active:translate-y-0 sm:h-14 sm:bg-white sm:px-7 sm:text-base sm:text-[#2D9FF6] sm:hover:bg-white/95"
            >
              <Trophy className="h-5 w-5 shrink-0" />
              <span>{dict.home.browseAuctions}</span>
            </Link>

            <Link
              href="/#how-it-works"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-6 text-sm font-extrabold text-slate-800 transition hover:-translate-y-0.5 hover:bg-slate-100 active:translate-y-0 sm:h-14 sm:border-white/85 sm:bg-white/15 sm:px-7 sm:text-base sm:text-white sm:backdrop-blur-xs sm:hover:bg-white/25"
            >
              <Users className="h-5 w-5 shrink-0" />
              <span>{dict.home.howItWorksBtn}</span>
            </Link>
          </motion.div>
        </motion.div>

        {/* Products + card — one centered column */}
        <motion.div
          className="relative z-20 flex w-full justify-center lg:w-1/2 lg:justify-end"
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: reduceMotion ? 0 : 0.65,
            delay: reduceMotion ? 0 : 0.15,
            ease: easeOut,
          }}
        >
          <div className="flex w-full max-w-[400px] flex-col items-center sm:max-w-[440px]">
            <Image
              src="/hero-products.png"
              alt="Featured auction prizes"
              width={1375}
              height={841}
              priority
              sizes="(max-width: 640px) 90vw, 440px"
              className="relative z-20 h-auto w-[88%] object-contain drop-shadow-[0_20px_28px_rgba(15,23,42,0.28)]"
            />

            <div
              aria-hidden
              className="relative z-10 -mt-4 h-14 w-[82%] sm:-mt-5 sm:h-16"
            >
              <div className="absolute inset-x-0 bottom-0 h-10 rounded-b-[100%] bg-gradient-to-r from-[#d5dbe3] via-[#f1f5f9] to-[#cbd5e1] shadow-[0_16px_32px_rgba(8,47,73,0.28)] sm:h-12" />
              <div className="absolute inset-x-0 top-0 h-7 rounded-[100%] border border-white bg-gradient-to-b from-white via-[#f8fafc] to-[#e2e8f0] shadow-inner sm:h-8" />
            </div>

            <div
              className="relative z-30 -mt-2 w-full rounded-2xl bg-white px-3.5 py-3 shadow-[0_12px_28px_rgba(15,23,42,0.14)]"
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
              onFocusCapture={() => setPaused(true)}
              onBlurCapture={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                  setPaused(false);
                }
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-extrabold text-slate-500">
                  {dict.home.currentAuction}
                </span>
                {slideCount > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={goToPrev}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200 active:scale-95"
                      aria-label="Previous auction"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={goToNext}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200 active:scale-95"
                      aria-label="Next auction"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              <Link href={auctionHref} className="group mt-1.5 block">
                <div className="relative min-h-[1.5rem] overflow-hidden">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.p
                      key={`${auction?.id || "empty"}-title-${currentSlide}`}
                      initial={
                        reduceMotion
                          ? { opacity: 1, y: 0 }
                          : { opacity: 0, y: slideDir * 10 }
                      }
                      animate={{ opacity: 1, y: 0 }}
                      exit={
                        reduceMotion
                          ? { opacity: 0 }
                          : { opacity: 0, y: slideDir * -10 }
                      }
                      transition={{
                        duration: reduceMotion ? 0 : 0.28,
                        ease: easeOut,
                      }}
                      className="truncate text-base font-extrabold text-[#F59E0B] group-hover:underline sm:text-lg"
                    >
                      {auctionTitle || dict.home.browseAuctions}
                    </motion.p>
                  </AnimatePresence>
                </div>

                <div className="mt-2 flex items-baseline justify-between gap-3 border-t border-slate-100 pt-2">
                  <span className="text-xs font-bold text-slate-700">
                    {dict.home.entryFrom}
                  </span>
                  <div className="text-right">
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.span
                        key={`${auction?.id || "empty"}-fee-${currentSlide}`}
                        initial={reduceMotion ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: reduceMotion ? 0 : 0.2 }}
                        className="block text-base font-extrabold tabular-nums text-[#2D9FF6] sm:text-lg"
                      >
                        {auctionFee > 0 ? formatCurrency(auctionFee) : "—"}
                      </motion.span>
                    </AnimatePresence>
                    {retailValue > 0 && (
                      <span className="mt-0.5 block text-[11px] font-bold text-slate-500">
                        {t("auctions.worth", {
                          amount: formatCurrency(retailValue),
                        })}
                      </span>
                    )}
                  </div>
                </div>
              </Link>

              {slideCount > 1 && (
                <div className="mt-2.5 flex items-center justify-center gap-1.5">
                  {auctions.map((item, index) => (
                    <button
                      key={item.id || index}
                      type="button"
                      onClick={() => goToSlide(index)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        index === currentSlide
                          ? "w-6 bg-[#2D9FF6]"
                          : "w-1.5 bg-slate-300 hover:bg-slate-400"
                      }`}
                      aria-label={`Go to auction ${index + 1}`}
                      aria-current={index === currentSlide ? "true" : undefined}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
