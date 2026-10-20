import type { Auction } from "@/lib/schemas";
import type { MediaItem } from "@/components/media/ProductMediaGallery";

export function auctionImageList(
  auction: Pick<Auction, "imageUrl" | "imageUrls">
): string[] {
  const urls = (auction.imageUrls ?? [])
    .map((u) => u.trim())
    .filter(Boolean);
  const cover = auction.imageUrl?.trim();
  if (cover && !urls.includes(cover)) {
    return [cover, ...urls];
  }
  return urls.length ? urls : cover ? [cover] : [];
}

export function auctionCoverImage(
  auction: Pick<Auction, "imageUrl" | "imageUrls">
): string | null {
  return auctionImageList(auction)[0] ?? null;
}

export function auctionMediaItems(
  auction: Pick<Auction, "imageUrl" | "imageUrls" | "videoUrl">
): MediaItem[] {
  const images = auctionImageList(auction).map((url) => ({
    url,
    type: "image" as const,
  }));
  const video = auction.videoUrl?.trim();
  if (video) {
    images.push({ url: video, type: "video" });
  }
  return images;
}
