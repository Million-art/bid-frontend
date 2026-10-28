import type { MetadataRoute } from "next";
import { getParticipantSiteOrigin } from "@/lib/site-url";
import { listAuctions } from "@/services/auctions.service";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteOrigin = getParticipantSiteOrigin();

  const publicRoutes = ["", "/auctions", "/terms", "/privacy"];

  const staticEntries: MetadataRoute.Sitemap = publicRoutes.map((route) => ({
    url: route === "" ? siteOrigin : `${siteOrigin}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" || route === "/auctions" ? "daily" : "weekly",
    priority: route === "" ? 1.0 : route === "/auctions" ? 0.9 : 0.7,
  }));

  let auctionEntries: MetadataRoute.Sitemap = [];
  try {
    const res = await listAuctions({ limit: 100 });
    auctionEntries = (res.items || []).map((auction) => ({
      url: `${siteOrigin}/auctions/${auction.id}`,
      lastModified: auction.createdAt
        ? new Date(auction.createdAt)
        : new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
    }));
  } catch {
    auctionEntries = [];
  }

  return [...staticEntries, ...auctionEntries];
}
