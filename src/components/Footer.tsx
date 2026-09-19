import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, MessageSquare } from "lucide-react";
import { brand, featureOn } from "@/brand";
import { telHref } from "@/lib/phone";

interface NavRoute {
  to: string;
  label: string;
}

interface Props {
  routes?: NavRoute[];
  socials?: { label: string; href: string }[];
}

// Footer nav mirrors the header's vertical-aware "offer" entry: quote for
// service businesses, pricing for product/SaaS, neither for the rest.
function defaultRoutes(): NavRoute[] {
  const offer: NavRoute | null = featureOn("quote")
    ? { to: "/quote", label: "Get a Quote" }
    : featureOn("pricing")
      ? { to: "/pricing", label: "Pricing" }
      : null;
  return [
    { to: "/", label: "Home" },
    { to: "/about", label: "About" },
    { to: "/services", label: "Services" },
    ...(offer ? [offer] : []),
    { to: "/blog", label: "Blog" },
    { to: "/faq", label: "FAQ" },
    { to: "/contact", label: "Contact" },
  ];
}

/**
 * The site footer — present on every page. Cinematic close: a glowing OKLCH
 * accent hairline rides the top edge, a faint drifting twin-tone accent wash +
 * grain give the slab depth, the four columns stagger-reveal on scroll (keyed on
 * the inline `--col-i` index), the social buttons lift + glow to accent on
 * hover/focus, and every nav / legal / contact link carries an accent underline
 * that grows from the centre. All motion is gated behind `prefers-reduced-motion`
 * with a fully-visible fallback, and theme tokens only — so it reads correctly on
 * light (healthcare/wellness) and dark (SaaS/agency) verticals alike.
 *
 * Contract preserved: the contact block (address / phone / email / "Send us a
 * message"), the `/sitemap.xml` `<a href>`, the legal links, and the
 * vertical-aware nav (quote-vs-pricing via `defaultRoutes()` / `featureOn`) are
 * all intact.
 */
export default function Footer({ routes, socials = [] }: Props) {
  const navRoutes = routes ?? defaultRoutes();
  const business = brand.business;
  const address = business.address;
  const phone = business.phone;
  const email = business.email;
  // Derive a contact email from the business's own domain when research didn't
  // find one (skip projectsites.dev subdomains — no mailbox there). Never
  // fabricate a phone number.
  const derivedEmail =
    email ||
    (() => {
      try {
        const h = new URL(business.url || "").hostname.replace(/^www\./, "");
        return h && !h.endsWith(".projectsites.dev") ? `info@${h}` : "";
      } catch {
        return "";
      }
    })();
  const mapHref = address
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`
    : "#";
  // '' (not '#') when the phone isn't dialable — the row below now gates on phoneHref, so a
  // digitless/placeholder phone hides the row entirely instead of rendering a dead href="#".
  const phoneHref = telHref(phone);
  const emailHref = derivedEmail ? `mailto:${derivedEmail}` : "#";

  return (
    <footer className="site-footer grain relative bg-surface text-text-muted pt-20 pb-8 border-t border-border">
      {/* Drifting twin-tone accent wash — OKLCH, decorative, behind the content. */}
      <div
        aria-hidden="true"
        className="footer-wash pointer-events-none absolute inset-0 -z-0"
      />
      <div className="max-w-container-wide relative z-10 mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          <div
            className="footer-col md:col-span-1"
            style={{ ["--col-i" as string]: 0 }}
          >
            <h3 className="text-text font-bold text-xl mb-4 font-heading tracking-tight">
              {business.name || "ProjectSites"}
            </h3>
            <p className="text-sm leading-relaxed text-text-muted">
              {business.description}
            </p>
            {socials.length > 0 && (
              <ul
                className="flex flex-wrap gap-3 mt-6"
                aria-label="Social media"
              >
                {socials.map((s) => (
                  <li key={s.href}>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="footer-social inline-flex items-center justify-center h-10 w-10 rounded-full border border-border text-text-muted hover:border-accent hover:text-accent focus-visible:border-accent focus-visible:text-accent"
                      aria-label={s.label}
                    >
                      <span className="text-xs font-mono">
                        {s.label.slice(0, 2).toUpperCase()}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <nav
            className="footer-col"
            aria-label="Footer navigation"
            style={{ ["--col-i" as string]: 1 }}
          >
            <h3 className="text-text font-semibold text-sm uppercase tracking-wider mb-6">
              Navigation
            </h3>
            <ul className="space-y-3 text-sm">
              {navRoutes.map((r) => (
                <li key={r.to}>
                  <Link
                    to={r.to}
                    className="footer-link inline-block text-text-muted hover:text-accent focus-visible:text-accent transition-colors"
                  >
                    {r.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="footer-col" style={{ ["--col-i" as string]: 2 }}>
            <h3 className="text-text font-semibold text-sm uppercase tracking-wider mb-6">
              Contact
            </h3>
            <address className="not-italic space-y-3 text-sm">
              {address && (
                <a
                  href={mapHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-link flex items-start gap-2 text-text-muted hover:text-accent focus-visible:text-accent transition-colors"
                >
                  <MapPin
                    size={16}
                    className="mt-0.5 flex-shrink-0 text-text-subtle"
                    aria-hidden="true"
                  />
                  <span>{address}</span>
                </a>
              )}
              {phoneHref && (
                <a
                  href={phoneHref}
                  className="footer-link flex items-center gap-2 text-text-muted hover:text-accent focus-visible:text-accent transition-colors"
                >
                  <Phone
                    size={16}
                    className="flex-shrink-0 text-text-subtle"
                    aria-hidden="true"
                  />
                  <span>{phone}</span>
                </a>
              )}
              {derivedEmail && (
                <a
                  href={emailHref}
                  className="footer-link flex items-center gap-2 text-text-muted hover:text-accent focus-visible:text-accent transition-colors break-all"
                >
                  <Mail
                    size={16}
                    className="flex-shrink-0 text-text-subtle"
                    aria-hidden="true"
                  />
                  <span>{derivedEmail}</span>
                </a>
              )}
              {/* Always-present contact channel — the form works even when phone/email are unknown. */}
              <Link
                to="/contact"
                className="footer-link flex items-center gap-2 text-text-muted hover:text-accent focus-visible:text-accent transition-colors"
              >
                <MessageSquare
                  size={16}
                  className="flex-shrink-0 text-text-subtle"
                  aria-hidden="true"
                />
                <span>Send us a message</span>
              </Link>
            </address>
          </div>

          <div className="footer-col" style={{ ["--col-i" as string]: 3 }}>
            <h3 className="text-text font-semibold text-sm uppercase tracking-wider mb-6">
              Legal
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  to="/privacy"
                  className="footer-link inline-block text-text-muted hover:text-accent focus-visible:text-accent transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="footer-link inline-block text-text-muted hover:text-accent focus-visible:text-accent transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  to="/accessibility"
                  className="footer-link inline-block text-text-muted hover:text-accent focus-visible:text-accent transition-colors"
                >
                  Accessibility
                </Link>
              </li>
              <li>
                <a
                  href="/sitemap.xml"
                  className="footer-link inline-block text-text-muted hover:text-accent focus-visible:text-accent transition-colors"
                >
                  Sitemap
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-text-subtle">
          <p>
            © {new Date().getFullYear()} {business.name || "ProjectSites"}. All
            rights reserved.
          </p>
          <p>
            Built with{" "}
            <a
              href="https://projectsites.dev"
              className="footer-link text-accent hover:text-accent-hover focus-visible:text-accent-hover transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              ProjectSites
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
