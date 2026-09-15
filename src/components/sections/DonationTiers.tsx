import { brand } from '@/brand';
import { JsonLd } from '@/components/JsonLd';
import { scrubText } from '@/lib/placeholders';
import { cn } from '@/lib/utils';

export interface DonationTier {
  /** Display amount, e.g. "$25". */
  amount: string;
  /** Optional short label, e.g. "Supporter". */
  label?: string;
  /** Impact line, e.g. "$25 = 12 meals served". Cite quantitative claims. */
  impact?: string;
}

interface Props {
  tiers?: DonationTier[];
  /** Stripe / Square donation link. Falls back to the brand phone. */
  donateUrl?: string;
  eyebrow?: string;
  headline?: string;
  description?: string;
  className?: string;
}

const DEFAULT_TIERS: DonationTier[] = [
  { amount: '$25' },
  { amount: '$50' },
  { amount: '$100' },
  { amount: '$250' },
];

/** Append the suggested amount to a payment link when it can carry one. */
function donateHref(base: string, amount: string): string {
  const num = amount.replace(/[^\d.]/g, '');
  if (!base || !num) return base;
  try {
    const u = new URL(base);
    // Square / Stripe payment links both accept an `amount` query hint.
    if (!u.searchParams.has('amount')) u.searchParams.set('amount', num);
    return u.toString();
  } catch {
    return base;
  }
}

/**
 * Suggested-amount donation tiers for nonprofits — amount cards with optional
 * impact copy ("$25 = 12 meals served") and a tracked donate CTA per tier that
 * deep-links to a Stripe/Square payment link (falls back to a click-to-call
 * `tel:` when no link is set). Falls back to standard amounts when the tier data
 * is unresolved, and returns `null` only when there is no donate link AND no
 * phone. Emits `NGO` + `DonateAction` JSON-LD so the giving action is machine-
 * readable. Use for any nonprofit / charity vertical.
 */
export function DonationTiers({ tiers, donateUrl, eyebrow = 'Support us', headline, description, className }: Props) {
  const safeEyebrow = scrubText(eyebrow, 'Support us');
  const safeHeadline = scrubText(headline);
  const safeDescription = scrubText(description);
  // Gate STRICTLY on a real donate link — never render just because a phone
  // exists, or every site with a NAP would show a "Support us" section. The
  // domain-builder supplies a Stripe/Square link, or a `mailto:`/`tel:` as the
  // donateUrl for nonprofits whose billing isn't wired yet.
  const safeDonate = scrubText(donateUrl);
  if (!safeDonate) return null;
  const base = safeDonate;

  const cleaned = (tiers ?? [])
    .map((t) => ({
      amount: scrubText(t.amount),
      label: scrubText(t.label),
      impact: scrubText(t.impact),
    }))
    .filter((t) => t.amount.length > 0);
  const finalTiers = cleaned.length > 0 ? cleaned : DEFAULT_TIERS;

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'NGO',
    name: brand.business.name,
    ...(brand.business.url ? { url: brand.business.url } : {}),
    ...(safeDonate
      ? { potentialAction: { '@type': 'DonateAction', target: safeDonate, name: `Donate to ${brand.business.name}` } }
      : {}),
  };

  return (
    <section className={cn('py-24 md:py-32 max-w-container-wide mx-auto px-6', className)}>
      <JsonLd data={ld} />
      <div className="text-center mb-14 reveal-on-view">
        <span className="text-accent text-sm font-mono tracking-widest uppercase">{safeEyebrow}</span>
        {safeHeadline && (
          <h2 className="text-3xl md:text-5xl font-bold font-heading mt-4 mb-4 text-text">{safeHeadline}</h2>
        )}
        {safeDescription && <p className="text-text-muted max-w-2xl mx-auto text-lg">{safeDescription}</p>}
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {finalTiers.map((t, i) => (
          <a
            key={`${t.amount}-${i}`}
            href={donateHref(base, t.amount)}
            data-bcl="donate"
            data-amount={t.amount}
            className="group card-tactile flex flex-col p-6 text-center transition-transform hover:-translate-y-1 reveal-on-view"
          >
            {t.label && <span className="text-xs font-mono uppercase tracking-widest text-text-muted">{t.label}</span>}
            <span className="mt-1 font-heading text-4xl font-extrabold text-text group-hover:text-accent transition-colors">
              {t.amount}
            </span>
            {t.impact && <span className="mt-3 text-sm text-text-muted leading-relaxed">{t.impact}</span>}
            <span className="mt-auto pt-5 font-mono text-xs uppercase tracking-widest text-accent">Donate →</span>
          </a>
        ))}
      </div>

      <div className="mt-10 text-center reveal-on-view">
        <a
          href={base}
          data-bcl="donate"
          data-amount="custom"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-accent px-8 py-3 font-mono text-sm font-semibold uppercase tracking-widest text-[var(--color-on-accent)] transition-transform hover:-translate-y-0.5"
        >
          Give a custom amount
        </a>
      </div>
    </section>
  );
}

export default DonationTiers;
