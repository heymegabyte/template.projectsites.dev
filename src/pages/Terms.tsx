import { AnimatedSection } from '@/components/AnimatedSection';
import { useSEO } from '@/hooks/useSEO';
import { brand } from '@/brand';
import { emailAddr } from '@/lib/email';

/**
 * Terms of Service — ships a complete, de-facto-standard starting contract so a
 * generated site is never a legal-page stub. Business-specific values come from
 * `brand.business` (name/email); the clauses are general-purpose boilerplate a
 * small business can adopt as-is or hand to counsel. Theme-aware text only (no
 * hardcoded light-on-light).
 */
export default function Terms() {
  const name = brand.business.name || 'this business';
  const email = emailAddr(brand.business.email); // real address or '' → the contact-form fallback below
  const year = new Date().getFullYear();

  const sections: { h: string; body: React.ReactNode }[] = [
    {
      h: 'Acceptance of Terms',
      body: `By accessing or using the website and services of ${name} (the "Services"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Services. We may update these terms from time to time, and your continued use of the Services constitutes acceptance of any changes.`,
    },
    {
      h: 'Use of Services',
      body: `You agree to use the Services only for lawful purposes and in a way that does not infringe the rights of, or restrict or inhibit the use of the Services by, any third party. You are responsible for any information you submit and for maintaining the confidentiality of any account credentials. We reserve the right to refuse service, remove content, or terminate access for conduct we believe violates these terms or is harmful to other users or the business.`,
    },
    {
      h: 'Intellectual Property',
      body: `All content on this website — including text, graphics, logos, images, and the arrangement thereof — is the property of ${name} or its licensors and is protected by applicable intellectual-property laws. You may not reproduce, distribute, or create derivative works from this content without prior written permission, except as permitted for personal, non-commercial use.`,
    },
    {
      h: 'Disclaimers',
      body: `The Services are provided on an "as is" and "as available" basis without warranties of any kind, whether express or implied. While we strive to keep information accurate and current, we do not warrant that the Services will be uninterrupted, error-free, or free of harmful components, and we make no guarantees regarding specific outcomes or results.`,
    },
    {
      h: 'Limitation of Liability',
      body: `To the fullest extent permitted by law, ${name} shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of the Services. Our total liability for any claim shall not exceed the amount you paid, if any, for the specific service giving rise to the claim.`,
    },
    {
      h: 'Changes to These Terms',
      body: `We may revise these Terms of Service at any time by updating this page. Material changes will be reflected by the "last updated" date above. We encourage you to review these terms periodically so you are aware of any updates.`,
    },
    {
      h: 'Governing Law',
      body: `These terms are governed by the laws of the jurisdiction in which ${name} operates, without regard to its conflict-of-law provisions. Any disputes arising under these terms shall be resolved in the courts of that jurisdiction.`,
    },
  ];

  useSEO({
    title: `Terms of Service — ${brand.business.name || 'Our Company'}`,
    description: `The terms of service governing your use of the ${name} website and services, including acceptance, use, intellectual property, and liability.`,
  });

  return (
    <section className="pt-32 pb-20">
      <div className="max-w-4xl mx-auto px-6">
        <AnimatedSection>
          <h1 className="text-4xl md:text-5xl font-bold font-heading mb-4">
            <span className="gradient-text">Terms of Service</span>
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
                If you have questions about these Terms of Service, please contact {name}
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
