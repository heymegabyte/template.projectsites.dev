import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

/**
 * Click-to-email integrity across every `mailto:` consumer — the email sibling of
 * `local-phone-safety.test.tsx`. An UNFILLED `{BUSINESS_EMAIL}` token (or empty/invalid value)
 * must NEVER render a dead `mailto:{BUSINESS_EMAIL}` / `mailto:` / `href="#"` control the visitor
 * clicks and a blank compose window addressed to nothing opens — nor leak a `{BUSINESS_EMAIL}`
 * token as visible text. All consumers now route through `lib/email.ts` (`emailAddr`/`mailtoHref`).
 * This locks the whole class (mirrors the telHref sweep).
 */

// Mutable brand mock so the page tests can flip placeholder ↔ real without re-importing.
const h = vi.hoisted(() => ({ brand: { business: { name: '', email: '', phone: '' } } }));
vi.mock('@/brand', () => ({ brand: h.brand }));

import { deriveOffer } from './components/ExitIntentOffer';
import SpeedDial from './components/local/SpeedDial';
import Accessibility from './pages/Accessibility';

const TOKEN = '{BUSINESS_EMAIL}';
const REAL = 'hello@acme.com';
const REAL_PHONE = '(512) 555-0123';

describe('click-to-email — no dead mailto on an unfilled / invalid email', () => {
  it('deriveOffer (ExitIntentOffer): token/invalid email → /contact, not a dead mailto', () => {
    expect(deriveOffer({ email: TOKEN }).href).toBe('/contact');
    expect(deriveOffer({ email: 'nope-no-at' }).href).toBe('/contact');
    expect(deriveOffer({ email: '' }).href).toBe('/contact');
    expect(deriveOffer({ email: REAL }).href).toBe(`mailto:${REAL}`);
    // A dialable phone still wins over email (highest-intent action).
    expect(deriveOffer({ phone: REAL_PHONE, email: REAL }).href).toBe('tel:5125550123');
  });

  it('SpeedDial: token email → no mailto control; real → mailto in the menu', () => {
    const tok = render(<SpeedDial email={TOKEN} />).container;
    expect(tok.querySelector('a[href^="mailto:"]')).toBeNull();
    expect(tok.innerHTML).not.toContain('mailto:{');
    // Give it a real phone too so the FAB definitely renders, then the email action's mailto shows.
    const { container } = render(<SpeedDial phone={REAL_PHONE} email={REAL} />);
    const fab = container.querySelector('button[aria-label="Open quick actions"]');
    if (fab) fireEvent.click(fab);
    expect(container.querySelector(`a[href="mailto:${REAL}"]`)).not.toBeNull();
  });

  it('Accessibility page: placeholder brand → no dead tel:/mailto:, no {TOKEN} leak, contact-form fallback', () => {
    h.brand.business = { name: '', email: '{BUSINESS_EMAIL}', phone: '{BUSINESS_PHONE}' };
    const { container } = render(<Accessibility />);
    expect(container.querySelector('a[href^="mailto:"]')).toBeNull();
    expect(container.querySelector('a[href^="tel:"]')).toBeNull();
    expect(container.innerHTML).not.toContain('{BUSINESS_'); // no token leak (name/phone/email)
    expect(container.querySelector('a[href="/contact"]')).not.toBeNull(); // graceful fallback
  });

  it('Accessibility page: real brand → working tel: + mailto:, no token, no fallback', () => {
    h.brand.business = { name: 'Acme Co', email: REAL, phone: REAL_PHONE };
    const { container } = render(<Accessibility />);
    expect(container.querySelector(`a[href="mailto:${REAL}"]`)).not.toBeNull();
    expect(container.querySelector('a[href="tel:5125550123"]')).not.toBeNull();
    expect(container.innerHTML).toContain('Acme Co is committed');
    expect(container.querySelector('a[href="/contact"]')).toBeNull();
  });
});
