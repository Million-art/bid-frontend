"use client";

import { useRef, useState, useEffect } from "react";
import { Play, Pause } from "lucide-react";

interface ConceptDemoCardProps {
  title: string;
  tag: string;
  description: string;
  featurePill?: string;
  posterSrc: string;
  av1Src: string;
  h264Src: string;
}

export function ConceptDemoCard({
  title,
  tag,
  description,
  featurePill,
  posterSrc,
  av1Src,
  h264Src,
}: ConceptDemoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Attempt autoplay; if browser blocks, reflect in state
    video.play().catch(() => {
      setIsPlaying(false);
    });

    const handleTimeUpdate = () => {
      if (video.duration) {
        setProgress((video.currentTime / video.duration) * 100);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
    };
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  };

  return (
    <div className="group flex flex-col rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs transition-all duration-300 hover:border-[var(--brand-blue)]/40 hover:shadow-md">
      {/* Card Header (Title & Tag, No Icon) */}
      <div className="flex items-center justify-between gap-2">
        <h4 className="truncate text-sm sm:text-base font-extrabold text-slate-900 transition-colors group-hover:text-[var(--brand-blue)]">
          {title}
        </h4>
        <span className="shrink-0 rounded-md bg-[var(--brand-blue)]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--brand-blue)]">
          {tag}
        </span>
      </div>

      {/* Description: 2 lines with balanced vertical rhythm */}
      <p className="mt-2.5 min-h-[2.5rem] text-xs leading-relaxed text-slate-600">
        {description}
      </p>

      {/* Video Container: 16:9 ratio, cropped margins, subtle border, interactive controls */}
      <div
        onClick={togglePlay}
        className="relative mt-3.5 cursor-pointer overflow-hidden rounded-xl border border-slate-200/90 bg-slate-950 aspect-video shadow-xs select-none"
        title={isPlaying ? "Click to pause" : "Click to play"}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            togglePlay();
          }
        }}
      >
        {/* Video element with scale to crop empty outer whitespace */}
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            poster={posterSrc}
            width={820}
            height={462}
            className="h-full w-full object-cover scale-[1.08] transition-transform duration-500 group-hover:scale-[1.10]"
            aria-label={title}
          >
            <source src={av1Src} type='video/mp4; codecs="av01.0.05M.10"' />
            <source src={h264Src} type="video/mp4" />
          </video>
        </div>


        {/* Play/Pause Button on Hover or when Paused */}
        <div
          className={`absolute inset-0 z-10 flex items-center justify-center bg-black/25 backdrop-blur-[1px] transition-opacity duration-200 ${
            !isPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black/85 text-white shadow-lg transition-all hover:scale-110 active:scale-95 hover:bg-[var(--brand-blue)]">
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 ml-0.5 fill-current" />
            )}
          </div>
        </div>

        {/* Brand Yellow Looping Progress / Seek Bar (Bottom) */}
        <div className="absolute bottom-0 left-0 right-0 z-10 h-[3px] bg-white/20">
          <div
            className="h-full bg-[var(--brand-yellow)] transition-all duration-150 ease-linear shadow-[0_0_8px_rgba(255,243,7,0.8)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Feature Footer: without 16:9 demo */}
      {featurePill && (
        <div className="mt-3 border-t border-slate-100 pt-2.5 text-[11px] font-medium text-slate-500">
          <span className="truncate">{featurePill}</span>
        </div>
      )}
    </div>
  );
}
