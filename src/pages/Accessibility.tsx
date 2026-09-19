import { brand } from '@/brand';
import { telHref } from '@/lib/phone';
import { mailtoHref } from '@/lib/email';

export default function Accessibility() {
  // Runtime-brand-driven (was hardcoded `{BUSINESS_NAME}`/`{BUSINESS_PHONE}`/`{BUSINESS_EMAIL}` literals
  // → a token leak + dead tel:/mailto: when a business lacked phone/email). Each contact control renders
  // only when real (telHref/mailtoHref), else the list falls back to the contact form — never a dead control.
  const name = brand.business.name || 'This website';
  const tel = telHref(brand.business.phone);
  const mail = mailtoHref(brand.business.email);
  return (
    <main className="pt-32 pb-20">
      <div className="max-w-3xl mx-auto px-6">
        <h1 className="text-3xl md:text-4xl font-heading font-bold text-text mb-8">
          Accessibility Statement
        </h1>

        <div className="space-y-6 text-text-muted text-sm leading-relaxed">
          <p>
            {name} is committed to ensuring digital accessibility for people with
            disabilities. We continually improve the user experience for everyone and apply the
            relevant accessibility standards.
          </p>

          <h2 className="text-xl font-heading font-semibold text-text mt-8">
            Conformance Status
          </h2>
          <p>
            This website strives to conform to the Web Content Accessibility Guidelines (WCAG) 2.2
            at Level AA. These guidelines explain how to make web content more accessible for people
            with disabilities and more user-friendly for everyone.
          </p>

          <h2 className="text-xl font-heading font-semibold text-text mt-8">
            Measures Taken
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>All images include descriptive alternative text</li>
            <li>Color contrast ratios meet or exceed 4.5:1 for body text and 3:1 for large text</li>
            <li>Interactive elements have visible focus indicators</li>
            <li>Touch targets are at least 24px (WCAG 2.2 criterion 2.5.8)</li>
            <li>All forms include visible labels and error descriptions</li>
            <li>Navigation is consistent across all pages</li>
            <li>A skip-to-content link is provided</li>
            <li>Animations respect the prefers-reduced-motion setting</li>
            <li>The site is fully navigable via keyboard</li>
          </ul>

          <h2 className="text-xl font-heading font-semibold text-text mt-8">
            Feedback
          </h2>
          <p>
            We welcome your feedback on the accessibility of this website. If you encounter
            accessibility barriers, please contact us:
          </p>
          {tel || mail ? (
            <ul className="list-disc pl-6 space-y-2">
              {tel && (
                <li>Phone: <a href={tel} className="text-[var(--color-accent)] hover:underline">{brand.business.phone}</a></li>
              )}
              {mail && (
                <li>Email: <a href={mail} className="text-[var(--color-accent)] hover:underline">{brand.business.email}</a></li>
              )}
            </ul>
          ) : (
            <p>Please use the <a href="/contact" className="text-[var(--color-accent)] hover:underline">contact form</a> on this website and we&rsquo;ll respond promptly.</p>
          )}
          <p>We aim to respond to accessibility feedback within 2 business days.</p>

          <h2 className="text-xl font-heading font-semibold text-text mt-8">
            Compliance
          </h2>
          <p>
            This statement was last updated on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.
            This website complies with ADA Title II requirements effective April 2026 for state and
            local government entities.
          </p>
        </div>
      </div>
    </main>
  );
}
