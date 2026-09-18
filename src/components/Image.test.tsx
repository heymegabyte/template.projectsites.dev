import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Image } from './Image';

/**
 * § C.13 — the universal <Image> fails SOFT: a broken image (a flaked stock URL, a 200 that isn't a
 * decodable image, a wrong content-type, a truncated file) hides its whole <picture> instead of
 * painting the browser's broken-image glyph to the visitor. Guarded live by
 * e2e/site-quality/verify-image-render.mjs.
 */
describe('Image — onError fail-soft (§ C.13)', () => {
  it('hides the whole <picture> when the image fails to load (no broken-image glyph)', () => {
    const { container } = render(<Image src="https://cdn.example/flaked.jpg" alt="Product" />);
    const img = container.querySelector('img') as HTMLImageElement;
    const picture = container.querySelector('picture') as HTMLElement;
    expect(picture.style.display).not.toBe('none'); // visible before any error
    fireEvent.error(img);
    expect(picture.style.display).toBe('none'); // load failed → the whole picture collapses cleanly
  });

  it("composes the caller's onError (still fires) while also failing soft", () => {
    const onError = vi.fn();
    const { container } = render(
      <Image src="https://cdn.example/flaked.jpg" alt="x" onError={onError} />,
    );
    fireEvent.error(container.querySelector('img') as HTMLImageElement);
    expect(onError).toHaveBeenCalledTimes(1);
    expect((container.querySelector('picture') as HTMLElement).style.display).toBe('none');
  });

  it('renders a normal <picture> (avif/webp sources + original src) for a healthy local asset', () => {
    const { container } = render(<Image src="/hero.jpg" alt="Hero" priority />);
    expect(container.querySelector('source[type="image/avif"]')).toBeTruthy();
    expect(container.querySelector('img')?.getAttribute('src')).toBe('/hero.jpg');
    expect((container.querySelector('picture') as HTMLElement).style.display).not.toBe('none');
  });
});
