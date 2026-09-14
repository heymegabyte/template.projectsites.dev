// verify-hero-shader.mjs — SOURCE-level GLSL gate for the WebGL hero backdrop.
//
// WHY: the deployed-artifact probe (projectsites e2e/site-quality/verify-hero-backdrop.mjs)
// only proves a <canvas> MOUNTS — a shader with a GLSL typo still mounts a canvas and renders
// BLACK. Every new per-industry scene (aurora…monolith) adds a `uMode` branch to FRAG_SRC; a
// compile error or an all-black branch would ship a dead hero on every site of that vertical,
// invisible to the mount check. This gate extracts the REAL FRAG_SRC/VERT_SRC from
// WebGLHeroBackdrop.tsx, compiles+links them in a real WebGL context (headless Chromium
// swiftshader), then renders EVERY uMode (0..MAX) and asserts each draws a non-black pixel.
//
// Usage:  node scripts/verify-hero-shader.mjs        (needs playwright on NODE_PATH)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = readFileSync(join(__dirname, '../src/components/sections/WebGLHeroBackdrop.tsx'), 'utf8');

const frag = SRC.match(/const FRAG_SRC = `([\s\S]*?)`;/)?.[1];
const vert = SRC.match(/const VERT_SRC = `([\s\S]*?)`;/)?.[1];
if (!frag || !vert) {
  console.error('✗ could not extract FRAG_SRC / VERT_SRC from WebGLHeroBackdrop.tsx');
  process.exit(2);
}
// The highest uMode = number of variants - 1 (flowing modes share uMode 0). Derive the ceiling
// from the modeFlag chain so the gate auto-covers every scene added later (no hardcoded count).
const MAX_MODE = Math.max(
  0,
  ...[...SRC.matchAll(/\?\s*(\d+)\s*\n\s*:\s*variant ===/g)].map((m) => Number(m[1])),
  ...[...SRC.matchAll(/variant === '[a-z]+'\s*\n?\s*\?\s*(\d+)/g)].map((m) => Number(m[1])),
);

const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
try {
  const page = await browser.newPage();
  const result = await page.evaluate(
    ({ frag, vert, maxMode }) => {
      const cv = document.createElement('canvas');
      cv.width = 64;
      cv.height = 64;
      const gl = cv.getContext('webgl');
      if (!gl) return { ok: false, err: 'no webgl context' };
      const mk = (type, src) => {
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : { err: gl.getShaderInfoLog(s) };
      };
      const vs = mk(gl.VERTEX_SHADER, vert);
      if (vs.err !== undefined) return { ok: false, err: 'vertex: ' + vs.err };
      const fs = mk(gl.FRAGMENT_SHADER, frag);
      if (fs.err !== undefined) return { ok: false, err: 'fragment: ' + fs.err };
      const prog = gl.createProgram();
      gl.attachShader(prog, vs);
      gl.attachShader(prog, fs);
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return { ok: false, err: 'link: ' + gl.getProgramInfoLog(prog) };
      gl.useProgram(prog);
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const aPos = gl.getAttribLocation(prog, 'aPos');
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
      const u = (n) => gl.getUniformLocation(prog, n);
      gl.uniform2f(u('uRes'), 64, 64);
      gl.uniform1f(u('uHue'), 0.55);
      gl.uniform1f(u('uScale'), 3.0);
      gl.uniform1f(u('uSharp'), 0.7);
      gl.uniform1f(u('uSpread'), 0.08);
      gl.uniform1f(u('uIntensity'), 0.85);
      gl.uniform1f(u('uWarp'), 0.5);
      const black = [];
      for (let mode = 0; mode <= maxMode; mode++) {
        gl.uniform1f(u('uMode'), mode);
        gl.uniform1f(u('uTime'), 12.3); // fixed non-zero time so time-driven fields are mid-animation
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        const px = new Uint8Array(64 * 64 * 4);
        gl.readPixels(0, 0, 64, 64, gl.RGBA, gl.UNSIGNED_BYTE, px);
        let lit = 0;
        for (let i = 0; i < px.length; i += 4) {
          if (px[i] > 6 || px[i + 1] > 6 || px[i + 2] > 6) lit++;
        }
        if (lit < 8) black.push({ mode, litPixels: lit }); // essentially all-black = dead branch
      }
      return { ok: true, black, maxMode };
    },
    { frag, vert, maxMode: MAX_MODE },
  );

  console.log(`\n━━ hero-shader GLSL gate (swiftshader, uMode 0..${MAX_MODE}) ━━`);
  if (!result.ok) {
    console.error(`  ✗ COMPILE/LINK FAIL — ${result.err}`);
    process.exit(1);
  }
  if (result.black.length) {
    for (const b of result.black) console.error(`  ❌ uMode=${b.mode} rendered BLACK (${b.litPixels} lit px)`);
    console.error(`\n✗ FAIL — ${result.black.length} scene(s) render black (dead/broken branch).`);
    process.exit(1);
  }
  console.log(`  ✅ compiles + links; all ${MAX_MODE + 1} uMode scenes render a non-black field.`);
} finally {
  await browser.close();
}
