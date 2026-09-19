import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * PageviewBeacon — records a client-side pageview on every SPA route change (react-router
 * pushState navigation), closing an analytics UNDERCOUNT the edge-injected `app.js` cannot fix.
 *
 * `app.js` (served at `/app.js`, injected into every generated site) fires exactly ONE pageview to
 * `POST /api/events` inside its `onReady` handler — it has NO history hook, so a client-side
 * navigation (home → about → services) fires no further pageview and the Worker's server-side
 * `recordPageviewFromRequest` never runs (no new document request). Result: a visitor who browses
 * five pages registers as ONE pageview, and the owner's "simple traffic view" undercounts real
 * engagement. This component records the missing navigations.
 *
 * NO double-count BY CONSTRUCTION: the FIRST render is skipped (app.js + the server already count
 * the initial load); this fires ONLY on subsequent navigations. It mirrors app.js's `/api/events`
 * contract exactly (`IncomingEventSchema`): `siteId` = the app.js script tag's `data-slug` (falling
 * back to the hostname's first label, identical to app.js's own derivation, so custom-domain sites
 * that carry an injected `data-slug` still attribute correctly), a fresh `eventId` per navigation,
 * `eventType: 'pageview'`, `payload: { href, title }`. Fire-and-forget `keepalive` fetch, fully
 * fail-soft — analytics must NEVER break the page. Renders nothing.
 */

/** Read a config attribute off the injected app.js `<script>` tag (matches app.js's own reads). */
function appJsAttr(name: string, fallback: string): string {
  try {
    const tag = document.querySelector('script[src*="/app.js"]');
    const v = tag?.getAttribute(name);
    if (v) return v;
  } catch {
    /* ignore — fall through to the fallback */
  }
  return fallback;
}

/** The site slug app.js sends as `siteId` (data-slug, else the hostname's first label). */
function siteSlug(): string {
  const bySlug = appJsAttr('data-slug', '');
  if (bySlug) return bySlug;
  try {
    return location.hostname.split('.')[0] || 'site';
  } catch {
    return 'site';
  }
}

/** One cookieless session id for this page-load lifetime (metadata only; pageview COUNT is exact). */
const SESSION_ID = (() => {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  } catch {
    /* ignore */
  }
  return `ps-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
})();

function newEventId(): string {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  } catch {
    /* ignore */
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export default function PageviewBeacon() {
  const { pathname, search } = useLocation();
  const firstRender = useRef(true);

  useEffect(() => {
    // The initial load is already counted by app.js + the server — never re-count it here.
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    try {
      const api = appJsAttr('data-api', 'https://projectsites.dev');
      const body: Record<string, unknown> = {
        eventId: newEventId(),
        siteId: siteSlug(),
        eventType: 'pageview',
        sessionId: SESSION_ID,
        timestamp: Date.now(),
        payload: { href: pathname + search, title: document.title || undefined },
      };
      try {
        if (document.referrer) body.referer = document.referrer;
      } catch {
        /* ignore */
      }
      void fetch(`${api}/api/events`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
        keepalive: true,
        mode: 'cors',
        credentials: 'omit',
      }).catch(() => {
        /* fire-and-forget — a failed beacon must never surface to the visitor */
      });
    } catch {
      /* analytics must never break the page */
    }
  }, [pathname, search]);

  return null;
}
