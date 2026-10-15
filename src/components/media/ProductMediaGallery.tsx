"use client";

import { useMemo, useState } from "react";
import { Film } from "lucide-react";

export type MediaItem = { url: string; type: "image" | "video" };

interface ProductMediaGalleryProps {
  imageUrl?: string | null;
  videoUrl?: string | null;
  media?: MediaItem[];
  className?: string;
  variant?: "default" | "retail";
}

function getMediaItems(props: ProductMediaGalleryProps): MediaItem[] {
  if (props.media && props.media.length > 0) {
    return props.media.map((m) => ({
      url: m.url,
      type: (m.type || "image") as "image" | "video",
    }));
  }
  const items: MediaItem[] = [];
  if (props.imageUrl) items.push({ url: props.imageUrl, type: "image" });
  if (props.videoUrl) items.push({ url: props.videoUrl, type: "video" });
  return items;
}

export function ProductMediaGallery({
  imageUrl,
  videoUrl,
  media,
  className = "",
  variant = "default",
}: ProductMediaGalleryProps) {
  const items = useMemo(
    () => getMediaItems({ imageUrl, videoUrl, media }),
    [imageUrl, videoUrl, media]
  );
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selected = items[selectedIndex];
  const isRetail = variant === "retail";

  if (items.length === 0) {
    return (
      <div
        className={`flex aspect-square w-full items-center justify-center rounded-2xl bg-slate-100 text-slate-400 ${className}`}
      >
        <Film className="h-10 w-10 opacity-30" />
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div
        className={`relative overflow-hidden bg-slate-100 ${
          isRetail ? "aspect-square rounded-xl" : "aspect-[4/3] rounded-2xl"
        }`}
      >
        {selected.type === "video" ? (
          <video
            src={selected.url}
            controls
            className="h-full w-full object-cover"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={selected.url}
            alt=""
            className="h-full w-full object-cover"
          />
        )}
      </div>
      {items.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {items.map((item, i) => (
            <button
              key={`${item.url}-${i}`}
              type="button"
              onClick={() => setSelectedIndex(i)}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${
                i === selectedIndex
                  ? "border-[var(--brand-blue)]"
                  : "border-transparent"
              }`}
            >
              {item.type === "video" ? (
                <div className="flex h-full w-full items-center justify-center bg-slate-200">
                  <Film className="h-5 w-5 text-slate-500" />
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
