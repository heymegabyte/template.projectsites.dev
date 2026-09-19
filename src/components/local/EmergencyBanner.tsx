import { Phone, AlertTriangle, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { telHref } from '@/lib/phone';

interface EmergencyBannerProps {
  emergencyPhone: string;
  businessHours: Record<string, string>;
  timezone?: string;
}

function isOutsideBusinessHours(businessHours: Record<string, string>, timezone?: string): boolean {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
    timeZone: timezone,
  });

  const parts = formatter.formatToParts(now);
  const weekday = parts.find((p) => p.type === 'weekday')?.value ?? '';
  const hour = parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0', 10);
  const minute = parseInt(parts.find((p) => p.type === 'minute')?.value ?? '0', 10);
  const currentMinutes = hour * 60 + minute;

  const todayHours = businessHours[weekday];
  if (!todayHours || todayHours.toLowerCase() === 'closed') return true;

  const match = todayHours.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?\s*[-–]\s*(\d{1,2}):?(\d{2})?\s*(am|pm)?/i);
  if (!match) return true;

  const parseTime = (h: string, m: string | undefined, ampm: string | undefined): number => {
    let hours = parseInt(h, 10);
    const mins = parseInt(m ?? '0', 10);
    if (ampm) {
      const lower = ampm.toLowerCase();
      if (lower === 'pm' && hours !== 12) hours += 12;
      if (lower === 'am' && hours === 12) hours = 0;
    }
    return hours * 60 + mins;
  };

  const openMinutes = parseTime(match[1], match[2], match[3]);
  const closeMinutes = parseTime(match[4], match[5], match[6]);

  return currentMinutes < openMinutes || currentMinutes >= closeMinutes;
}

/**
 * `EmergencyBanner` — an after-hours alert bar that only appears outside business hours, offering
 * a one-tap emergency call (for HVAC / plumbing / medical / any 24-7 service). The red/white is
 * intentional — a solid urgent alert reads correctly on any theme (not the dark-assumed bug). It
 * announces via `role="alert"`, the warning icon gives a subtle attention pulse, the call button
 * glows, and it can be dismissed. All motion is `prefers-reduced-motion` gated.
 */
export default function EmergencyBanner({
  emergencyPhone,
  businessHours,
  timezone,
}: EmergencyBannerProps) {
  const [afterHours, setAfterHours] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setAfterHours(isOutsideBusinessHours(businessHours, timezone));

    const interval = setInterval(() => {
      setAfterHours(isOutsideBusinessHours(businessHours, timezone));
    }, 60_000);

    return () => clearInterval(interval);
  }, [businessHours, timezone]);

  // Only ring a REAL emergency line — a dead `tel:{token}`/`tel:` after hours is the worst doomed
  // control. telHref returns '' unless the phone is dialable (≥7 digits, not a token) → banner hides.
  const href = telHref(emergencyPhone);
  if (!afterHours || dismissed || !href) return null;

  const track = (event: string, props?: Record<string, unknown>) => {
    window.gtag?.('event', event, props);
    window.posthog?.capture(event, props);
  };

  return (
    <div
      role="alert"
      className="emergency-banner fixed top-0 left-0 right-0 z-[60] bg-red-600/95 backdrop-blur-sm border-b border-red-400/30 motion-safe:animate-[slideDown_300ms_ease-out]"
    >
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-center gap-3">
        <AlertTriangle size={18} className="emergency-pulse text-white shrink-0" aria-hidden="true" />
        <span className="text-white text-sm font-medium">After Hours?</span>
        <a
          href={href}
          className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white font-bold text-sm px-4 py-1.5 rounded-full transition-all hover:shadow-[0_0_14px_rgba(255,255,255,0.35)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 motion-reduce:transition-none"
          onClick={() => track('phone_click', { phone: emergencyPhone, after_hours: true })}
        >
          <Phone size={14} strokeWidth={2.5} />
          Call {emergencyPhone}
        </a>
      </div>

      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
        aria-label="Dismiss after-hours banner"
      >
        <X size={16} />
      </button>
    </div>
  );
}
