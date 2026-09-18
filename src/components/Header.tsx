import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Menu, X, Command as CommandIcon } from 'lucide-react';
import { brand, featureOn } from '@/brand';
import { ThemeToggle } from './ThemeToggle';

interface NavLink {
  to: string;
  label: string;
}

interface Props {
  links?: NavLink[];
  ctaLabel?: string;
  ctaHref?: string;
}

/**
 * The primary "offer" nav entry is vertical-aware: service businesses
 * (contractors, HVAC, roofing, agencies) request a custom quote — a fixed
 * price list would mislead — while product/SaaS/wellness businesses show
 * pricing. Verticals with neither flag (medical, nonprofit, restaurant) omit
 * it entirely and lean on the Contact CTA. Driven by `featureOn('quote')` /
 * `featureOn('pricing')` from the resolved brand.
 */
function offerLink(): NavLink | null {
  if (featureOn('quote')) return { to: '/quote', label: 'Get a Quote' };
  if (featureOn('pricing')) return { to: '/pricing', label: 'Pricing' };
  return null;
}

function defaultLinks(): NavLink[] {
  const offer = offerLink();
  return [
    { to: '/',         label: 'Home' },
    { to: '/about',    label: 'About' },
    { to: '/services', label: 'Services' },
    ...(offer ? [offer] : []),
    { to: '/contact',  label: 'Contact' },
  ];
}

/**
 * A generated `/logo-wordmark.png` is only legible in the navbar when it's a genuine
 * HORIZONTAL banner. Some generations emit a near-square / padded canvas (e.g. Ideogram
 * ASPECT_16_9 → 1.78:1, or an untrimmed 1024×894 = 1.15:1); height-constrained to the
 * navbar's ~48px it squishes the business name into an illegible ~55px-wide smear
 * (the AL-392 cafe-dim-sum / AL-450 Parnassus-Books incident). A real wordmark trimmed
 * to a tight banner is ≥3:1; anything below 2:1 is too square to render legibly, so we
 * fall back to the always-legible styled HTML text wordmark instead of the smear.
 * Pure so it's unit-testable (the imperative onLoad path can't run in jsdom).
 */
export function wordmarkTooSquare(naturalWidth: number, naturalHeight: number): boolean {
  if (!Number.isFinite(naturalWidth) || !Number.isFinite(naturalHeight) || naturalWidth <= 0 || naturalHeight <= 0) {
    return false; // can't measure → trust it (onError still guards a truly broken asset)
  }
  return naturalWidth / naturalHeight < 2;
}

/**
 * A generated `/logo-wordmark.png` can bake INK that doesn't contrast the theme the icon-luminance
 * logic chose. The icon drives theme polarity (light icon → dark theme), but the wordmark is a
 * SEPARATE Ideogram asset with no such guarantee — so a DARK-ink wordmark can ship on a DARK header
 * (or light-on-light), rendering an illegible smear even at a perfectly valid banner aspect.
 * Measured live (AL-617): alpenglow-sports-tahoe-city's wordmark had mean opaque-ink luminance
 * **25/255** on a dark header (the icon was 178 = light, so it correctly picked the dark theme —
 * the wordmark simply didn't match). Gate it: when the wordmark's ink doesn't contrast the header,
 * fall back to the always-theme-correct HTML text wordmark (`text-text` = theme ink + a halo).
 * Pure so the DECISION is unit-testable (the canvas sampling that measures the ink can't run in jsdom).
 *
 * @param inkLuminance mean luminance (0–255) of the wordmark's opaque (alpha ≥ 32) pixels
 * @param darkHeader   is the navbar/header dark (dark theme)?
 * @returns true when the ink CONTRASTS the header (safe to render the PNG); false → use the text wordmark
 */
export function wordmarkContrastsTheme(inkLuminance: number, darkHeader: boolean): boolean {
  if (!Number.isFinite(inkLuminance)) return true; // can't measure → trust it (best-effort)
  // dark header needs LIGHT-ish ink (≥90); light header needs DARK-ish ink (≤165). The 90–165 mid
  // band is ambiguous → trust it (only the clearly-wrong-polarity cases fall back).
  return darkHeader ? inkLuminance >= 90 : inkLuminance <= 165;
}

export default function Header({ links, ctaLabel, ctaHref }: Props) {
  const navLinks = links ?? defaultLinks();
  // A single dominant, verb-first CTA converts best; for quote verticals it
  // points straight at the quote form.
  const cta = featureOn('quote')
    ? { label: ctaLabel ?? 'Get a Free Quote', href: ctaHref ?? '/quote' }
    : { label: ctaLabel ?? 'Get in Touch', href: ctaHref ?? '/contact' };
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  // A logo mark ALWAYS renders in the navbar: the build-generated
  // /apple-touch-icon.png (produced by the mandatory favicon pipeline from the
  // extracted / Ideogram / DALL-E logo), falling back to a branded monogram badge
  // if that asset ever fails to load.
  // Icon-mark source fallback chain: prefer a TRANSPARENT icon-only logo
  // (`/logo-icon.png`, produced by the container's bg-strip step when available), fall
  // back to the real (opaque) apple-touch-icon logo, then to a branded monogram badge.
  // We deliberately do NOT use android-chrome-*.png here — that asset is a small solid
  // brand-color square from the favicon pipeline, not the real logo.
  const iconSrcs = ['/logo-icon.png', '/apple-touch-icon.png'];
  const [iconIdx, setIconIdx] = useState(0);
  // AL-591: default to the crisp HTML text wordmark (the always-legible baseline), and ONLY
  // upgrade to /logo-wordmark.png once a fetch-HEAD confirms it exists. A large fraction of
  // deployed sites never generated a wordmark (gentle-dental / vanta / ironhaus / martin-agency
  // all 404 it — the AI wordmark step flaked/was absent), and rendering `<img src>` optimistically
  // fired a hard 404 → a console error on EVERY such site (the onError→text fallback fixed the
  // VISUAL but not the console-error hard-gate). A `fetch` 404 is SILENT (no "Failed to load
  // resource"), unlike an `<img>`/`<link>` 404 — so probing first eliminates the console error
  // while keeping the pretty PNG whenever it's real. Icon keeps its serve-time apple-touch fallback.
  const [wordmarkOk, setWordmarkOk] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 16);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // AL-591: silently probe the wordmark PNG (a fetch 404 logs NO console error, unlike an <img>).
  // Only upgrade from the text wordmark to the image when it genuinely exists.
  useEffect(() => {
    let alive = true;
    fetch('/logo-wordmark.png', { method: 'HEAD' })
      .then((r) => {
        if (alive && r.ok) setWordmarkOk(true);
      })
      .catch(() => {
        /* network hiccup → keep the text wordmark (never throws, never logs) */
      });
    return () => {
      alive = false;
    };
  }, []);

  const business = brand.business.name || 'ProjectSites';
  const initials =
    business
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase() || 'PS';
  const isMac = typeof navigator !== 'undefined' && /mac/i.test(navigator.platform);

  return (
    <header
      data-scrolled={scrolled ? 'true' : 'false'}
      className={`site-header fixed top-0 w-full z-50 transition-all duration-base ${
        scrolled ? 'site-header--scrolled glass-strong shadow-md' : 'bg-transparent'
      }`}
    >
      <nav className="max-w-container-wide mx-auto px-6 py-3 flex justify-between items-center" aria-label="Primary">
        <Link to="/" className="site-brand group flex items-center gap-3 min-w-0 mr-3" aria-label={`${business} — home`}>
          {iconIdx < iconSrcs.length ? (
            // Icon mark: the REAL brand logo (transparent `logo-icon.png` first, then the
            // opaque apple-touch-icon). No border / shadow / rounded box and
            // `object-contain` (never crop) so a transparent mark reads clean over the
            // glass header; sized to fill the navbar height (big) while the row stays
            // compact. On error, advance the source; exhausting the chain shows the monogram.
            <img
              src={iconSrcs[iconIdx]}
              alt=""
              width={56}
              height={56}
              fetchPriority="high"
              decoding="async"
              // drop-shadow halo (not a box): keeps the mark TRANSPARENT while staying
              // legible over a busy/low-contrast hero when the header is transparent
              // (unscrolled) — per the logo-contrast rule. Sized LARGE (h-14→h-16, 56→64px in
              // the 80px header) so the brand mark is unmistakably PROMINENT — never a tiny
              // afterthought (cafe-dim-sum shipped a 44px icon lost against the hero; AL-392).
              className="site-logo h-14 w-14 sm:h-16 sm:w-16 object-contain shrink-0 drop-shadow-[0_1px_3px_rgba(0,0,0,0.55)]"
              onError={() => setIconIdx((i) => i + 1)}
            />
          ) : (
            <span
              className="site-logo h-14 w-14 sm:h-16 sm:w-16 rounded-lg grid place-items-center bg-accent text-[var(--color-on-accent)] font-heading font-extrabold text-xl shadow-sm shrink-0"
              aria-hidden="true"
            >
              {initials}
            </span>
          )}
          {wordmarkOk ? (
            // Stylized text wordmark — the SECOND Ideogram logo, shown to the RIGHT of the
            // square icon mark. Falls back to crisp HTML text if the generated image is
            // absent/broken (so the brand name always renders).
            <img
              src="/logo-wordmark.png"
              alt={business}
              // C.2 LCP (AL-718): the wordmark is the LCP element on text-hero sites. Eager
              // + high-priority so it's not deprioritized behind the hero image; the build
              // also injects a <link rel=preload fetchpriority=high> for its bytes.
              fetchPriority="high"
              decoding="async"
              className="site-wordmark h-10 sm:h-12 w-auto max-w-[220px] sm:max-w-[340px] object-contain drop-shadow-[0_1px_3px_rgba(0,0,0,0.55)]"
              onError={() => setWordmarkOk(false)}
              // A near-square wordmark loads fine (no onError) yet squishes to an illegible
              // smear at navbar height — fall back to the crisp styled text wordmark instead.
              onLoad={(e) => {
                const img = e.currentTarget;
                if (wordmarkTooSquare(img.naturalWidth, img.naturalHeight)) {
                  setWordmarkOk(false);
                  return;
                }
                // AL-617: gate INK CONTRAST vs the theme — a dark-ink wordmark on a dark header (or
                // light-on-light) is an illegible smear even at a valid aspect; sample the opaque-ink
                // luminance (same-origin PNG → canvas is untainted) and fall back to the theme-correct
                // text wordmark when it doesn't contrast. Best-effort: any failure keeps the PNG.
                try {
                  const w = 80;
                  const h = Math.max(1, Math.round((80 * img.naturalHeight) / img.naturalWidth));
                  const cv = document.createElement('canvas');
                  cv.width = w;
                  cv.height = h;
                  const cx = cv.getContext('2d');
                  if (!cx) return;
                  cx.drawImage(img, 0, 0, w, h);
                  const px = cx.getImageData(0, 0, w, h).data;
                  let sum = 0;
                  let n = 0;
                  for (let i = 0; i < px.length; i += 4) {
                    if (px[i + 3] < 32) continue; // skip transparent pixels
                    sum += 0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2];
                    n++;
                  }
                  const darkHeader =
                    (document.documentElement.getAttribute('data-theme') || '').toLowerCase() ===
                      'dark' ||
                    (typeof window !== 'undefined' &&
                      window.matchMedia?.('(prefers-color-scheme: dark)').matches === true);
                  if (n && !wordmarkContrastsTheme(sum / n, darkHeader)) setWordmarkOk(false);
                } catch {
                  /* canvas unavailable/tainted → keep the PNG (best-effort) */
                }
              }}
            />
          ) : (
            <span className="site-wordmark-text min-w-0 truncate text-text font-extrabold font-heading tracking-tight text-[clamp(1.25rem,5vw,1.75rem)] [text-shadow:0_1px_3px_rgba(0,0,0,0.55)] group-hover:text-accent transition-colors">
              {business}
            </span>
          )}
        </Link>

        <div className="hidden md:flex gap-6 items-center">
          {navLinks.map((l) => {
            const isActive = pathname === l.to;
            return (
              <Link
                key={l.to}
                to={l.to}
                aria-current={isActive ? 'page' : undefined}
                data-active={isActive ? 'true' : undefined}
                className={`nav-link text-sm font-medium transition-colors ${
                  isActive ? 'nav-link--active text-accent' : 'text-text-muted hover:text-text'
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => {
              const ev = new KeyboardEvent('keydown', { key: 'k', metaKey: !!isMac, ctrlKey: !isMac, bubbles: true });
              window.dispatchEvent(ev);
            }}
            className="hidden lg:flex items-center gap-2 px-3 h-10 rounded-md border border-border bg-surface text-text-muted hover:text-text hover:border-accent/50 transition-colors text-sm"
            aria-label="Open command palette"
          >
            <CommandIcon size={14} />
            <span>Search</span>
            <span className="cmdk-kbd ml-2">{isMac ? '⌘' : 'Ctrl'} K</span>
          </button>
          <ThemeToggle />
          <Link
            to={cta.href}
            className="bg-accent hover:bg-accent-hover text-[var(--color-on-accent)] font-bold text-sm px-5 py-2.5 rounded-lg transition-all hover:-translate-y-0.5 hover:shadow-glow"
          >
            {cta.label}
          </Link>
        </div>

        <button
          type="button"
          className="md:hidden text-text/80 hover:text-text transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="mobile-menu"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {open && (
        <div
          id="mobile-menu"
          className="site-menu md:hidden glass-strong border-t border-border px-6 py-4 space-y-1"
        >
          {navLinks.map((l, i) => {
            const isActive = pathname === l.to;
            return (
              <Link
                key={l.to}
                to={l.to}
                aria-current={isActive ? 'page' : undefined}
                style={{ ['--menu-i' as string]: i }}
                className={`site-menu__item block py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-accent bg-surface'
                    : 'text-text-muted hover:text-text hover:bg-surface'
                }`}
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            );
          })}
          <div
            className="site-menu__item flex items-center justify-between pt-3"
            style={{ ['--menu-i' as string]: navLinks.length }}
          >
            <ThemeToggle />
            <Link
              to={cta.href}
              className="bg-accent hover:bg-accent-hover text-[var(--color-on-accent)] font-bold text-sm px-5 py-3 rounded-lg transition-all hover:-translate-y-0.5"
              onClick={() => setOpen(false)}
            >
              {cta.label}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
