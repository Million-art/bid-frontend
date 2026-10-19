"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface CountdownParts {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function computeCountdown(targetMs: number, nowMs: number): CountdownParts {
  const diff = Math.max(0, targetMs - nowMs);
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { totalMs: diff, days, hours, minutes, seconds };
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export interface AuctionCountdownProps {
  closeAt?: string | null;
  status?: string | null;
  variant?: "card" | "detail";
}

export function AuctionCountdown({
  closeAt,
  status,
  variant = "card",
}: AuctionCountdownProps) {
  const { dict, formatDate } = useLanguage();

  const targetDate = useMemo(() => {
    if (!closeAt) return null;
    const d = new Date(closeAt);
    return Number.isNaN(d.getTime()) ? null : d;
  }, [closeAt]);

  const targetMs = targetDate ? targetDate.getTime() : 0;
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    if (!targetMs) return;
    setNowMs(Date.now());
    const id = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(id);
  }, [targetMs]);

  if (!targetDate) return null;

  const normalizedStatus = String(status || "").toLowerCase();
  const isClosedByStatus = ["closed", "executed", "completed", "cancelled"].includes(
    normalizedStatus
  );
  const parts = computeCountdown(targetMs, nowMs);
  const isEnded = isClosedByStatus || parts.totalMs <= 0;

  if (isEnded) {
    return null;
  }

  const isUrgent = parts.totalMs <= 24 * 3600 * 1000;

  if (variant === "detail") {
    return (
      <div
        className={`mt-4 rounded-2xl border p-4 shadow-sm ${
          isUrgent
            ? "border-amber-200 bg-amber-50/90"
            : "border-sky-200/80 bg-white"
        }`}
      >
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider ${
              isUrgent ? "text-amber-700" : "text-[var(--brand-blue)]"
            }`}
          >
            <Clock className="h-4 w-4" />
            {dict.auctions.countdown.endsIn}
          </span>
          <span className="text-xs font-medium text-slate-500">
            {dict.auctionDetail.closes} {formatDate(targetDate)}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {[
            { value: parts.days, label: dict.auctions.countdown.days },
            { value: parts.hours, label: dict.auctions.countdown.hours },
            { value: parts.minutes, label: dict.auctions.countdown.minutes },
            { value: parts.seconds, label: dict.auctions.countdown.seconds },
          ].map((unit, idx) => (
            <div
              key={idx}
              className={`flex flex-col items-center justify-center rounded-xl border px-2 py-2.5 text-center ${
                isUrgent
                  ? "border-amber-200/90 bg-white text-amber-900 shadow-xs"
                  : "border-slate-200/90 bg-slate-50/90 text-slate-900"
              }`}
            >
              <span className="font-mono text-xl font-extrabold tabular-nums tracking-tight sm:text-2xl">
                {pad2(unit.value)}
              </span>
              <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 sm:text-[11px]">
                {unit.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border px-3 py-2 ${
        isUrgent
          ? "border-amber-200 bg-amber-50/90"
          : "border-sky-100 bg-sky-50/75"
      }`}
    >
      <div className="mb-1.5 flex items-center justify-between gap-1.5">
        <span
          className={`inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider ${
            isUrgent ? "text-amber-700" : "text-[var(--brand-blue)]"
          }`}
        >
          <Clock className="h-3.5 w-3.5 shrink-0" />
          {dict.auctions.countdown.endsIn}
        </span>
        <span className="truncate text-[10px] font-medium text-slate-500">
          {formatDate(targetDate)}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {[
          { value: parts.days, label: dict.auctions.countdown.days },
          { value: parts.hours, label: dict.auctions.countdown.hours },
          { value: parts.minutes, label: dict.auctions.countdown.minutes },
          { value: parts.seconds, label: dict.auctions.countdown.seconds },
        ].map((unit, idx) => (
          <div
            key={idx}
            className={`flex flex-col items-center justify-center rounded-lg border px-1.5 py-1 text-center ${
              isUrgent
                ? "border-amber-200 bg-white text-amber-900"
                : "border-sky-200/70 bg-white text-slate-900 shadow-2xs"
            }`}
          >
            <span className="font-mono text-sm font-extrabold tabular-nums leading-tight sm:text-base">
              {pad2(unit.value)}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
              {unit.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
