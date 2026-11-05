"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Gavel, Clock, Heart, ArrowRight, Users } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { PublicAuctionCard } from "@/services/auctions.service";
import { auctionCoverImage } from "@/lib/auction-media";
import {
  formatCountdownParts,
  getCountdownUrgency,
  getEntrantProgress,
} from "@/lib/auction-card";

function resolveEndsAt(auction: PublicAuctionCard): string | null | undefined {
  return auction.endsAt ?? auction.closeAt;
}

export function AuctionCard({ auction }: { auction: PublicAuctionCard }) {
  const { dict, formatCurrency, t } = useLanguage();

  const normalizedStatus = String(auction.status || "").toLowerCase();
  const isOpen = ["active", "postponed"].includes(normalizedStatus);
  const isEnded =
    !isOpen ||
    ["closed", "executed", "cancelled"].includes(normalizedStatus);
  const cover = auctionCoverImage(auction);

  const progress = getEntrantProgress(
    Number(auction.participantCount ?? 0),
    Number(auction.minParticipants ?? 10)
  );
  const participantCount = Number(auction.participantCount ?? 0);
  const minParticipants = Math.max(1, Number(auction.minParticipants ?? 10));
  const prizeUnlocked = Boolean(auction.prizeUnlocked) || progress.prizeUnlocked;
  const retailValue = Number(auction.retailValue ?? 0);
  const hasJoined = Boolean(auction.userHasJoined);
  const tag = String(auction.tag || "").toLowerCase();

  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("carra_favorites");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.includes(auction.id)) {
          setIsFavorite(true);
        }
      }
    } catch {
      // ignore
    }
  }, [auction.id]);

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const stored = localStorage.getItem("carra_favorites");
      const list = stored ? JSON.parse(stored) : [];
      const updated = Array.isArray(list)
        ? isFavorite
          ? list.filter((id: string) => id !== auction.id)
          : [...list, auction.id]
        : [auction.id];
      localStorage.setItem("carra_favorites", JSON.stringify(updated));
      setIsFavorite(!isFavorite);
    } catch {
      setIsFavorite(!isFavorite);
    }
  };

  const endsAtRaw = resolveEndsAt(auction);
  const targetMs = useMemo(() => {
    if (!endsAtRaw) return null;
    const d = new Date(endsAtRaw);
    return Number.isNaN(d.getTime()) ? null : d.getTime();
  }, [endsAtRaw]);

  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    if (!targetMs || !isOpen) return;
    setNowMs(Date.now());
    const interval = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(interval);
  }, [targetMs, isOpen]);

  const { timeLeft, urgency } = useMemo(() => {
    if (!targetMs) {
      return {
        timeLeft: null as { desktop: string; mobile: string } | null,
        urgency: getCountdownUrgency(isEnded ? 0 : null),
      };
    }
    const diff = targetMs - nowMs;
    return {
      timeLeft: formatCountdownParts(diff),
      urgency: getCountdownUrgency(diff),
    };
  }, [targetMs, nowMs, isEnded]);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return dict.auctions.filters.active;
      case "postponed":
        return dict.auctions.filters.postponed;
      case "closed":
        return dict.auctions.filters.closed;
      case "executed":
        return dict.auctions.filters.executed;
      case "cancelled":
        return dict.auctions.filters.cancelled;
      default:
        return status;
    }
  };

  const tagLabel =
    tag === "hot"
      ? dict.auctions.tags.hot
      : tag === "new"
        ? dict.auctions.tags.new
        : tag === "almost_unlocked"
          ? dict.auctions.tags.almostUnlocked
          : null;

  const countdownAria = timeLeft
    ? t("auctions.countdownAria", { time: timeLeft.desktop })
    : dict.auctions.countdown.ended;

  const wishlistAria = isFavorite
    ? dict.auctions.removeFromWishlist
    : dict.auctions.addToWishlist;

  const ctaLabel = isEnded
    ? dict.auctions.ended
    : hasJoined
      ? dict.auctions.placeAnotherBid
      : dict.auctions.joinAndBid;

  const showCountdown = isOpen && timeLeft && urgency !== "ended";

  return (
    <Link
      href={`/auctions/${auction.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-3.5 sm:p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-md"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl sm:rounded-2xl bg-neutral-100 flex items-center justify-center">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={auction.title}
            loading="lazy"
            decoding="async"
            width={640}
            height={480}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center text-slate-400">
            <Gavel className="h-10 w-10 mb-1.5 text-slate-300" aria-hidden />
            <span className="text-sm font-medium text-slate-400">
              [Product photo]
            </span>
          </div>
        )}

        {tagLabel && isOpen && (
          <div className="absolute left-3 top-3 sm:left-3.5 sm:top-3.5 z-10 rounded-full bg-[var(--brand-blue)] px-3 py-1 text-xs sm:text-sm font-bold uppercase tracking-wider text-white shadow-sm">
            {tagLabel}
          </div>
        )}

        {!isOpen && !tagLabel && (
          <div className="absolute left-3 top-3 sm:left-3.5 sm:top-3.5 z-10 flex items-center gap-1.5 rounded-full bg-black/75 backdrop-blur-xs px-3 py-1 text-xs sm:text-sm font-bold uppercase tracking-wider text-white shadow-sm">
            <span>{getStatusLabel(String(auction.status))}</span>
          </div>
        )}

        {showCountdown && (
          <div
            aria-label={countdownAria}
            className={[
              "absolute right-3 top-3 sm:right-3.5 sm:top-3.5 z-10 flex max-w-[72%] items-center gap-1.5 rounded-full px-3 py-1 text-xs sm:text-sm font-bold shadow-sm",
              urgency === "critical"
                ? "bg-red-600 text-white animate-pulse"
                : urgency === "soon"
                  ? "bg-amber-400 text-slate-900"
                  : "bg-[var(--brand-yellow)] text-black",
            ].join(" ")}
          >
            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" aria-hidden />
            {urgency === "critical" || urgency === "soon" ? (
              <span className="truncate">
                {urgency === "critical"
                  ? dict.auctions.endingVerySoon
                  : dict.auctions.endingSoon}
                <span className="ml-1 tabular-nums opacity-90">
                  {timeLeft.mobile}
                </span>
              </span>
            ) : (
              <>
                <span className="hidden sm:inline tabular-nums">
                  {timeLeft.desktop}
                </span>
                <span className="sm:hidden tabular-nums">{timeLeft.mobile}</span>
              </>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={toggleFavorite}
          aria-label={wishlistAria}
          aria-pressed={isFavorite}
          className="absolute bottom-3 right-3 sm:bottom-3.5 sm:right-3.5 z-10 flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-white/95 shadow-sm border border-slate-100/90 text-slate-400 hover:text-rose-500 hover:scale-110 active:scale-95 transition-all"
        >
          <Heart
            aria-hidden
            className={`h-4 w-4 sm:h-4.5 sm:w-4.5 transition-colors ${
              isFavorite
                ? "fill-rose-500 text-rose-500"
                : "text-slate-400 group-hover:text-slate-600"
            }`}
          />
        </button>
      </div>

      <div className="flex flex-1 flex-col pt-3.5 sm:pt-4">
        <div className="flex items-start justify-between gap-2.5">
          <h3 className="line-clamp-2 min-w-0 flex-1 text-base sm:text-xl font-extrabold text-slate-900 group-hover:text-[var(--brand-blue)] transition-colors leading-snug">
            {auction.title}
          </h3>
          <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs sm:text-sm font-extrabold text-slate-900 tabular-nums">
            {t("auctions.entryPill", {
              amount: formatCurrency(auction.entranceFee),
            })}
          </span>
        </div>

        {retailValue > 0 && (
          <p className="mt-1.5 text-sm sm:text-base font-bold text-slate-600">
            {t("auctions.worth", { amount: formatCurrency(retailValue) })}
          </p>
        )}

        <div className="mt-2.5 flex items-center gap-2 text-sm sm:text-base font-bold text-slate-700">
          <Users className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 shrink-0" aria-hidden />
          <span>
            {t("auctions.playersJoined", { count: participantCount })}
          </span>
        </div>

        <div className="mt-3">
          <div className="mb-1.5 flex items-center justify-between gap-2 text-xs sm:text-sm font-extrabold">
            {prizeUnlocked ? (
              <span className="text-emerald-700">
                {dict.auctions.prizeUnlocked}
              </span>
            ) : (
              <span className="text-slate-600">
                {t("auctions.entrantsProgress", {
                  count: participantCount,
                  min: minParticipants,
                })}
              </span>
            )}
            <span
              className={
                prizeUnlocked
                  ? "text-emerald-700 tabular-nums"
                  : "text-slate-600 tabular-nums"
              }
            >
              {progress.percent}%
            </span>
          </div>
          <div
            className="h-3 sm:h-3.5 w-full overflow-hidden rounded-full bg-slate-100 ring-1 ring-inset ring-slate-200/80"
            role="progressbar"
            aria-valuenow={progress.percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={
              prizeUnlocked
                ? dict.auctions.prizeUnlocked
                : t("auctions.entrantsProgress", {
                    count: participantCount,
                    min: minParticipants,
                  })
            }
          >
            <div
              className={[
                "h-full rounded-full transition-all duration-500",
                prizeUnlocked ? "bg-emerald-500" : "bg-[var(--brand-blue)]",
              ].join(" ")}
              style={{ width: `${progress.ratio * 100}%` }}
            />
          </div>
        </div>

        <div className="mt-auto pt-3.5 sm:pt-4">
          {!isOpen && auction.winnerName ? (
            <div className="mb-2.5 rounded-xl border border-emerald-200/80 bg-emerald-50/80 px-3 py-2 text-sm">
              <div className="flex items-center justify-between gap-1.5">
                <span className="font-bold text-emerald-800 text-xs sm:text-sm">
                  {dict.winners.winner}
                </span>
                <span className="truncate font-extrabold text-emerald-950 text-xs sm:text-sm">
                  {auction.winnerName}
                </span>
              </div>
            </div>
          ) : null}

          {isEnded ? (
            <span
              aria-disabled="true"
              className="mt-0.5 inline-flex h-11 sm:h-12 w-full cursor-not-allowed items-center justify-center rounded-xl sm:rounded-2xl border border-slate-200 bg-slate-100 px-4 text-sm sm:text-base font-extrabold text-slate-500"
            >
              {dict.auctions.ended}
            </span>
          ) : (
            <span className="mt-0.5 inline-flex h-11 sm:h-12 w-full items-center justify-center gap-2 rounded-xl sm:rounded-2xl bg-[var(--brand-blue)] hover:bg-[#1c8ee0] active:scale-[0.99] px-4 text-sm sm:text-base font-extrabold text-white shadow-sm transition-all duration-200 group-hover:brightness-105">
              <Gavel className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" aria-hidden />
              <span>{ctaLabel}</span>
              <ArrowRight
                className="hidden sm:inline h-4 w-4 sm:h-5 sm:w-5 ml-0.5 shrink-0"
                aria-hidden
              />
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
