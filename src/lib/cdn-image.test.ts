import { describe, it, expect } from 'vitest';
import { cdnImageProps, isResizableCdn } from './cdn-image';

describe('cdnImageProps — responsive + modern-format rewrite for CDN images', () => {
  const unsplash =
    'https://images.unsplash.com/photo-abc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=xyz';

  it('rewrites an Unsplash fm=jpg URL to auto=format + a 5-width responsive srcSet', () => {
    const r = cdnImageProps(unsplash);
    expect(r.src).toContain('auto=format');
    expect(r.src).not.toContain('fm=jpg'); // the JPEG-forcing param is dropped → AVIF/WebP
    expect(r.srcSet?.split(',').length).toBe(5);
    expect(r.srcSet).toContain('480w');
    expect(r.srcSet).toContain('1920w');
    expect(r.src).toContain('crop=entropy'); // preserves the meaningful crop
    expect(r.sizes).toBe('100vw');
  });

  it('is idempotent — re-applying does not stack w / fm / auto params', () => {
    const once = cdnImageProps(unsplash).src;
    const twice = cdnImageProps(once).src;
    expect(twice).toBe(once);
    expect((twice.match(/[?&]w=/g) ?? []).length).toBe(1);
    expect((twice.match(/auto=format/g) ?? []).length).toBe(1);
  });

  it('honors a custom sizes + width ladder', () => {
    const r = cdnImageProps(unsplash, '(max-width: 1024px) 100vw, 50vw', [400, 800]);
    expect(r.sizes).toBe('(max-width: 1024px) 100vw, 50vw');
    expect(r.srcSet?.split(',').length).toBe(2);
  });

  it('passes non-CDN / local URLs through unchanged (those use <Image> AVIF/WebP siblings)', () => {
    expect(cdnImageProps('/images/team.jpg')).toEqual({ src: '/images/team.jpg' });
    expect(cdnImageProps('https://cdn.example.com/x.png').srcSet).toBeUndefined();
  });

  it('isResizableCdn matches Unsplash / Pexels / Pixabay only', () => {
    expect(isResizableCdn('https://images.unsplash.com/photo-x')).toBe(true);
    expect(isResizableCdn('https://images.pexels.com/photos/1/x.jpg')).toBe(true);
    expect(isResizableCdn('https://cdn.pixabay.com/photo/1.jpg')).toBe(true);
    expect(isResizableCdn('/local.jpg')).toBe(false);
    expect(isResizableCdn('https://example.com/x.jpg')).toBe(false);
  });
});
