"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Gavel, ShieldCheck, Target } from "lucide-react";

type AuthSplitShellProps = {
  children: React.ReactNode;
};

function HeroDecorations() {
  return (
    <>
      <div
        className="pointer-events-none absolute -right-6 top-16 h-16 w-16 rotate-12 rounded-lg border-2 border-sky-200/50"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-24 left-8 h-20 w-20 -rotate-12 bg-white/12 shadow-lg"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute right-12 top-1/3 h-6 w-10 rounded-full bg-emerald-300/35 blur-[1px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-16 top-1/4 h-5 w-8 rounded-full bg-sky-200/45 blur-[1px]"
        aria-hidden
      />
    </>
  );
}

/** Split-screen auth: left marketing panel + right form. */
export function AuthSplitShell({ children }: AuthSplitShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-white lg:min-h-screen lg:flex-row lg:items-stretch">
      <div className="relative overflow-hidden bg-gradient-to-br from-[#1c6fd4] via-brand-blue to-[#1e5bb8] px-5 py-4 lg:hidden">
        <HeroDecorations />
        <div className="relative z-10 flex items-center gap-3">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-white/95 ring-2 ring-white/25">
            <Image
              src="/image.png"
              alt=""
              width={256}
              height={256}
              className="h-full w-full object-contain object-center"
              sizes="48px"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold leading-snug text-white">
              Lowest Unique Bid
            </p>
            <p className="mt-0.5 text-xs text-white/90">
              CarraMarket auctions
            </p>
          </div>
        </div>
        <div className="relative z-10 mt-3 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold text-white">
            <Gavel className="h-3 w-3" /> Auctions
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold text-white">
            <Target className="h-3 w-3" /> Lowest unique wins
          </span>
        </div>
      </div>

      <aside className="relative hidden min-h-screen shrink-0 flex-col overflow-hidden bg-gradient-to-br from-[#1c6fd4] via-brand-blue to-[#1e5bb8] lg:flex lg:w-1/2 lg:min-w-0">
        <HeroDecorations />

        <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center gap-7 px-6 xl:px-8">
          <div className="flex w-full max-w-full justify-center">
            <div className="rounded-2xl border-2 border-sky-200/65 bg-white/5 p-2.5 shadow-2xl">
              <Image
                src="/image.png"
                alt="CarraMarket — Lowest Unique Bid auctions"
                width={800}
                height={800}
                className="block h-auto w-[200px] max-w-full rounded-xl bg-white/95 ring-1 ring-white/25 xl:w-[240px]"
                sizes="(max-width: 1280px) 200px, 240px"
                priority
              />
            </div>
          </div>

          <div className="max-w-[20rem] text-center">
            <h2 className="text-xl font-bold tracking-tight text-white xl:text-2xl">
              Bid smart. Win unique.
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-white/90 xl:text-sm">
              Join platform auctions where the lowest unique bid takes the
              prize.
            </p>
          </div>

          <div className="w-full max-w-[18rem] space-y-2.5">
            <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-sm">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20">
                <Gavel className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Our products</p>
                <p className="text-[10px] leading-snug text-white/75">
                  CarraMarket posts every auction
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-sm">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20">
                <Target className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Lowest unique</p>
                <p className="text-[10px] leading-snug text-white/75">
                  One-of-a-kind low bid wins
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 px-1 pt-1">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-300" />
              <p className="text-[10px] text-white/70">
                Secure payments on every entrance fee
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 shrink-0 px-6 pb-6 pt-2 xl:px-8 xl:pb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border-2 border-white/85 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back home
          </Link>
        </div>
      </aside>

      <div className="flex min-h-0 w-full flex-1 flex-col bg-slate-50/90 lg:min-h-0 lg:w-1/2 lg:min-w-0 lg:flex-none lg:overflow-y-auto">
        <div className="mx-auto my-auto w-full max-w-2xl px-4 py-5 sm:px-6 sm:py-6 lg:max-w-3xl lg:py-7 lg:pl-10 lg:pr-8 xl:pl-12">
          {children}
        </div>
      </div>
    </div>
  );
}
