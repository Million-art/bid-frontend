"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { TelegramBackButton } from "@/components/telegram/TelegramBackButton";
import { TelegramPrompts } from "@/components/telegram/TelegramPrompts";
import { TelegramDeepLinkHandler } from "@/components/telegram/TelegramDeepLinkHandler";

const AUTH_FULL_BLEED =
  /^\/(login|signup|forgot-password|set-password|staffpanel)(\/|$)/;

export function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const bareAuth = AUTH_FULL_BLEED.test(pathname);

  if (bareAuth) {
    return (
      <>
        <TelegramBackButton />
        <TelegramDeepLinkHandler />
        {children}
        <TelegramPrompts />
      </>
    );
  }

  return (
    <>
      <TelegramBackButton />
      <TelegramDeepLinkHandler />
      <Navbar />
      <main className="min-w-0 flex-1">{children}</main>
      <Footer />
      <TelegramPrompts />
    </>
  );
}
