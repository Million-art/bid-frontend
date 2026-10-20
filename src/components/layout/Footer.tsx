"use client";

import Image from "next/image";
import Link from "next/link";
import { SOCIAL } from "@/lib/social";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.77 1.52V6.76a4.85 4.85 0 0 1-1-.07z" />
    </svg>
  );
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

const socialBtnClass =
  "flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400 transition-colors hover:border-sky-500/40 hover:bg-white/10 hover:text-sky-300";

const linkClass = "text-sm text-slate-400 transition-colors hover:text-sky-400";

const headingClass =
  "mb-4 text-xs font-black uppercase tracking-widest text-white";

export function Footer() {
  const { dict } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-white/[0.06] bg-[#13151a] pb-10 pt-14 text-slate-300">
      <div
        className="pointer-events-none absolute -bottom-4 left-1/2 -translate-x-1/2 select-none whitespace-nowrap font-bold leading-none text-white/[0.03]"
        style={{ fontSize: "clamp(4rem, 18vw, 14rem)" }}
        aria-hidden
      >
        CarraMarket
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link href="/" className="inline-block">
              <Image
                src="/white_logo.png"
                alt="CarraMarket"
                width={160}
                height={50}
                className="mb-4 h-10 w-auto object-contain object-left"
              />
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-slate-400">
              {dict.home.heroSubtitle}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a
                href={SOCIAL.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                className={socialBtnClass}
                aria-label="TikTok"
              >
                <TikTokIcon className="h-4 w-4" />
              </a>
              <a
                href={SOCIAL.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className={socialBtnClass}
                aria-label="Telegram"
              >
                <TelegramIcon className="h-4 w-4" />
              </a>
              <div className="ml-2">
                <LanguageSwitcher variant="pill" />
              </div>
            </div>
          </div>

          <div>
            <h4 className={headingClass}>{dict.footer.auctionsHeading}</h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/auctions" className={linkClass}>
                  {dict.footer.liveAuctions}
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className={linkClass}>
                  {dict.footer.howLubWorks}
                </Link>
              </li>
              <li>
                <Link href="/#winners" className={linkClass}>
                  {dict.footer.winners}
                </Link>
              </li>
              <li>
                <Link href="/my-auctions" className={linkClass}>
                  {dict.footer.myAuctions}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className={headingClass}>{dict.footer.companyHeading}</h4>
            <ul className="mb-6 space-y-2.5">
              <li>
                <Link href="/#faq" className={linkClass}>
                  {dict.footer.faq}
                </Link>
              </li>
            </ul>
            <h4 className={headingClass}>{dict.footer.legalHeading}</h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/terms" className={linkClass}>
                  {dict.footer.terms}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className={linkClass}>
                  {dict.footer.privacy}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-8 text-xs text-slate-500 sm:flex-row sm:items-center">
          <p>© {year} CarraMarket. {dict.footer.copyright}</p>
          <p className="text-slate-600 sm:text-right">
            {dict.footer.tagline}
          </p>
        </div>
      </div>
    </footer>
  );
}

