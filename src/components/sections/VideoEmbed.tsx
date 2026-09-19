import { useState } from "react";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  /** Full URL or video ID. Supports YouTube, Vimeo, Loom, or a direct .mp4 path. */
  src: string;
  /** Provider hint. Auto-detected from URL if omitted. */
  provider?: "youtube" | "vimeo" | "loom" | "mp4" | "auto";
  /** Poster image shown before user clicks play. Required — prevents 200kb iframe preload on initial paint. */
  poster: { src: string; alt: string };
  /** Aspect ratio. Default `16 / 9`. */
  aspect?: string;
  /** Optional caption / credit shown below the video. */
  caption?: string;
  className?: string;
}

function detectProvider(src: string): NonNullable<Props["provider"]> {
  if (/youtube\.com|youtu\.be/.test(src)) return "youtube";
  if (/vimeo\.com/.test(src)) return "vimeo";
  if (/loom\.com/.test(src)) return "loom";
  if (/\.mp4($|\?)/.test(src)) return "mp4";
  return "youtube";
}

function youtubeId(src: string): string {
  const m =
    src.match(/youtube\.com\/(?:watch\?v=|embed\/|shorts\/)([^&?/]+)/) ||
    src.match(/youtu\.be\/([^?]+)/);
  return m?.[1] ?? src;
}

function vimeoId(src: string): string {
  const m = src.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m?.[1] ?? src;
}

function loomId(src: string): string {
  const m = src.match(/loom\.com\/(?:share|embed)\/([^?]+)/);
  return m?.[1] ?? src;
}

function embedUrl(
  provider: NonNullable<Props["provider"]>,
  src: string,
): string {
  if (provider === "youtube") {
    return `https://www.youtube-nocookie.com/embed/${youtubeId(src)}?autoplay=1&rel=0&modestbranding=1`;
  }
  if (provider === "vimeo") {
    return `https://player.vimeo.com/video/${vimeoId(src)}?autoplay=1&title=0&byline=0`;
  }
  if (provider === "loom") {
    return `https://www.loom.com/embed/${loomId(src)}?autoplay=1&hideEmbedTopBar=true`;
  }
  return src;
}

/**
 * Privacy + perf-friendly video embed.
 *
 * Shows the poster image until the user clicks play. Only then does the
 * iframe load — saves ~200KB on initial paint and avoids YouTube tracking
 * cookies until consent. Defaults to youtube-nocookie.com.
 *
 * Direct `.mp4` files render in a `<video controls>` element with native
 * browser playback.
 */
export function VideoEmbed({
  src,
  provider = "auto",
  poster,
  aspect = "16 / 9",
  caption,
  className,
}: Props) {
  const [active, setActive] = useState(false);
  const resolvedProvider = provider === "auto" ? detectProvider(src) : provider;

  return (
    <figure className={cn("reveal-on-view", className)}>
      <div
        className="relative overflow-hidden rounded-lg card-tactile"
        style={{ aspectRatio: aspect }}
      >
        {!active ? (
          <button
            type="button"
            onClick={() => setActive(true)}
            className="group absolute inset-0 cursor-pointer"
            aria-label={`Play video: ${poster.alt}`}
          >
            <img
              src={poster.src}
              alt={poster.alt}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-background/40 group-hover:bg-background/30 transition-colors" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="h-20 w-20 rounded-full bg-accent text-[var(--color-on-accent)] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Play size={32} aria-hidden="true" fill="currentColor" />
              </span>
            </div>
          </button>
        ) : resolvedProvider === "mp4" ? (
          <video
            src={src}
            controls
            autoPlay
            playsInline
            className="absolute inset-0 h-full w-full"
            poster={poster.src}
          />
        ) : (
          <iframe
            src={embedUrl(resolvedProvider, src)}
            // `poster.alt` can be an empty string (TS-required, not runtime-non-empty); an empty
            // iframe `title=""` is still a WCAG 4.1.2 failure, so fall back to a meaningful label.
            title={poster.alt || "Embedded video"}
            allow="autoplay; encrypted-media; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="absolute inset-0 h-full w-full"
          />
        )}
      </div>
      {caption && (
        <figcaption className="mt-3 text-sm text-text-subtle text-center">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

export default VideoEmbed;
