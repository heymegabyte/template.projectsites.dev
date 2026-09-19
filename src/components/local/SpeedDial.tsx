import { Plus, Phone, Mail, MapPin, Calendar, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { telDigits, telHref } from '@/lib/phone';

interface SpeedDialProps {
  phone?: string;
  email?: string;
  directionsUrl?: string;
  bookingUrl?: string;
}

interface DialAction {
  label: string;
  icon: typeof Phone;
  href: string;
  event: string;
  color: string;
}

export default function SpeedDial({ phone, email, directionsUrl, bookingUrl }: SpeedDialProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const track = (event: string, props?: Record<string, unknown>) => {
    window.gtag?.('event', event, props);
    window.posthog?.capture(event, props);
  };

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const actions: DialAction[] = [];

  // Call action ONLY for a dialable phone (telDigits rejects {token}/empty/<7-digit) so the FAB
  // never opens a dead tel: — if that leaves no actions, the `actions.length === 0` guard hides it.
  if (telDigits(phone)) {
    actions.push({
      label: 'Call',
      icon: Phone,
      href: telHref(phone),
      event: 'phone_click',
      color: 'bg-green-500 hover:bg-green-400',
    });
  }

  if (email) {
    actions.push({
      label: 'Email',
      icon: Mail,
      href: `mailto:${email}`,
      event: 'email_click',
      color: 'bg-blue-500 hover:bg-blue-400',
    });
  }

  if (directionsUrl) {
    actions.push({
      label: 'Directions',
      icon: MapPin,
      href: directionsUrl,
      event: 'direction_click',
      color: 'bg-purple-500 hover:bg-purple-400',
    });
  }

  if (bookingUrl) {
    actions.push({
      label: 'Book',
      icon: Calendar,
      href: bookingUrl,
      event: 'booking_click',
      color: 'bg-orange-500 hover:bg-orange-400',
    });
  }

  if (actions.length === 0) return null;

  return (
    <div ref={containerRef} className="md:hidden fixed bottom-20 right-4 z-[55] flex flex-col-reverse items-end gap-3">
      {/* FAB trigger */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={`w-14 h-14 rounded-full bg-[var(--color-accent)] text-[var(--color-on-accent)] shadow-lg shadow-[var(--color-accent)]/30 flex items-center justify-center transition-transform motion-safe:duration-200 active:scale-90 ${open ? 'rotate-45' : ''}`}
        aria-label={open ? 'Close quick actions' : 'Open quick actions'}
        aria-expanded={open}
      >
        {open ? <X size={24} strokeWidth={2.5} /> : <Plus size={24} strokeWidth={2.5} />}
      </button>

      {/* Action buttons */}
      {open && (
        <div className="flex flex-col gap-2 motion-safe:animate-[fadeUp_150ms_ease-out]">
          {actions.map(({ label, icon: Icon, href, event, color }, i) => (
            <a
              key={label}
              href={href}
              target={href.startsWith('http') ? '_blank' : undefined}
              rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
              className={`flex items-center gap-3 motion-safe:animate-[fadeUp_150ms_ease-out] active:scale-95 transition-transform`}
              style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'both' }}
              onClick={() => {
                track(event, { source: 'speed_dial' });
                setOpen(false);
              }}
              aria-label={label}
            >
              <span className="bg-black/80 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap">
                {label}
              </span>
              <div className={`w-11 h-11 rounded-full ${color} text-white flex items-center justify-center shadow-lg transition-colors`}>
                <Icon size={18} />
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
