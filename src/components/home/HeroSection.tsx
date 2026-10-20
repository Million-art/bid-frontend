"use client";

import Image from "next/image";
import Link from "next/link";
import { Trophy, Users } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

function shortWinnerName(name?: string | null) {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (parts.length === 0) return "A bidder";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

const easeOut = [0.22, 1, 0.36, 1] as const;

export function HeroSection({
  winner,
}: {
  winner?: { name?: string | null; product?: string | null } | null;
}) {
  const { dict, t } = useLanguage();
  const reduceMotion = useReducedMotion();
  const winnerLabel =
    winner?.product
      ? t("home.justWon", {
          name: shortWinnerName(winner.name),
          product: winner.product,
        })
      : null;

  const fadeUp = {
    hidden: reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 },
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
        delayChildren: reduceMotion ? 0 : 0.12,
      },
    },
  };

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

      <div className="relative z-20 mx-auto min-h-[560px] max-w-7xl px-4 pb-[32%] sm:min-h-[620px] sm:px-6 sm:pb-[28%] lg:min-h-[700px] lg:px-8 lg:pb-0">
        <motion.div
          className="pointer-events-none absolute left-[-8px] top-10 z-10 w-20 sm:left-2 sm:top-16 sm:w-28 lg:left-0 lg:top-20 lg:w-36"
          initial={reduceMotion ? false : { opacity: 0, x: -36, rotate: -28 }}
          animate={
            reduceMotion
              ? { opacity: 1, x: 0, rotate: -18 }
              : {
                  opacity: 1,
                  x: 0,
                  rotate: -18,
                  y: [0, -10, 0],
                }
          }
          transition={
            reduceMotion
              ? { duration: 0 }
              : {
                  opacity: { duration: 0.6, ease: easeOut },
                  x: { duration: 0.7, ease: easeOut },
                  rotate: { duration: 0.7, ease: easeOut },
                  y: {
                    duration: 4.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.8,
                  },
                }
          }
        >
          <Image
            src="/watch-1.png"
            alt=""
            width={420}
            height={420}
            priority
            className="h-auto w-full object-contain"
          />
        </motion.div>

        <motion.div
          className="relative z-30 mx-auto flex max-w-2xl flex-col items-center px-8 pb-6 pt-20 text-center sm:px-16 sm:pt-24 lg:pb-28 lg:pt-28"
          variants={copyContainer}
          initial="hidden"
          animate="show"
        >
          <motion.h1
            variants={fadeUp}
            className="text-[2.4rem] font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-[3.6rem]"
          >
            {dict.home.heroTitlePrefix}{" "}
            <span className="text-[#FFF307]">{dict.home.heroTitleHighlight}</span>
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className="mt-4 text-lg font-semibold text-white sm:text-xl"
          >
            {dict.home.heroKicker}
          </motion.p>
          <motion.p
            variants={fadeUp}
            className="mt-3 max-w-md text-sm leading-relaxed text-white/90 sm:text-base"
          >
            {dict.home.heroSubtitle}
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
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
          </motion.div>
        </motion.div>
      </div>

      <motion.div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center sm:justify-end lg:inset-x-auto lg:right-0 lg:w-[58%] lg:max-w-[720px]"
        initial={reduceMotion ? false : { opacity: 0, y: 48 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: reduceMotion ? 0 : 0.75,
          delay: reduceMotion ? 0 : 0.25,
          ease: easeOut,
        }}
      >
        {winnerLabel ? (
          <motion.div
            className="pointer-events-auto absolute left-3 top-2 z-20 hidden w-[200px] sm:block lg:left-[18%] lg:top-[6%] lg:w-[220px]"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.9, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              duration: reduceMotion ? 0 : 0.45,
              delay: reduceMotion ? 0 : 0.7,
              ease: easeOut,
            }}
          >
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
          </motion.div>
        ) : null}

        <Image
          src="/hero-products.png"
          alt=""
          width={1375}
          height={841}
          priority
          sizes="(max-width: 640px) 85vw, (max-width: 1024px) 70vw, 720px"
          className="block h-auto max-h-[220px] w-[85%] object-contain object-bottom sm:max-h-[280px] sm:w-[70%] lg:max-h-[380px] lg:w-full drop-shadow-[0_18px_28px_rgba(8,47,73,0.16)]"
        />
      </motion.div>
    </section>
  );
}
