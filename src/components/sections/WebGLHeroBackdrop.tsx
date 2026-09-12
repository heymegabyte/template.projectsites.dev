import { useEffect, useRef, useState, type CSSProperties } from 'react';

/**
 * WebGLHeroBackdrop — a gorgeous, brand-tinted animated hero backdrop rendered
 * with a hand-written GLSL fragment shader on a raw `<canvas>` (NO three.js).
 *
 * WHY RAW WEBGL, NOT three.js / R3F:
 * three.js + R3F is ~150 KB gzip — it blows this template's TTFR / JS-budget gate
 * and hurts LCP for the low-bandwidth audiences these sites serve. A single
 * fragment shader gives the same "wow" (flowing aurora / mesh) at ~3 KB with zero
 * dependencies. If a build ever needs true 3D geometry, lazy-load R3F in a
 * `@defer`-style dynamic import behind these same guards — never in the initial bundle.
 *
 * LCP-SAFE BY CONSTRUCTION:
 *   - It is a DECORATIVE backdrop (`aria-hidden`, `pointer-events-none`), absolutely
 *     positioned BEHIND the hero content. The hero's H1/text is the LCP element and
 *     paints immediately, independent of this canvas.
 *   - The WebGL context + RAF loop start AFTER mount (post-hydration), so they never
 *     block first paint. Animation pauses when the tab/section isn't visible.
 *
 * GRACEFUL DEGRADATION (always legible):
 *   - `prefers-reduced-motion: reduce` → NO canvas, NO RAF; a static brand gradient.
 *   - WebGL unavailable / context lost → the same static brand gradient.
 *
 * BRAND-TINTED AUTOMATICALLY: reads `--brand-hue` from the cascade and feeds it to
 * the shader, so the backdrop matches whatever palette the generated site uses.
 */

/** The visual character of the backdrop — pick per industry. */
export type HeroBackdropVariant = 'aurora' | 'waves' | 'mesh' | 'ember';

/** Shader parameters per variant (pure data — unit-tested). */
export interface HeroBackdropConfig {
  /** Spatial frequency of the noise field (higher = finer detail). */
  scale: number;
  /** Animation speed multiplier. */
  speed: number;
  /** Band contrast (higher = sharper light ribbons). */
  sharpness: number;
  /** Hue spread around the brand hue, in turns (0..1). */
  hueSpread: number;
  /** Overall brightness (0..1). Kept low so foreground text stays legible. */
  intensity: number;
  /**
   * Domain-warp strength — flows the noise sample coords through a low-freq fbm field so the
   * flat noise becomes marbled, swirling ribbons (organic + premium, +~20% structural variance).
   * `0` = the legacy flat field (identical to the pre-warp shader). Tuned per variant.
   */
  warp: number;
}

/**
 * Per-variant shader configs. `aurora` = soft flowing ribbons (wellness/creative);
 * `waves` = broad horizontal swells (finance/professional, calmer); `mesh` = tighter
 * cellular shimmer (tech/AI); `ember` = a warm glow that RISES from a hearth floor
 * (food/hospitality/artisan — the one variant with vertical, not diagonal, motion).
 * All stay dark + low-intensity so foreground text stays legible.
 */
export const HERO_BACKDROP_CONFIGS: Record<HeroBackdropVariant, HeroBackdropConfig> = {
  // warp: aurora highest (flowing ribbons), ember turbulent, waves silky-gentle, mesh subtle
  // (keep the tight cellular tech read — just less flat).
  aurora: { scale: 2.5, speed: 1.0, sharpness: 0.7, hueSpread: 0.08, intensity: 0.9, warp: 0.9 },
  waves: { scale: 1.6, speed: 0.6, sharpness: 0.5, hueSpread: 0.04, intensity: 0.8, warp: 0.5 },
  mesh: { scale: 4.0, speed: 1.3, sharpness: 0.85, hueSpread: 0.12, intensity: 0.85, warp: 0.35 },
  ember: { scale: 2.0, speed: 0.8, sharpness: 0.58, hueSpread: 0.06, intensity: 0.82, warp: 0.7 },
};

/**
 * Map a `themeStyle` preset (the 13 site personalities) to the backdrop whose
 * MOTION matches that personality — so every generated site gets a fitting
 * animated hero automatically (no per-build opt-in):
 *   - `aurora` — soft flowing ribbons → welcoming / organic / creative / nostalgic
 *     (botanical, scholarly, boutique, classic, retro — retro's playful vibrant nostalgia
 *     reads as synthwave flowing color, not a techy shimmer);
 *   - `waves`  — broad calm swells → authoritative / professional / trusted
 *     (editorial, luxe);
 *   - `mesh`   — tight cellular shimmer → technical / energetic / precise
 *     (futuristic, bold, precision, rugged, brutalist);
 *   - `ember`  — warm glow rising from a hearth floor → food / hospitality / artisan / after-dark
 *     (warm, heritage, artisan, noir — noir's after-dark steakhouse/lounge wants ember's
 *     intimate warm-glow-in-a-dark-room, not cool ribbons) — the ONLY upward-motion variant.
 * Pure + total (unknown/blank → `aurora`) so it unit-tests in isolation.
 *
 * @example backdropForPreset('luxe')       // → 'waves'
 * @example backdropForPreset('futuristic') // → 'mesh'
 * @example backdropForPreset('warm')       // → 'ember'
 * @example backdropForPreset(undefined)    // → 'aurora'
 */
// MUST carry an explicit entry for EVERY `THEME_PRESETS` key — a preset with no entry
// silently falls back to `aurora` below, so a tech/energetic personality (e.g. `precision`,
// `bold`) would ship SOFT ribbons instead of the intended `mesh` shimmer: a per-industry
// beauty regression that's invisible (no error). Presets get added often (5 in recent
// commits), so the coverage is drift-GUARDED by a test (WebGLHeroBackdrop.test.ts asserts
// every PRESET_NAMES entry is a key here) — add the mapping in the SAME change as a new preset.
export const PRESET_BACKDROP: Record<string, HeroBackdropVariant> = {
  botanical: 'aurora', scholarly: 'aurora', boutique: 'aurora', classic: 'aurora', retro: 'aurora',
  editorial: 'waves', luxe: 'waves',
  futuristic: 'mesh', bold: 'mesh', precision: 'mesh', rugged: 'mesh', brutalist: 'mesh',
  warm: 'ember', heritage: 'ember', noir: 'ember', artisan: 'ember',
};
export function backdropForPreset(preset: string | null | undefined): HeroBackdropVariant {
  return PRESET_BACKDROP[(preset ?? '').trim().toLowerCase()] ?? 'aurora';
}

/**
 * Parse a `--brand-hue` CSS value (degrees, 0–360) into a shader turn (0–1).
 * Falls back to 240 (the template default blue) for blank/NaN input.
 *
 * @example parseBrandHue('195') // → 195/360
 * @example parseBrandHue('')    // → 240/360
 */
export function parseBrandHue(cssValue: string | null | undefined, fallbackDeg = 240): number {
  const deg = Number.parseFloat((cssValue ?? '').trim());
  const h = Number.isFinite(deg) ? deg : fallbackDeg;
  return ((h % 360) + 360) % 360 / 360;
}

/**
 * Decide how to render: the animated WebGL scene only when motion is allowed AND
 * WebGL is available; otherwise the static brand gradient. Pure → unit-tested.
 *
 * @example resolveBackdropMode({ reducedMotion: true,  webglOk: true  }) // 'static'
 * @example resolveBackdropMode({ reducedMotion: false, webglOk: false }) // 'static'
 * @example resolveBackdropMode({ reducedMotion: false, webglOk: true  }) // 'webgl'
 */
export function resolveBackdropMode(input: {
  reducedMotion: boolean;
  webglOk: boolean;
}): 'webgl' | 'static' {
  return !input.reducedMotion && input.webglOk ? 'webgl' : 'static';
}

const FRAG_SRC = `
precision mediump float;
uniform vec2 uRes;
uniform float uTime;
uniform float uHue;       // 0..1 (brand)
uniform float uScale;
uniform float uSharp;
uniform float uSpread;
uniform float uIntensity;
uniform float uMode;      // 0 = flowing field (aurora/waves/mesh); 1 = ember (warm upward rise)
uniform float uWarp;      // domain-warp strength (0 = legacy flat field)
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),f.x), mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),f.x), f.y); }
float fbm(vec2 p){ float v=0.0, a=0.5; for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.02; a*=0.5; } return v; }
vec3 hsl2rgb(float h,float s,float l){ vec3 r=clamp(abs(mod(h*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0,0.0,1.0); return l+s*(r-0.5)*(1.0-abs(2.0*l-1.0)); }
void main(){
  vec2 uv = gl_FragCoord.xy / uRes.xy;
  vec2 p = uv * vec2(uRes.x/uRes.y, 1.0);
  float t = uTime * 0.05;
  bool ember = uMode > 0.5;
  // ember RISES vertically (embers/steam over a hearth); the others drift diagonally.
  vec2 drift  = ember ? vec2(0.03*sin(t*1.7), -t*1.5) : vec2(t, t*0.6);
  vec2 drift2 = ember ? vec2(-0.02*sin(t*1.3), -t*1.1) : vec2(-t*0.8, -t);
  // DOMAIN WARP — flow the sample coords through a low-freq fbm field so the flat noise
  // becomes marbled, swirling ribbons (organic + premium; ~+20% structural variance measured).
  // uWarp=0 makes the warp term vanish → byte-identical to the pre-warp field.
  vec2 q = vec2(fbm(p*uScale + drift), fbm(p*uScale + drift2 + 5.2));
  float f = fbm(p*uScale + uWarp*q + drift);
  f += 0.5 * fbm(p*uScale*2.0 + uWarp*0.6*q + drift2);
  float band = smoothstep(1.0-uSharp, 0.95, f);
  float hue = uHue + (ember ? -0.02 : 0.0) + uSpread * sin(f*3.14159 + t);  // ember nudges warm
  // ember adds a soft warm glow floor rising from the bottom edge (uv.y→0 = hearth).
  float glow = ember ? 0.07 * (1.0 - smoothstep(0.0, 0.65, uv.y)) : 0.0;
  // premium silk highlight along the warped ribbon crests (only when warping).
  float sheen = uWarp > 0.0 ? 0.06 * pow(band, 3.0) : 0.0;
  vec3 col = hsl2rgb(hue, 0.7, 0.13 + 0.30*band + glow + sheen);
  col *= smoothstep(1.25, 0.2, length(uv-0.5));   // vignette → keeps center text legible
  gl_FragColor = vec4(col * uIntensity, 1.0);
}`;

const VERT_SRC = `attribute vec2 aPos; void main(){ gl_Position = vec4(aPos,0.0,1.0); }`;

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  return gl.getShaderParameter(sh, gl.COMPILE_STATUS) ? sh : null;
}

interface Props {
  variant?: HeroBackdropVariant;
  className?: string;
}

/**
 * Render the backdrop. Mount it as the FIRST child of a `relative`-positioned hero,
 * before the content, e.g. `<section className="relative"><WebGLHeroBackdrop /> …`.
 */
export function WebGLHeroBackdrop({ variant = 'aurora', className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mode, setMode] = useState<'webgl' | 'static'>('static');
  const cfg = HERO_BACKDROP_CONFIGS[variant] ?? HERO_BACKDROP_CONFIGS.aurora;

  useEffect(() => {
    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
    const canvas = canvasRef.current;
    let gl: WebGLRenderingContext | null = null;
    try {
      gl = canvas?.getContext('webgl', { antialias: true, alpha: false }) ?? null;
    } catch {
      gl = null;
    }
    const next = resolveBackdropMode({ reducedMotion, webglOk: !!gl });
    setMode(next);
    if (next === 'static' || !canvas || !gl) return;

    const vs = compile(gl, gl.VERTEX_SHADER, VERT_SRC);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG_SRC);
    const prog = gl.createProgram();
    if (!vs || !fs || !prog) {
      setMode('static');
      return;
    }
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      setMode('static');
      return;
    }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const u = {
      res: gl.getUniformLocation(prog, 'uRes'),
      time: gl.getUniformLocation(prog, 'uTime'),
      hue: gl.getUniformLocation(prog, 'uHue'),
      scale: gl.getUniformLocation(prog, 'uScale'),
      sharp: gl.getUniformLocation(prog, 'uSharp'),
      spread: gl.getUniformLocation(prog, 'uSpread'),
      intensity: gl.getUniformLocation(prog, 'uIntensity'),
      mode: gl.getUniformLocation(prog, 'uMode'),
      warp: gl.getUniformLocation(prog, 'uWarp'),
    };
    const modeFlag = variant === 'ember' ? 1 : 0;
    const hue = parseBrandHue(
      getComputedStyle(document.documentElement).getPropertyValue('--brand-hue'),
    );

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      if (!canvas || !gl) return;
      const w = Math.floor(canvas.clientWidth * dpr);
      const h = Math.floor(canvas.clientHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    let raf = 0;
    let running = true;
    const start = performance.now();
    const frame = () => {
      if (!running || !gl) return;
      resize();
      gl.uniform2f(u.res, canvas.width, canvas.height);
      gl.uniform1f(u.time, (performance.now() - start) / 1000);
      gl.uniform1f(u.hue, hue);
      gl.uniform1f(u.scale, cfg.scale);
      gl.uniform1f(u.sharp, cfg.sharpness);
      gl.uniform1f(u.spread, cfg.hueSpread);
      gl.uniform1f(u.intensity, cfg.intensity);
      gl.uniform1f(u.mode, modeFlag);
      gl.uniform1f(u.warp, cfg.warp);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      raf = requestAnimationFrame(frame);
    };
    // Pause when the tab is hidden or the hero scrolls out — no wasted GPU/battery.
    const io = new IntersectionObserver(
      ([e]) => {
        const visible = e?.isIntersecting ?? true;
        if (visible && running && !raf) raf = requestAnimationFrame(frame);
        if (!visible && raf) {
          cancelAnimationFrame(raf);
          raf = 0;
        }
      },
      { threshold: 0.01 },
    );
    io.observe(canvas);
    const onVis = () => {
      if (document.hidden && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else if (!document.hidden && !raf) {
        raf = requestAnimationFrame(frame);
      }
    };
    document.addEventListener('visibilitychange', onVis);
    const onLost = (ev: Event) => {
      ev.preventDefault();
      setMode('static');
    };
    canvas.addEventListener('webglcontextlost', onLost);
    raf = requestAnimationFrame(frame);

    return () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      canvas.removeEventListener('webglcontextlost', onLost);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [variant, cfg.scale, cfg.sharpness, cfg.hueSpread, cfg.intensity, cfg.warp]);

  // Static brand gradient — the always-legible fallback (reduced-motion / no-WebGL /
  // SSR first paint). Uses the brand tokens so it matches the animated version's palette.
  const staticStyle: CSSProperties = {
    background:
      'radial-gradient(120% 120% at 50% 0%, color-mix(in oklch, var(--color-primary) 22%, transparent), transparent 60%), radial-gradient(90% 90% at 80% 100%, color-mix(in oklch, var(--color-accent) 16%, transparent), transparent 55%)',
  };

  return (
    <div
      aria-hidden="true"
      className={['pointer-events-none absolute inset-0 -z-10 overflow-hidden', className]
        .filter(Boolean)
        .join(' ')}
    >
      {mode === 'webgl' ? (
        <canvas ref={canvasRef} className="h-full w-full" />
      ) : (
        // Keep the canvas ref mountable so the effect can still probe WebGL on the
        // first client pass; the visible layer is the static gradient until 'webgl' wins.
        <>
          <canvas ref={canvasRef} className="absolute h-0 w-0 opacity-0" aria-hidden="true" />
          <div className="h-full w-full" style={staticStyle} />
        </>
      )}
    </div>
  );
}
