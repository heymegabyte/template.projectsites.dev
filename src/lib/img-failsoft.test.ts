import { describe, it, expect, afterEach } from 'vitest';
import { hideBrokenImage, installGlobalImageFailSoft } from './img-failsoft';

/**
 * § C.13 — a broken image hides itself instead of painting the browser's broken-image
 * glyph. Covers BOTH the core `hideBrokenImage` (used by `<Image>`'s onError) and the
 * global capture-phase listener that fail-softs every raw content `<img>` site-wide.
 */

const cleanups: Array<() => void> = [];
afterEach(() => {
  while (cleanups.length) cleanups.pop()!();
  document.body.innerHTML = '';
});

describe('hideBrokenImage', () => {
  it('hides the whole <picture> when the <img> is inside one', () => {
    document.body.innerHTML = '<picture><img src="x.jpg" alt="p" /></picture>';
    const img = document.querySelector('img') as HTMLImageElement;
    const picture = document.querySelector('picture') as HTMLElement;
    expect(picture.style.display).toBe('');
    hideBrokenImage(img);
    expect(picture.style.display).toBe('none'); // the picture collapses, not the bare img
  });

  it('hides the bare <img> when there is no <picture> wrapper', () => {
    document.body.innerHTML = '<img src="x.jpg" alt="raw" />';
    const img = document.querySelector('img') as HTMLImageElement;
    hideBrokenImage(img);
    expect(img.style.display).toBe('none');
  });
});

describe('installGlobalImageFailSoft', () => {
  it('fail-softs a raw <img> that errors — via the document capture phase (error does not bubble)', () => {
    document.body.innerHTML = '<img src="https://cdn.invalid/flaked.jpg" alt="content" />';
    const img = document.querySelector('img') as HTMLImageElement;

    // Control (baked-in RED): with NO global listener installed, an error leaves the image visible.
    img.dispatchEvent(new Event('error'));
    expect(img.style.display).toBe('');

    // With the global listener, the same error hides the broken image.
    cleanups.push(installGlobalImageFailSoft(document));
    img.dispatchEvent(new Event('error'));
    expect(img.style.display).toBe('none');
  });

  it('covers <img> inside a <picture> too (hides the whole picture)', () => {
    cleanups.push(installGlobalImageFailSoft(document));
    document.body.innerHTML = '<picture><img src="https://cdn.invalid/x.jpg" alt="pic" /></picture>';
    const img = document.querySelector('img') as HTMLImageElement;
    img.dispatchEvent(new Event('error'));
    expect((document.querySelector('picture') as HTMLElement).style.display).toBe('none');
  });

  it('ignores non-<img> error events (a broken <script>/<link> is not our concern)', () => {
    cleanups.push(installGlobalImageFailSoft(document));
    document.body.innerHTML = '<script></script><img src="ok.jpg" alt="ok" />';
    const script = document.querySelector('script') as HTMLScriptElement;
    const img = document.querySelector('img') as HTMLImageElement;
    script.dispatchEvent(new Event('error'));
    expect(img.style.display).toBe(''); // untouched — only the erroring <script> would be, and we skip it
  });

  it('cleanup removes the listener — after cleanup an error no longer hides the image', () => {
    const cleanup = installGlobalImageFailSoft(document);
    cleanup();
    document.body.innerHTML = '<img src="https://cdn.invalid/y.jpg" alt="after" />';
    const img = document.querySelector('img') as HTMLImageElement;
    img.dispatchEvent(new Event('error'));
    expect(img.style.display).toBe('');
  });

  it('no-ops safely when there is no event target (non-DOM environment)', () => {
    expect(() => installGlobalImageFailSoft(undefined)()).not.toThrow();
  });
});
