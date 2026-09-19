import { render, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { ExitIntentOffer, deriveOffer } from './ExitIntentOffer';
import { exitIntentEnabled } from '@/lib/featureFlags';

/**
 * BLEEDING-EDGE exit-intent recovery (`exit_intent` / VITE_EXIT_INTENT) — the 2026 conversion
 * frontier the big AI builders don't ship. Locks: (1) the flag is DARK by default; (2) the offer
 * is AI-DERIVED from the business's own data (phone→call, else email, else contact) with zero
 * owner config; (3) the dark path renders nothing (LCP-safe). The live cursor-leaves-top trigger →
 * dialog is proven in a REAL browser by e2e/site-quality/verify-exit-intent.mjs (jsdom has no
 * viewport-exit signal); here we lock the gate + the derivation + the dark contract.
 */
afterEach(() => vi.unstubAllEnvs());

describe('exitIntentEnabled — VITE_EXIT_INTENT gate (dark by default)', () => {
  it('is OFF unless VITE_EXIT_INTENT=1 (experimental, promote-to-enable)', () => {
    expect(exitIntentEnabled()).toBe(false);
    vi.stubEnv('VITE_EXIT_INTENT', '1');
    expect(exitIntentEnabled()).toBe(true);
    vi.stubEnv('VITE_EXIT_INTENT', '0');
    expect(exitIntentEnabled()).toBe(false);
  });
});

describe('deriveOffer — AI-derived highest-intent action (zero owner config)', () => {
  it('prefers click-to-call when a phone exists (stripping formatting for the tel: href)', () => {
    const o = deriveOffer({ name: 'Vito Salon', shortName: 'Vito', phone: '+1 (555) 123-4567' });
    expect(o.href).toBe('tel:+15551234567');
    expect(o.label).toBe('Call Vito');
    expect(o.event).toBe('exit_intent_call');
  });

  it('falls back to email (mailto) when there is no phone', () => {
    const o = deriveOffer({ name: 'Acme', email: 'hi@acme.example' });
    expect(o.href).toBe('mailto:hi@acme.example');
    expect(o.event).toBe('exit_intent_email');
  });

  it('falls back to the contact page when neither phone nor email exists', () => {
    const o = deriveOffer({ name: 'Acme' });
    expect(o.href).toBe('/contact');
    expect(o.event).toBe('exit_intent_contact');
  });

  it('never crashes on an empty business (embarrassingly-easy fail-soft)', () => {
    const o = deriveOffer({});
    expect(o.href).toBe('/contact');
    expect(o.label).toContain('Get in touch');
  });
});

describe('ExitIntentOffer — dark until the exit signal (LCP-safe)', () => {
  it('renders NOTHING on mount (no offer without the trigger), flag on or off', () => {
    const off = render(
      <MemoryRouter>
        <ExitIntentOffer />
      </MemoryRouter>,
    );
    expect(off.queryByTestId('exit-intent-offer')).toBeNull();
    off.unmount();

    vi.stubEnv('VITE_EXIT_INTENT', '1');
    const on = render(
      <MemoryRouter>
        <ExitIntentOffer />
      </MemoryRouter>,
    );
    // Flag on, but no cursor-leaves-top signal yet → still nothing (only mounts on the real exit).
    expect(on.queryByTestId('exit-intent-offer')).toBeNull();
  });
});

describe('ExitIntentOffer — MOBILE exit-intent (2026: scroll-up-after-engage on touch)', () => {
  const ARM_MS = 4000; // mirrors ARM_DELAY_MS (module-private)
  afterEach(() => {
    vi.useRealTimers();
    try {
      sessionStorage.removeItem('ps_exit_offer_v1');
    } catch {
      /* ignore */
    }
  });

  it('fires the recovery offer when a touch visitor scrolls deep then darts back to the top', async () => {
    vi.useFakeTimers();
    vi.stubEnv('VITE_EXIT_INTENT', '1');
    try {
      sessionStorage.removeItem('ps_exit_offer_v1');
    } catch {
      /* ignore */
    }
    // Emulate a TOUCH device: (pointer: fine) → false → the component takes the mobile branch.
    const mm = vi.spyOn(window, 'matchMedia').mockImplementation(
      (q: string) =>
        ({
          matches: !/pointer:\s*fine/.test(q),
          media: q,
          onchange: null,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => false,
        }) as unknown as MediaQueryList,
    );
    let y = 0;
    Object.defineProperty(window, 'scrollY', { configurable: true, get: () => y });

    const r = render(
      <MemoryRouter>
        <ExitIntentOffer />
      </MemoryRouter>,
    );
    expect(r.queryByTestId('exit-intent-offer')).toBeNull(); // dark until the gesture

    // BEFORE arming: even a perfect leave-gesture is ignored (no accidental early nag).
    act(() => {
      y = 800;
      window.dispatchEvent(new Event('scroll'));
      y = 40;
      window.dispatchEvent(new Event('scroll'));
    });
    expect(r.queryByTestId('exit-intent-offer')).toBeNull();

    // Arm (4s grace), then engage (scroll deep) → dart back up near the top = the leave signal.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(ARM_MS + 20);
    });
    act(() => {
      y = 900;
      window.dispatchEvent(new Event('scroll')); // engaged (deepest ≥ 600)
      y = 30;
      window.dispatchEvent(new Event('scroll')); // darting up toward the top → OPEN
    });
    expect(r.queryByTestId('exit-intent-offer')).not.toBeNull();
    // AI-derived recovery CTA is present (zero owner config).
    expect(r.queryByTestId('exit-intent-cta')).not.toBeNull();

    mm.mockRestore();
    r.unmount();
  });

  it('does NOT fire on a shallow scroll (never engaged past the depth floor)', async () => {
    vi.useFakeTimers();
    vi.stubEnv('VITE_EXIT_INTENT', '1');
    try {
      sessionStorage.removeItem('ps_exit_offer_v1');
    } catch {
      /* ignore */
    }
    const mm = vi.spyOn(window, 'matchMedia').mockImplementation(
      (q: string) =>
        ({
          matches: !/pointer:\s*fine/.test(q),
          media: q,
          onchange: null,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => false,
        }) as unknown as MediaQueryList,
    );
    let y = 0;
    Object.defineProperty(window, 'scrollY', { configurable: true, get: () => y });

    const r = render(
      <MemoryRouter>
        <ExitIntentOffer />
      </MemoryRouter>,
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(ARM_MS + 20);
    });
    // Shallow bob: down 200 (< 600 depth floor) then back up — NOT an engaged visitor → no offer.
    act(() => {
      y = 200;
      window.dispatchEvent(new Event('scroll'));
      y = 10;
      window.dispatchEvent(new Event('scroll'));
    });
    expect(r.queryByTestId('exit-intent-offer')).toBeNull();

    mm.mockRestore();
    r.unmount();
  });
});
