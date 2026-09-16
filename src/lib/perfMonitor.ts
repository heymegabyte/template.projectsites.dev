/**
 * Core Web Vitals + LoAF (Long Animation Frames) + Soft Navigations monitoring.
 *
 * Wires up PerformanceObserver for INP / LCP / CLS / LoAF + the experimental
 * Soft Navigations API (Chrome 147+ origin trial). Emits to `window.gtag` +
 * `window.posthog` when available, otherwise console-logs in dev.
 *
 * Call once from `main.tsx` — `initPerfMonitor()`.
 *
 * Per 2026 web-vitals best practices:
 *   - Use buffered: true so we catch entries that fired before this module loaded
 *   - durationThreshold: 40ms for events (skip trivial interactions)
 *   - LCP / CLS / INP are TRACKED continuously, then flushed ONCE as the definitive
 *     per-page value on the first visibilitychange→hidden / pagehide. The last
 *     layout shift + the worst interaction usually happen right before the user
 *     leaves, so reporting per-entry both under-reports the final value AND floods
 *     GA4/PostHog with escalating intermediate readings (one true value per metric
 *     per page is what CrUX + GA4's own web-vitals model expect).
 *   - LoAF + SoftNav stay per-entry — they are diagnostic streams, not one-value metrics.
 */

export type MetricName = 'LCP' | 'INP' | 'CLS' | 'LoAF' | 'FCP' | 'TTFB' | 'SoftNav';

export interface MetricEvent {
  name: MetricName;
  value: number;
  delta?: number;
  id?: string;
  rating?: 'good' | 'needs-improvement' | 'poor';
  navigationType?: 'hard' | 'soft';
  url?: string;
  meta?: Record<string, unknown>;
}

/** A snapshot of the tracked-so-far core vitals, flushed once when the page hides. */
export interface PerfSnapshot {
  lcp: number;
  cls: number;
  inp: number;
  inpId: string;
}

/** Rate a metric value against Google's good / needs-improvement / poor thresholds. */
export function rate(name: MetricName, value: number): MetricEvent['rating'] {
  if (name === 'LCP') return value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor';
  if (name === 'INP') return value <= 200 ? 'good' : value <= 500 ? 'needs-improvement' : 'poor';
  if (name === 'CLS') return value <= 0.1 ? 'good' : value <= 0.25 ? 'needs-improvement' : 'poor';
  if (name === 'FCP') return value <= 1800 ? 'good' : value <= 3000 ? 'needs-improvement' : 'poor';
  if (name === 'TTFB') return value <= 800 ? 'good' : value <= 1800 ? 'needs-improvement' : 'poor';
  return undefined;
}

/**
 * Build the definitive metric events to flush when the page hides. Pure + testable
 * — no DOM, no side effects. CLS is ALWAYS emitted (0 is a valid "good" score, not
 * "no data"); LCP / INP are skipped when never observed (value 0 = no real reading).
 *
 * @param snap - the tracked LCP / CLS / INP values at page-hide time
 * @returns the ordered list of final MetricEvents to emit (each `meta.final = true`)
 * @example
 * finalizeMetrics({ lcp: 1800, cls: 0.04, inp: 120, inpId: '42' })
 * // → [{name:'LCP',…}, {name:'CLS',…}, {name:'INP', id:'42', …}]  (all meta.final)
 */
export function finalizeMetrics(snap: PerfSnapshot): MetricEvent[] {
  const events: MetricEvent[] = [];
  if (snap.lcp > 0) events.push({ name: 'LCP', value: snap.lcp, meta: { final: true } });
  events.push({ name: 'CLS', value: snap.cls, meta: { final: true } });
  if (snap.inp > 0) events.push({ name: 'INP', value: snap.inp, id: snap.inpId, meta: { final: true } });
  return events;
}

function emit(event: MetricEvent): void {
  if (typeof window === 'undefined') return;

  const rating = event.rating ?? rate(event.name, event.value);
  const payload = {
    ...event,
    rating,
    url: event.url ?? location.pathname,
    timestamp: Date.now(),
  };

  // GA4 / GTM
  window.gtag?.('event', `web_vital_${event.name.toLowerCase()}`, payload);

  // PostHog
  window.posthog?.capture(`web_vital_${event.name.toLowerCase()}`, payload);

  if (import.meta.env.DEV) {
    const color = rating === 'good' ? 'color:#26d07c' : rating === 'poor' ? 'color:#ff5252' : 'color:#ffb547';
    console.log(`%c[perf] ${event.name}=${event.value.toFixed(1)} (${rating ?? '—'})`, color, event);
  }
}

let initialized = false;

export function initPerfMonitor(): void {
  if (typeof window === 'undefined' || initialized) return;
  if (!('PerformanceObserver' in window)) return;
  initialized = true;

  // Tracked continuously in this closure, flushed once as the definitive value on hide.
  let lcpValue = 0;
  let clsValue = 0;
  let inpValue = 0;
  let inpId = '';

  // ─── LCP (track only; the last entry before hide is the real LCP) ───
  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1] as (PerformanceEntry & { startTime: number }) | undefined;
      if (last) lcpValue = last.startTime;
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch { /* unsupported */ }

  // ─── CLS (accumulate; the total is flushed on hide) ───
  try {
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as Array<PerformanceEntry & { value: number; hadRecentInput: boolean }>) {
        if (!entry.hadRecentInput) clsValue += entry.value;
      }
    });
    clsObserver.observe({ type: 'layout-shift', buffered: true });
  } catch { /* unsupported */ }

  // ─── INP / event timing (track the WORST interaction; flushed on hide) ───
  try {
    const inpObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as Array<PerformanceEntry & { duration: number; interactionId?: number }>) {
        if (entry.duration > inpValue && entry.interactionId) {
          inpValue = entry.duration;
          inpId = String(entry.interactionId);
        }
      }
    });
    inpObserver.observe({ type: 'event', buffered: true, durationThreshold: 40 } as PerformanceObserverInit);
  } catch { /* unsupported */ }

  // ─── LoAF (Long Animation Frames) — Chrome 123+ (per-entry diagnostic stream) ───
  try {
    const loafObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as Array<PerformanceEntry & { duration: number; renderStart: number; blockingDuration: number }>) {
        if (entry.duration >= 50) {
          emit({
            name: 'LoAF',
            value: entry.duration,
            meta: {
              renderStart: entry.renderStart,
              blockingDuration: entry.blockingDuration,
            },
          });
        }
      }
    });
    loafObserver.observe({ type: 'long-animation-frame', buffered: true } as PerformanceObserverInit);
  } catch { /* unsupported */ }

  // ─── Soft Navigations (Chrome 147+ origin trial, per-entry stream) ───
  try {
    const softNavObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as Array<PerformanceEntry & { navigationId?: string }>) {
        emit({
          name: 'SoftNav',
          value: entry.startTime,
          id: entry.navigationId,
          url: entry.name,
          navigationType: 'soft',
        });
      }
    });
    softNavObserver.observe({ type: 'soft-navigation', buffered: true } as PerformanceObserverInit);
  } catch { /* unsupported — the type may not exist in TS lib.dom.d.ts yet */ }

  // ─── Flush the definitive LCP + CLS + INP once, before the page becomes
  //     unobservable. visibilitychange→hidden is the recommended hook (fires on
  //     tab-switch, close, and mobile navigation); pagehide is the bfcache-safe
  //     backup. The `flushed` guard prevents double-counting across both. ───
  let flushed = false;
  const flushFinal = (): void => {
    if (flushed) return;
    flushed = true;
    for (const event of finalizeMetrics({ lcp: lcpValue, cls: clsValue, inp: inpValue, inpId })) {
      emit(event);
    }
  };

  document.addEventListener(
    'visibilitychange',
    () => {
      if (document.visibilityState === 'hidden') flushFinal();
    },
    { capture: true },
  );
  window.addEventListener('pagehide', flushFinal, { capture: true });
}

/**
 * Wrap a click handler to break long tasks via the Scheduler API.
 * Returns a function that yields to the main thread for non-urgent work.
 */
export function withYielding<T extends (...args: never[]) => unknown>(handler: T): T {
  return (async (...args: Parameters<T>) => {
    const scheduler = (window as Window & { scheduler?: { yield: () => Promise<void> } }).scheduler;
    if (scheduler?.yield) {
      await scheduler.yield();
    }
    return handler(...args);
  }) as T;
}
