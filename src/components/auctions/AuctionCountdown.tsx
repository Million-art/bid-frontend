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
  const { dict } = useLanguage();

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
  const units = [
    { value: parts.days, label: dict.auctions.countdown.days },
    { value: parts.hours, label: dict.auctions.countdown.hours },
    { value: parts.minutes, label: dict.auctions.countdown.minutes },
    { value: parts.seconds, label: dict.auctions.countdown.seconds },
  ];

  const isDetail = variant === "detail";

  return (
    <div className={isDetail ? "mt-4 space-y-2.5" : "space-y-1.5"}>
      <span
        className={`inline-flex items-center gap-1 font-extrabold uppercase tracking-wider ${
          isDetail ? "gap-1.5 text-xs" : "text-[11px]"
        } ${isUrgent ? "text-amber-700" : "text-[var(--brand-blue)]"}`}
      >
        <Clock className={isDetail ? "h-4 w-4" : "h-3.5 w-3.5 shrink-0"} />
        {dict.auctions.countdown.endsIn}
      </span>

      <div className={`grid grid-cols-4 ${isDetail ? "gap-2 sm:gap-3" : "gap-1.5"}`}>
        {units.map((unit) => (
          <div
            key={unit.label}
            className={`flex flex-col items-center justify-center text-center ${
              isDetail
                ? `rounded-xl border px-2 py-2.5 ${
                    isUrgent
                      ? "border-amber-200/90 bg-amber-50 text-amber-900"
                      : "border-slate-200 bg-slate-50 text-slate-900"
                  }`
                : `rounded-lg border px-1.5 py-1.5 ${
                    isUrgent
                      ? "border-amber-200 bg-amber-50 text-amber-900"
                      : "border-slate-200 bg-slate-50 text-slate-900"
                  }`
            }`}
          >
            <span
              className={`font-extrabold tabular-nums ${
                isDetail
                  ? "text-xl tracking-tight sm:text-2xl"
                  : "text-sm leading-tight sm:text-base"
              }`}
            >
              {pad2(unit.value)}
            </span>
            <span
              className={`font-bold uppercase tracking-wide text-slate-500 ${
                isDetail
                  ? "mt-0.5 text-[10px] tracking-wider sm:text-[11px]"
                  : "text-[9px]"
              }`}
            >
              {unit.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
