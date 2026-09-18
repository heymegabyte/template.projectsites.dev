import { cdnImageProps } from '@/lib/cdn-image';

interface Service {
  name: string;
  description: string;
  image?: string;
  price?: string;
  bookingUrl?: string;
}

interface ServiceCardsProps {
  services: Service[];
  heading?: string;
}

/**
 * `ServiceCards` — a responsive grid of service tiles (image + name + optional
 * price + "Book Now"). Theme-token + cinematic: `card-tactile` glass frames that
 * lift to an accent border on hover, the image Ken-Burns-zooms, and the whole
 * grid reveals on scroll. Legible on BOTH light and dark verticals — the old
 * hardcoded `text-white`/`bg-white/5`/`border-white/10` made the copy invisible
 * on light themes (fixed to `text-text` / `card-tactile` / `border-border`).
 */
export default function ServiceCards({ services, heading = 'Our Services' }: ServiceCardsProps) {
  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-heading font-bold text-text mb-12 text-center text-balance reveal-on-view">
          {heading}
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => {
            // Responsive + modern-format props for the service photo. 3-col card grid
            // (1-col phone / 2-col ≥sm / 3-col ≥lg). Additive; no-op for non-CDN URLs.
            const rimg = service.image
              ? cdnImageProps(service.image, '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw')
              : null;
            return (
            <div
              key={service.name}
              className="group card-tactile reveal-on-view rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:border-accent/40 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            >
              {service.image && (
                <div className="aspect-[16/10] overflow-hidden">
                  <img
                    src={rimg?.src ?? service.image}
                    srcSet={rimg?.srcSet}
                    sizes={rimg?.sizes}
                    alt={service.name}
                    width={800}
                    height={500}
                    className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              )}
              <div className="p-6">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="text-lg font-heading font-bold text-text">{service.name}</h3>
                  {service.price && (
                    <span className="text-accent font-semibold text-sm whitespace-nowrap">
                      {service.price}
                    </span>
                  )}
                </div>
                <p className="text-text-muted text-sm leading-relaxed mb-4">{service.description}</p>
                {service.bookingUrl && (
                  <a
                    href={service.bookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-accent hover:text-accent/80 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
                    onClick={() => {
                      if (typeof gtag !== 'undefined') gtag('event', 'booking_click', { service: service.name });
                      if (typeof posthog !== 'undefined') posthog.capture('booking_click', { service: service.name });
                    }}
                  >
                    Book Now →
                  </a>
                )}
              </div>
            </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
