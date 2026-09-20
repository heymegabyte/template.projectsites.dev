import { render } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { FAQ } from './FAQ';
import { faqNativeDisclosureEnabled } from '@/lib/featureFlags';

/**
 * BLEEDING-EDGE native height-auto disclosure (`faq_native_disclosure` /
 * VITE_FAQ_NATIVE_DISCLOSURE). Locks the flag gate + the wiring: the effect is DARK by default
 * (a shipped site keeps the grid-rows reveal until promoted), and when promoted the answer panel
 * gains a `data-faq-native` opt-in attribute — the reveal WRAPS the existing markup, never
 * replaces it (the base grid-rows track + the answer copy + the FAQPage JSON-LD all remain). The
 * actual `interpolate-size` `height:0→auto` tween is a CSS rule under `@supports` that jsdom can't
 * run; that's proven in a real browser. Here we lock the STRUCTURAL contract only.
 */
const items = [
  { question: 'What is a real, specific question?', answer: 'A real, specific answer with substance.' },
  { question: 'Do you keep the base grid-rows fallback?', answer: 'Yes — flag-off ships byte-identically.' },
];
const renderFAQ = () => render(<FAQ items={items} />);

afterEach(() => vi.unstubAllEnvs());

describe('faqNativeDisclosureEnabled — VITE_FAQ_NATIVE_DISCLOSURE gate (ON by default, opt-OUT — AL-833)', () => {
  it('is ON by default (no env) and only OFF when explicitly VITE_FAQ_NATIVE_DISCLOSURE=0', () => {
    expect(faqNativeDisclosureEnabled()).toBe(true); // promoted default-on (layered under @supports)
    vi.stubEnv('VITE_FAQ_NATIVE_DISCLOSURE', '0');
    expect(faqNativeDisclosureEnabled()).toBe(false); // the opt-out escape hatch
    vi.stubEnv('VITE_FAQ_NATIVE_DISCLOSURE', '1');
    expect(faqNativeDisclosureEnabled()).toBe(true);
  });
});

describe('FAQ — native height-auto disclosure is flag-gated', () => {
  it('marks every panel data-faq-native by DEFAULT (ON) — reveal wraps, never replaces', () => {
    const { container } = renderFAQ();
    const native = container.querySelectorAll('[data-faq-native]');
    // Every panel opted in — and every native panel is a real .faq-panel with its answer inside.
    expect(native.length).toBe(items.length);
    native.forEach((el) => {
      expect(el.classList.contains('faq-panel')).toBe(true);
      expect(el.querySelector('.faq-panel__clip .faq-answer')).not.toBeNull();
    });
    // The FAQPage JSON-LD (the AI-citation payload) is unaffected by the visual upgrade.
    expect(container.querySelector('script[type="application/ld+json"]')).not.toBeNull();
  });

  it('does NOT mark panels data-faq-native when opted OUT (=0); the grid-rows reveal + answers still render', () => {
    vi.stubEnv('VITE_FAQ_NATIVE_DISCLOSURE', '0');
    const { container } = renderFAQ();
    // Opted out: no opt-in attribute anywhere.
    expect(container.querySelector('[data-faq-native]')).toBeNull();
    // The universal base/fallback reveal is intact.
    const panels = container.querySelectorAll('.faq-panel');
    expect(panels.length).toBe(items.length);
    // The clip wrapper + the answer copy are present regardless of the flag.
    expect(container.querySelector('.faq-panel__clip')).not.toBeNull();
    expect(container.querySelector('.faq-answer')?.textContent).toContain('substance');
  });
});
