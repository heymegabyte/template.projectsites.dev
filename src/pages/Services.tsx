import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Check } from 'lucide-react';
import { AnimatedSection } from '@/components/AnimatedSection';
import { useSEO } from '@/hooks/useSEO';
import { JsonLd } from '@/components/JsonLd';
import { Button } from '@/components/ui/button';
import { hasRealImage, scrubText } from '@/lib/placeholders';

// Each card renders the ~80-word LONG description (emitted by the content pack for
// all 10 verticals) so /services ships 500+ words across several sections. The
// `image` reuses the build's FEATURE_N imagery (the same service photos the
// homepage bento shows) so /services carries its own images — gated by
// hasRealImage so a card silently drops the <img> when a build has no photo
// (no 404 / broken box), keeping the page valid on imageless builds too.
const services = [
  { title: '{SERVICE_1_TITLE}', description: '{SERVICE_1_LONG_DESCRIPTION}', image: '{FEATURE_1_IMAGE_URL}' },
  { title: '{SERVICE_2_TITLE}', description: '{SERVICE_2_LONG_DESCRIPTION}', image: '{FEATURE_2_IMAGE_URL}' },
  { title: '{SERVICE_3_TITLE}', description: '{SERVICE_3_LONG_DESCRIPTION}', image: '{FEATURE_3_IMAGE_URL}' },
  { title: '{SERVICE_4_TITLE}', description: '{SERVICE_4_LONG_DESCRIPTION}', image: '{FEATURE_4_IMAGE_URL}' },
  { title: '{SERVICE_5_TITLE}', description: '{SERVICE_5_LONG_DESCRIPTION}', image: '{FEATURE_5_IMAGE_URL}' },
  { title: '{SERVICE_6_TITLE}', description: '{SERVICE_6_LONG_DESCRIPTION}', image: '{FEATURE_6_IMAGE_URL}' },
];

const whyUs = [
  { title: '{SERVICES_WHY_1_TITLE}', desc: '{SERVICES_WHY_1_DESC}' },
  { title: '{SERVICES_WHY_2_TITLE}', desc: '{SERVICES_WHY_2_DESC}' },
  { title: '{SERVICES_WHY_3_TITLE}', desc: '{SERVICES_WHY_3_DESC}' },
];

export default function Services() {
  useSEO({
    title: 'Services {BUSINESS_NAME} — {SEO_TAGLINE}',
    description: '{SERVICES_META_DESCRIPTION}',
  });

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Service',
          provider: { '@type': 'LocalBusiness', name: '{BUSINESS_NAME}' },
          name: '{SERVICES_HEADLINE}',
        }}
      />

      <section className="pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-6">
          <AnimatedSection className="text-center mb-10">
            <span className="text-accent text-sm font-mono tracking-widest uppercase">
              Our Services
            </span>
            <h1 className="text-4xl md:text-6xl font-bold font-heading mt-4 mb-6">
              <span className="gradient-text">{'{SERVICES_HEADLINE}'}</span>
            </h1>
            <p className="text-text-subtle max-w-2xl mx-auto text-lg">
              {'{SERVICES_SUBHEADLINE}'}
            </p>
          </AnimatedSection>

          {/* Intro paragraph */}
          <AnimatedSection className="mb-16">
            <div className="glass rounded-2xl p-8 md:p-10 max-w-3xl mx-auto">
              <p className="text-text-muted leading-relaxed text-center">
                {'{SERVICES_INTRO}'}
              </p>
            </div>
          </AnimatedSection>

          {/* Service cards — full write-ups */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, i) => (
              <AnimatedSection key={i} delay={`${i * 0.1}s`}>
                <div className="group glass rounded-2xl p-8 hover:border-[var(--color-accent)]/20 transition-all duration-300 hover:-translate-y-2 h-full flex flex-col">
                  {hasRealImage(service.image) && (
                    <div className="mb-6 aspect-[16/10] overflow-hidden rounded-xl">
                      <img
                        src={service.image}
                        alt={scrubText(service.title, 'Our service')}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  )}
                  <div className="h-14 w-14 rounded-2xl bg-[var(--color-accent)]/10 flex items-center justify-center mb-6 group-hover:bg-[var(--color-accent)]/20 transition-colors">
                    <Zap className="h-7 w-7 text-[var(--color-accent)]" />
                  </div>
                  <h3 className="text-xl font-bold text-text mb-3 font-heading">
                    {service.title}
                  </h3>
                  <p className="text-text-subtle text-sm leading-relaxed flex-1">
                    {service.description}
                  </p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Why choose us band */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <AnimatedSection className="text-center mb-10">
            <span className="text-accent text-sm font-mono tracking-widest uppercase">
              Why choose us
            </span>
            <h2 className="text-2xl md:text-4xl font-bold font-heading text-text mt-3">
              What you can count on
            </h2>
          </AnimatedSection>
          <div className="grid md:grid-cols-3 gap-6">
            {whyUs.map((item, i) => (
              <AnimatedSection key={i} delay={`${i * 0.1}s`}>
                <div className="glass rounded-2xl p-8 h-full">
                  <div className="h-11 w-11 rounded-xl bg-[var(--color-accent)]/10 flex items-center justify-center mb-5">
                    <Check className="h-5 w-5 text-[var(--color-accent)]" />
                  </div>
                  <h3 className="text-lg font-bold font-heading text-text mb-2">{item.title}</h3>
                  <p className="text-text-muted text-sm leading-relaxed">{item.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 pb-28">
        <div className="max-w-7xl mx-auto px-6">
          <AnimatedSection className="text-center">
            <div className="glass rounded-3xl p-12 max-w-3xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold font-heading mb-4">
                {'{SERVICES_CTA_HEADLINE}'}
              </h2>
              <p className="text-text-subtle mb-8">
                {'{SERVICES_CTA_DESCRIPTION}'}
              </p>
              <Button asChild size="lg">
                <Link to="/contact">
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
}
