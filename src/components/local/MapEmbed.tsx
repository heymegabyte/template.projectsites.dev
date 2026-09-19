import { MapPin, Clock, Phone as PhoneIcon } from 'lucide-react';
import { telHref } from '@/lib/phone';

interface HoursEntry {
  day: string;
  hours: string;
}

interface MapEmbedProps {
  lat: number;
  lng: number;
  address: string;
  directionsUrl: string;
  phone?: string;
  hours?: HoursEntry[];
  mapsApiKey?: string;
}

/**
 * `MapEmbed` — the location section: a framed Google Maps embed beside address / phone / today-aware
 * hours. Cinematic + theme-token: the map frame carries an accent hairline and warms to an accent
 * border on hover, the columns reveal on scroll, the address/phone rows nudge their icon on hover,
 * and today's hours glow with a live pulse dot. Fixes a latent bug — the section background used a
 * non-existent `--color-bg-secondary` token falling back to hardcoded `#0a0a1a` (a dark band on
 * light verticals); now `bg-surface`, theme-aware.
 */
export default function MapEmbed({ lat, lng, address, directionsUrl, phone, hours, mapsApiKey }: MapEmbedProps) {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const mapSrc = mapsApiKey
    ? `https://www.google.com/maps/embed/v1/place?key=${mapsApiKey}&q=${lat},${lng}&maptype=roadmap`
    : `https://www.google.com/maps?q=${lat},${lng}&output=embed`;
  // Phone row only for a dialable phone — never a dead `tel:{token}`/`tel:` in the location section.
  const callHref = telHref(phone);

  const track = (event: string, props?: Record<string, unknown>) => {
    window.gtag?.('event', event, props);
    window.posthog?.capture(event, props);
  };

  return (
    <section className="map-embed py-20 bg-surface">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-5 gap-8 reveal-on-view">
          {/* Map */}
          <div className="map-frame lg:col-span-3 relative rounded-xl overflow-hidden border border-border transition-colors duration-300 hover:border-accent/40">
            <div className="map-frame-rule" aria-hidden="true" />
            <iframe
              src={mapSrc}
              width="100%"
              height="400"
              style={{ border: 0, display: 'block' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Business location"
            />
          </div>

          {/* Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Address */}
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-3 text-text-muted hover:text-accent transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
              onClick={() => track('direction_click')}
            >
              <MapPin
                size={20}
                className="text-accent mt-0.5 shrink-0 transition-transform duration-200 group-hover:-translate-y-0.5 motion-reduce:transition-none"
              />
              <div>
                <p className="font-semibold text-text group-hover:text-accent transition-colors">Get Directions</p>
                <p className="text-sm">{address}</p>
              </div>
            </a>

            {/* Phone */}
            {callHref && (
              <a
                href={callHref}
                className="group flex items-center gap-3 text-text-muted hover:text-accent transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                onClick={() => track('phone_click', { phone })}
              >
                <PhoneIcon
                  size={20}
                  className="text-accent shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none"
                />
                <span className="font-semibold text-text group-hover:text-accent transition-colors">{phone}</span>
              </a>
            )}

            {/* Hours */}
            {hours && hours.length > 0 && (
              <div className="flex items-start gap-3">
                <Clock size={20} className="text-accent mt-0.5 shrink-0" />
                <div className="space-y-1 text-sm w-full">
                  {hours.map(({ day, hours: h }) => {
                    const isToday = day === today;
                    return (
                      <div
                        key={day}
                        className={`flex justify-between gap-6 ${isToday ? 'text-accent font-semibold' : 'text-text-muted'}`}
                      >
                        <span className="inline-flex items-center gap-2">
                          {isToday && <span className="map-today-dot" aria-hidden="true" />}
                          {day}
                        </span>
                        <span>{h}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
