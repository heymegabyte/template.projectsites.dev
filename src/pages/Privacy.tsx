import { AnimatedSection } from '@/components/AnimatedSection';
import { useSEO } from '@/hooks/useSEO';
import { brand } from '@/brand';
import { emailAddr } from '@/lib/email';

/**
 * Privacy Policy — ships a complete, de-facto-standard starting policy so a
 * generated site is never a legal-page stub. Business-specific values come from
 * `brand.business` (name/email); the clauses are general-purpose boilerplate a
 * small business can adopt as-is or hand to counsel. Theme-aware text only.
 */
export default function Privacy() {
  const name = brand.business.name || 'this business';
  const email = emailAddr(brand.business.email); // real address or '' → the contact-form fallback below
  const year = new Date().getFullYear();

  const sections: { h: string; body: React.ReactNode }[] = [
    {
      h: 'Information We Collect',
      body: `${name} collects information you provide directly to us — such as your name, email address, phone number, and any message content — when you fill out a contact form, subscribe to updates, or otherwise communicate with us. We also automatically collect limited technical information, such as your browser type, device, and pages visited, to help us understand how the website is used.`,
    },
    {
      h: 'How We Use Your Information',
      body: `We use the information we collect to respond to your inquiries, provide and improve our services, send you information you have requested, maintain the security of our website, and comply with legal obligations. We do not sell your personal information to third parties.`,
    },
    {
      h: 'Cookies & Analytics',
      body: `Our website may use cookies and similar technologies to remember your preferences and measure site performance. You can control cookies through your browser settings. We may use privacy-respecting analytics to understand aggregate usage patterns; this data is used to improve the website and is not used to identify you personally.`,
    },
    {
      h: 'How We Share Information',
      body: `We share your information only as needed to operate our business — for example, with service providers who help us deliver email, host our website, or process forms, all of whom are obligated to protect your information. We may also disclose information when required by law or to protect our rights and the safety of others.`,
    },
    {
      h: 'Your Rights & Choices',
      body: `You have the right to access, correct, or request deletion of the personal information we hold about you, and to opt out of marketing communications at any time. To exercise these rights, contact us using the details below and we will respond within a reasonable timeframe.`,
    },
    {
      h: 'Data Security',
      body: `We take reasonable administrative, technical, and physical measures to protect your information against unauthorized access, loss, or misuse. No method of transmission over the internet is completely secure, however, so we cannot guarantee absolute security.`,
    },
    {
      h: "Children's Privacy",
      body: `Our website is not directed to children under the age of 13, and we do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us so we can remove it.`,
    },
    {
      h: 'Changes to This Policy',
      body: `We may update this Privacy Policy from time to time. Material changes will be reflected by the "last updated" date above. We encourage you to review this page periodically to stay informed about how we protect your information.`,
    },
  ];

  useSEO({
    title: `Privacy Policy — ${brand.business.name || 'Our Company'}`,
    description: `How ${name} collects, uses, shares, and protects your personal information, and the choices and rights available to you.`,
  });

  return (
    <section className="pt-32 pb-20">
      <div className="max-w-4xl mx-auto px-6">
        <AnimatedSection>
          <h1 className="text-4xl md:text-5xl font-bold font-heading mb-4">
            <span className="gradient-text">Privacy Policy</span>
          </h1>
          <p className="text-text-subtle text-sm mb-12">Last updated: January {year}</p>
        </AnimatedSection>

        <AnimatedSection delay="0.1s">
          <div className="space-y-8">
            {sections.map((s) => (
              <div key={s.h} className="glass rounded-2xl p-8">
                <h2 className="text-xl font-bold text-text mb-4 font-heading">{s.h}</h2>
                <p className="text-text-muted leading-relaxed">{s.body}</p>
              </div>
            ))}

            <div className="glass rounded-2xl p-8">
              <h2 className="text-xl font-bold text-text mb-4 font-heading">Contact Us</h2>
              <p className="text-text-muted leading-relaxed">
                If you have questions about this Privacy Policy or wish to exercise your rights,
                please contact {name}
                {email ? (
                  <>
                    {' '}at{' '}
                    <a href={`mailto:${email}`} className="text-accent hover:underline">
                      {email}
                    </a>
                  </>
                ) : (
                  <> through the contact form on this website</>
                )}
                .
              </p>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
