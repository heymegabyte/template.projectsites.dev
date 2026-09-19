import { describe, it, expect } from 'vitest';
import { emailAddr, mailtoHref } from './email';

describe('emailAddr — real-email guard (click-to-email integrity)', () => {
  it('returns a real, trimmed email', () => {
    expect(emailAddr('info@cochon.com')).toBe('info@cochon.com');
    expect(emailAddr('  hi@a.co  ')).toBe('hi@a.co');
    expect(emailAddr('a.b+tag@sub.domain.org')).toBe('a.b+tag@sub.domain.org');
  });
  it('rejects unfilled {token}s', () => {
    expect(emailAddr('{BUSINESS_EMAIL}')).toBe('');
    expect(emailAddr('{EMAIL}')).toBe('');
  });
  it('rejects empty / nullish / whitespace', () => {
    expect(emailAddr('')).toBe('');
    expect(emailAddr(undefined)).toBe('');
    expect(emailAddr('   ')).toBe('');
  });
  it('rejects non-email strings (no @, no dotted TLD, spaces)', () => {
    expect(emailAddr('Call for hours')).toBe('');
    expect(emailAddr('bob@localhost')).toBe(''); // no dotted TLD
    expect(emailAddr('two words@x.com')).toBe(''); // internal space
    expect(emailAddr('nope')).toBe('');
  });
});

describe('mailtoHref — dead-control-safe mailto', () => {
  it('builds a mailto: for a real email', () => {
    expect(mailtoHref('info@cochon.com')).toBe('mailto:info@cochon.com');
  });
  it('returns "" for a placeholder / invalid email so the caller renders no Email control', () => {
    expect(mailtoHref('{BUSINESS_EMAIL}')).toBe('');
    expect(mailtoHref('')).toBe('');
    expect(mailtoHref('Call for hours')).toBe('');
    expect(mailtoHref(undefined)).toBe('');
  });
});
