import { render } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import GalleryGrid from './GalleryGrid';

/**
 * GalleryGrid × focus_pull (`VITE_FOCUS_PULL`, dark by default, AL-853). Locks the flag gate +
 * the cinematic rack-focus contract: the `ps-focus-pull` class (blur→sharp on scroll-in, base
 * SHARP `filter:none` — proven never-stranded-blurred by the prod probe `e2e/verify-focus-pull.mjs`)
 * is applied to each gallery image ONLY when the flag is on, so a dark build ships the crisp image
 * with zero extra class.
 */
const IMAGES = [
  { src: 'https://images.unsplash.com/photo-1', alt: 'A surfboard on the sand' },
  { src: 'https://images.unsplash.com/photo-2', alt: 'A wetsuit rack' },
];

describe('GalleryGrid — focus_pull gate (dark by default)', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('does NOT apply ps-focus-pull when the flag is off (default)', () => {
    const { container } = render(<GalleryGrid images={IMAGES} />);
    const imgs = container.querySelectorAll('img.gallery-tile__img');
    expect(imgs.length).toBe(2);
    imgs.forEach((im) => expect(im.classList.contains('ps-focus-pull')).toBe(false));
  });

  it('applies ps-focus-pull to every tile image when VITE_FOCUS_PULL=1', () => {
    vi.stubEnv('VITE_FOCUS_PULL', '1');
    const { container } = render(<GalleryGrid images={IMAGES} />);
    const imgs = container.querySelectorAll('img.gallery-tile__img');
    expect(imgs.length).toBe(2);
    imgs.forEach((im) => expect(im.classList.contains('ps-focus-pull')).toBe(true));
  });
});
