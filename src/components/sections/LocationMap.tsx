import { useEffect, useState } from 'react';
import { MapPin, Navigation, Clock, Phone, Mail } from 'lucide-react';
import { brand } from '@/brand';
import { cn } from '@/lib/utils';
import { hoursToWeek, describeToday, formatTime12 } from '@/lib/businessSchema';
import { cityFromAddress } from '@/lib/placeholders';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * LocationMap — a "where to find us" band: a real, keyless embedded map of the business
 * address + a service-area statement + hours + a Get-Directions CTA. The served-site CSP
 * is `default-src *`, so the keyless Google Maps embed (`?q=<address>&output=embed`,
 * address-driven, NO API key) is allowed with no worker change.
 *
 * @remarks
 * Graceful + self-healing: the map is an ENHANCEMENT — the address, service-area line,
 * hours, and directions CTA render regardless, so the section stays useful even if the
 * embed is slow, blocked, or the visitor has data-saver on. Self-hides entirely when
 * there's no real address (bare template, or an online-only business), mirroring the
 * placeholder-scrub pattern used across the template. Emits no JSON-LD — the homepage
 * `HomeContact` NAP already carries the LocalBusiness microdata, so this band is purely
 * the visual/wayfinding surface and never double-claims the business.
 */
interface Props {
  /** Overrides for Storybook/testing — default to the real `brand.business` values. */
  name?: string;
  address?: string;
  hours?: string;
  phone?: string;
  email?: string;
}

export function LocationMap(props: Props = {}) {
  const b = brand.business;
  const name = props.name ?? b.name;
  const address = props.address ?? b.address;
  const hours = props.hours ?? b.hours;
  const phone = props.phone ?? b.phone;
  const email = props.email ?? b.email;
  const hasAddress = Boolean(address && !address.startsWith('{') && address.trim().length >= 6);
  if (!hasAddress) return null;
  const hasPhone = Boolean(phone && !phone.startsWith('{') && phone.replace(/[^\d]/g, '').length >= 7);
  const telHref = hasPhone ? `tel:${phone.replace(/[^\d+]/g, '')}` : '';
  const hasEmail = Boolean(email && !email.startsWith('{') && email.includes('@'));
  const mailtoHref = hasEmail ? `mailto:${email.trim()}` : '';

  const q = encodeURIComponent(address);
  const mapSrc = `https://maps.google.com/maps?q=${q}&z=14&output=embed`;
  const dirHref = `https://www.google.com/maps/dir/?api=1&destination=${q}`;

  // City for the service-area line, robust to BOTH a compact Places address
  // ("4500 Federal Blvd, Denver, CO 80211" → "Denver") AND the verbose OSM
  // display_name the AL-729 fallback returns (whose [length-2] is the ZIP — the old
  // `parts[length-2]` shipped "Proudly serving 94109"). Same cityFromAddress the H1 +
  // meta use (AL-736). Falls back to a warm generic line when unparseable.
  const city = cityFromAddress(address);
  const areaLine = city
    ? `Proudly serving ${city} and the surrounding area — come see us.`
    : 'Come see us — we would love to welcome you in person.';
  const hasHours = Boolean(hours && !hours.startsWith('{') && hours.trim());
  const week = hoursToWeek(hours);

  // Live "Open now" + today-highlight are CLIENT-only (visitor's local clock) so the
  // prerendered shell never bakes in a stale day/time or triggers a hydration mismatch:
  // the grid renders on the server, the chip + today row light up after mount and
  // refresh every minute.
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);
  const todayName = now ? DAY_NAMES[now.getDay()] : null;
  const today = now ? describeToday(hours, todayName as string, now.getHours() * 60 + now.getMinutes()) : null;

  return (
    <section
      id="location"
      className="relative overflow-hidden border-t border-border py-24 md:py-32"
      aria-labelledby="location-heading"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-60"
        style={{
          background:
            'radial-gradient(55% 50% at 50% 0%, color-mix(in oklch, var(--color-accent) 10%, transparent), transparent 70%)',
        }}
      />
      <div className="max-w-container-wide mx-auto px-6">
        <div className="reveal-on-view mb-14 text-center">
          <span className="font-mono text-sm uppercase tracking-widest text-accent">Visit us</span>
          <h2
            id="location-heading"
            className="mt-4 text-balance font-heading text-3xl font-bold tracking-[-0.02em] text-text md:text-5xl"
          >
            Where to find us
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-lg text-text-muted">{areaLine}</p>
        </div>

        <div className="grid items-stretch gap-8 lg:grid-cols-[1.5fr_1fr]">
          {/* Real, keyless, address-driven map (enhancement — never gates the info). */}
          <div className="lm-map card-tactile reveal-on-view overflow-hidden rounded-2xl">
            <iframe
              title={`Map showing the location of ${name}`}
              src={mapSrc}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-full min-h-[340px] w-full border-0"
            />
          </div>

          {/* Address + hours + directions — renders regardless of the embed. */}
          <div className="card-tactile reveal-on-view flex flex-col justify-center p-8">
            <span className="lm-pin mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent ring-1 ring-accent/20">
              <MapPin size={26} strokeWidth={1.75} aria-hidden />
            </span>
            <h3 className="font-heading text-xl font-bold text-text">{name}</h3>
            <p className="mt-2 leading-relaxed text-text-muted">{address}</p>
            {hasHours && week.length > 0 ? (
              <div className="oh mt-5">
                <div className="mb-3 flex items-center gap-2">
                  <Clock size={16} className="shrink-0 text-accent" aria-hidden />
                  {now && today && (
                    <span
                      className={cn('oh-status', today.open ? 'oh-open' : 'oh-closed')}
                      role="status"
                      aria-live="polite"
                    >
                      <span className="oh-dot" aria-hidden />
                      {today.label}
                    </span>
                  )}
                </div>
                <table className="oh-table w-full text-sm">
                  <caption className="sr-only">Weekly opening hours for {name}</caption>
                  <tbody>
                    {week.map((d) => (
                      <tr key={d.day} className={cn('oh-row', d.day === todayName && 'oh-today')}>
                        <th scope="row" className="oh-day py-1 pr-4 text-left font-medium">
                          {d.day.slice(0, 3)}
                          {d.day === todayName && <span className="sr-only"> (today)</span>}
                        </th>
                        <td className="oh-time py-1 text-right tabular-nums">
                          {d.closed ? 'Closed' : `${formatTime12(d.opens as string)} – ${formatTime12(d.closes as string)}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : hasHours ? (
              <p className="mt-4 flex items-start gap-2 text-sm text-text-muted">
                <Clock size={16} className="mt-0.5 shrink-0 text-accent" aria-hidden />
                <span>{hours}</span>
              </p>
            ) : null}
            {/* Matched pill CTA row — Call (accent-tinted, primary) + Get directions
                (outline). Both ≥44px tap targets (WCAG 2.5.8); flex-wrap so they stack
                on a narrow card. Call self-hides when no phone. */}
            <div className="mt-6 flex flex-wrap gap-3">
              {hasPhone && (
                <a
                  href={telHref}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-accent/50 bg-accent/10 px-6 py-3 font-medium text-accent transition hover:bg-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                  aria-label={`Call ${name} at ${phone}`}
                >
                  <Phone size={18} aria-hidden />
                  Call {phone}
                </a>
              )}
              {hasEmail && (
                <a
                  href={mailtoHref}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-accent/50 px-6 py-3 font-medium text-accent transition hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                  aria-label={`Email ${name}`}
                >
                  <Mail size={18} aria-hidden />
                  Email
                </a>
              )}
              <a
                href={dirHref}
                target="_blank"
                rel="noopener noreferrer"
                className="lm-dir inline-flex min-h-[44px] items-center gap-2 rounded-full border border-accent/50 px-6 py-3 font-medium text-accent transition hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                aria-label={`Get directions to ${name}`}
              >
                <Navigation size={18} aria-hidden />
                Get directions
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default LocationMap;
