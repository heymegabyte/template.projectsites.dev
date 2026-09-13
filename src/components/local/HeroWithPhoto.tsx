import { Phone, MapPin, Star, ChevronDown } from 'lucide-react';

interface HeroWithPhotoProps {
  businessName: string;
  tagline: string;
  heroImage: string;
  phone?: string;
  directionsUrl?: string;
  rating?: number;
  reviewCount?: number;
}

/**
 * `HeroWithPhoto` — a full-bleed photo hero. Cinematic: the image slowly Ken-Burns-drifts
 * behind a theme-aware gradient (dark at the top for legible white text, fading to the page
 * background at the bottom for a seamless seam on light AND dark verticals), the badge / kinetic
 * clamp() headline / tagline / CTAs cascade in on load, and an animated chevron cues the scroll.
 * The white copy is correct here — it sits on the guaranteed-dark photo overlay, not the theme
 * canvas. All motion is `prefers-reduced-motion` gated.
 */
export default function HeroWithPhoto({
  businessName,
  tagline,
  heroImage,
  phone,
  directionsUrl,
  rating,
  reviewCount,
}: HeroWithPhotoProps) {
  return (
    <section className="hero-photo relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background image — Ken-Burns drift */}
      <img
        src={heroImage}
        alt={`${businessName} storefront`}
        className="hero-photo-img absolute inset-0 w-full h-full object-cover"
        fetchPriority="high"
      />
      {/* Overlay: dark at top (legible text) → page background at bottom (seamless seam) */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/45 to-[var(--color-background)]" />
      {/* soft accent glow for depth */}
      <div className="hero-photo-glow" aria-hidden="true" />
      {/* cinematic film grain (above photo/gradient, below the z-10 copy) — matches the
          luxe/noir/artisan/heritage theme dossiers' "film grain" art direction */}
      <div className="hero-photo-grain" aria-hidden="true" />

      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        {/* Rating badge */}
        {rating && reviewCount && (
          <div
            className="hero-photo-in inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 mb-8"
            style={{ ['--hero-i' as string]: 0 } as React.CSSProperties}
          >
            <Star size={16} className="text-yellow-400 fill-yellow-400" />
            <span className="text-white font-semibold text-sm">
              {rating}/5 from {reviewCount} reviews
            </span>
          </div>
        )}

        <h1
          className="hero-photo-in font-heading font-bold text-white mb-6 tracking-tight text-balance text-[clamp(2.5rem,6vw,4.75rem)] leading-[1.05]"
          style={{ ['--hero-i' as string]: 1 } as React.CSSProperties}
        >
          {businessName}
        </h1>
        <p
          className="hero-photo-in text-lg md:text-xl text-white/85 mb-10 max-w-2xl mx-auto text-pretty"
          style={{ ['--hero-i' as string]: 2 } as React.CSSProperties}
        >
          {tagline}
        </p>

        {/* CTAs */}
        <div
          className="hero-photo-in flex flex-col sm:flex-row gap-4 justify-center"
          style={{ ['--hero-i' as string]: 3 } as React.CSSProperties}
        >
          {phone && (
            <a
              href={`tel:${phone}`}
              className="group inline-flex items-center justify-center gap-2 bg-[var(--color-accent)] text-[var(--color-on-accent)] font-bold px-8 py-4 rounded-lg text-lg transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[var(--color-accent)]/30 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              onClick={() => {
                if (typeof gtag !== 'undefined') gtag('event', 'phone_click', { phone });
                if (typeof posthog !== 'undefined') posthog.capture('phone_click', { phone });
              }}
            >
              <Phone size={20} strokeWidth={2.5} className="transition-transform group-hover:rotate-12 motion-reduce:transition-none" />
              Call Now
            </a>
          )}
          {directionsUrl && (
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 border-2 border-white/40 text-white font-bold px-8 py-4 rounded-lg text-lg transition-all hover:border-white hover:bg-white/10 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 motion-reduce:transition-none"
              onClick={() => {
                if (typeof gtag !== 'undefined') gtag('event', 'direction_click');
                if (typeof posthog !== 'undefined') posthog.capture('direction_click');
              }}
            >
              <MapPin size={20} />
              Get Directions
            </a>
          )}
        </div>
      </div>

      {/* Scroll cue */}
      <div className="hero-photo-scroll absolute bottom-6 left-1/2 -translate-x-1/2 z-10 text-white/60" aria-hidden="true">
        <ChevronDown size={26} />
      </div>
    </section>
  );
}
