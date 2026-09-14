import type { ReactNode } from 'react';
import { BadgeCheck, ShieldCheck, Clock, Star, Phone, MapPin, Award, HeartHandshake } from 'lucide-react';
import { brand, featureOn } from '@/brand';

/**
 * Trust strip rendered directly beneath the hero — wordless credibility above the
 * fold, the single most-cited conversion lever for local-service and considered
 * purchases. Renders promise-grade signals every business can stand behind (free
 * quotes, experienced & reliable, fast response, satisfaction guaranteed) — NEVER an
 * unverifiable CREDENTIAL like a blanket "licensed & insured" (true for a plumber,
 * FABRICATED for the salon / agency / consultant that also quotes) or a review count.
 * A real trade passes "Licensed & insured" via `items`; a missing field is omitted.
 *
 * Theme tokens only, so it reads correctly on light (healthcare/wellness) and dark
 * (SaaS/agency) verticals alike.
 */
export interface TrustItem {
  icon: ReactNode;
  label: string;
}

interface Props {
  items?: TrustItem[];
}

/** Vertical-aware, fabrication-free defaults. Quote-using verticals lead with the
 *  estimate + reliability promises; everyone else gets generic credibility.
 *  NOTE: "Licensed & insured" is a trades-specific FACT (correct for a plumber,
 *  fabricated for a salon / agency / consultant that also quotes) — it is NOT a
 *  universal default; a genuine trade passes it via the `items` prop. */
function defaultItems(): TrustItem[] {
  const svc = featureOn('quote');
  const base: TrustItem[] = svc
    ? [
        { icon: <BadgeCheck size={16} />, label: 'Free, no-obligation quotes' },
        { icon: <ShieldCheck size={16} />, label: 'Experienced & reliable' },
        { icon: <Clock size={16} />, label: 'Fast, reliable response' },
        { icon: <HeartHandshake size={16} />, label: 'Satisfaction guaranteed' },
      ]
    : [
        { icon: <Star size={16} />, label: 'Trusted by our community' },
        { icon: <Award size={16} />, label: 'Experienced & professional' },
        { icon: <Clock size={16} />, label: 'Responsive support' },
        { icon: <HeartHandshake size={16} />, label: 'Client-first service' },
      ];
  // Fold in real contact facts when we actually have them.
  if (brand.business.phone) base.push({ icon: <Phone size={16} />, label: brand.business.phone });
  if (brand.business.address) {
    const city = brand.business.address.split(',').slice(-2, -1)[0]?.trim();
    if (city) base.push({ icon: <MapPin size={16} />, label: `Serving ${city} & nearby` });
  }
  return base;
}

export function TrustBar({ items }: Props) {
  const list = (items ?? defaultItems()).slice(0, 5);
  if (list.length === 0) return null;
  return (
    <section
      aria-label="Why choose us"
      className="grain relative border-y border-border bg-surface/60 backdrop-blur-sm"
    >
      {/* Faint accent wash for cinematic depth — OKLCH, motion-agnostic, purely decorative. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            'radial-gradient(60% 120% at 50% 0%, color-mix(in oklch, var(--color-accent) 10%, transparent) 0%, transparent 70%)',
        }}
      />
      <ul className="max-w-container-wide relative z-10 mx-auto flex flex-wrap items-center justify-center gap-x-8 gap-y-3 px-6 py-4">
        {list.map((it, i) => (
          <li
            key={it.label}
            className="trust-chip flex items-center gap-2 text-sm text-text-muted"
            style={{ ['--trust-i' as string]: i }}
          >
            <span
              className="trust-chip__icon inline-flex h-7 w-7 items-center justify-center rounded-full text-accent ring-1 ring-accent/25"
              aria-hidden="true"
            >
              {it.icon}
            </span>
            <span className="font-medium">{it.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default TrustBar;
