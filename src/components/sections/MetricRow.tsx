import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { AnimatedNumber } from '@/components/AnimatedNumber';
import { cn } from '@/lib/utils';
import { scrubText } from '@/lib/placeholders';

export interface Metric {
  /** The big number. */
  value: number;
  /** Unit / suffix ("%", "ms", "x"). */
  suffix?: string;
  /** Caption below the value. */
  label: string;
  /** Optional sub-caption. */
  caption?: string;
  /** Delta with direction: positive = good, negative = bad, neutral = flat. */
  delta?: { value: string; direction: 'up' | 'down' | 'flat'; goodIs?: 'up' | 'down' };
}

interface Props {
  metrics: Metric[];
  eyebrow?: string;
  headline?: string;
  className?: string;
}

/**
 * Metric row (idea #66) — 4 metric cards with directional delta indicators.
 * Use when you want to show "before vs after" or quarter-over-quarter movement
 * in addition to a single number.
 *
 * Color rule: if `goodIs: 'up'` (default), positive direction = success green.
 * If `goodIs: 'down'` (e.g. error rate, latency), positive direction = danger.
 */
export function MetricRow({ metrics, eyebrow, headline, className }: Props) {
  // Placeholder firewall (mirrors LogoCloud/Timeline): a leaked `{METRIC_N_*}`
  // token never renders. Scrub every text prop; drop metric cards whose label
  // scrubs empty (an unfilled slot); hide the whole row when nothing real remains.
  const safeEyebrow = scrubText(eyebrow);
  const safeHeadline = scrubText(headline);
  const safeMetrics = metrics
    .map((m) => {
      const deltaValue = m.delta ? scrubText(m.delta.value) : '';
      return {
        ...m,
        label: scrubText(m.label),
        suffix: scrubText(m.suffix) || undefined,
        caption: scrubText(m.caption) || undefined,
        delta: m.delta && deltaValue ? { ...m.delta, value: deltaValue } : undefined,
      };
    })
    .filter((m) => m.label.length > 0);
  if (safeMetrics.length === 0) return null;
  return (
    <section className={cn('py-16 md:py-24 max-w-container-wide mx-auto px-6', className)}>
      {(safeEyebrow || safeHeadline) && (
        <div className="text-center mb-12 reveal-on-view">
          {safeEyebrow && (
            <p className="text-accent text-sm font-mono tracking-widest uppercase">{safeEyebrow}</p>
          )}
          {safeHeadline && (
            <h2 className="mt-4 text-3xl md:text-4xl font-bold font-heading text-text">{safeHeadline}</h2>
          )}
        </div>
      )}
      <dl className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {safeMetrics.map((m, i) => {
          const direction = m.delta?.direction ?? 'flat';
          const goodIs = m.delta?.goodIs ?? 'up';
          const isGood =
            (direction === 'up' && goodIs === 'up') ||
            (direction === 'down' && goodIs === 'down');
          const isBad =
            (direction === 'down' && goodIs === 'up') ||
            (direction === 'up' && goodIs === 'down');
          const Icon = direction === 'up' ? TrendingUp : direction === 'down' ? TrendingDown : Minus;
          const deltaColor = isGood ? 'text-success' : isBad ? 'text-danger' : 'text-text-subtle';

          return (
            <div
              key={`${m.label}-${i}`}
              className="card-tactile p-6 reveal-on-view"
            >
              <dt className="sr-only">{m.label}</dt>
              <dd>
                <span
                  className="font-heading text-4xl md:text-5xl font-extrabold tracking-tight gradient-text block"
                  aria-label={`${m.value}${m.suffix ?? ''}`}
                >
                  <AnimatedNumber value={m.value} suffix={m.suffix} />
                </span>
                <span className="mt-2 text-text font-medium block">{m.label}</span>
                {m.caption && (
                  <span className="mt-1 text-xs text-text-subtle block">{m.caption}</span>
                )}
                {m.delta && (
                  <span className={cn('mt-3 inline-flex items-center gap-1 text-xs font-mono', deltaColor)}>
                    <Icon size={14} aria-hidden="true" />
                    {m.delta.value}
                  </span>
                )}
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}

export default MetricRow;
