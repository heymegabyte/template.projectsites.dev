import type { Config } from 'tailwindcss';

/**
 * Tailwind v3 config that reads from CSS custom properties set by
 * `applyBrand()` in `src/brand.ts` (which itself reads `_brand.json`).
 *
 * To rebrand: edit `_brand.json`. Do NOT edit color values here.
 */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    container: { center: true, padding: '1.5rem', screens: { '2xl': '1280px' } },
    extend: {
      colors: {
        primary:   { DEFAULT: 'var(--color-primary)',  hover: 'var(--color-primary-hover)' },
        accent:    { DEFAULT: 'var(--color-accent)',   hover: 'var(--color-accent-hover)' },
        background:'var(--color-background)',
        surface:   { DEFAULT: 'var(--color-surface)',  elevated: 'var(--color-surface-elevated)' },
        border:    'var(--color-border)',
        text:      { DEFAULT: 'var(--color-text)', muted: 'var(--color-text-muted)', subtle: 'var(--color-text-subtle)' },
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        danger:  'var(--color-danger)',
        info:    'var(--color-info)',
        /* Legacy aliases — keep so existing components still compile. */
        foreground: 'var(--color-text)',
        muted:      { DEFAULT: 'var(--color-text-muted)', foreground: 'var(--color-text-subtle)' },
        card:       { DEFAULT: 'var(--color-surface)',    foreground: 'var(--color-text)' },
        ring:       'var(--color-accent)',
        input:      'var(--color-border)',
        dark:       'var(--color-background)',
        brand:      {
          primary:   'var(--color-primary)',
          secondary: 'var(--color-surface)',
          accent:    'var(--color-accent)',
        },
      },
      fontFamily: {
        heading: ['var(--font-heading)', 'system-ui', 'sans-serif'],
        body:    ['var(--font-body)',    'system-ui', 'sans-serif'],
        mono:    ['var(--font-mono)',    'ui-monospace', 'monospace'],
      },
      fontSize: {
        'fluid-xl':  'var(--text-xl)',
        'fluid-2xl': 'var(--text-2xl)',
        'fluid-3xl': 'var(--text-3xl)',
        'fluid-4xl': 'var(--text-4xl)',
        'fluid-5xl': 'var(--text-5xl)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
      },
      boxShadow: {
        sm:   'var(--shadow-sm)',
        md:   'var(--shadow-md)',
        lg:   'var(--shadow-lg)',
        glow: 'var(--shadow-glow)',
      },
      transitionTimingFunction: { brand: 'var(--ease)' },
      transitionDuration: {
        fast: 'var(--duration-fast)',
        base: 'var(--duration-base)',
        slow: 'var(--duration-slow)',
      },
      maxWidth: {
        'container-wide':   'var(--container-wide)',
        'container-normal': 'var(--container-normal)',
        'container-prose':  'var(--container-prose)',
      },
      keyframes: {
        // Reveal keyframes FLOOR `0%` opacity at 0.9 (not 0): the visible motion is the
        // transform (translate/scale), and a 0→1 opacity fade composites reveal TEXT below WCAG
        // AA mid-flight (axe scans it as a "serious" color-contrast fail that settles AA-safe in
        // <1s). Starting at 0.9 keeps text legible the whole reveal for default-motion visitors
        // while the entrance motion reads identically. Mirrors the AL-440 fix for the index.css
        // reveal keyframes (rise-in etc.); this closes the tailwind-config siblings AnimatedSection
        // uses (AL-769 — surfaced by the generated-site visitor journey on /contact).
        fadeInUp:     { '0%': { opacity: '0.9', transform: 'translateY(24px)' },  '100%': { opacity: '1', transform: 'translateY(0)' } },
        fadeInDown:   { '0%': { opacity: '0.9', transform: 'translateY(-24px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideInLeft:  { '0%': { opacity: '0.9', transform: 'translateX(-40px)' },'100%': { opacity: '1', transform: 'translateX(0)' } },
        slideInRight: { '0%': { opacity: '0.9', transform: 'translateX(40px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
        scaleIn:      { '0%': { opacity: '0.9', transform: 'scale(0.9)' },        '100%': { opacity: '1', transform: 'scale(1)' } },
        subtleFloat:  { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        gradientShift:{ '0%': { backgroundPosition: '0% 50%' }, '50%': { backgroundPosition: '100% 50%' }, '100%': { backgroundPosition: '0% 50%' } },
        glowPulse:    { '0%, 100%': { boxShadow: '0 0 20px oklch(var(--brand-hue) 0.18 0.6 / 0.15)' }, '50%': { boxShadow: '0 0 40px oklch(var(--brand-hue) 0.18 0.6 / 0.30)' } },
        shimmer:      { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        // Same 0.9 reveal-opacity floor (AL-770 completes AL-769): these are text-capable via
        // AnimatedSection's open `animation` prop, so a 0→1 fade would composite reveal text below
        // AA mid-flight. The DRAMA is the transform (bounce-scale / rotate / blur), left untouched.
        bounceIn:     { '0%': { opacity: '0.9', transform: 'scale(0.3)' }, '50%': { transform: 'scale(1.05)' }, '70%': { transform: 'scale(0.95)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        rotateIn:     { '0%': { opacity: '0.9', transform: 'rotate(-10deg) scale(0.9)' }, '100%': { opacity: '1', transform: 'rotate(0) scale(1)' } },
        blurIn:       { '0%': { opacity: '0.9', filter: 'blur(12px)' }, '100%': { opacity: '1', filter: 'blur(0)' } },
      },
      animation: {
        fadeInUp:      'fadeInUp 0.7s var(--ease) forwards',
        fadeInDown:    'fadeInDown 0.7s var(--ease) forwards',
        slideInLeft:   'slideInLeft 0.7s var(--ease) forwards',
        slideInRight:  'slideInRight 0.7s var(--ease) forwards',
        scaleIn:       'scaleIn 0.5s var(--ease) forwards',
        subtleFloat:   'subtleFloat 6s ease-in-out infinite',
        gradientShift: 'gradientShift 8s ease infinite',
        glowPulse:     'glowPulse 3s ease-in-out infinite',
        shimmer:       'shimmer 2s linear infinite',
        bounceIn:      'bounceIn 0.8s var(--ease) forwards',
        rotateIn:      'rotateIn 0.6s var(--ease) forwards',
        blurIn:        'blurIn 0.6s var(--ease) forwards',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
