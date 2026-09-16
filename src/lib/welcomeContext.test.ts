import { describe, it, expect } from 'vitest';
import { resolveWelcomeContext } from './welcomeContext';

describe('resolveWelcomeContext — zero-config visitor personalization', () => {
  it('greets a RETURNING visitor by business name', () => {
    const r = resolveWelcomeContext({ referrer: '', isReturning: true, businessName: 'Vito’s' });
    expect(r).toEqual({ show: true, kind: 'returning', message: '👋 Welcome back to Vito’s!' });
  });

  it('greets a returning visitor generically when no business name is known', () => {
    const r = resolveWelcomeContext({ referrer: '', isReturning: true });
    expect(r.show).toBe(true);
    expect(r.message).toBe('👋 Welcome back!');
  });

  it('thanks a SOCIAL arrival by platform', () => {
    expect(resolveWelcomeContext({ referrer: 'https://l.instagram.com/?u=x', isReturning: false }).message).toBe(
      '👋 Thanks for stopping by from Instagram!',
    );
    expect(resolveWelcomeContext({ referrer: 'https://m.facebook.com/', isReturning: false }).message).toContain('Facebook');
    expect(resolveWelcomeContext({ referrer: 'https://t.co/abc', isReturning: false }).message).toContain('X');
    expect(resolveWelcomeContext({ referrer: 'https://www.tiktok.com/@x', isReturning: false }).message).toContain('TikTok');
    expect(resolveWelcomeContext({ referrer: 'https://lnkd.in/xyz', isReturning: false }).message).toContain('LinkedIn');
  });

  it('RETURNING wins over a social referrer (warmest line)', () => {
    const r = resolveWelcomeContext({ referrer: 'https://instagram.com/x', isReturning: true, businessName: 'Acme' });
    expect(r.kind).toBe('returning');
  });

  it('firewalls an UNFILLED {TOKEN} business name → generic line, never a leaked token', () => {
    const r = resolveWelcomeContext({ referrer: '', isReturning: true, businessName: '{BUSINESS_SHORT_NAME}' });
    expect(r.message).toBe('👋 Welcome back!');
    expect(r.message).not.toContain('{');
  });

  it('shows NOTHING for a first-time visitor from search / direct (no noise)', () => {
    expect(resolveWelcomeContext({ referrer: 'https://www.google.com/', isReturning: false }).show).toBe(false);
    expect(resolveWelcomeContext({ referrer: 'https://duckduckgo.com/', isReturning: false }).show).toBe(false);
    expect(resolveWelcomeContext({ referrer: '', isReturning: false }).show).toBe(false);
  });

  it('ignores a SAME-HOST referrer (internal SPA nav is not an arrival)', () => {
    const r = resolveWelcomeContext({
      referrer: 'https://vitos.projectsites.dev/about',
      isReturning: false,
      selfHost: 'vitos.projectsites.dev',
    });
    expect(r.show).toBe(false);
  });
});
