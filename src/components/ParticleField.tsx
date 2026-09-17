import { useEffect, useRef, useState } from 'react';
import { particleFieldEnabled } from '@/lib/featureFlags';

/** Parse `#rrggbb` / `#rgb` → {r,g,b}, or null. Used to tint the motes with the brand accent. */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const h = hex.trim().replace(/^#/, '');
  const full = h.length === 3 ? h.replace(/(.)/g, '$1$1') : h;
  if (!/^[0-9a-f]{6}$/i.test(full)) return null;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

/**
 * Ambient particle field — a slow drift of luminous brand-tinted motes, the Awwwards / motion.so
 * "living canvas" ambient signature. Canvas 2D (no WebGL, no library); a pre-rendered radial-glow
 * sprite is `drawImage`d per mote with additive (`lighter`) blending, so the per-frame cost is a
 * handful of cheap blits — never a per-mote `createRadialGradient`.
 *
 * Mount inside a `position: relative; overflow: hidden` container (e.g. the CTA band); the canvas
 * absolutely fills it, BEHIND the `z-10` content. Safe by construction:
 *  - **LCP-safe**: renders `null` until an idle callback fires (post-first-paint); decorative +
 *    `aria-hidden` + `pointer-events-none`, NEVER the LCP element. Guard the container to below-fold.
 *  - **INP-safe**: one lightweight rAF; PAUSES on `document.hidden` + when scrolled off-screen
 *    (IntersectionObserver); a passive `pointermove` writes a ref (no per-event React work).
 *  - **CLS-safe**: `position:absolute; inset:0`, zero layout impact.
 *  - **Fallbacks**: flag-off / SSR / `prefers-reduced-motion: reduce` / no 2D context → `null`
 *    (the container's own background stands). Dark by default (`VITE_PARTICLE_FIELD=1` to preview).
 */
export function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  // Gate ONCE, synchronously — a disabled build renders nothing + schedules no work.
  const enabled =
    particleFieldEnabled() &&
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: no-preference)').matches;

  // Mount the canvas only AFTER first paint (post-LCP) so it never competes with the hero. The
  // `{ timeout }` GUARANTEES the callback fires within 1.5s even if the page never goes idle
  // (deterministic mount — an untimed requestIdleCallback can be starved indefinitely under load).
  useEffect(() => {
    if (!enabled) return;
    const hasRIC = typeof window.requestIdleCallback === 'function';
    const handle = hasRIC
      ? window.requestIdleCallback(() => setReady(true), { timeout: 1500 })
      : (window.setTimeout(() => setReady(true), 200) as unknown as number);
    return () => {
      if (hasRIC && typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(handle);
      else window.clearTimeout(handle);
    };
  }, [enabled]);

  useEffect(() => {
    if (!ready) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return; // no 2D context → graceful nothing

    const accentVar = getComputedStyle(document.documentElement)
      .getPropertyValue('--color-accent')
      .trim();
    const rgb = hexToRgb(accentVar) ?? { r: 0, g: 229, b: 255 }; // brand cyan fallback

    // Pre-render ONE soft glow sprite (offscreen); blit it per mote — far cheaper than a
    // per-frame radial gradient.
    const SPRITE = 64;
    const sprite = document.createElement('canvas');
    sprite.width = sprite.height = SPRITE;
    const sctx = sprite.getContext('2d');
    if (!sctx) return;
    const grad = sctx.createRadialGradient(SPRITE / 2, SPRITE / 2, 0, SPRITE / 2, SPRITE / 2, SPRITE / 2);
    grad.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},0.9)`);
    grad.addColorStop(0.4, `rgba(${rgb.r},${rgb.g},${rgb.b},0.25)`);
    grad.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},0)`);
    sctx.fillStyle = grad;
    sctx.fillRect(0, 0, SPRITE, SPRITE);

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let w = 0;
    let h = 0;
    const resize = () => {
      w = canvas.clientWidth || 1;
      h = canvas.clientHeight || 1;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    // Mote count scales with area, capped for INP (fewer on a phone).
    const count = Math.min(64, Math.max(20, Math.floor((w * h) / 24000)));
    const motes = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      s: 0.35 + Math.random() * 1.1, // sprite scale
      vx: (Math.random() - 0.5) * 0.16,
      vy: -(0.06 + Math.random() * 0.2), // gentle rise
      a: 0.1 + Math.random() * 0.4, // per-mote opacity
    }));

    // Passive pointer parallax — write a ref, apply in rAF (no per-event React/DOM work).
    const ptr = { tx: 0, ty: 0, x: 0, y: 0 };
    const onMove = (e: PointerEvent) => {
      ptr.tx = e.clientX / window.innerWidth - 0.5;
      ptr.ty = e.clientY / window.innerHeight - 0.5;
    };
    window.addEventListener('pointermove', onMove, { passive: true });

    let raf = 0;
    let hidden = document.hidden;
    let onscreen = true;
    const draw = () => {
      raf = 0;
      if (hidden || !onscreen) return; // paused → no next frame scheduled
      ptr.x += (ptr.tx - ptr.x) * 0.04;
      ptr.y += (ptr.ty - ptr.y) * 0.04;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      for (const m of motes) {
        m.x += m.vx;
        m.y += m.vy;
        if (m.y < -SPRITE) {
          m.y = h + SPRITE;
          m.x = Math.random() * w;
        }
        if (m.x < -SPRITE) m.x = w + SPRITE;
        else if (m.x > w + SPRITE) m.x = -SPRITE;
        const size = SPRITE * m.s;
        const px = m.x + ptr.x * 22 * m.s;
        const py = m.y + ptr.y * 22 * m.s;
        ctx.globalAlpha = m.a;
        ctx.drawImage(sprite, px - size / 2, py - size / 2, size, size);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      schedule();
    };
    const schedule = () => {
      if (!raf && !hidden && onscreen) raf = requestAnimationFrame(draw);
    };

    const io = new IntersectionObserver(
      ([e]) => {
        onscreen = e.isIntersecting;
        schedule();
      },
      { threshold: 0 },
    );
    io.observe(canvas);
    const onVis = () => {
      hidden = document.hidden;
      schedule();
    };
    document.addEventListener('visibilitychange', onVis);
    const onResize = () => resize();
    window.addEventListener('resize', onResize, { passive: true });
    schedule();

    return () => {
      if (raf) cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [ready]);

  if (!enabled || !ready) return null;
  return <canvas ref={canvasRef} aria-hidden="true" className="ps-particle-field" data-particle-field="1" />;
}

export default ParticleField;
