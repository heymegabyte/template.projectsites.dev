import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
} from "lucide-react";
import { telHref } from "../../lib/phone";

interface SocialLink {
  platform: string;
  url: string;
}

interface NAPFooterProps {
  businessName: string;
  address: string;
  phone: string;
  email: string;
  hours: Record<string, string>;
  socialLinks: SocialLink[];
  logoSrc?: string;
}

const SOCIAL_ICONS: Record<string, typeof Facebook> = {
  facebook: Facebook,
  instagram: Instagram,
  twitter: Twitter,
  x: Twitter,
  linkedin: Linkedin,
  youtube: Youtube,
};

function TikTokIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  );
}

function getTodayDay(): string {
  return [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ][new Date().getDay()];
}

/**
 * `NAPFooter` — the Name/Address/Phone + hours + social footer with schema.org
 * `LocalBusiness` microdata. Cinematic + theme-token: an accent hairline traces the top
 * edge over a soft OKLCH footer wash, the three columns reveal on scroll, contact rows nudge
 * their icon + warm to the accent on hover, today's hours glow with a live pulse dot, and the
 * social chips lift into an accent fill. Legible on light AND dark verticals (the old
 * hardcoded `text-white`/`bg-white/5`/`border-white/10` was invisible on light themes).
 */
export default function NAPFooter({
  businessName,
  address,
  phone,
  email,
  hours,
  socialLinks,
  logoSrc,
}: NAPFooterProps) {
  const today = getTodayDay();
  // Fail-safe every NAP control: render a contact link ONLY when its datum is real, never a dead
  // href on a placeholder/empty value (a doomed control — the visitor taps and nothing happens, or
  // an unfilled {TOKEN} leaks as text). Mirrors LocationMap's guards + the shared telHref helper.
  const hasAddress = Boolean(
    address && !address.startsWith("{") && address.trim().length >= 6,
  );
  const phoneHref = telHref(phone); // '' unless dialable (≥7 digits, not a {token})
  const hasEmail = Boolean(
    email && !email.startsWith("{") && email.includes("@"),
  );
  const validSocials = (socialLinks ?? []).filter(
    (s) => typeof s.url === "string" && s.url.startsWith("http"),
  ); // drops '#' / '' / '{token}' — no dead social link
  // One-tap turn-by-turn DIRECTIONS (not a search-results page) — matches the
  // `direction_click` event fired below, the template's AGENTS.md convention, and every
  // sibling (Footer/AddressLink/LocationMap). A visitor tapping the address wants to
  // navigate, not read a Maps search page (embarrassingly-easy: one tap → directions).
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;

  const track = (event: string, props?: Record<string, unknown>) => {
    window.gtag?.("event", event, props);
    window.posthog?.capture(event, props);
  };

  const rowClass =
    "group flex items-center gap-3 text-text-muted hover:text-accent transition-colors text-sm rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60";
  const iconClass =
    "shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-accent motion-reduce:transition-none motion-reduce:group-hover:translate-x-0";

  return (
    <footer
      className="nap-footer relative bg-surface/40 backdrop-blur-md border-t border-border py-16 overflow-hidden"
      itemScope
      itemType="https://schema.org/LocalBusiness"
    >
      <div className="nap-rule" aria-hidden="true" />
      <div className="nap-wash" aria-hidden="true" />

      <div className="relative max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-12">
          {/* Business identity */}
          <div
            className="nap-col reveal-on-view"
            style={{ ["--col-i" as string]: 0 } as React.CSSProperties}
          >
            {logoSrc && (
              <img
                src={logoSrc}
                alt={`${businessName} logo`}
                className="h-12 w-auto mb-4"
                loading="lazy"
                decoding="async"
                itemProp="logo"
              />
            )}
            <h2
              className="text-xl font-heading font-bold text-text mb-4 text-balance"
              itemProp="name"
            >
              {businessName}
            </h2>

            <div className="space-y-3">
              {hasAddress && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${rowClass} items-start`}
                  onClick={() => track("direction_click", { address })}
                  itemProp="address"
                  itemScope
                  itemType="https://schema.org/PostalAddress"
                >
                  <MapPin size={18} className={`${iconClass} mt-0.5`} />
                  <span itemProp="streetAddress">{address}</span>
                </a>
              )}

              {phoneHref && (
                <a
                  href={phoneHref}
                  className={rowClass}
                  onClick={() => track("phone_click", { phone })}
                >
                  <Phone size={18} className={iconClass} />
                  <span itemProp="telephone">{phone}</span>
                </a>
              )}

              {hasEmail && (
                <a
                  href={`mailto:${email}`}
                  className={rowClass}
                  onClick={() => track("email_click", { email })}
                >
                  <Mail size={18} className={iconClass} />
                  <span itemProp="email">{email}</span>
                </a>
              )}
            </div>
          </div>

          {/* Hours */}
          <div
            className="nap-col reveal-on-view"
            style={{ ["--col-i" as string]: 1 } as React.CSSProperties}
          >
            <h3 className="text-lg font-heading font-bold text-text mb-4 flex items-center gap-2">
              <Clock size={18} className="text-accent" />
              Hours
            </h3>
            <table className="w-full text-sm">
              <tbody>
                {Object.entries(hours).map(([day, time]) => {
                  const isToday = day === today;
                  return (
                    <tr
                      key={day}
                      className={
                        isToday
                          ? "text-accent font-semibold"
                          : "text-text-muted"
                      }
                    >
                      <td className="py-1.5 pr-4">
                        <span className="inline-flex items-center gap-2">
                          {isToday && (
                            <span
                              className="nap-today-dot"
                              aria-hidden="true"
                            />
                          )}
                          {day}
                        </span>
                      </td>
                      <td className="py-1.5 text-right">{time}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Social */}
          <div
            className="nap-col reveal-on-view"
            style={{ ["--col-i" as string]: 2 } as React.CSSProperties}
          >
            {validSocials.length > 0 && (
              <h3 className="text-lg font-heading font-bold text-text mb-4">
                Connect With Us
              </h3>
            )}
            <div className="flex flex-wrap gap-3">
              {validSocials.map(({ platform, url }) => {
                const key = platform.toLowerCase();
                const Icon = SOCIAL_ICONS[key];
                return (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group w-10 h-10 flex items-center justify-center rounded-lg card-tactile text-text-muted transition-all duration-200 hover:-translate-y-0.5 hover:text-[var(--color-on-accent)] hover:bg-[var(--color-accent)] hover:border-accent hover:shadow-lg hover:shadow-[var(--color-accent)]/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                    aria-label={`Follow us on ${platform}`}
                    itemProp="sameAs"
                    onClick={() => track("social_click", { platform })}
                  >
                    {key === "tiktok" ? (
                      <TikTokIcon size={18} />
                    ) : Icon ? (
                      <Icon size={18} />
                    ) : (
                      <span className="text-xs font-bold">
                        {platform.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </a>
                );
              })}
            </div>

            <p
              className="text-xs mt-8"
              style={{ color: "var(--color-text-subtle)" }}
            >
              &copy; {new Date().getFullYear()} {businessName}. All rights
              reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
