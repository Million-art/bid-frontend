import type { Metadata } from "next";

import { getParticipantSiteOrigin } from "@/lib/site-url";

/** Shared site-wide SEO defaults for the App Router `metadata` export. */
export function createSiteMetadata(overrides?: Metadata): Metadata {
  const siteOrigin = getParticipantSiteOrigin();

  return {
    metadataBase: new URL(siteOrigin),
    title: {
      default: "Carra Market – Lowest Unique Bid Auctions",
      template: "%s | Carra Market",
    },
    description:
      "Join Lowest Unique Bid auctions on Carra Market. Pay the entrance fee, place your bid, and win when your value is the lowest unique one.",
    robots: { index: true, follow: true },
    alternates: {
      canonical: siteOrigin,
    },
    icons: {
      icon: "/carramarket.svg",
    },
    openGraph: {
      title: "Carra Market – Lowest Unique Bid Auctions",
      description:
        "Platform-run LUB auctions in Ethiopia. Secure payments and transparent winners.",
      url: siteOrigin,
      siteName: "Carra Market",
      images: [{ url: "/carramarket.svg" }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Carra Market – Lowest Unique Bid Auctions",
      description:
        "Platform-run LUB auctions in Ethiopia. Secure payments and transparent winners.",
      images: ["/carramarket.svg"],
    },
    ...overrides,
  };
}
