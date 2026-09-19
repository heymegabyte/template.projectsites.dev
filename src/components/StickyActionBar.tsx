import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Phone, ClipboardList, MessageSquare } from "lucide-react";
import { brand, featureOn } from "@/brand";
import { telHref } from "@/lib/phone";

/**
 * Mobile-only sticky action bar — the single highest-leverage conversion win for
 * local-service traffic, which is overwhelmingly mobile and rarely scrolls back to
 * a header CTA. Fixed to the bottom of the viewport, it surfaces a one-tap
 * click-to-call (when a phone number is known) plus the vertical's primary action
 * (Get a Quote for service businesses, otherwise Contact). Hidden on `md+` where the
 * header CTA already lives.
 *
 * Behavior:
 *  - Reveals only after the user scrolls past the hero (~60vh) so it never competes
 *    with the above-the-fold CTA.
 *  - Hides itself while any form field is focused, so it never covers the on-screen
 *    keyboard or the field the user is filling.
 *  - Respects the iOS home-indicator via `env(safe-area-inset-bottom)`.
 *  - Theme-token colors only (correct on light AND dark verticals).
 */
export function StickyActionBar() {
  const [visible, setVisible] = useState(false);
  const [typing, setTyping] = useState(false);

  // telHref returns '' unless the phone is real (≥7 digits, not a {token}) — so a dead
  // "Call" button (href="tel:" dialing nothing) is never rendered (gated on phoneHref below).
  const phoneHref = telHref(brand.business.phone);
  const quote = featureOn("quote");
  const cta = quote
    ? {
        to: "/quote",
        label: "Get a Quote",
        icon: <ClipboardList size={18} aria-hidden="true" />,
      }
    : {
        to: "/contact",
        label: "Contact Us",
        icon: <MessageSquare size={18} aria-hidden="true" />,
      };

  useEffect(() => {
    const onScroll = () =>
      setVisible(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Collapse while the visitor is filling a form so the bar never covers inputs/keyboard.
  useEffect(() => {
    const isField = (el: EventTarget | null) =>
      el instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName);
    const onFocus = (e: FocusEvent) => isField(e.target) && setTyping(true);
    const onBlur = (e: FocusEvent) => isField(e.target) && setTyping(false);
    document.addEventListener("focusin", onFocus);
    document.addEventListener("focusout", onBlur);
    return () => {
      document.removeEventListener("focusin", onFocus);
      document.removeEventListener("focusout", onBlur);
    };
  }, []);

  const shown = visible && !typing;

  return (
    <div
      className={`md:hidden fixed inset-x-0 bottom-0 z-40 transition-transform duration-300 ${
        shown ? "translate-y-0" : "translate-y-full"
      }`}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-hidden={!shown}
      // When hidden the bar is only slid off-screen (translate-y-full) — its CTA
      // links stay keyboard-focusable, so a Tab lands inside aria-hidden content
      // (axe aria-hidden-focus, serious). `inert` (React 19) removes the whole
      // subtree from the tab order + a11y tree while hidden; dropped when shown.
      inert={!shown}
    >
      <div className="glass-strong border-t border-border flex gap-2 p-2.5">
        {phoneHref && (
          <a
            href={phoneHref}
            data-bcl-phone
            className="flex-1 inline-flex items-center justify-center gap-2 min-h-[48px] rounded-lg border border-accent/40 bg-surface text-text font-semibold text-sm hover:border-accent transition-colors"
          >
            <Phone size={18} aria-hidden="true" /> Call
          </a>
        )}
        <Link
          to={cta.to}
          data-bcl-cta
          className="flex-1 inline-flex items-center justify-center gap-2 min-h-[48px] rounded-lg bg-accent text-[var(--color-on-accent)] font-bold text-sm hover:bg-accent-hover transition-colors"
        >
          {cta.icon} {cta.label}
        </Link>
      </div>
    </div>
  );
}

export default StickyActionBar;
