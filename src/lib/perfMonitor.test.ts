import { describe, it, expect } from 'vitest';
import { finalizeMetrics, rate } from './perfMonitor';

describe('perfMonitor rate()', () => {
  it('rates LCP against the 2.5s / 4.0s thresholds', () => {
    expect(rate('LCP', 2000)).toBe('good');
    expect(rate('LCP', 3000)).toBe('needs-improvement');
    expect(rate('LCP', 5000)).toBe('poor');
  });

  it('rates INP against the 200ms / 500ms thresholds', () => {
    expect(rate('INP', 150)).toBe('good');
    expect(rate('INP', 350)).toBe('needs-improvement');
    expect(rate('INP', 600)).toBe('poor');
  });

  it('rates CLS against the 0.1 / 0.25 thresholds', () => {
    expect(rate('CLS', 0.05)).toBe('good');
    expect(rate('CLS', 0.2)).toBe('needs-improvement');
    expect(rate('CLS', 0.5)).toBe('poor');
  });

  it('returns undefined for diagnostic-stream metrics with no thresholds', () => {
    expect(rate('LoAF', 100)).toBeUndefined();
    expect(rate('SoftNav', 100)).toBeUndefined();
  });
});

describe('perfMonitor finalizeMetrics() — the on-hide flush contract', () => {
  it('emits all three core vitals when observed, each marked final', () => {
    const events = finalizeMetrics({ lcp: 1800, cls: 0.04, inp: 120, inpId: '42' });
    expect(events.map((e) => e.name)).toEqual(['LCP', 'CLS', 'INP']);
    expect(events.every((e) => e.meta?.final === true)).toBe(true);
    expect(events.find((e) => e.name === 'INP')?.id).toBe('42');
  });

  it('ALWAYS emits CLS — 0 is a valid "good" score, not "no data"', () => {
    const events = finalizeMetrics({ lcp: 0, cls: 0, inp: 0, inpId: '' });
    expect(events.map((e) => e.name)).toEqual(['CLS']);
    expect(events[0]?.value).toBe(0);
  });

  it('skips LCP and INP when never observed (value 0 = no reading)', () => {
    const events = finalizeMetrics({ lcp: 0, cls: 0.12, inp: 0, inpId: '' });
    expect(events.map((e) => e.name)).toEqual(['CLS']);
  });

  it('emits LCP + CLS but skips an unobserved INP', () => {
    const events = finalizeMetrics({ lcp: 2400, cls: 0.08, inp: 0, inpId: '' });
    expect(events.map((e) => e.name)).toEqual(['LCP', 'CLS']);
  });
});
