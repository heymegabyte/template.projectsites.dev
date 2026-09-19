import { Calendar, Phone, Send, ChevronDown } from 'lucide-react';
import { telHref } from '@/lib/phone';
import { useState } from 'react';

type BookingProvider = 'calendly' | 'acuity' | 'square' | 'custom';

interface BookingEmbedProps {
  provider: BookingProvider;
  embedUrl?: string;
  phone?: string;
  onBookingClick?: () => void;
  services?: string[];
}

const PROVIDER_CONFIG: Record<string, { minHeight: string; title: string }> = {
  calendly: { minHeight: '700px', title: 'Schedule with Calendly' },
  acuity: { minHeight: '800px', title: 'Book with Acuity' },
  square: { minHeight: '600px', title: 'Book with Square' },
};

export default function BookingEmbed({
  provider,
  embedUrl,
  phone,
  onBookingClick,
  services = [],
}: BookingEmbedProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    date: '',
    service: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const track = (event: string, props?: Record<string, unknown>) => {
    window.gtag?.('event', event, props);
    window.posthog?.capture(event, props);
  };

  const handleBookingInteraction = () => {
    track('booking_click', { provider, source: 'embed' });
    onBookingClick?.();
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    track('booking_click', { provider: 'custom', ...formData });
    onBookingClick?.();
    setSubmitted(true);
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Every "or call us" tel: link renders only for a dialable phone (never a {token}/empty).
  const callHref = telHref(phone);

  // Iframe embed for known providers
  if (provider !== 'custom' && embedUrl) {
    const config = PROVIDER_CONFIG[provider] ?? { minHeight: '600px', title: 'Book Online' };

    return (
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-6">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar size={20} className="text-[var(--color-accent)]" />
                <h2 className="text-lg font-heading font-bold text-white">{config.title}</h2>
              </div>
              {callHref && (
                <a
                  href={callHref}
                  className="flex items-center gap-1.5 text-white/60 hover:text-[var(--color-accent)] text-sm transition-colors"
                  onClick={() => track('phone_click', { phone, source: 'booking_header' })}
                >
                  <Phone size={14} />
                  Or call
                </a>
              )}
            </div>

            <div
              className="w-full bg-white rounded-b-2xl"
              onClick={handleBookingInteraction}
              role="presentation"
            >
              <iframe
                src={embedUrl}
                title={config.title}
                className="w-full border-0 rounded-b-2xl"
                style={{ minHeight: config.minHeight }}
                loading="lazy"
                allow="payment"
              />
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Custom booking form
  return (
    <section className="py-16">
      <div className="max-w-lg mx-auto px-6">
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center">
              <Calendar size={24} className="text-[var(--color-accent)]" />
            </div>
            <div>
              <h2 className="text-xl font-heading font-bold text-white">Request a Booking</h2>
              <p className="text-white/50 text-sm">We&apos;ll confirm within 24 hours</p>
            </div>
          </div>

          {!submitted ? (
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label htmlFor="booking-name" className="block text-white/70 text-sm font-medium mb-1.5">
                  Your Name
                </label>
                <input
                  id="booking-name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[var(--color-accent)]/50 transition-colors"
                  placeholder="Jane Smith"
                />
              </div>

              <div>
                <label htmlFor="booking-phone" className="block text-white/70 text-sm font-medium mb-1.5">
                  Phone Number
                </label>
                <input
                  id="booking-phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[var(--color-accent)]/50 transition-colors"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <label htmlFor="booking-date" className="block text-white/70 text-sm font-medium mb-1.5">
                  Preferred Date
                </label>
                <input
                  id="booking-date"
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => updateField('date', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[var(--color-accent)]/50 transition-colors [color-scheme:light_dark]"
                />
              </div>

              {services.length > 0 && (
                <div className="relative">
                  <label htmlFor="booking-service" className="block text-white/70 text-sm font-medium mb-1.5">
                    Service
                  </label>
                  <div className="relative">
                    <select
                      id="booking-service"
                      value={formData.service}
                      onChange={(e) => updateField('service', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[var(--color-accent)]/50 transition-colors appearance-none pr-10"
                    >
                      <option value="" className="bg-surface text-text">Select a service</option>
                      {services.map((s) => (
                        <option key={s} value={s} className="bg-surface text-text">{s}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="booking-message" className="block text-white/70 text-sm font-medium mb-1.5">
                  Message (optional)
                </label>
                <textarea
                  id="booking-message"
                  rows={3}
                  value={formData.message}
                  onChange={(e) => updateField('message', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[var(--color-accent)]/50 resize-none transition-colors"
                  placeholder="Any special requests..."
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-[var(--color-accent)] text-[var(--color-on-accent)] font-bold py-3.5 rounded-lg transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[var(--color-accent)]/20 active:scale-[0.98]"
              >
                <Send size={18} />
                Request Booking
              </button>

              {callHref && (
                <p className="text-center text-white/40 text-xs mt-2">
                  Need immediate help?{' '}
                  <a
                    href={callHref}
                    className="text-[var(--color-accent)] hover:text-[var(--color-accent)]/80 transition-colors"
                    onClick={() => track('phone_click', { phone, source: 'booking_form' })}
                  >
                    Call us directly
                  </a>
                </p>
              )}
            </form>
          ) : (
            <div className="text-center py-8 motion-safe:animate-[fadeIn_200ms_ease-out]">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
                <Calendar size={28} className="text-green-400" />
              </div>
              <h3 className="text-lg font-heading font-bold text-white mb-2">Request Sent!</h3>
              <p className="text-white/60 text-sm mb-4">
                We&apos;ll confirm your booking within 24 hours.
              </p>
              {callHref && (
                <a
                  href={callHref}
                  className="text-[var(--color-accent)] hover:text-[var(--color-accent)]/80 text-sm font-medium transition-colors"
                  onClick={() => track('phone_click', { phone, source: 'booking_confirmation' })}
                >
                  Call for faster confirmation →
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
