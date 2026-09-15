import { useEffect, useState } from 'react';
import { brand } from '@/brand';
import { JsonLd } from '@/components/JsonLd';
import { scrubText } from '@/lib/placeholders';
import { cn } from '@/lib/utils';

export interface HoursRow {
  /** Day name — "Monday", "Mon", etc. (case-insensitive). */
  day: string;
  /** Opening time, e.g. "09:00" or "9:00 AM". Omit + set closed for a dark day. */
  opens?: string;
  closes?: string;
  closed?: boolean;
}

interface Props {
  rows: HoursRow[];
  eyebrow?: string;
  headline?: string;
  description?: string;
  className?: string;
}

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
const DAY_LABEL: Record<string, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};
/** JS Date.getDay() (0=Sun) → canonical key. */
const JS_DAY = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function canonDay(day: string): string | null {
  const d = day.trim().toLowerCase();
  if (d.length < 3) return null; // '' or 1–2 chars — never match (startsWith('') is always true)
  const key = d.slice(0, 3);
  const hit = DAY_ORDER.find((full) => full.startsWith(key));
  return hit ?? null;
}

/** Parse "9:00 AM" / "17:30" / "9" → minutes since midnight, or null. */
function parseMinutes(t?: string): number | null {
  if (!t) return null;
  const m = t.trim().toLowerCase().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2] ?? '0');
  const ap = m[3];
  if (h > 23 || min > 59) return null;
  if (ap === 'pm' && h < 12) h += 12;
  if (ap === 'am' && h === 12) h = 0;
  return h * 60 + min;
}

const toHHMM = (mins: number): string =>
  `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;

/**
 * Opening-hours table for any local business, with a live "Open now / Closed"
 * badge computed client-side from the visitor's local time (SSR-neutral: the
 * badge only appears after mount, so there is no hydration flash). Rows are
 * normalized + ordered Mon→Sun, unparseable/empty rows dropped, and the section
 * returns `null` when no real day survives. Emits a `LocalBusiness`
 * `openingHoursSpecification` JSON-LD block so search engines show hours + the
 * open-now signal in rich results. Use for every storefront / local vertical.
 */
export function OpeningHours({ rows, eyebrow = 'Hours', headline, description, className }: Props) {
  const safeEyebrow = scrubText(eyebrow, 'Hours');
  const safeHeadline = scrubText(headline);
  const safeDescription = scrubText(description);

  const parsed = (rows ?? [])
    .map((r) => {
      const key = canonDay(scrubText(r.day));
      if (!key) return null;
      const closed = r.closed === true;
      const opens = closed ? null : parseMinutes(scrubText(r.opens));
      const closes = closed ? null : parseMinutes(scrubText(r.closes));
      return { key, closed, opens, closes };
    })
    .filter((r): r is { key: string; closed: boolean; opens: number | null; closes: number | null } => r !== null);

  // Dedupe by day (last wins), then order Mon→Sun.
  const byDay = new Map(parsed.map((r) => [r.key, r]));
  const ordered = DAY_ORDER.map((k) => byDay.get(k)).filter(Boolean) as NonNullable<
    ReturnType<typeof byDay.get>
  >[];

  const [openNow, setOpenNow] = useState<null | { open: boolean }>(null);
  useEffect(() => {
    const now = new Date();
    const todayKey = JS_DAY[now.getDay()];
    const mins = now.getHours() * 60 + now.getMinutes();
    const today = byDay.get(todayKey);
    if (!today || today.closed || today.opens == null || today.closes == null) {
      setOpenNow({ open: false });
      return;
    }
    const open =
      today.closes > today.opens
        ? mins >= today.opens && mins < today.closes
        : mins >= today.opens || mins < today.closes; // wraps past midnight
    setOpenNow({ open });
    // byDay is derived from rows each render; depend on the stable rows length + JSON.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  if (ordered.length === 0) return null;
  // Day names are literals ("Monday"…), so canonDay always matches — the real
  // gate is whether ANY day has parseable open+close times. Unfilled time tokens
  // → every row null → hide the section (never ship 7 lying "Closed" rows).
  const hasRealHours = ordered.some((r) => !r.closed && r.opens != null && r.closes != null);
  if (!hasRealHours) return null;

  const spec = ordered
    .filter((r) => !r.closed && r.opens != null && r.closes != null)
    .map((r) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: `https://schema.org/${DAY_LABEL[r.key]}`,
      opens: toHHMM(r.opens as number),
      closes: toHHMM(r.closes as number),
    }));

  const hoursLd =
    spec.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'LocalBusiness',
          '@id': `${brand.business.url || ''}#hours`,
          name: brand.business.name,
          ...(brand.business.url ? { url: brand.business.url } : {}),
          openingHoursSpecification: spec,
        }
      : null;

  return (
    <section className={cn('py-24 md:py-32 max-w-container-normal mx-auto px-6', className)}>
      {hoursLd && <JsonLd data={hoursLd} />}
      <div className="text-center mb-12 reveal-on-view">
        <span className="text-accent text-sm font-mono tracking-widest uppercase">{safeEyebrow}</span>
        {safeHeadline && (
          <h2 className="text-3xl md:text-5xl font-bold font-heading mt-4 mb-4 text-text">{safeHeadline}</h2>
        )}
        {safeDescription && <p className="text-text-muted max-w-2xl mx-auto text-lg">{safeDescription}</p>}
        {openNow && (
          <span
            data-testid="open-now-badge"
            className={cn(
              'mt-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 font-mono text-xs uppercase tracking-widest',
              openNow.open ? 'bg-accent/15 text-accent' : 'bg-text-muted/10 text-text-muted',
            )}
          >
            <span
              aria-hidden="true"
              className={cn('h-2 w-2 rounded-full', openNow.open ? 'bg-accent' : 'bg-text-muted')}
            />
            {openNow.open ? 'Open now' : 'Closed now'}
          </span>
        )}
      </div>

      <ul className="mx-auto max-w-md card-tactile divide-y divide-border p-2 reveal-on-view">
        {ordered.map((r) => (
          <li key={r.key} className="flex min-h-[44px] items-center justify-between px-4 py-3">
            <span className="font-heading font-semibold text-text">{DAY_LABEL[r.key]}</span>
            <span className="font-mono text-sm text-text-muted">
              {r.closed || r.opens == null || r.closes == null
                ? 'Closed'
                : `${toHHMM(r.opens)} – ${toHHMM(r.closes)}`}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default OpeningHours;
