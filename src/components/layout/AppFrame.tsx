"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";

const AUTH_FULL_BLEED =
  /^\/(login|signup|forgot-password)(\/|$)/;

export function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const bareAuth = AUTH_FULL_BLEED.test(pathname);

  if (bareAuth) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      <main className="min-w-0 flex-1">{children}</main>
      <Footer />
    </>
  );
}
