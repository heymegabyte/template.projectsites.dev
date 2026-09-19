/**
 * Click-to-email integrity — the ONE place that turns a business email string into a `mailto:` href.
 *
 * The email sibling of {@link ./phone.ts} (`telHref`): returns a real address / `mailto:` ONLY when
 * the email is real — present, not an unfilled `{token}`, and shaped `local@domain.tld`. Otherwise it
 * returns '' so the caller renders NO email control rather than a dead `mailto:` / `mailto:{token}` /
 * `href="#"` that opens a blank compose window addressed to nothing — a "doomed control" (the busy
 * owner's visitor taps Email and nothing sensible happens).
 *
 * Extracted when NINE consumers (`Footer`, `ExitIntentOffer`, `SpeedDial`, `FAQ`, `Terms`, `Privacy`,
 * `Home`, `LocationMap`, `NAPFooter`, `Accessibility`) each shipped a raw `mailto:${email}` /
 * `href="#"` / a hardcoded `mailto:{BUSINESS_EMAIL}` token leak. Per inverted-abstraction-pyramid the
 * specific-thing-written-many-times becomes one shared, tested thing — matching the `telHref` fix.
 */

/**
 * The real business email, or '' when it is empty, an unfilled `{token}`, or not shaped
 * `local@domain.tld`. Intentionally pragmatic (not full RFC 5322) — enough to reject placeholders,
 * mirroring `telDigits`'s ≥7-digit guard.
 *
 * @example emailAddr('info@cochon.com')   // → 'info@cochon.com'
 * @example emailAddr('  hi@a.co ')        // → 'hi@a.co' (trimmed)
 * @example emailAddr('{BUSINESS_EMAIL}')  // → '' (unfilled token)
 * @example emailAddr('Call for hours')    // → '' (no @)
 * @example emailAddr('bob@localhost')     // → '' (no dotted TLD)
 */
export function emailAddr(email?: string): string {
  if (!email || email.startsWith("{")) return "";
  const e = email.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) ? e : "";
}

/**
 * A `mailto:` href for a real email, else '' — gate the Email control on its truthiness so a dead
 * `mailto:` is never rendered.
 *
 * @example mailtoHref('info@cochon.com')   // → 'mailto:info@cochon.com'
 * @example mailtoHref('{BUSINESS_EMAIL}')  // → '' → caller renders no Email control
 */
export function mailtoHref(email?: string): string {
  const e = emailAddr(email);
  return e ? `mailto:${e}` : "";
}
