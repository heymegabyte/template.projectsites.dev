/**
 * Zero-config visitor-adaptive welcome context — the 2026 "liquid UI" AI-personalization pattern
 * (adaptive messaging by traffic source + returning-status), shipped AUTOMATIC. Framer/Webflow
 * require manual UTM pages + routing rules for this; we derive it from signals the visitor already
 * carries, so the site owner configures NOTHING.
 *
 * Pure + testable: given the referrer + returning-status + business name, decide whether to show a
 * tailored welcome line and what it says. A first-time visitor from search/direct → `show:false`
 * (no noise — only RECOGNIZED arrivals get a line). Same inputs → same output; the component injects
 * the live signals (`document.referrer`, a localStorage marker, `og:site_name`).
 */

/** Referrer hosts recognized as a social-platform arrival → the platform label to thank. */
const SOCIAL: ReadonlyArray<readonly [RegExp, string]> = [
  [/instagram\.com/i, 'Instagram'],
  [/(?:facebook|fb)\.com|fb\.me/i, 'Facebook'],
  [/tiktok\.com/i, 'TikTok'],
  [/(?:twitter|x)\.com|t\.co\//i, 'X'],
  [/linkedin\.com|lnkd\.in/i, 'LinkedIn'],
  [/youtube\.com|youtu\.be/i, 'YouTube'],
  [/pinterest\.|pin\.it/i, 'Pinterest'],
  [/reddit\.com/i, 'Reddit'],
  [/threads\.net/i, 'Threads'],
];

export type WelcomeKind = 'returning' | 'social' | 'none';

export interface WelcomeContext {
  readonly show: boolean;
  readonly kind: WelcomeKind;
  readonly message: string;
}

export interface WelcomeSignals {
  /** `document.referrer` — the external URL the visitor arrived from, or '' (none / same-origin). */
  readonly referrer: string;
  /** true when a prior-visit marker exists (localStorage). */
  readonly isReturning: boolean;
  /** The business name (`og:site_name`), woven into the copy when present. */
  readonly businessName?: string | undefined;
  /** The current host — a same-host referrer is internal SPA nav, NOT an arrival, so it's ignored. */
  readonly selfHost?: string | undefined;
}

/** The social platform for a referrer, or null. */
function socialPlatform(referrer: string): string | null {
  for (const [re, name] of SOCIAL) if (re.test(referrer)) return name;
  return null;
}

/**
 * Decide the welcome line. Precedence: RETURNING (warmest, most conversion-lifting) > SOCIAL
 * arrival > none. A same-host referrer (internal nav) never counts as an arrival.
 *
 * @example
 * resolveWelcomeContext({ referrer: '', isReturning: true, businessName: 'Vito’s' })
 * // → { show: true, kind: 'returning', message: '👋 Welcome back to Vito’s!' }
 * resolveWelcomeContext({ referrer: 'https://instagram.com/x', isReturning: false })
 * // → { show: true, kind: 'social', message: '👋 Thanks for stopping by from Instagram!' }
 * resolveWelcomeContext({ referrer: 'https://google.com', isReturning: false })
 * // → { show: false, kind: 'none', message: '' }
 */
export function resolveWelcomeContext(s: WelcomeSignals): WelcomeContext {
  // Firewall unfilled tokens: `og:site_name` may still be a `{BUSINESS_SHORT_NAME}` skeleton token
  // if site-gen didn't fill it — never leak that into the greeting; fall back to the generic line.
  const raw = (s.businessName || '').trim();
  const name = /\{[A-Z0-9_]+\}/.test(raw) ? '' : raw;
  if (s.isReturning) {
    return {
      show: true,
      kind: 'returning',
      message: name ? `👋 Welcome back to ${name}!` : '👋 Welcome back!',
    };
  }
  const ref = (s.referrer || '').trim();
  const internal = !!s.selfHost && ref.includes(s.selfHost);
  if (ref && !internal) {
    const platform = socialPlatform(ref);
    if (platform) {
      return { show: true, kind: 'social', message: `👋 Thanks for stopping by from ${platform}!` };
    }
  }
  return { show: false, kind: 'none', message: '' };
}
