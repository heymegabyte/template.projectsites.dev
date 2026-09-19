import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { sectionRailEnabled } from "@/lib/featureFlags";

/**
 * Cinematic Section Rail (`section_rail`, dark by default) — the Apple / Awwwards-2026
 * "scroll navigation" pattern, made embarrassingly-easy: a minimal left-edge, desktop-only
 * navigator of the page's OWN sections that the owner never configures.
 *
 * `deriveSections` reads `#main`'s real outermost `<section>` landmarks + their headings at
 * runtime → the rail always mirrors the page's actual structure (zero-config; "AI does the work").
 * Renders only on long pages (≥4 labeled sections) + desktop; short pages / mobile → null. An
 * IntersectionObserver tracks the active section; clicking a dot smooth-scrolls (instant under
 * reduced-motion) to that section — a one-tap jump straight to the convert section (Contact/Book).
 *
 * Safety: mounts post-paint (LCP-safe), IO-driven (no scroll listener → INP-safe), fixed overlay
 * (CLS-safe), fail-soft (any DOM error → no rail, never a crash). a11y: `<nav aria-label>` + real
 * `#anchor` links + `aria-current` + ≥24px targets + focus-visible label.
 */

interface RailItem {
  id: string;
  label: string;
}

const MIN_SECTIONS = 4;
const LABEL_MAX = 24;

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 32) || "section"
  );
}

/**
 * Derive nav entries from the page's OWN outermost `<section>`s. Label = `aria-label` or the
 * section's first heading; id = the section's own id, else a stable one assigned here. Sections
 * with no accessible label are skipped (decorative). Exported for the unit test.
 */
export function deriveSections(root: HTMLElement): RailItem[] {
  const all = Array.from(root.querySelectorAll("section"));
  // Keep only OUTERMOST sections (drop nested) so the rail mirrors the top-level page structure.
  const top = all.filter((s) => !all.some((o) => o !== s && o.contains(s)));
  const items: RailItem[] = [];
  const usedIds = new Set<string>();
  for (const s of top) {
    const heading = s.querySelector("h1, h2");
    const raw =
      (s.getAttribute("aria-label") || "").trim() ||
      (heading?.textContent || "").replace(/\s+/g, " ").trim();
    if (!raw) continue; // unlabeled / decorative section → not navigable
    // Render-honesty: skip a section whose heading is still an unfilled `{TOKEN}` (site-gen fills
    // these on a real build). A rail label like "{ABOUT_HEADLINE}" would leak — never show one.
    if (/\{[A-Z0-9_]{2,}\}/.test(raw)) continue;
    const label =
      raw.length > LABEL_MAX ? raw.slice(0, LABEL_MAX - 1).trimEnd() + "…" : raw;
    let id = s.id;
    if (!id) {
      const base = `ps-rail-${slugify(raw)}`;
      let candidate = base;
      let n = 2;
      while (usedIds.has(candidate) || root.ownerDocument.getElementById(candidate)) {
        candidate = `${base}-${n++}`;
      }
      id = candidate;
      s.id = id;
    }
    if (usedIds.has(id)) continue;
    usedIds.add(id);
    items.push({ id, label });
  }
  return items;
}

export function SectionRail() {
  const enabled = sectionRailEnabled();
  const location = useLocation();
  const [items, setItems] = useState<RailItem[]>([]);
  const [active, setActive] = useState<string>("");

  // Derive AFTER paint (double rAF) so lazy / animated sections have mounted; re-derive per route.
  useEffect(() => {
    if (!enabled || typeof document === "undefined") return;
    let cancelled = false;
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        if (cancelled) return;
        try {
          const main = document.getElementById("main");
          const derived = main ? deriveSections(main) : [];
          setItems(derived.length >= MIN_SECTIONS ? derived : []);
          setActive(derived[0]?.id ?? "");
        } catch {
          setItems([]); // fail-soft: no rail rather than a crash
        }
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [enabled, location.pathname]);

  // Active-section tracking — IntersectionObserver, no scroll listener (INP-safe).
  useEffect(() => {
    if (!items.length || typeof IntersectionObserver === "undefined") return;
    const ratios = new Map<string, number>();
    let io: IntersectionObserver | null = null;
    try {
      io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            ratios.set(
              (e.target as HTMLElement).id,
              e.isIntersecting ? e.intersectionRatio : 0,
            );
          }
          let best = "";
          let bestRatio = 0;
          for (const [id, r] of ratios) {
            if (r > bestRatio) {
              bestRatio = r;
              best = id;
            }
          }
          if (best) setActive(best);
        },
        { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.25, 0.5, 1] },
      );
      for (const it of items) {
        const el = document.getElementById(it.id);
        if (el) io.observe(el);
      }
    } catch {
      /* IO failure → rail still renders, just without active tracking (fail-soft) */
    }
    return () => io?.disconnect();
  }, [items]);

  if (!enabled || items.length < MIN_SECTIONS) return null;

  const jump = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "start",
    });
    setActive(id);
    try {
      history.replaceState(null, "", `#${id}`);
    } catch {
      /* history unavailable — non-fatal */
    }
    // Structured observability — which sections visitors jump to (conversion signal).
    if (typeof window !== "undefined") {
      window.gtag?.("event", "section_rail_jump", { section: id });
      window.posthog?.capture("section_rail_jump", { section: id });
    }
  };

  return (
    <nav
      aria-label="Page sections"
      data-testid="section-rail"
      className="ps-section-rail hidden lg:flex fixed left-4 top-1/2 -translate-y-1/2 z-40 flex-col gap-2.5"
    >
      {items.map((it) => {
        const isActive = it.id === active;
        return (
          <a
            key={it.id}
            href={`#${it.id}`}
            onClick={(e) => jump(e, it.id)}
            aria-current={isActive ? "true" : undefined}
            data-testid="section-rail-item"
            className="ps-section-rail-item group relative flex items-center"
          >
            <span className="ps-section-rail-dot" aria-hidden="true" />
            <span className="ps-section-rail-label">{it.label}</span>
          </a>
        );
      })}
    </nav>
  );
}

export default SectionRail;
