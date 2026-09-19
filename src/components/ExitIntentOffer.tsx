import { useEffect, useRef, useState } from "react";
import { brand } from "@/brand";
import { exitIntentEnabled } from "@/lib/featureFlags";
import { telHref } from "@/lib/phone";
import { mailtoHref } from "@/lib/email";

/**
 * ExitIntentOffer — the 2026 conversion-recovery frontier the big AI builders (Framer / Lovable /
 * v0) don't ship natively. When a desktop visitor's cursor darts to the top of the viewport to
 * leave, a tasteful, session-once card surfaces the ONE highest-intent action for THIS business —
 * derived automatically from the site's own brand data (click-to-call its phone → else email →
 * else the contact page). The owner configures NOTHING; the AI already knows the business.
 *
 * EMBARRASSINGLY-EASY + accessible: session-once (sessionStorage), armed only after a 4s grace so it
 * never fires on an accidental early mouse-out, a prominent "No thanks" dismiss + Esc + backdrop
 * click, focus moves to the primary action on open and restores on close (never traps).
 *
 * LCP-SAFE BY CONSTRUCTION: renders `null` until the exit signal (which can only occur long after
 * paint — it needs a real cursor to leave the viewport), so nothing it contains is ever an LCP
 * candidate. Zero bundle cost (no lazy libs). CSS lives in the linked `index.css` (`.ps-exit*`) —
 * React 19 drops a component's inline `<style>{string}` on the client. Entrance motion is gated in
 * CSS by `prefers-reduced-motion` → reduced-motion users get the card instantly, no slide.
 *
 * Dark by default — only mounts its listeners when `exitIntentEnabled()` (`VITE_EXIT_INTENT=1`).
 */
const SESSION_KEY = "ps_exit_offer_v1";
const ARM_DELAY_MS = 4000;

export interface OfferCta {
  readonly href: string;
  readonly label: string;
  readonly event: string;
}

/**
 * Derive the single highest-intent recovery action from the business's OWN data — zero owner
 * config (the AI already knows the business). Phone → click-to-call (the highest-intent local
 * action); else email → mailto; else the contact page. Pure + exported for unit coverage.
 */
export function deriveOffer(business: {
  name?: string;
  shortName?: string;
  phone?: string;
  email?: string;
}): OfferCta {
  // Only offer "Call" when the phone is actually dialable (≥7 digits) — a digitless/placeholder
  // phone falls through to the email/contact CTA instead of a dead tel: exit-intent offer.
  const callHref = telHref(business.phone);
  if (callHref)
    return {
      href: callHref,
      label: `Call ${business.shortName || business.name || "us"}`,
      event: "exit_intent_call",
    };
  // Only offer email when it's a real address (not a placeholder/{token}/invalid) — else fall
  // through to the contact page rather than a dead mailto: exit-intent offer.
  const mail = mailtoHref(business.email);
  if (mail)
    return {
      href: mail,
      label: "Send us a message",
      event: "exit_intent_email",
    };
  return {
    href: "/contact",
    label: "Get in touch",
    event: "exit_intent_contact",
  };
}

export function ExitIntentOffer() {
  const [open, setOpen] = useState(false);
  const ctaRef = useRef<HTMLAnchorElement>(null);
  const lastFocus = useRef<Element | null>(null);

  useEffect(() => {
    if (!exitIntentEnabled()) return;
    // Coarse-pointer (touch) devices have no cursor exit signal — desktop only, so we never nag a
    // phone user who can't produce the gesture.
    let finePointer = true;
    try {
      finePointer = window.matchMedia?.("(pointer: fine)").matches !== false;
    } catch {
      /* matchMedia unavailable → assume desktop */
    }
    if (!finePointer) return;

    let seen = false;
    try {
      seen = sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      /* storage blocked → allow once, don't persist */
    }
    if (seen) return;

    let armed = false;
    let fired = false; // fire at most ONCE per mount (sessionStorage guards across mounts)
    const armTimer = setTimeout(() => {
      armed = true;
    }, ARM_DELAY_MS);

    const onMouseOut = (e: MouseEvent) => {
      // Cursor left through the TOP edge (toward the tab bar / URL / close button), not into
      // another element or out a side. `relatedTarget` null + clientY≤0 is the classic signal.
      if (
        fired ||
        !armed ||
        e.relatedTarget ||
        (e as MouseEvent & { toElement?: unknown }).toElement
      )
        return;
      if (e.clientY > 0) return;
      fired = true;
      lastFocus.current = document.activeElement;
      try {
        sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        /* ignore */
      }
      setOpen(true);
    };

    document.addEventListener("mouseout", onMouseOut);
    return () => {
      clearTimeout(armTimer);
      document.removeEventListener("mouseout", onMouseOut);
    };
  }, []);

  // On open: focus the primary action. On close: restore focus to where the visitor was.
  useEffect(() => {
    if (open) {
      ctaRef.current?.focus();
    } else if (lastFocus.current instanceof HTMLElement) {
      lastFocus.current.focus?.();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  const offer = deriveOffer(brand.business);
  const name = brand.business.shortName || brand.business.name || "us";

  return (
    <div
      className="ps-exit-backdrop"
      onClick={() => setOpen(false)}
      data-testid="exit-intent-backdrop"
    >
      <div
        className="ps-exit-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ps-exit-title"
        onClick={(e) => e.stopPropagation()}
        data-testid="exit-intent-offer"
      >
        <p className="ps-exit-eyebrow">Before you go</p>
        <h2 id="ps-exit-title" className="ps-exit-title">
          Have a quick question for {name}?
        </h2>
        <p className="ps-exit-body">
          We're happy to help — reach out and we'll get right back to you.
        </p>
        <a
          ref={ctaRef}
          href={offer.href}
          className="ps-exit-cta"
          data-ps-event={offer.event}
          data-testid="exit-intent-cta"
          onClick={() => setOpen(false)}
        >
          {offer.label}
        </a>
        <button
          type="button"
          className="ps-exit-dismiss"
          onClick={() => setOpen(false)}
          data-testid="exit-intent-dismiss"
        >
          No thanks, just browsing
        </button>
      </div>
    </div>
  );
}
