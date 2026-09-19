import { useEffect, useState } from "react";
import { X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { scrubText } from "@/lib/placeholders";

interface Props {
  /** Banner copy. Keep ≤80 chars. */
  message: string;
  /** Optional CTA link. */
  cta?: { label: string; href: string };
  /** Unique id so dismissal persists per banner. */
  id?: string;
  /** Display tone. */
  tone?: "accent" | "success" | "warning" | "danger" | "info";
  /** Dismissible. Default true. */
  dismissible?: boolean;
  className?: string;
}

const TONE_CLASS: Record<NonNullable<Props["tone"]>, string> = {
  accent: "bg-accent text-[var(--color-on-accent)]",
  success: "bg-success text-on-signal",
  warning: "bg-warning text-on-signal",
  danger: "bg-danger text-on-signal",
  info: "bg-info text-on-signal",
};

/**
 * Top-of-page announcement bar.
 *
 * Persists dismissal in `localStorage` keyed by `id` so users don't see the
 * same banner after closing. Mount in `Layout.tsx` ABOVE the `<Header>` so
 * it pushes the header down rather than overlapping it.
 *
 * Usage:
 *   <AnnouncementBanner id="black-friday-2026"
 *     message="Black Friday — 30% off annual plans"
 *     cta={{ label: 'Claim', href: '/pricing?promo=BF2026' }} />
 */
export function AnnouncementBanner({
  message,
  cta,
  id = "default",
  tone = "accent",
  dismissible = true,
  className,
}: Props) {
  const [dismissed, setDismissed] = useState(false);
  const storageKey = `projectsites:banner:${id}`;

  useEffect(() => {
    try {
      if (localStorage.getItem(storageKey) === "1") setDismissed(true);
    } catch {
      /* private mode */
    }
  }, [storageKey]);

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(storageKey, "1");
    } catch {
      /* private mode */
    }
  }

  // Self-hide when the message is a placeholder/empty (a token-leaking or blank banner is worse than
  // no banner). The CTA renders only when it has real copy AND a real href (not `{token}`/`#`/empty) —
  // never a dead announcement link.
  const msg = scrubText(message);
  const ctaLabel = scrubText(cta?.label);
  const ctaHref = (cta?.href ?? "").trim();
  const showCta = Boolean(
    ctaLabel && ctaHref && !ctaHref.startsWith("{") && ctaHref !== "#",
  );

  if (dismissed || !msg) return null;

  return (
    <div
      role="region"
      aria-label="Announcement"
      className={cn(
        "flex items-center justify-center gap-4 px-4 py-2.5 text-sm font-medium",
        TONE_CLASS[tone],
        className,
      )}
    >
      <Sparkles size={14} aria-hidden="true" />
      <span>{msg}</span>
      {showCta && (
        <a
          href={ctaHref}
          className="underline underline-offset-2 hover:no-underline font-bold"
        >
          {ctaLabel} →
        </a>
      )}
      {dismissible && (
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="ml-2 h-7 w-7 rounded-md flex items-center justify-center hover:bg-background/10 transition-colors"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

export default AnnouncementBanner;
