/**
 * Click-to-call integrity — the ONE place that turns a business phone string into a `tel:` href.
 *
 * Returns a DIALABLE `tel:+digits` ONLY when the phone is real: present, not an unfilled `{token}`,
 * and carrying at least 7 digits. Otherwise returns '' so the caller renders NO Call control rather
 * than a dead `href="tel:"` / `href="#"` / `href="tel:555"` that dials nothing — a "doomed control"
 * (the busy-owner's visitor taps Call and nothing happens).
 *
 * Extracted from LocationMap's correct `≥7 digits` guard when four other consumers
 * (StickyActionBar / Footer / ExitIntentOffer / ServiceMenu) shipped the weaker `phone ? tel:… : ''`
 * (no digit-count check → a filled-but-digitless phone like "Call for hours" rendered a dead button).
 * Per inverted-abstraction-pyramid: the specific-thing-written-twice is now the one shared thing.
 */

/**
 * Normalize a phone string to its dialable core (`+` and digits), or '' when it lacks a plausible
 * 7+ digits or is an unfilled `{token}`.
 *
 * @example telDigits('+1 (415) 555-0123') // → '+14155550123'
 * @example telDigits('Call for hours')     // → '' (0 digits)
 * @example telDigits('{BUSINESS_PHONE}')   // → '' (unfilled token)
 */
export function telDigits(phone?: string): string {
  if (!phone || phone.startsWith("{")) return "";
  const cleaned = phone.replace(/[^\d+]/g, "");
  return cleaned.replace(/\D/g, "").length >= 7 ? cleaned : "";
}

/**
 * A dialable `tel:` href for a real phone, else '' — gate the Call control on its truthiness so a
 * dead click-to-call is never rendered.
 *
 * @example telHref('(415) 555-0123') // → 'tel:4155550123'
 * @example telHref('n/a')            // → '' → caller renders no Call button
 */
export function telHref(phone?: string): string {
  const d = telDigits(phone);
  return d ? `tel:${d}` : "";
}
